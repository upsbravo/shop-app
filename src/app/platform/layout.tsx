"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth-provider";
import { FullPageMessage, Shell } from "@/components/shell";

/** Platform owner console. The server routes check superAdmin again. */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, user, superAdmin } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/sign-in");
    else if (!superAdmin) router.replace("/");
  }, [loading, user, superAdmin, router]);

  if (loading || !user || !superAdmin) return <FullPageMessage title="Loading Shop App" />;
  return (
    <Shell kind="platform">
      <Suspense fallback={null}>{children}</Suspense>
    </Shell>
  );
}
