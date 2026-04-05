import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { deleteDoc, doc, getFirestore, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { getFirebaseRuntimeConfig } from "../../config/runtime.js";

const PRESENCE_COLLECTION = "presence";
const SESSION_COLLECTION = "presenceSessions";
const HEARTBEAT_INTERVAL_MS = 15000;
const SESSION_SYNC_INTERVAL_MS = 60000;
const SESSION_ID_STORAGE_KEY = "kaguya-session-id";
const SESSION_STARTED_AT_STORAGE_KEY = "kaguya-session-started-at";

let presenceDocRef = null;
let sessionDocRef = null;
let heartbeatTimer = 0;
let started = false;
let presenceSource = null;
let lastSessionSyncAt = 0;
let lastSessionNickname = "";
let lastSessionPhase = "";
let sessionStartedAt = "";

function hasFirebaseConfig(config) {
  return Boolean(config?.apiKey && config?.projectId && config?.appId);
}

function getFirebaseApp() {
  const config = getFirebaseRuntimeConfig();

  if (!hasFirebaseConfig(config)) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(config);
}

function getDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

function normalizeName(name) {
  return Array.from(String(name || "").trim().replace(/\s+/g, " ")).slice(0, 12).join("");
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Math.random().toString(36).slice(2, 14)}-${Date.now().toString(36)}`;
}

function isValidIsoTimestamp(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function getOrCreateSessionState() {
  const fallbackStartedAt = new Date().toISOString();

  try {
    const storedId = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    const storedStartedAt = sessionStorage.getItem(SESSION_STARTED_AT_STORAGE_KEY);

    if (storedId && isValidIsoTimestamp(storedStartedAt)) {
      return {
        sessionId: storedId,
        startedAt: storedStartedAt
      };
    }

    const nextState = {
      sessionId: createSessionId(),
      startedAt: fallbackStartedAt
    };
    sessionStorage.setItem(SESSION_ID_STORAGE_KEY, nextState.sessionId);
    sessionStorage.setItem(SESSION_STARTED_AT_STORAGE_KEY, nextState.startedAt);
    return nextState;
  } catch {
    return {
      sessionId: createSessionId(),
      startedAt: fallbackStartedAt
    };
  }
}

async function syncSessionLog({ force = false, endedAt = "" } = {}) {
  if (!sessionDocRef || !presenceSource) {
    return;
  }

  const nickname = normalizeName(presenceSource.getNickname());
  const phase = String(presenceSource.getPhase() || "ready");
  const now = Date.now();

  const shouldSync = force
    || !lastSessionSyncAt
    || nickname !== lastSessionNickname
    || phase !== lastSessionPhase
    || now - lastSessionSyncAt >= SESSION_SYNC_INTERVAL_MS
    || Boolean(endedAt);

  if (!shouldSync) {
    return;
  }

  const nowIso = new Date(now).toISOString();
  const payload = {
    sessionId: sessionDocRef.id,
    playerId: presenceSource.playerId,
    nickname,
    phase,
    page: "game",
    startedAt: sessionStartedAt || nowIso,
    lastSeen: nowIso
  };

  if (endedAt) {
    payload.endedAt = endedAt;
  }

  await setDoc(sessionDocRef, payload, { merge: true });
  lastSessionSyncAt = now;
  lastSessionNickname = nickname;
  lastSessionPhase = phase;
}

async function sendHeartbeat() {
  if (!presenceDocRef || !presenceSource || document.hidden) {
    return;
  }

  const nowIso = new Date().toISOString();

  await setDoc(presenceDocRef, {
    playerId: presenceSource.playerId,
    nickname: normalizeName(presenceSource.getNickname()),
    phase: String(presenceSource.getPhase() || "ready"),
    page: "game",
    lastSeen: nowIso
  }, { merge: true });

  await syncSessionLog();
}

function stopHeartbeat() {
  if (!heartbeatTimer) {
    return;
  }

  window.clearInterval(heartbeatTimer);
  heartbeatTimer = 0;
}

async function clearPresence() {
  stopHeartbeat();

  try {
    await syncSessionLog({
      force: true,
      endedAt: new Date().toISOString()
    });
  } catch {
    // Session analytics is best-effort only.
  }

  if (presenceDocRef) {
    try {
      await deleteDoc(presenceDocRef);
    } catch {
      // Presence is best-effort only.
    }
  }
}

export function startPresenceTracking({ playerId, getNickname, getPhase }) {
  if (started) {
    return;
  }

  const db = getDb();
  if (!db || !playerId) {
    return;
  }

  started = true;
  presenceSource = { playerId, getNickname, getPhase };
  presenceDocRef = doc(db, PRESENCE_COLLECTION, playerId);
  const sessionState = getOrCreateSessionState();
  sessionStartedAt = sessionState.startedAt;
  sessionDocRef = doc(db, SESSION_COLLECTION, sessionState.sessionId);
  void syncSessionLog({ force: true });

  const refresh = () => {
    void sendHeartbeat();
  };

  refresh();
  heartbeatTimer = window.setInterval(refresh, HEARTBEAT_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopHeartbeat();
      return;
    }

    if (!heartbeatTimer) {
      heartbeatTimer = window.setInterval(refresh, HEARTBEAT_INTERVAL_MS);
    }

    refresh();
  });

  window.addEventListener("pagehide", () => {
    void clearPresence();
  });

  window.addEventListener("beforeunload", () => {
    void clearPresence();
  });
}
