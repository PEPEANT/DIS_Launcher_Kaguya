import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "kaguya-snack-rush";
export const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "(default)";
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = path.join(ROOT_DIR, "data");

function getFirebaseConfigstorePath() {
  return path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
}

export function getDefaultActor() {
  return String(process.env.ADMIN_ACTOR || os.userInfo().username || "admin").trim() || "admin";
}

export function createActionId(prefix = "admin_action") {
  return `${prefix}_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export function refreshFirebaseTokenCache() {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/c", "firebase.cmd", "projects:list", "--json"], {
      stdio: "ignore",
      cwd: ROOT_DIR
    });
    return;
  }

  execFileSync("firebase", ["projects:list", "--json"], {
    stdio: "ignore",
    cwd: ROOT_DIR
  });
}

async function readFirebaseAccessToken() {
  const raw = await fs.readFile(getFirebaseConfigstorePath(), "utf8");
  const config = JSON.parse(raw);
  const token = String(config?.tokens?.access_token || "").trim();

  if (!token) {
    throw new Error("Firebase CLI access token not found.");
  }

  return token;
}

function encodePathSegments(relativePath) {
  return relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getApiBaseUrl() {
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(DATABASE_ID)}`;
}

export function getDocumentName(documentPath) {
  return `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${documentPath}`;
}

async function authFetch(url, options = {}) {
  const token = await readFirebaseAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore API ${response.status} ${response.statusText}: ${text}`);
  }

  return response;
}

export function firestoreValueToJs(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("stringValue" in value) {
    return String(value.stringValue || "");
  }

  if ("integerValue" in value) {
    return Number.parseInt(value.integerValue, 10) || 0;
  }

  if ("doubleValue" in value) {
    return Number(value.doubleValue) || 0;
  }

  if ("booleanValue" in value) {
    return value.booleanValue === true;
  }

  if ("timestampValue" in value) {
    return String(value.timestampValue || "");
  }

  if ("arrayValue" in value) {
    return Array.isArray(value.arrayValue?.values)
      ? value.arrayValue.values.map((entry) => firestoreValueToJs(entry))
      : [];
  }

  if ("mapValue" in value) {
    return firestoreFieldsToJs(value.mapValue?.fields || {});
  }

  if ("nullValue" in value) {
    return null;
  }

  return null;
}

export function firestoreFieldsToJs(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, firestoreValueToJs(value)])
  );
}

export function jsValueToFirestore(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((entry) => jsValueToFirestore(entry))
      }
    };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [key, jsValueToFirestore(entry)])
        )
      }
    };
  }

  return { stringValue: String(value) };
}

export function jsFieldsToFirestore(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, jsValueToFirestore(value)])
  );
}

export async function listDocuments(collectionPath) {
  const encodedCollectionPath = encodePathSegments(collectionPath);
  const documents = [];
  let pageToken = "";

  while (true) {
    const search = new URLSearchParams({ pageSize: "1000" });
    if (pageToken) {
      search.set("pageToken", pageToken);
    }

    const response = await authFetch(`${getApiBaseUrl()}/documents/${encodedCollectionPath}?${search.toString()}`);
    if (!response) {
      break;
    }

    const payload = await response.json();
    documents.push(...(payload.documents || []));

    if (!payload.nextPageToken) {
      break;
    }

    pageToken = payload.nextPageToken;
  }

  return documents;
}

export async function readDocument(documentPath) {
  const encodedDocumentPath = encodePathSegments(documentPath);
  const response = await authFetch(`${getApiBaseUrl()}/documents/${encodedDocumentPath}`);

  if (!response) {
    return { exists: false, data: {} };
  }

  const payload = await response.json();
  return {
    exists: true,
    data: firestoreFieldsToJs(payload.fields || {})
  };
}

export async function commitWrites(writes) {
  const response = await authFetch(`${getApiBaseUrl()}/documents:commit`, {
    method: "POST",
    body: JSON.stringify({ writes })
  });

  if (!response) {
    throw new Error("Commit request returned an empty response.");
  }

  return response.json();
}

export function buildPatchWrite(documentPath, fields, { mustNotExist = false } = {}) {
  return {
    update: {
      name: getDocumentName(documentPath),
      fields: jsFieldsToFirestore(fields)
    },
    updateMask: {
      fieldPaths: Object.keys(fields)
    },
    ...(mustNotExist ? { currentDocument: { exists: false } } : {})
  };
}

export function buildDeleteWrite(documentPath, { mustExist = false } = {}) {
  return {
    delete: getDocumentName(documentPath),
    ...(mustExist ? { currentDocument: { exists: true } } : {})
  };
}

export async function writeSummaryFile(prefix, summary) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const stampSource = String(summary?.startedAt || new Date().toISOString());
  const stamp = stampSource.slice(0, 19).replace(/[:T]/g, "_");
  const filepath = path.join(DATA_DIR, `${prefix}-${stamp}.json`);
  await fs.writeFile(filepath, JSON.stringify(summary, null, 2));
  return filepath;
}
