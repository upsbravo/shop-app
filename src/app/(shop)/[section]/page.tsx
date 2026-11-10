"use client";

import { useParams } from "next/navigation";
import { ComingSoon, PageHeader, SHOP_NAV } from "@/components/shell";

export default function SectionPage() {
  const { section } = useParams<{ section: string }>();
  const item = SHOP_NAV.find((entry) => entry.href === `/${section}`);
  if (!item) return <PageHeader title="Page not found" lead="There is no screen at this address." />;
  return <ComingSoon item={item} />;
}
