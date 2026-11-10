"use client";

import { useSession } from "@/components/auth-provider";
import { Card, PageHeader } from "@/components/shell";

const COLUMNS = ["Estimates", "Waiting on approval", "In the bay", "Waiting on parts", "Ready to invoice"];

export default function BoardPage() {
  const { user } = useSession();
  return (
    <>
      <PageHeader
        title="Job board"
        lead={`Signed in as ${user?.displayName ?? user?.email ?? "you"}. Orders arrive in build slice 5.`}
      />
      <div className="flex flex-wrap gap-3">
        {COLUMNS.map((column) => (
          <Card key={column} className="flex min-h-40 flex-[1_1_200px] flex-col gap-2">
            <h2 className="font-semibold">{column}</h2>
            <p className="text-muted">No orders yet</p>
          </Card>
        ))}
      </div>
    </>
  );
}
