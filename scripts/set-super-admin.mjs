// Marks one account as the platform owner. Run it yourself, once:
//   FIREBASE_SERVICE_ACCOUNT='<service account json>' node scripts/set-super-admin.mjs you@example.com
// There is deliberately no screen or API route that can do this.
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-super-admin.mjs <email>");
  process.exit(1);
}
const json = process.env.FIREBASE_SERVICE_ACCOUNT;
initializeApp({ credential: json ? cert(JSON.parse(json)) : applicationDefault() });

const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), superAdmin: true });
console.log(`${email} is now a platform owner. They must sign out and back in.`);
