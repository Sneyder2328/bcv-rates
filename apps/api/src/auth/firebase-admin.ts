import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type ServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function readServiceAccountFromEnv(): ServiceAccount | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as Partial<ServiceAccount>;
      if (parsed.projectId && parsed.clientEmail && parsed.privateKey) {
        return {
          projectId: parsed.projectId,
          clientEmail: parsed.clientEmail,
          privateKey: parsed.privateKey,
        };
      }
    } catch {
      // fall through and try other methods
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  // Private keys are commonly stored with escaped newlines in env vars.
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey };
}

function getFirebaseAdminApp() {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const serviceAccount = readServiceAccountFromEnv();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return initializeApp({
    credential: applicationDefault(),
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
