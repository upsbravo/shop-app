"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth-provider";
import { Card } from "@/components/shell";

export default function OnboardingPage() {
  const router = useRouter();
  const { loading, user, shopId, api, refresh, signOutNow } = useSession();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/sign-in");
    else if (shopId) router.replace("/board");
  }, [loading, user, shopId, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await api("/api/shops", { method: "POST", body: JSON.stringify({ name }) });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "The shop could not be created.");
      }
      // The server has set this user's shop and role; fetch a token that carries them.
      await refresh();
      router.replace("/board");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The shop could not be created.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-tight">Create your shop</h1>
      <p className="text-muted">
        You become the shop admin. The shop starts on a trial with four roles ready to use: shop admin, service
        writer, technician and parts manager.
      </p>
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="shop-name" className="font-semibold">
            Shop name
          </label>
          <input
            id="shop-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={80}
            required
            autoComplete="organization"
            className="min-h-11 rounded-lg border border-field px-3"
          />
          {error ? (
            <p role="alert" className="rounded-lg bg-warn-bg px-3 py-2 text-warn">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-lg bg-accent px-4 font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Creating shop" : "Create shop"}
          </button>
        </form>
      </Card>
      <p className="text-[13px] text-muted">
        Joining an existing shop instead? Ask its admin to invite {user?.email ?? "your email"}, then sign in again.{" "}
        <button type="button" onClick={signOutNow} className="font-semibold text-accent underline">
          Sign out
        </button>
      </p>
    </main>
  );
}
