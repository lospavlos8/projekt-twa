import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../api/auth/[...nextauth]";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

type ErrorResponse = {
  error?: string;
};

export default function NoteEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const noteId = typeof id === "string" ? id : null;
  const isNewNote = noteId === "new";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(!isNewNote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!noteId) {
      return;
    }

    if (isNewNote) {
      setTitle("");
      setContent("");
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;

    async function loadNote() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/notes");

        if (!response.ok) {
          const data = (await response.json()) as ErrorResponse;
          throw new Error(data.error ?? "Nepodarilo se nacist poznamku.");
        }

        const notes = (await response.json()) as Note[];
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
          setIsLoading(false);
        }
      }
    }

    void loadNote();

    return () => {
      active = false;
    };
  }, [isNewNote, noteId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!noteId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const endpoint = isNewNote ? "/api/notes" : `/api/notes/${noteId}`;
    const method = isNewNote ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, content })
      });

      if (!response.ok) {
        const data = (await response.json()) as ErrorResponse;
        throw new Error(data.error ?? "Nepodarilo se ulozit poznamku.");
      }

      await router.push("/dashboard");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Nepodarilo se ulozit poznamku.";
      setError(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto mt-10 flex max-w-3xl flex-col gap-6 bg-slate-50 px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Editor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {isNewNote ? "Nova poznamka" : "Upravit poznamku"}
          </h1>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-orange-500"
        >
          Zpet
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 shadow-sm">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
          Nacitam poznamku...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex min-h-[60vh] flex-col bg-transparent">
          <div className="flex flex-1 flex-col">
            <label className="flex flex-col">
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mb-6 w-full border-none bg-transparent px-0 text-4xl font-extrabold text-slate-900 outline-none focus:ring-0 placeholder:text-slate-300"
              />
            </label>

            <label className="flex flex-1 flex-col">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                rows={12}
                className="min-h-[60vh] w-full resize-none border-none bg-transparent px-0 py-0 text-lg leading-relaxed text-slate-800 outline-none focus:ring-orange-500 placeholder:text-slate-400"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {isSubmitting ? "Ukladam..." : "Ulozit"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

  return {
    props: {}
  };
};
