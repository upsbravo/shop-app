import { connection } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { errorResponse, HttpError, requireCaller } from "@/lib/server-auth";

/** Lists every shop's subscription summary. Platform owner only. */
export async function GET(request: Request) {
  // Always answered per request, never prerendered or cached.
  await connection();
  try {
    const caller = await requireCaller(request);
    if (!caller.superAdmin) throw new HttpError(403, "Platform owner only.");

    const snapshot = await adminDb().collection("shops").orderBy("createdAt", "desc").limit(200).get();
    const shops = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const members = await doc.ref.collection("members").where("active", "==", true).count().get();
        // Only subscription facts leave the server here, never shop records.
        return {
          id: doc.id,
          name: String(data.name ?? ""),
          plan: String(data.plan ?? ""),
          status: String(data.status ?? ""),
          seatLimit: Number(data.seatLimit ?? 0),
          seatsUsed: members.data().count,
        };
      }),
    );
    return Response.json({ shops });
  } catch (error) {
    return errorResponse(error);
  }
}
