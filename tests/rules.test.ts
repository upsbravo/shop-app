/**
 * Security rule tests. These run against the Firestore emulator:
 *   npm run test:rules
 * They are skipped when the emulator is not running.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from "firebase/firestore";
import { DEFAULT_ROLES, NO_ACCESS } from "@/lib/permissions";

const emulator = process.env.FIRESTORE_EMULATOR_HOST;
let env: RulesTestEnvironment;

const customRole = { name: "Front desk", description: "Answers the phone", system: false, permissions: NO_ACCESS };

async function seedShop(shopId: string, status: string) {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "shops", shopId), { name: shopId, plan: "starter", status, seatLimit: 3 });
    for (const [roleId, role] of Object.entries(DEFAULT_ROLES)) {
      await setDoc(doc(db, "shops", shopId, "roles", roleId), role);
    }
    await setDoc(doc(db, "shops", shopId, "roles", "custom"), customRole);
    await setDoc(doc(db, "shops", shopId, "members", "someone"), { roleId: "admin", active: true });
    await setDoc(doc(db, "shops", shopId, "auditLog", "first"), { action: "shop.created" });
  });
}

const as = (uid: string, claims: Record<string, unknown>) => env.authenticatedContext(uid, claims).firestore();
const adminOf = (shopId: string) => as(`admin-${shopId}`, { shopId, roleId: "admin" });
const techOf = (shopId: string) => as(`tech-${shopId}`, { shopId, roleId: "technician" });

describe.skipIf(!emulator)("firestore.rules", () => {
  beforeAll(async () => {
    const [host, port] = emulator!.split(":");
    env = await initializeTestEnvironment({
      projectId: "demo-shop-app",
      firestore: { rules: readFileSync("firestore.rules", "utf8"), host, port: Number(port) },
    });
  });
  afterAll(async () => {
    await env?.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await seedShop("alpha", "active");
    await seedShop("bravo", "active");
    await seedShop("late", "pastDue");
    await seedShop("locked", "suspended");
  });

  describe("signed out", () => {
    it("cannot read anything", async () => {
      const db = env.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(db, "shops", "alpha")));
      await assertFails(getDocs(collection(db, "shops", "alpha", "roles")));
      await assertFails(getDoc(doc(db, "platform", "config")));
    });
  });

  describe("signed in without a shop", () => {
    it("cannot read or create a shop", async () => {
      const db = as("newcomer", {});
      await assertFails(getDoc(doc(db, "shops", "alpha")));
      await assertFails(setDoc(doc(db, "shops", "mine"), { name: "Mine", status: "active" }));
    });
  });

  describe("tenant isolation", () => {
    it("lets a member read their own shop", async () => {
      await assertSucceeds(getDoc(doc(adminOf("alpha"), "shops", "alpha")));
      await assertSucceeds(getDocs(collection(adminOf("alpha"), "shops", "alpha", "roles")));
      await assertSucceeds(getDocs(collection(adminOf("alpha"), "shops", "alpha", "members")));
    });
    it("blocks every read of another shop, even for its admin role", async () => {
      const db = adminOf("alpha");
      await assertFails(getDoc(doc(db, "shops", "bravo")));
      await assertFails(getDocs(collection(db, "shops", "bravo", "roles")));
      await assertFails(getDocs(collection(db, "shops", "bravo", "members")));
      await assertFails(getDoc(doc(db, "shops", "bravo", "auditLog", "first")));
    });
    it("blocks every write to another shop", async () => {
      const db = adminOf("alpha");
      await assertFails(setDoc(doc(db, "shops", "bravo", "roles", "sneaky"), customRole));
      await assertFails(updateDoc(doc(db, "shops", "bravo", "roles", "custom"), { name: "Changed" }));
    });
    it("does not let members list all shops", async () => {
      await assertFails(getDocs(collection(adminOf("alpha"), "shops")));
    });
  });

  describe("server-only records", () => {
    it("no browser can change plan, status or seats", async () => {
      await assertFails(updateDoc(doc(adminOf("alpha"), "shops", "alpha"), { status: "active", seatLimit: 999 }));
      await assertFails(deleteDoc(doc(adminOf("alpha"), "shops", "alpha")));
    });
    it("no browser can add members or change a member's role", async () => {
      const db = adminOf("alpha");
      await assertFails(setDoc(doc(db, "shops", "alpha", "members", "friend"), { roleId: "admin", active: true }));
      await assertFails(updateDoc(doc(db, "shops", "alpha", "members", "someone"), { roleId: "technician" }));
    });
    it("no browser can write or erase the audit log", async () => {
      const db = adminOf("alpha");
      await assertFails(setDoc(doc(db, "shops", "alpha", "auditLog", "fake"), { action: "nothing" }));
      await assertFails(deleteDoc(doc(db, "shops", "alpha", "auditLog", "first")));
    });
  });

  describe("roles", () => {
    it("a role with teamManage can create, edit and delete custom roles", async () => {
      const db = adminOf("alpha");
      await assertSucceeds(setDoc(doc(db, "shops", "alpha", "roles", "desk"), customRole));
      await assertSucceeds(updateDoc(doc(db, "shops", "alpha", "roles", "desk"), { name: "Desk" }));
      await assertSucceeds(deleteDoc(doc(db, "shops", "alpha", "roles", "desk")));
    });
    it("a technician cannot change any role, including their own", async () => {
      const db = techOf("alpha");
      await assertFails(setDoc(doc(db, "shops", "alpha", "roles", "desk"), customRole));
      await assertFails(updateDoc(doc(db, "shops", "alpha", "roles", "technician"), { "permissions.teamManage": true }));
      await assertFails(deleteDoc(doc(db, "shops", "alpha", "roles", "custom")));
    });
    it("nobody can change or delete the shop admin role", async () => {
      const db = adminOf("alpha");
      await assertFails(updateDoc(doc(db, "shops", "alpha", "roles", "admin"), { name: "Owner" }));
      await assertFails(deleteDoc(doc(db, "shops", "alpha", "roles", "admin")));
    });
    it("nobody can mark a role as a system role", async () => {
      const db = adminOf("alpha");
      await assertFails(updateDoc(doc(db, "shops", "alpha", "roles", "technician"), { system: true }));
      await assertFails(setDoc(doc(db, "shops", "alpha", "roles", "fake"), { ...customRole, system: true }));
    });
    it("the starter roles other than shop admin can be edited", async () => {
      const db = adminOf("alpha");
      await assertSucceeds(updateDoc(doc(db, "shops", "alpha", "roles", "technician"), { "permissions.inventoryView": true }));
    });
    it("rejects malformed roles", async () => {
      const db = adminOf("alpha");
      const roles = (id: string) => doc(db, "shops", "alpha", "roles", id);
      await assertFails(setDoc(roles("a"), { ...customRole, permissions: { ...NO_ACCESS, superAdmin: true } }));
      await assertFails(setDoc(roles("b"), { ...customRole, permissions: { ...NO_ACCESS, ordersView: "everything" } }));
      await assertFails(setDoc(roles("c"), { ...customRole, permissions: { ordersView: "all" } }));
      await assertFails(setDoc(roles("d"), { ...customRole, name: "x" }));
      await assertFails(setDoc(roles("e"), { ...customRole, extra: 1 }));
    });
  });

  describe("audit log", () => {
    it("is readable with auditView and hidden without it", async () => {
      await assertSucceeds(getDoc(doc(adminOf("alpha"), "shops", "alpha", "auditLog", "first")));
      await assertFails(getDoc(doc(techOf("alpha"), "shops", "alpha", "auditLog", "first")));
    });
  });

  describe("subscription status", () => {
    it("a past-due shop can be read but not changed", async () => {
      const db = adminOf("late");
      await assertSucceeds(getDocs(collection(db, "shops", "late", "roles")));
      await assertFails(setDoc(doc(db, "shops", "late", "roles", "desk"), customRole));
      await assertFails(updateDoc(doc(db, "shops", "late", "roles", "custom"), { name: "Changed" }));
    });
    it("a suspended shop shows its status and nothing else", async () => {
      const db = adminOf("locked");
      await assertSucceeds(getDoc(doc(db, "shops", "locked")));
      await assertFails(getDocs(collection(db, "shops", "locked", "roles")));
      await assertFails(getDocs(collection(db, "shops", "locked", "members")));
    });
  });

  describe("platform owner", () => {
    const owner = () => as("owner", { superAdmin: true });
    it("can list shop subscriptions and read platform config", async () => {
      await assertSucceeds(getDocs(collection(owner(), "shops")));
      await assertSucceeds(getDoc(doc(owner(), "platform", "config")));
    });
    it("cannot read inside a shop from the browser", async () => {
      await assertFails(getDocs(collection(owner(), "shops", "alpha", "members")));
      await assertFails(getDoc(doc(owner(), "shops", "alpha", "auditLog", "first")));
    });
    it("cannot write shops or platform config from the browser", async () => {
      await assertFails(updateDoc(doc(owner(), "shops", "alpha"), { status: "suspended" }));
      await assertFails(setDoc(doc(owner(), "platform", "config"), { price: 1 }));
    });
    it("a shop admin cannot read platform config", async () => {
      await assertFails(getDoc(doc(adminOf("alpha"), "platform", "config")));
    });
  });
});
