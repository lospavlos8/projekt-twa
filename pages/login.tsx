import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      void router.replace("/dashboard");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || status === "authenticated") {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        name,
        password,
        redirect: false
      });

      if (!result || result.error) {
        setError("Neplatne prihlasovaci udaje.");
        return;
      }

      await router.push("/dashboard");
    } catch {
      setError("Prihlaseni se nepodarilo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-slate-50">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md shadow-slate-200/70 sm:p-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Vitej zpet</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Prihlaseni</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Pokracuj do sveho prostoru s poznamkami.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Jmeno</span>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-1 py-1 focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/20">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="username"
                required
                className="w-full rounded-lg border-none bg-transparent px-3 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Heslo</span>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-1 py-1 focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/20">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border-none bg-transparent px-3 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
              />
            </div>
          </label>

          {error ? <p className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || status === "authenticated"}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Prihlasuji..." : "Prihlasit"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Jeste nemas ucet?{" "}
          <Link href="/register" className="font-medium text-blue-950 underline decoration-orange-500 underline-offset-4 hover:text-orange-500">
            Vytvorit ucet
          </Link>
        </p>
      </section>
    </main>
  );
}
