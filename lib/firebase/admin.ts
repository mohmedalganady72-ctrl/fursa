import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "@/lib/env";

function getFirebaseAdminApp() {
  if (getApps().length) return getApp();

  const credential = env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY
    ? cert({
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      })
    : applicationDefault();

  return initializeApp({
    credential,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const firebaseAdminAuth = getAuth(getFirebaseAdminApp());
