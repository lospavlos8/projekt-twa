import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "./api/auth/[...nextauth]";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-slate-50">
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50 to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Minimal workspace for notes
          </div>
          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Vase myslenky, bezpecne ulozene
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Jednoducha a rychla aplikace pro spravu vasich poznamek. Pis, upravuj a mej vsechny dulezite
            napady na jednom miste.
          </p>
        </div>

        <div className="relative mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex min-w-48 items-center justify-center rounded-xl bg-orange-500 px-7 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
          >
            Zacit psat
          </Link>
          <Link
            href="/login"
            className="inline-flex min-w-48 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-blue-950 transition hover:-translate-y-0.5 hover:border-orange-500 hover:text-orange-500"
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
