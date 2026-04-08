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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Editor</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {isNewNote ? "Nova poznamka" : "Upravit poznamku"}
          </h1>
        </div>
        <Link href="/dashboard" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
          Zpet
        </Link>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
          Nacitam poznamku...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Nazev</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="rounded border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Obsah</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                rows={12}
                className="rounded border border-gray-300 px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-fit rounded bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
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
