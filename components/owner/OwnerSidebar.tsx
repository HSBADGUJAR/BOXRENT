"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/owner",
    icon: LayoutDashboard,
  },
  {
    name: "My Containers",
    href: "/owner/containers",
    icon: Package,
    isParent: true,
    children: ["/owner/containers/new", "/owner/containers/edit"],
  },
  {
    name: "Add Container",
    href: "/owner/containers/new",
    icon: PlusCircle,
  },
  {
    name: "Rental Requests",
    href: "/owner/requests",
    icon: ClipboardList,
    isParent: true,
    children: ["/owner/requests/"],
  },
  {
    name: "Reports",
    href: "/owner/reports",
    icon: BarChart3,
  },
];

const bottomNavigation = [
  {
    name: "My Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Logout",
    href: "/logout",
    icon: LogOut,
  },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, children?: string[]) => {
    if (href === "/owner") {
      return pathname === "/owner";
    }

    // Exact match
    if (pathname === href) {
      return true;
    }

    // If this is a parent route with children, don't mark as active when on child action pages (new, edit, etc.)
    if (children && children.length > 0) {
      const isOnChildPage = children.some((child) => pathname.startsWith(child));
      if (isOnChildPage) {
        return false;
      }
    }

    // For other routes, check if pathname starts with href
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link
          href="/owner"
          onClick={closeMobileMenu}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
            B
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              BoxRent
            </p>

            <p className="text-xs text-slate-500">
              Owner Panel
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
          aria-label="Toggle owner menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close owner menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={[
          "fixed bottom-0 left-0 top-0 z-[60]",
          "flex w-64 flex-col",
          "border-r border-slate-200 bg-white",
          "transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        {/* =================================================
            SIDEBAR HEADER
        ================================================= */}

        <div className="flex h-20 shrink-0 items-center border-b border-slate-200 px-5">
          <Link
            href="/owner"
            onClick={closeMobileMenu}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 font-bold text-white">
              B
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                BoxRent
              </p>

              <p className="text-xs text-slate-500">
                Owner ERP
              </p>
            </div>
          </Link>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="owner-sidebar-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Management
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.children);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={[
                    "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "h-5 w-5 shrink-0",
                      active
                        ? "text-teal-600"
                        : "text-slate-400 group-hover:text-slate-600",
                    ].join(" ")}
                  />

                  <span className="flex-1 truncate">
                    {item.name}
                  </span>

                  {active && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-teal-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* =================================================
            BOTTOM ACTIONS
        ================================================= */}

        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="space-y-1">
            {bottomNavigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.href !== "/logout" &&
                isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-400" />

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* =====================================================
          MOBILE CONTENT SPACER
      ===================================================== */}

      <div className="h-16 lg:hidden" />
    </>
  );
}