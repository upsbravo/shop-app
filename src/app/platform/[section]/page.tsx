"use client";

import { useParams } from "next/navigation";
import { ComingSoon, PageHeader, PLATFORM_NAV } from "@/components/shell";

export default function PlatformSectionPage() {
  const { section } = useParams<{ section: string }>();
  const item = PLATFORM_NAV.find((entry) => entry.href === `/platform/${section}`);
  if (!item) return <PageHeader title="Page not found" lead="There is no screen at this address." />;
  return <ComingSoon item={item} />;
}
