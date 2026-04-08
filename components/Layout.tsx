import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, BookOpen, PenSquare } from "lucide-react";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Tmavě modrá navigační lišta */}
            <nav className="bg-slate-900 border-b border-slate-800 shrink-0">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Logo / Návrat na Dashboard */}
                    <Link
                        href={session ? "/dashboard" : "/"}
                        className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors"
                    >
                        <BookOpen className="w-6 h-6 text-orange-500" />
                        <span className="font-bold text-lg tracking-tight">MojePoznámky</span>
                    </Link>

                    {/* Pravá část menu */}
                    <div className="flex items-center gap-4">
                        {status === "loading" ? (
                            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                        ) : session ? (
                            <>
                <span className="text-slate-300 text-sm hidden sm:block">
                  {session.user?.name}
                </span>
                                <Link
                                    href="/notes/new"
                                    className="hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-1.5 rounded-md items-center gap-2 transition-colors"
                                >
                                    <PenSquare className="w-4 h-4" />
                                    Napsat
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
                                    title="Odhlásit se"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Odhlásit se</span>
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                            >
                                Přihlásit se
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hlavní obsah stránky */}
            <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}