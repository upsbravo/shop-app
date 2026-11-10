"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth-provider";
import { FullPageMessage } from "@/components/shell";

/** Sends each visitor to the right place for their account state. */
export default function Home() {
  const router = useRouter();
  const { loading, user, shopId, superAdmin } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/sign-in");
    else if (shopId) router.replace("/board");
    else if (superAdmin) router.replace("/platform");
    else router.replace("/onboarding");
  }, [loading, user, shopId, superAdmin, router]);

  return <FullPageMessage title="Loading Shop App" />;
}
