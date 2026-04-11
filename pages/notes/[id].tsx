import { FormEvent, useEffect, useState } from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import { ArrowLeft, Loader2, Save } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
}

type ErrorResponse = {
  error?: string;
};

type PageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export default function NoteEditorPage(_: PageProps) {
  const router = useRouter();
  const { id } = router.query;
  const noteId = typeof id === "string" ? id : null;
  const isNewNote = noteId === "new";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldShowLoading = !router.isReady || (!isNewNote && isFetching);

  useEffect(() => {
    if (!router.isReady || !noteId) {
      return;
    }

    if (isNewNote) {
      setTitle("");
      setContent("");
      setError(null);
      setIsFetching(false);
      return;
    }

    let active = true;

    async function loadNote() {
      setIsFetching(true);
      setError(null);

      try {
        const response = await fetch("/api/notes");
        const notes = (await response.json()) as Note[];

        if (!response.ok) {
          const data = notes as unknown as ErrorResponse;
          throw new Error(data.error ?? "Nepodarilo se nacist poznamku.");
        }

        const existingNote = notes.find((note) => note.id === noteId);

        if (!existingNote) {
          throw new Error("Poznamka nebyla nalezena.");
        }

        if (active) {
          setTitle(existingNote.title);
          setContent(existingNote.content);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Nepodarilo se nacist poznamku.");
        }
      } finally {
        if (active) {
          setIsFetching(false);
        }
      }
    }

    void loadNote();

    return () => {
      active = false;
    };
  }, [isNewNote, noteId, router.isReady]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!noteId || isSaving) {
      return;
    }

    if (!title.trim()) {
      setError("Titulek je povinny.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const endpoint = isNewNote ? "/api/notes" : `/api/notes/${noteId}`;
    const method = isNewNote ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: title.trim(), content })
      });

      if (!response.ok) {
        const data = (await response.json()) as ErrorResponse;
        throw new Error(data.error ?? "Nepodarilo se ulozit poznamku.");
      }

      await router.push("/dashboard");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Nepodarilo se ulozit poznamku.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12 gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-orange-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpet na dashboard
        </Link>

        <button
          type="submit"
          form="note-editor-form"
          disabled={!router.isReady || isFetching || isSaving}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-2 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Ukladam" : "Ulozit"}
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{error}</div>
      ) : null}

      {shouldShowLoading ? (
        <div className="flex min-h-[500px] items-center justify-center text-slate-500">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-base font-medium">Nacitam poznamku...</span>
          </div>
        </div>
      ) : (
        <form id="note-editor-form" onSubmit={handleSave}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Bez nazvu"
            className="w-full text-4xl sm:text-5xl font-extrabold text-slate-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-300"
          />

          <div className="h-px bg-slate-200 w-full my-6" />

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Zacni psat..."
            className="w-full min-h-[500px] text-lg text-slate-700 leading-relaxed bg-transparent border-none outline-none resize-none focus:ring-0 placeholder:text-slate-400"
          />
        </form>
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
