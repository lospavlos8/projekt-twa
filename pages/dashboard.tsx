import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { Plus, Edit3, Trash2, FileText } from "lucide-react";

// Definice typu pro poznámku
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Načtení poznámek po zobrazení stránky
  useEffect(() => {
    fetch("/api/notes")
        .then((res) => res.json())
        .then((data) => {
          setNotes(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat tuto poznámku?")) return;

    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes(notes.filter((note) => note.id !== id));
      }
    } catch (error) {
      console.error("Chyba při mazání:", error);
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin" />
        </div>
    );
  }

  return (
      <div className="w-full">
        {/* Hlavička stránky */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Tvoje poznámky
            </h1>
            <p className="text-slate-500 mt-1">
              Spravuj své nápady a úkoly na jednom místě.
            </p>
          </div>
          <Link
              href="/notes/new"
              className="group flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Nová poznámka
          </Link>
        </div>

        {/* Prázdný stav */}
        {notes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center text-center">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <FileText className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Zatím tu nic není</h3>
              <p className="text-slate-500 max-w-sm mb-6">
                Tvé plátno je prázdné. Vytvoř svou první poznámku a začni si organizovat myšlenky.
              </p>
              <Link
                  href="/notes/new"
                  className="text-orange-500 font-medium hover:text-orange-600 hover:underline"
              >
                Vytvořit první poznámku &rarr;
              </Link>
            </div>
        ) : (
            /* Mřížka poznámek */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                  <div
                      key={note.id}
                      className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all flex flex-col h-64 overflow-hidden relative"
                  >
                    {/* Oranžový designový proužek nahoře */}
                    <div className="h-1 w-full bg-slate-100 group-hover:bg-orange-400 transition-colors" />

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">
                          {note.title}
                        </h3>

                        {/* Akční tlačítka (zobrazí se po najetí myší na desktopu) */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Link
                              href={`/notes/${note.id}`}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Upravit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                              onClick={() => handleDelete(note.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Smazat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-600 text-sm flex-1 whitespace-pre-wrap line-clamp-4">
                        {note.content}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
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

// Ochrana cesty: Nepřihlášený uživatel bude přesměrován na login
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};