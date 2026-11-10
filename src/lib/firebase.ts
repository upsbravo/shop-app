import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Browser-side Firebase. These values are public identifiers, not secrets;
 * access is controlled by firestore.rules and the server routes.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** False until the Firebase project is connected (see README). */
export const firebaseReady = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;

function getClientApp(): FirebaseApp {
  if (!firebaseReady) throw new Error("Firebase is not configured yet.");
  if (!app) app = getApps().length ? getApp() : initializeApp(config);
  return app;
}

export function clientAuth(): Auth {
  return getAuth(getClientApp());
}

export function clientDb(): Firestore {
  return getFirestore(getClientApp());
}
