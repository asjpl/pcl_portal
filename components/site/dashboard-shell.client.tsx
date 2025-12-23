// components/site/dashboard-shell.client.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export type NavItem = {
  label: string;
  href: string;
  /** Optional grouping label shown as a section header in the sidebar */
  section?: string;
  /** Optional icon key (subtle monochrome) */
  icon?: IconKey;
};

type IconKey =
  | "dashboard"
  | "customers"
  | "vehicles"
  | "leases"
  | "messages"
  | "users"
  | "profile"
  | "billing"
  | "settings"
  | "overview"
  | "help";

/**
 * ✅ DEFAULT NAVS LIVE HERE (as requested)
 * - DashboardShellServer can still pass nav, but if it doesn't, we fall back to these.
 */
const DEFAULT_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", section: "Overview", icon: "dashboard" },

  { label: "Customers", href: "/admin/customers", section: "Manage", icon: "customers" },
  { label: "Vehicles", href: "/admin/vehicles", section: "Manage", icon: "vehicles" },
  { label: "Leases", href: "/admin/leases", section: "Billing", icon: "leases" },

  { label: "Messages", href: "/admin/messages", section: "Communications", icon: "messages" },

];

const DEFAULT_CUSTOMER_NAV: NavItem[] = [
  { label: "Overview", href: "/account", section: "Account", icon: "overview" },
  { label: "Profile", href: "/account/profile", section: "Account", icon: "profile" },
];

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function IconHamburger() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white transition-all hover:-translate-y-[1px] hover:bg-neutral-50 hover:shadow-sm active:translate-y-0">
      <div className="flex w-5 flex-col gap-1.5">
        <span className="block h-0.5 w-full bg-neutral-900" />
        <span className="block h-0.5 w-full bg-neutral-900" />
        <span className="block h-0.5 w-full bg-neutral-900" />
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      {children}
    </span>
  );
}

/** ---------- Subtle monochrome icons (inline SVG, no deps) ---------- */
function Icon({ name, active }: { name: IconKey; active?: boolean }) {
  const cls = cn(
    "h-4 w-4 shrink-0 transition-colors",
    active ? "text-white/90" : "text-neutral-500 group-hover:text-neutral-700"
  );

  switch (name) {
    case "dashboard":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 13.5h7V4H4v9.5ZM13 20h7v-7h-7v7ZM13 11h7V4h-7v7ZM4 20h7v-4.5H4V20Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "customers":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M16 18c0-2.2-2-4-4-4s-4 1.8-4 4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M12 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 12 12Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "vehicles":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 14l1.3-4.1A3 3 0 0 1 9.2 8h5.6a3 3 0 0 1 2.9 1.9L19 14"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M6 14h12a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "leases":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path
            d="M8 12h8M8 16h8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      );
    case "messages":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4.5 6.5A3.5 3.5 0 0 1 8 3h8a3.5 3.5 0 0 1 3.5 3.5V14A3.5 3.5 0 0 1 16 17.5H10l-4.5 3V17.5A3.5 3.5 0 0 1 4.5 14V6.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M8 8.5h8M8 12h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M3.5 19c0-2.2 2.2-4 5-4s5 1.8 5 4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M16 11.2a2.6 2.6 0 1 0 0-5.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M15.5 15.2c1.9.3 3.5 1.5 3.5 3.3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      );
    case "profile":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M5 20c0-3 3.1-5.5 7-5.5S19 17 19 20"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "overview":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 17V7M10 17v-5M15 17V9M20 17v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "billing":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 7h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M4 10h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />
          <path d="M8 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M19 12a7.2 7.2 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.6 7.6 0 0 0-1.7-1L14.5 3h-5L9.2 6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5A7.2 7.2 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.5 2 3.5 2.4-1c.5.4 1.1.8 1.7 1l.3 3h5l.3-3c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      );
    case "help":
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 18h.01M9.7 9.6a2.6 2.6 0 1 1 4.1 2.2c-.9.6-1.3 1.1-1.3 2.2v.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
  }
}

function initialsFromEmail(email: string | null) {
  if (!email) return "U";
  const part = email.split("@")[0] || "U";
  const bits = part.split(/[.\-_ ]+/).filter(Boolean);
  const a = bits[0]?.[0] ?? part[0] ?? "U";
  const b = bits[1]?.[0] ?? part[1] ?? "";
  return (a + b).toUpperCase();
}

function groupNav(nav: NavItem[]) {
  const map = new Map<string, NavItem[]>();
  for (const item of nav) {
    const sec = item.section?.trim() || "General";
    if (!map.has(sec)) map.set(sec, []);
    map.get(sec)!.push(item);
  }
  return Array.from(map.entries());
}

function SidebarNav({ nav, activeHref }: { nav: NavItem[]; activeHref: string }) {
  const grouped = useMemo(() => groupNav(nav), [nav]);

  return (
    <div className="mt-4 space-y-6">
      {grouped.map(([sectionName, items]) => (
        <div key={sectionName}>
          <p className="px-2 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">{sectionName}</p>

          <nav className="mt-2 space-y-1">
            {items.map((item) => {
              const active = item.href === activeHref;
              const iconName = item.icon ?? "overview";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    "focus:outline-none focus:ring-2 focus:ring-neutral-900/10",
                    active ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full transition-all",
                      active ? "bg-white/90" : "bg-transparent group-hover:bg-neutral-300/80"
                    )}
                  />

                  <Icon name={iconName} active={active} />
                  <span className="truncate">{item.label}</span>

                  {active ? (
                    <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">Active</span>
                  ) : null}

                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
                    style={{
                      background: "radial-gradient(800px 120px at 0% 0%, rgba(0,0,0,0.04), transparent 60%)",
                    }}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function DashboardShellClient({
  title,
  subtitle,
  role,
  nav,
  userEmail,
  children,
}: {
  title: string;
  subtitle?: string;
  role: "admin" | "customer";
  /**
   * ✅ If your server wrapper passes nav, it will be used.
   * ✅ If it passes an empty array or nothing, we fall back to the defaults above.
   */
  nav?: NavItem[];
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDrawerOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const effectiveNav = useMemo(() => {
    if (nav && nav.length > 0) return nav;
    return role === "admin" ? DEFAULT_ADMIN_NAV : DEFAULT_CUSTOMER_NAV;
  }, [nav, role]);

  const activeHref = useMemo(() => {
    let best: { href: string; len: number } | null = null;
    for (const item of effectiveNav) {
      if (pathname === item.href) return item.href;
      if (item.href !== "/" && pathname.startsWith(item.href)) {
        const len = item.href.length;
        if (!best || len > best.len) best = { href: item.href, len };
      }
    }
    return best?.href ?? "";
  }, [pathname, effectiveNav]);

  const workspaceLabel = role === "admin" ? "Admin Workspace" : "Customer Workspace";
  const profileHref = role === "admin" ? "/admin/profile" : "/account/profile";

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/admin/customers?query=${encodeURIComponent(q)}`);
  }

  const HEADER_H = 72;
  const FOOTER_H = 72;
  const SIDEBAR_W = 280;

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100">
      {/* Fixed Header */}
      <header
        className="fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur"
        style={{ height: HEADER_H }}
      >
        <div className="flex h-full w-full items-center justify-between gap-3 px-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button type="button" className="lg:hidden" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}>
              <IconHamburger />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative h-9 w-28">
                <Image src="/pcllogo.png" alt="Perth Car Leasing" fill className="object-contain" priority />
              </div>

              <div className="hidden md:block">
                <p className="text-sm font-semibold leading-tight text-neutral-900">{workspaceLabel}</p>
                <p className="text-xs leading-tight text-neutral-500">{userEmail ?? " "}</p>
              </div>
            </div>
          </div>

          {/* Center: Search (admin only) */}
          {role === "admin" ? (
            <form onSubmit={onSearchSubmit} className="hidden w-full max-w-xl md:block">
              <div className="group flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all focus-within:ring-2 focus-within:ring-neutral-900/10 hover:shadow-sm">
                <span className="text-neutral-400" aria-hidden>
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers (name, email, phone)…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-[1px] hover:bg-neutral-800 hover:shadow active:translate-y-0"
                >
                  Search
                </button>
              </div>
            </form>
          ) : (
            <div className="hidden md:block" />
          )}

          {/* Right */}
          <div className="flex items-center gap-2">
            <Badge>{role === "admin" ? "Admin" : "Customer"}</Badge>

            <Link
              href="https://perthcarleasing.com.au"
              className="hidden rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 no-underline transition-all hover:-translate-y-[1px] hover:bg-neutral-50 hover:shadow-sm active:translate-y-0 sm:inline-flex"
            >
              Website
            </Link>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all hover:-translate-y-[1px] hover:bg-neutral-50 hover:shadow-sm active:translate-y-0"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-semibold text-white">
                  {initialsFromEmail(userEmail)}
                </span>
                <span className="hidden max-w-[160px] truncate text-sm sm:block">{userEmail ?? "Account"}</span>
                <span className="text-neutral-400" aria-hidden>
                  ▾
                </span>
              </button>

              {userMenuOpen ? (
                <div role="menu" className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
                  <div className="border-b border-neutral-200 px-4 py-3">
                    <p className="text-xs font-semibold text-neutral-500">SIGNED IN AS</p>
                    <p className="mt-1 truncate text-sm font-semibold text-neutral-900">{userEmail ?? "—"}</p>
                    <p className="mt-1 text-xs text-neutral-600">{workspaceLabel}</p>
                  </div>

                  <div className="p-2">
                    {/* ONLY: Profile + Users (admin only) */}
                    <Link
                      role="menuitem"
                      href={profileHref}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-neutral-900 no-underline transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    >
                      <span>Profile</span>
                      <span className="text-neutral-400">→</span>
                    </Link>

                    {role === "admin" ? (
                      <Link
                        role="menuitem"
                        href="/admin/users"
                        className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-neutral-900 no-underline transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                      >
                        <span>Users</span>
                        <span className="text-neutral-400">→</span>
                      </Link>
                    ) : null}

                    <div className="mt-2 border-t border-neutral-200 pt-2">
                      <form action="/api/auth/logout" method="post">
                        <button
                          role="menuitem"
                          type="submit"
                          className="flex w-full items-center justify-between rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-[1px] hover:bg-neutral-800 hover:shadow active:translate-y-0"
                        >
                          <span>Log out</span>
                          <span aria-hidden>⎋</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile search (admin only) */}
        {role === "admin" ? (
          <div className="px-4 pb-3 md:hidden">
            <form onSubmit={onSearchSubmit}>
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-neutral-900/10">
                <span className="text-neutral-400" aria-hidden>
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
                <button type="submit" className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800">
                  Go
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </header>

      {/* Fixed Footer (keep your footer text) */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white" style={{ height: FOOTER_H }}>
        <div className="flex h-full flex-col gap-2 px-5 py-3 text-xs text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Lets Perth PTY LTD.</p>
          <div className="flex flex-wrap gap-3">
            <span>Platform by</span>
            <Link className="font-semibold text-neutral-700 no-underline hover:underline" href="https://hsg.it.com">
              Hernan Sayers Group
            </Link>
            <Link className="font-semibold text-neutral-700 no-underline hover:underline" href="mailto:helpdesk@hsg.it.com">
              Support
            </Link>
          </div>
        </div>
      </footer>

      {/* Fixed Sidebar (single surface) */}
      <aside
        className="fixed z-20 hidden bg-neutral-50 lg:block"
        style={{ top: HEADER_H, bottom: FOOTER_H, left: 0, width: SIDEBAR_W }}
      >
        <div className="h-full overflow-y-auto p-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-neutral-500">NAVIGATION</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{workspaceLabel}</p>
              </div>
              <Badge>Live</Badge>
            </div>

            <SidebarNav nav={effectiveNav} activeHref={activeHref} />

            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs font-semibold text-neutral-700">Support</p>
              <p className="mt-1 text-xs text-neutral-600">support@perthcarleasing.com.au</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Navigation</p>
                <p className="text-xs text-neutral-500">{workspaceLabel}</p>
              </div>
              <button
                type="button"
                className="h-10 w-10 rounded-xl border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <SidebarNav nav={effectiveNav} activeHref={activeHref} />

              <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs font-semibold text-neutral-700">Support</p>
                <p className="mt-1 text-xs text-neutral-600">Need help? Contact support.</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <a className="font-semibold text-neutral-900 no-underline hover:underline" href="mailto:support@perthcarleasing.com.au">
                    Email
                  </a>
                  <span className="text-neutral-300">•</span>
                  <a className="font-semibold text-neutral-900 no-underline hover:underline" href="tel:+61427526002">
                    Call
                  </a>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3">
                <p className="text-xs font-semibold text-neutral-600">Signed in as</p>
                <p className="mt-1 text-xs text-neutral-700">{userEmail ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Scrollable Content */}
      <main className="relative" style={{ paddingTop: HEADER_H, paddingBottom: FOOTER_H }}>
        <div className="h-[calc(100vh-144px)] overflow-y-auto" style={{ paddingLeft: SIDEBAR_W }}>
          <div className="px-4 py-6 lg:px-8">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge>{activeHref || pathname}</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">{children}</div>

            <div className="h-6" />
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 1023px) {
            main > div {
              padding-left: 0 !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
