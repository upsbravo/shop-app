"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/auth-provider";
import { allows, type PermissionKey } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  /** Hide the item unless the role has this permission. UI only, not security. */
  needs?: PermissionKey;
  /** Which build slice delivers this screen. */
  slice?: number;
}

export const SHOP_NAV: NavItem[] = [
  { href: "/board", label: "Job board", needs: "ordersView", slice: 6 },
  { href: "/assistant", label: "Assistant", needs: "assistantUse", slice: 12 },
  { href: "/orders", label: "Orders", needs: "ordersView", slice: 5 },
  { href: "/calendar", label: "Calendar", needs: "ordersView", slice: 6 },
  { href: "/customers", label: "Customers and fleets", needs: "customersView", slice: 4 },
  { href: "/inventory", label: "Inventory", needs: "inventoryView", slice: 8 },
  { href: "/purchasing", label: "Purchasing", needs: "purchasingView", slice: 8 },
  { href: "/time", label: "Time clocks", needs: "timeOwn", slice: 9 },
  { href: "/reports", label: "Reports", needs: "reportsView", slice: 9 },
  { href: "/team", label: "Team and roles", needs: "teamManage" },
  { href: "/settings", label: "Settings", needs: "settingsManage", slice: 10 },
];

export const PLATFORM_NAV: NavItem[] = [
  { href: "/platform", label: "Shops" },
  { href: "/platform/plans", label: "Plans and pricing", slice: 3 },
  { href: "/platform/billing", label: "Subscriptions and billing", slice: 11 },
  { href: "/platform/support", label: "Support access", slice: 3 },
  { href: "/platform/audit", label: "Audit log", slice: 3 },
  { href: "/platform/settings", label: "Platform settings", slice: 3 },
];

function Brand({ note }: { note?: string }) {
  return (
    <div className="px-2.5 pb-4 pt-1">
      <div className="flex items-center gap-2.5 font-display text-xl font-semibold text-white">
        <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[15px]">
          S
        </span>
        Shop App
      </div>
      {note ? <div className="mt-1 text-xs text-side-text">{note}</div> : null}
    </div>
  );
}

export function Shell({ kind, children }: { kind: "shop" | "platform"; children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, permissions, signOutNow } = useSession();
  const items =
    kind === "platform" ? PLATFORM_NAV : SHOP_NAV.filter((item) => !item.needs || allows(permissions, item.needs));

  return (
    <div className="flex min-h-screen flex-wrap">
      <nav aria-label="Main" className="flex max-w-full flex-[1_1_220px] flex-col gap-1 bg-side px-3.5 py-5">
        <Brand note={kind === "platform" ? "Platform owner console" : undefined} />
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-lg px-2.5 ${
                active ? "bg-accent font-semibold text-white" : "text-side-text hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="mt-4 border-t border-white/15 px-2.5 pt-3 text-[13px] text-side-text">
          <div className="break-words">{user?.email}</div>
          <button
            type="button"
            onClick={signOutNow}
            className="mt-2 min-h-11 rounded-lg border border-white/30 px-3 font-semibold text-white hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 px-7 py-6">{children}</main>
    </div>
  );
}

export function PageHeader({ title, lead, action }: { title: string; lead: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h1 className="font-display text-[28px] font-semibold tracking-tight">{title}</h1>
        <p className="text-muted">{lead}</p>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,20,25,0.06)] ${className}`}>
      {children}
    </section>
  );
}

export function ComingSoon({ item }: { item: NavItem }) {
  return (
    <>
      <PageHeader title={item.label} lead="This screen is designed and is built in a later slice." />
      <Card>
        <p>
          Planned for build slice {item.slice}. The design for this screen is on the project canvas, and the build
          brief lists what it must do.
        </p>
      </Card>
    </>
  );
}

export function FullPageMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="text-muted">{children}</div>
    </div>
  );
}
