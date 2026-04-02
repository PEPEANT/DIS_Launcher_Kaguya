import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "kaguya-snack-rush";
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "(default)";
const BACKUP_DATE = process.env.FIRESTORE_BACKUP_DATE || new Date().toISOString().slice(0, 10).replace(/-/g, "_");
const BACKUP_PREFIX = process.env.FIRESTORE_BACKUP_PREFIX || `backup_${BACKUP_DATE}`;
const COLLECTIONS = (process.env.FIRESTORE_BACKUP_COLLECTIONS || [
  "rankings",
  "rankings_season2",
  "users",
  "identityLinks",
  "presence",
  "presenceSessions"
].join(","))
  .split(",")
  .map((name) => String(name || "").trim())
  .filter(Boolean);

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT_DIR, "data");

function getFirebaseConfigstorePath() {
  return path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
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

function getRelativeDocumentPath(fullDocumentName) {
  const marker = `/documents/`;
  const markerIndex = fullDocumentName.indexOf(marker);
  return markerIndex >= 0 ? fullDocumentName.slice(markerIndex + marker.length) : "";
}

async function readFirebaseAccessToken() {
  const configstorePath = getFirebaseConfigstorePath();
  const raw = await fs.readFile(configstorePath, "utf8");
  const config = JSON.parse(raw);
  const token = String(config?.tokens?.access_token || "").trim();

  if (!token) {
    throw new Error("Firebase CLI access token not found.");
  }

  return token;
}

function refreshFirebaseTokenCache() {
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

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore API ${response.status} ${response.statusText}: ${text}`);
  }

  return response;
}

async function listDocuments(collectionPath) {
  const encodedCollectionPath = encodePathSegments(collectionPath);
  const documents = [];
  let pageToken = "";

  while (true) {
    const search = new URLSearchParams({ pageSize: "1000" });
    if (pageToken) {
      search.set("pageToken", pageToken);
    }

    const response = await authFetch(`${getApiBaseUrl()}/documents/${encodedCollectionPath}?${search.toString()}`);
    const payload = await response.json();
    documents.push(...(payload.documents || []));

    if (!payload.nextPageToken) {
      break;
    }

    pageToken = payload.nextPageToken;
  }

  return documents;
}

async function listSubcollectionIds(documentPath) {
  const encodedDocumentPath = encodePathSegments(documentPath);
  const collectionIds = [];
  let pageToken = "";

  while (true) {
    const response = await authFetch(`${getApiBaseUrl()}/documents/${encodedDocumentPath}:listCollectionIds`, {
      method: "POST",
      body: JSON.stringify({
        pageSize: 1000,
        ...(pageToken ? { pageToken } : {})
      })
    });
    const payload = await response.json();
    collectionIds.push(...(payload.collectionIds || []));

    if (!payload.nextPageToken) {
      break;
    }

    pageToken = payload.nextPageToken;
  }

  return collectionIds;
}

async function writeDocument(documentPath, fields = {}) {
  const encodedDocumentPath = encodePathSegments(documentPath);
  await authFetch(`${getApiBaseUrl()}/documents/${encodedDocumentPath}`, {
    method: "PATCH",
    body: JSON.stringify({ fields })
  });
}

async function copyCollection(sourceCollectionPath, targetCollectionPath, summary) {
  const documents = await listDocuments(sourceCollectionPath);
  summary.collections += 1;
  summary.collectionMap[sourceCollectionPath] = {
    targetCollectionPath,
    documents: documents.length
  };

  for (const document of documents) {
    const sourceDocumentPath = getRelativeDocumentPath(document.name);
    const documentId = sourceDocumentPath.split("/").pop();
    const targetDocumentPath = `${targetCollectionPath}/${documentId}`;
    await writeDocument(targetDocumentPath, document.fields || {});
    summary.documents += 1;

    const subcollectionIds = await listSubcollectionIds(sourceDocumentPath);
    for (const subcollectionId of subcollectionIds) {
      await copyCollection(
        `${sourceDocumentPath}/${subcollectionId}`,
        `${targetDocumentPath}/${subcollectionId}`,
        summary
      );
    }
  }
}

async function writeSummaryFile(summary) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const filename = `firestore-backup-${BACKUP_DATE}.json`;
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(summary, null, 2));
  return filepath;
}

async function main() {
  refreshFirebaseTokenCache();

  const summary = {
    projectId: PROJECT_ID,
    databaseId: DATABASE_ID,
    backupPrefix: BACKUP_PREFIX,
    collections: 0,
    documents: 0,
    startedAt: new Date().toISOString(),
    collectionMap: {}
  };

  for (const collectionName of COLLECTIONS) {
    const targetCollectionName = `${BACKUP_PREFIX}_${collectionName}`;
    console.log(`Backing up ${collectionName} -> ${targetCollectionName}`);
    await copyCollection(collectionName, targetCollectionName, summary);
  }

  summary.completedAt = new Date().toISOString();
  const summaryFile = await writeSummaryFile(summary);

  console.log("");
  console.log(`Backup completed. ${summary.documents} documents copied across ${summary.collections} collections/subcollections.`);
  console.log(`Summary written to ${summaryFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
