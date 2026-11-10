"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useSession } from "@/components/auth-provider";
import { Card, PageHeader } from "@/components/shell";
import { clientDb } from "@/lib/firebase";
import { allows, NO_ACCESS, type PermissionKey, type Role } from "@/lib/permissions";

const LABELS: Record<PermissionKey, string> = {
  ordersView: "See orders",
  ordersEdit: "Create and edit orders",
  pricesView: "See prices and costs",
  pricesEdit: "Change prices",
  customersView: "See customers",
  customersEdit: "Edit customers",
  paymentsTake: "Take payments",
  paymentsRefund: "Refund payments",
  inventoryView: "See inventory",
  inventoryEdit: "Adjust inventory",
  purchasingView: "See purchase orders",
  purchasingEdit: "Create and receive purchase orders",
  timeOwn: "Clock own time",
  timeAll: "See everyone's time",
  timeEdit: "Edit time entries",
  reportsView: "See reports",
  teamManage: "Manage team and roles",
  settingsManage: "Change shop settings",
  auditView: "See the audit log",
  assistantUse: "Use the assistant",
};

const KEYS = Object.keys(NO_ACCESS) as PermissionKey[];

function describe(role: Role, key: PermissionKey): string {
  const value = role.permissions[key];
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return { all: "All", assigned: "Assigned only", full: "Full", nameOnly: "Name only", sales: "Sales", inventory: "Inventory", none: "No" }[value];
}

export default function TeamPage() {
  const { shopId, permissions } = useSession();
  const [roles, setRoles] = useState<Array<Role & { id: string }>>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    return onSnapshot(
      collection(clientDb(), "shops", shopId, "roles"),
      (snapshot) => setRoles(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Role) }))),
      () => setError(true),
    );
  }, [shopId]);

  if (!allows(permissions, "teamManage")) {
    return <PageHeader title="Team and roles" lead="Your role does not include managing the team." />;
  }

  return (
    <>
      <PageHeader title="Team and roles" lead="What each role can see and do. Editing roles and invites arrive in build slice 2." />
      {error ? (
        <p role="alert" className="rounded-lg bg-warn-bg px-3 py-2 text-warn">
          Roles could not be loaded.
        </p>
      ) : null}
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" className="border-b border-line py-2 pr-4 font-semibold">
                Permission
              </th>
              {roles.map((role) => (
                <th key={role.id} scope="col" className="border-b border-line px-3 py-2 font-semibold">
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KEYS.map((key) => (
              <tr key={key}>
                <th scope="row" className="border-b border-line py-2 pr-4 font-normal">
                  {LABELS[key]}
                </th>
                {roles.map((role) => (
                  <td key={role.id} className="border-b border-line px-3 py-2 text-muted">
                    {describe(role, key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
