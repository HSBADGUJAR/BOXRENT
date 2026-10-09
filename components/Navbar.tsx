
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

type Role = "renter" | "owner" | "admin" | null;

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Role>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          setRole((profile?.role as Role) || "renter");
        }
      } else {
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          setRole((profile?.role as Role) || "renter");
        }
      } else {
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, pathname]);

  const showPublicLinks =
    !loading && (!user || role !== "renter");
  const showOwnerLink =
    !loading &&
    (!user || role === "owner" || role === "admin");

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setRole(null);
    setMenuOpen(false);

    window.location.href = "/";
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-shell">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
              B
            </div>

            <span className="text-xl font-black tracking-tight text-slate-950">
              BoxRent
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 md:flex">

            {showPublicLinks && (
              <Link
                href="/containers"
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Find Containers
              </Link>
            )}

            {showPublicLinks && (
              <Link
                href="/#how"
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                How It Works
              </Link>
            )}

            {showOwnerLink && (
              <Link
                href="/#owners"
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                For Owners
              </Link>
            )}

            {!loading && user && role === "renter" && (
              <>
                <Link
                  href="/my-requests"
                  className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  My Requests
                </Link>

                <Link
                  href="/my-bookings"
                  className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  My Bookings
                </Link>
              </>
            )}

            {!loading && user && (role === "owner" || role === "admin") && (
              <Link
                href="/owner"
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Owner Dashboard
              </Link>
            )}

            {!loading && user ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  My Account
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Sign Up
                </Link>
              </>
            ) : null}
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="border-t border-slate-200 py-4 md:hidden">
            <nav className="flex flex-col gap-1">

              {showPublicLinks && (
                <Link
                  href="/containers"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Find Containers
                </Link>
              )}

              {showPublicLinks && (
                <Link
                  href="/#how-it-works"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  How It Works
                </Link>
              )}

              {showOwnerLink && (
                <Link
                  href="/#owners"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  For Owners
                </Link>
              )}

              {!loading && user && role === "renter" && (
                <>
                  <Link
                    href="/my-requests"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    My Requests
                  </Link>

                  <Link
                    href="/my-bookings"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    My Bookings
                  </Link>
                </>
              )}

              {!loading && user && (role === "owner" || role === "admin") && (
                <Link
                  href="/owner"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Owner Dashboard
                </Link>
              )}

              {!loading && user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    My Account
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 rounded-xl bg-slate-950 px-4 py-3 text-left text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Logout
                  </button>
                </>
              ) : !loading ? (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="mt-2 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Sign Up
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
