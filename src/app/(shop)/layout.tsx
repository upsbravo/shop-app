"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { useSession } from "@/components/auth-provider";
import { FullPageMessage, Shell } from "@/components/shell";
import { clientDb } from "@/lib/firebase";
import { shopIsWritable, type ShopStatus } from "@/lib/permissions";

const NOTICES: Partial<Record<ShopStatus, string>> = {
  pastDue: "Payment is overdue, so this shop is read-only until the subscription is brought up to date.",
  suspended: "This shop is suspended. Contact support to restore access.",
  cancelled: "This subscription has ended. Contact support to reopen the shop.",
};

/** Guards every shop screen: signed in, belongs to a shop, shop is open. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, user, shopId } = useSession();
  const [status, setStatus] = useState<ShopStatus | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/sign-in");
    else if (!shopId) router.replace("/");
  }, [loading, user, shopId, router]);

  useEffect(() => {
    if (!shopId) return;
    return onSnapshot(
      doc(clientDb(), "shops", shopId),
      (snapshot) => setStatus((snapshot.data()?.status as ShopStatus | undefined) ?? null),
      () => setStatus(null),
    );
  }, [shopId]);

  if (loading || !user || !shopId) return <FullPageMessage title="Loading Shop App" />;
  if (status === "suspended" || status === "cancelled") {
    return <FullPageMessage title="Shop unavailable">{NOTICES[status]}</FullPageMessage>;
  }

  return (
    <Shell kind="shop">
      {status && !shopIsWritable(status) ? (
        <p role="status" className="rounded-lg bg-warn-bg px-3 py-2 text-warn">
          {NOTICES[status]}
        </p>
      ) : null}
      <Suspense fallback={null}>{children}</Suspense>
    </Shell>
  );
}
