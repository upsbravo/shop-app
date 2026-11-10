import { describe, expect, it } from "vitest";
import { allows, DEFAULT_ROLES, isValidPermissions, NO_ACCESS, shopIsWritable } from "@/lib/permissions";

describe("default roles", () => {
  it("ships the four starting roles", () => {
    expect(Object.keys(DEFAULT_ROLES).sort()).toEqual(["admin", "parts", "technician", "writer"]);
  });

  it("gives every default role a complete, valid permission set", () => {
    for (const role of Object.values(DEFAULT_ROLES)) expect(isValidPermissions(role.permissions)).toBe(true);
  });

  it("lets the shop admin do everything", () => {
    for (const key of Object.keys(NO_ACCESS) as Array<keyof typeof NO_ACCESS>) {
      expect(allows(DEFAULT_ROLES.admin.permissions, key)).toBe(true);
    }
  });

  it("keeps technicians away from prices, payments, team and settings", () => {
    const p = DEFAULT_ROLES.technician.permissions;
    for (const key of ["pricesView", "pricesEdit", "paymentsTake", "paymentsRefund", "teamManage", "settingsManage", "auditView"] as const) {
      expect(allows(p, key)).toBe(false);
    }
    expect(p.ordersView).toBe("assigned");
  });

  it("only the shop admin manages the team by default", () => {
    const managers = Object.entries(DEFAULT_ROLES).filter(([, role]) => role.permissions.teamManage).map(([id]) => id);
    expect(managers).toEqual(["admin"]);
  });
});

describe("allows", () => {
  it("denies when there is no role", () => {
    expect(allows(null, "ordersView")).toBe(false);
  });
  it("treats the none level as no access", () => {
    expect(allows(NO_ACCESS, "ordersView")).toBe(false);
    expect(allows({ ...NO_ACCESS, ordersView: "assigned" }, "ordersView")).toBe(true);
  });
});

describe("isValidPermissions", () => {
  it("rejects missing keys, extra keys and wrong types", () => {
    const missing: Record<string, unknown> = { ...NO_ACCESS };
    delete missing.assistantUse;
    expect(isValidPermissions(missing)).toBe(false);
    expect(isValidPermissions({ ...NO_ACCESS, superAdmin: true })).toBe(false);
    expect(isValidPermissions({ ...NO_ACCESS, ordersView: "everything" })).toBe(false);
    expect(isValidPermissions({ ...NO_ACCESS, teamManage: "yes" })).toBe(false);
    expect(isValidPermissions(null)).toBe(false);
  });
});

describe("shopIsWritable", () => {
  it("allows changes only on trial and active shops", () => {
    expect(shopIsWritable("trial")).toBe(true);
    expect(shopIsWritable("active")).toBe(true);
    expect(shopIsWritable("pastDue")).toBe(false);
    expect(shopIsWritable("suspended")).toBe(false);
    expect(shopIsWritable("cancelled")).toBe(false);
  });
});
