import { ChangeEvent, useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { Download, Edit3, FileText, Loader2, Plus, Trash2, Upload } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

type ImportResponse = {
  error?: string;
  importedCount?: number;
};

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadNotes() {
    try {
      const response = await fetch("/api/notes");
      const data = (await response.json()) as Note[] | { error?: string };

      if (!response.ok) {
        throw new Error("Nepodarilo se nacist poznamky.");
      }

      setNotes(data as Note[]);
    } catch (error) {
      console.error(error);
      alert("Nepodarilo se nacist poznamky.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat tuto poznamku?")) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });

      if (response.ok) {
        setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
        return;
      }

      alert("Poznamku se nepodarilo smazat.");
    } catch (error) {
      console.error("Chyba pri mazani:", error);
      alert("Poznamku se nepodarilo smazat.");
    }
  };

  const handleExport = () => {
    window.open("/api/notes/export", "_blank");
  };

  const handleImportClick = () => {
    if (!isImporting) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      const fileContent = await file.text();

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(fileContent);
      } catch {
        throw new Error("Vybrany soubor neobsahuje platny JSON.");
      }

      const response = await fetch("/api/notes/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsedJson)
      });

      const result = (await response.json()) as ImportResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "Import poznamek se nepodaril.");
      }

      alert(`Import probehl uspesne. Nahrano poznamek: ${result.importedCount ?? 0}.`);
      setLoading(true);
      await loadNotes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import poznamek se nepodaril.";
      console.error(error);
      alert(message);
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tvoje poznamky</h1>
          <p className="mt-1 text-slate-500">Spravuj sve napady a ukoly na jednom miste.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
          >
            <Download className="h-4 w-4" />
            Exportovat do JSON
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importovat z JSON
          </button>

          <Link
            href="/notes/new"
            className="group flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:scale-110" />
            Nova poznamka
          </Link>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 rounded-full bg-blue-50 p-4">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900">Zatim tu nic neni</h3>
          <p className="mb-6 max-w-sm text-slate-500">
            Tve platno je prazdne. Vytvor svou prvni poznamku a zacni si organizovat myslenky.
          </p>
          <Link href="/notes/new" className="font-medium text-orange-500 hover:text-orange-600 hover:underline">
            Vytvorit prvni poznamku &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative flex h-64 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
            >
              <div className="h-1 w-full bg-slate-100 transition-colors group-hover:bg-orange-400" />

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-lg font-bold leading-tight text-slate-900">{note.title}</h3>

                  <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <Link
                      href={`/notes/${note.id}`}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Upravit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Smazat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="line-clamp-4 flex-1 whitespace-pre-wrap text-sm text-slate-600">{note.content}</p>

                <div className="mt-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-400">
                  {new Date(note.createdAt).toLocaleDateString("cs-CZ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

  return {
    props: { session }
  };
};
