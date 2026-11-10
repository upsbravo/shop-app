import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase-admin";

export interface Caller {
  uid: string;
  email: string | null;
  name: string | null;
  /** From the verified token only. Never read a shop ID from the request body. */
  shopId: string | null;
  roleId: string | null;
  superAdmin: boolean;
  token: DecodedIdToken;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Verifies the caller's Firebase ID token and returns who they are. */
export async function requireCaller(request: Request): Promise<Caller> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) throw new HttpError(401, "Sign in first.");
  let token: DecodedIdToken;
  try {
    // checkRevoked=true: a removed user's old token stops working at once.
    token = await adminAuth().verifyIdToken(match[1], true);
  } catch {
    throw new HttpError(401, "Your session has expired. Sign in again.");
  }
  return {
    uid: token.uid,
    email: token.email ?? null,
    name: typeof token.name === "string" ? token.name : null,
    shopId: typeof token.shopId === "string" ? token.shopId : null,
    roleId: typeof token.roleId === "string" ? token.roleId : null,
    superAdmin: token.superAdmin === true,
    token,
  };
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
}
