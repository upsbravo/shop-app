"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth-provider";
import { firebaseReady } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();
  const { loading, user, signIn } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch {
      setError("Sign-in did not finish. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-wrap">
      <div className="flex flex-[1_1_380px] flex-col justify-between gap-8 bg-side px-10 py-10 text-white">
        <div className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[15px]">
            S
          </span>
          Shop App
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-display text-[34px] font-semibold leading-tight tracking-tight">
            Run the whole shop from one screen.
          </p>
          <p className="max-w-md text-side-text">
            Estimates, repair orders, invoices, parts, purchasing and time clocks, with roles that decide exactly what
            each person can see and do.
          </p>
        </div>
        <p className="text-[13px] text-side-text">Each shop&apos;s data is kept separate from every other shop.</p>
      </div>
      <main className="flex flex-[1_1_380px] flex-col justify-center gap-4 px-10 py-10">
        <h1 className="font-display text-[28px] font-semibold tracking-tight">Sign in</h1>
        {firebaseReady ? (
          <>
            <p className="text-muted">Use the Google account your shop invited, or start a new shop.</p>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={busy}
              className="min-h-11 max-w-xs rounded-lg bg-accent px-4 font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Opening Google" : "Continue with Google"}
            </button>
            {error ? (
              <p role="alert" className="max-w-xs rounded-lg bg-warn-bg px-3 py-2 text-warn">
                {error}
              </p>
            ) : null}
          </>
        ) : (
          <div role="alert" className="max-w-md rounded-xl border border-line bg-white p-4">
            <p className="font-semibold">Firebase is not connected yet</p>
            <p className="mt-1 text-muted">
              Add the four NEXT_PUBLIC_FIREBASE values from .env.example, then reload. In AI Studio, turning on
              Firebase for the app fills these in.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
