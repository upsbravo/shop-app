"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/auth-provider";
import { Card, PageHeader } from "@/components/shell";

interface ShopRow {
  id: string;
  name: string;
  plan: string;
  status: string;
  seatLimit: number;
  seatsUsed: number;
}

export default function PlatformShopsPage() {
  const { api } = useSession();
  const [shops, setShops] = useState<ShopRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api("/api/platform/shops")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const body = (await response.json()) as { shops: ShopRow[] };
        if (!cancelled) setShops(body.shops);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <>
      <PageHeader title="Shops" lead="Every subscriber, with plan, status and seats. Shop records stay private to each shop." />
      {error ? (
        <p role="alert" className="rounded-lg bg-warn-bg px-3 py-2 text-warn">
          Shops could not be loaded.
        </p>
      ) : null}
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {["Shop", "Plan", "Status", "Seats"].map((heading) => (
                <th key={heading} scope="col" className="border-b border-line px-3 py-2 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(shops ?? []).map((shop) => (
              <tr key={shop.id}>
                <td className="border-b border-line px-3 py-2">{shop.name}</td>
                <td className="border-b border-line px-3 py-2 text-muted">{shop.plan}</td>
                <td className="border-b border-line px-3 py-2 text-muted">{shop.status}</td>
                <td className="border-b border-line px-3 py-2 text-muted">
                  {shop.seatsUsed} of {shop.seatLimit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shops && shops.length === 0 ? <p className="px-3 py-3 text-muted">No shops yet</p> : null}
        {!shops && !error ? <p className="px-3 py-3 text-muted">Loading shops</p> : null}
      </Card>
    </>
  );
}
