import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { signOut } from "next-auth/react";

import { authOptions } from "./api/auth/[...nextauth]";

type DashboardProps = {
  user: {
    id: string;
    name: string | null;
  };
};

export default function DashboardPage({
  user
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2">Prihlasen jako {user.name ?? "uzivatel"}.</p>
        <p className="text-sm text-gray-600">ID: {user.id}</p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Odhlasit se
        </button>
      </div>
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
