import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { getFirebaseRuntimeConfig } from "../../config/runtime.js";

const LOBBY_CHAT_COLLECTION = "lobbyChat";
const PLAYER_CHAT_MAX_LENGTH = 60;
const ADMIN_NOTICE_MAX_LENGTH = 220;
const ADMIN_NOTICE_TITLE_MAX_LENGTH = 48;

function hasFirebaseConfig(config) {
  return Boolean(config?.apiKey && config?.projectId && config?.appId);
}

function getDb() {
  const config = getFirebaseRuntimeConfig();
  if (!hasFirebaseConfig(config)) {
    throw new Error("Firebase chat is not configured.");
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  return getFirestore(app);
}

function normalizeNickname(nickname) {
  return Array.from(String(nickname || "").trim().replace(/\s+/g, " ")).slice(0, 12).join("");
}

function normalizeChatLine(text, maxLength = PLAYER_CHAT_MAX_LENGTH) {
  return String(text || "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeChatText(text, { messageType = "user" } = {}) {
  return normalizeChatLine(
    text,
    messageType === "admin_notice" ? ADMIN_NOTICE_MAX_LENGTH : PLAYER_CHAT_MAX_LENGTH
  );
}

function normalizeChatTitle(title) {
  return normalizeChatLine(title, ADMIN_NOTICE_TITLE_MAX_LENGTH);
}

function normalizeLobbyChatMessage(snapshot) {
  const data = snapshot.data() || {};
  const messageType = String(data.messageType || "").trim() === "admin_notice" ? "admin_notice" : "user";

  return {
    messageId: String(snapshot.id || ""),
    uid: String(data.uid || "").trim(),
    nicknameSnapshot: normalizeNickname(data.nicknameSnapshot),
    title: normalizeChatTitle(data.title),
    text: normalizeChatText(data.text, { messageType }),
    messageType,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : ""
  };
}

export function subscribeLobbyChat({ onMessages = () => {}, onError = () => {} } = {}) {
  const chatQuery = query(
    collection(getDb(), LOBBY_CHAT_COLLECTION),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    chatQuery,
    (snapshot) => {
      const messages = snapshot.docs
        .map((entry) => normalizeLobbyChatMessage(entry))
        .filter((message) => message.text && (message.nicknameSnapshot || message.messageType === "admin_notice"))
        .reverse();

      onMessages(messages);
    },
    (error) => {
      onError(error);
    }
  );
}

export async function sendLobbyChatMessage({ uid, nickname, text }) {
  const safeUid = String(uid || "").trim();
  const safeNickname = normalizeNickname(nickname);
  const safeText = normalizeChatText(text, { messageType: "user" });

  if (!safeUid) {
    throw new Error("Signed-in user is required.");
  }

  if (!safeNickname) {
    throw new Error("Nickname is required.");
  }

  if (!safeText) {
    throw new Error("Message text is required.");
  }

  await addDoc(collection(getDb(), LOBBY_CHAT_COLLECTION), {
    uid: safeUid,
    nicknameSnapshot: safeNickname,
    text: safeText,
    createdAt: new Date().toISOString()
  });
}
