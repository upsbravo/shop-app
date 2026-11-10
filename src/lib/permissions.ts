/**
 * Roles and permissions. This file is the single source of truth for the
 * permission keys; firestore.rules checks the same keys on the server side.
 * The UI may hide things with these helpers, but hiding is never the
 * protection: the rules and the server routes are.
 */

export type OrdersLevel = "all" | "assigned" | "none";
export type CustomersLevel = "full" | "nameOnly" | "none";
export type ReportsLevel = "all" | "sales" | "inventory" | "none";

export interface Permissions {
  ordersView: OrdersLevel;
  ordersEdit: boolean;
  pricesView: boolean;
  pricesEdit: boolean;
  customersView: CustomersLevel;
  customersEdit: boolean;
  paymentsTake: boolean;
  paymentsRefund: boolean;
  inventoryView: boolean;
  inventoryEdit: boolean;
  purchasingView: boolean;
  purchasingEdit: boolean;
  timeOwn: boolean;
  timeAll: boolean;
  timeEdit: boolean;
  reportsView: ReportsLevel;
  teamManage: boolean;
  settingsManage: boolean;
  auditView: boolean;
  assistantUse: boolean;
}

export type PermissionKey = keyof Permissions;

export interface Role {
  name: string;
  description: string;
  system: boolean;
  permissions: Permissions;
}

/** Everything off. New custom roles start here. */
export const NO_ACCESS: Permissions = {
  ordersView: "none",
  ordersEdit: false,
  pricesView: false,
  pricesEdit: false,
  customersView: "none",
  customersEdit: false,
  paymentsTake: false,
  paymentsRefund: false,
  inventoryView: false,
  inventoryEdit: false,
  purchasingView: false,
  purchasingEdit: false,
  timeOwn: false,
  timeAll: false,
  timeEdit: false,
  reportsView: "none",
  teamManage: false,
  settingsManage: false,
  auditView: false,
  assistantUse: false,
};

export const ADMIN_ROLE_ID = "admin";

/** The four roles every new shop starts with, keyed by role id. */
export const DEFAULT_ROLES: Record<string, Role> = {
  [ADMIN_ROLE_ID]: {
    name: "Shop admin",
    description: "Full control of this shop. Cannot see other shops.",
    system: true,
    permissions: {
      ordersView: "all",
      ordersEdit: true,
      pricesView: true,
      pricesEdit: true,
      customersView: "full",
      customersEdit: true,
      paymentsTake: true,
      paymentsRefund: true,
      inventoryView: true,
      inventoryEdit: true,
      purchasingView: true,
      purchasingEdit: true,
      timeOwn: true,
      timeAll: true,
      timeEdit: true,
      reportsView: "all",
      teamManage: true,
      settingsManage: true,
      auditView: true,
      assistantUse: true,
    },
  },
  writer: {
    name: "Service writer",
    description: "Writes estimates, talks to customers, takes payments.",
    system: false,
    permissions: {
      ...NO_ACCESS,
      ordersView: "all",
      ordersEdit: true,
      pricesView: true,
      pricesEdit: true,
      customersView: "full",
      customersEdit: true,
      paymentsTake: true,
      inventoryView: true,
      purchasingView: true,
      purchasingEdit: true,
      timeOwn: true,
      reportsView: "sales",
      assistantUse: true,
    },
  },
  technician: {
    name: "Technician",
    description: "Sees assigned jobs without prices. Clocks time and completes work.",
    system: false,
    permissions: {
      ...NO_ACCESS,
      ordersView: "assigned",
      customersView: "nameOnly",
      inventoryView: true,
      timeOwn: true,
    },
  },
  parts: {
    name: "Parts manager",
    description: "Runs inventory and purchasing. No customer payments.",
    system: false,
    permissions: {
      ...NO_ACCESS,
      ordersView: "all",
      pricesView: true,
      customersView: "nameOnly",
      inventoryView: true,
      inventoryEdit: true,
      purchasingView: true,
      purchasingEdit: true,
      timeOwn: true,
      reportsView: "inventory",
      assistantUse: true,
    },
  },
};

/** True when a permission grants any access at all. */
export function allows(permissions: Permissions | null | undefined, key: PermissionKey): boolean {
  if (!permissions) return false;
  const value = permissions[key];
  return typeof value === "boolean" ? value : value !== "none";
}

const LEVEL_VALUES: Record<string, readonly string[]> = {
  ordersView: ["all", "assigned", "none"],
  customersView: ["full", "nameOnly", "none"],
  reportsView: ["all", "sales", "inventory", "none"],
};

/**
 * Checks that an object is a complete, well-formed permission set with no
 * extra keys. Used by the server before a role is saved.
 */
export function isValidPermissions(input: unknown): input is Permissions {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return false;
  const record = input as Record<string, unknown>;
  const expected = Object.keys(NO_ACCESS);
  const actual = Object.keys(record);
  if (actual.length !== expected.length) return false;
  return expected.every((key) => {
    const value = record[key];
    const levels = LEVEL_VALUES[key];
    return levels ? typeof value === "string" && levels.includes(value) : typeof value === "boolean";
  });
}

/** Shop status decides whether data can be changed. Mirrors firestore.rules. */
export type ShopStatus = "trial" | "active" | "pastDue" | "suspended" | "cancelled";

export function shopIsWritable(status: ShopStatus): boolean {
  return status === "trial" || status === "active";
}
