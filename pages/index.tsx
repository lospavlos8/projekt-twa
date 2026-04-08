import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "./api/auth/[...nextauth]";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-4xl rounded-3xl border border-gray-200 bg-white/90 px-8 py-16 text-center shadow-sm sm:px-12">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-gray-500">My Notes</p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-950 sm:text-6xl">
          Vase myslenky, bezpecne ulozene
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
          Jednoducha a rychla aplikace pro spravu vasich poznamek. Pis, upravuj a mej vsechny dulezite
          napady na jednom miste.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex min-w-40 items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Zacit psat
          </Link>
          <Link
            href="/login"
            className="inline-flex min-w-40 items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
          >
            Prihlasit se
          </Link>
        </div>
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false
      }
    };
  }

  return {
    props: {}
  };
};
