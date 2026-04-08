import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { signOut } from "next-auth/react";

import { authOptions } from "./api/auth/[...nextauth]";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

type DashboardProps = {
  user: {
    id: string;
    name: string | null;
  };
};

type ErrorResponse = {
  error?: string;
};

export default function DashboardPage({ user }: DashboardProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadNotes() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/notes");

        if (!response.ok) {
          const data = (await response.json()) as ErrorResponse;
          throw new Error(data.error ?? "Nepodarilo se nacist poznamky.");
        }

        const data = (await response.json()) as Note[];

        if (active) {
          setNotes(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Nepodarilo se nacist poznamky.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(noteId: string) {
    if (deletingId) {
      return;
    }

    setDeletingId(noteId);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        let message = "Nepodarilo se smazat poznamku.";

        try {
          const data = (await response.json()) as ErrorResponse;
          message = data.error ?? message;
        } catch {
          message = "Nepodarilo se smazat poznamku.";
        }

        throw new Error(message);
      }

      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Nepodarilo se smazat poznamku.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Dashboard</p>
          <h1 className="text-3xl font-semibold">Tvoje poznamky</h1>
          <p className="text-sm text-gray-600">
            Prihlasen jako <span className="font-medium text-gray-900">{user.name ?? "uzivatel"}</span>.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void router.push("/notes/new")}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Nova poznamka
          </button>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Odhlasit se
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
          Nacitam poznamky...
        </div>
      ) : null}

      {!isLoading && notes.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <h2 className="text-lg font-medium text-gray-900">Zatim zadne poznamky</h2>
          <p className="mt-2 text-sm text-gray-600">Vytvor prvni poznamku a zacni si budovat vlastni zapisnik.</p>
        </div>
      ) : null}

      {!isLoading && notes.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <article key={note.id} className="rounded border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-gray-900">{note.title}</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleString("cs-CZ")}
                  </p>
                </div>
              </div>

              <p className="mt-4 line-clamp-4 whitespace-pre-wrap text-sm text-gray-700">
                {note.content}
              </p>

              <div className="mt-5 flex gap-3">
                <Link
                  href={`/notes/${note.id}`}
                  className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  Upravit
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {deletingId === note.id ? "Mazani..." : "Smazat"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardProps> = async (context) => {
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
    props: {
      user: {
        id: session.user.id,
        name: session.user.name ?? null
      }
    }
  };
};
