import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { arrayUnion, collection, doc, getDoc, getDocs, getFirestore, runTransaction, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { getFirebaseRuntimeConfig } from "../../config/runtime.js";

function hasFirebaseConfig(config) {
  return Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
}

function ensureFirebaseReady() {
  const config = getFirebaseRuntimeConfig();

  if (!hasFirebaseConfig(config)) {
    throw new Error("Firebase account sync is not configured.");
  }

  return config;
}

function getFirebaseApp() {
  const config = ensureFirebaseReady();
  return getApps()[0] || initializeApp(config);
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}

export {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc
};

export function normalizePlayerId(playerId) {
  const trimmed = String(playerId || "").trim();
  return /^[A-Za-z0-9_-]{16,64}$/u.test(trimmed) ? trimmed : "";
}

export function normalizeUid(uid) {
  const trimmed = String(uid || "").trim();
  return trimmed ? trimmed : "";
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeProviderIds(providerIds) {
  return Array.isArray(providerIds)
    ? providerIds
      .map((providerId) => String(providerId || "").trim())
      .filter(Boolean)
    : [];
}

export function normalizeLinkedPlayerIds(playerIds) {
  return Array.isArray(playerIds)
    ? [...new Set(playerIds.map((playerId) => normalizePlayerId(playerId)).filter(Boolean))]
    : [];
}

export function normalizeSeasonNumber(season) {
  const safeSeason = Math.floor(Number(season));
  return Number.isFinite(safeSeason) && safeSeason >= 1 ? safeSeason : 1;
}

export function normalizeRank(rank) {
  const safeRank = Math.floor(Number(rank));
  return Number.isFinite(safeRank) && safeRank >= 1 ? safeRank : null;
}

export function normalizeScore(score) {
  const safeScore = Math.floor(Number(score));
  return Number.isFinite(safeScore) ? safeScore : null;
}

export function normalizeIsoDate(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : "";
}

export function normalizeNonNegativeInt(value) {
  const safeValue = Math.floor(Number(value));
  return Number.isFinite(safeValue) && safeValue >= 0 ? safeValue : 0;
}

export function normalizeRewardIds(ids) {
  return Array.isArray(ids)
    ? [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))]
    : [];
}

export function normalizeBoolean(value) {
  return value === true;
}

export function normalizeMessageId(value) {
  const trimmed = String(value || "").trim();
  return /^[A-Za-z0-9_-]{1,80}$/u.test(trimmed) ? trimmed : "";
}

export function normalizeMessageType(value) {
  return String(value || "").trim();
}

export function normalizeRewardCurrency(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeMessage(snapshotOrData, messageId = "") {
  const snapshot = snapshotOrData && typeof snapshotOrData.id === "string" ? snapshotOrData : null;
  const data = snapshot ? (snapshot.data() || {}) : (snapshotOrData || {});
  const safeMessageId = normalizeMessageId(snapshot ? snapshot.id : messageId);

  return {
    messageId: safeMessageId,
    type: normalizeMessageType(data.type),
    title: String(data.title || "").trim(),
    body: String(data.body || "").trim(),
    season: normalizeSeasonNumber(data.season),
    seasonLabel: String(data.seasonLabel || "").trim(),
    rank: normalizeRank(data.rank),
    rewardCurrency: normalizeRewardCurrency(data.rewardCurrency),
    rewardAmount: normalizeNonNegativeInt(data.rewardAmount),
    claimable: normalizeBoolean(data.claimable),
    claimed: normalizeBoolean(data.claimed),
    sentAt: normalizeIsoDate(data.sentAt),
    claimedAt: normalizeIsoDate(data.claimedAt)
  };
}
