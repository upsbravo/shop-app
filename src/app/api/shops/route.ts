import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ADMIN_ROLE_ID, DEFAULT_ROLES } from "@/lib/permissions";
import { errorResponse, HttpError, requireCaller } from "@/lib/server-auth";

const STARTER_SEATS = 3;

/**
 * Creates a shop for the signed-in user, who becomes its shop admin.
 * Everything here is privileged: the browser can never create a shop, a role
 * set, a membership or claims directly (firestore.rules denies it).
 */
export async function POST(request: Request) {
  try {
    const caller = await requireCaller(request);
    if (caller.shopId) throw new HttpError(409, "This account already belongs to a shop.");

    const body: unknown = await request.json().catch(() => null);
    const rawName = typeof body === "object" && body !== null ? (body as Record<string, unknown>).name : null;
    const name = typeof rawName === "string" ? rawName.trim().replace(/\s+/g, " ") : "";
    if (name.length < 2 || name.length > 80) {
      throw new HttpError(400, "Enter a shop name between 2 and 80 characters.");
    }

    const db = adminDb();
    const shopRef = db.collection("shops").doc();
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    batch.set(shopRef, {
      name,
      plan: "starter",
      status: "trial",
      seatLimit: STARTER_SEATS,
      ownerUid: caller.uid,
      nextOrderNumber: 1001,
      createdAt: now,
    });
    for (const [roleId, role] of Object.entries(DEFAULT_ROLES)) {
      batch.set(shopRef.collection("roles").doc(roleId), { ...role, createdAt: now });
    }
    batch.set(shopRef.collection("members").doc(caller.uid), {
      roleId: ADMIN_ROLE_ID,
      active: true,
      displayName: caller.name ?? caller.email ?? "Shop admin",
      email: caller.email,
      createdAt: now,
    });
    batch.set(shopRef.collection("auditLog").doc(), {
      at: now,
      actorUid: caller.uid,
      action: "shop.created",
      detail: { name },
    });
    await batch.commit();

    // Keep any existing claims (for example superAdmin) and add the shop.
    const existing = (await adminAuth().getUser(caller.uid)).customClaims ?? {};
    await adminAuth().setCustomUserClaims(caller.uid, { ...existing, shopId: shopRef.id, roleId: ADMIN_ROLE_ID });

    return Response.json({ shopId: shopRef.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
