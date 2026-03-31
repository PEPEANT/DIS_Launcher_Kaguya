import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { getFirebaseRuntimeConfig } from "../config/runtime.js";

const COLLECTION_NAME = "rankings";
const MAX_RANKINGS = 10;

function hasFirebaseConfig(config) {
  return Boolean(config?.apiKey && config?.projectId && config?.appId);
}

function ensureFirebaseReady() {
  const config = getFirebaseRuntimeConfig();

  if (!hasFirebaseConfig(config)) {
    throw new Error("Firebase ranking is not configured.");
  }

  return config;
}

function normalizeName(name) {
  return Array.from(String(name || "").trim().replace(/\s+/g, " ")).slice(0, 12).join("");
}

function normalizePlayerId(playerId) {
  const trimmed = String(playerId || "").trim();
  return /^[A-Za-z0-9_-]{16,64}$/u.test(trimmed) ? trimmed : "";
}

function compareRankings(left, right) {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  return String(left.submittedAt).localeCompare(String(right.submittedAt));
}

function sanitizeEntry(entry) {
  const name = normalizeName(entry?.name);
  const playerId = normalizePlayerId(entry?.playerId);
  const score = Math.floor(Number(entry?.score));
  const submittedAt = typeof entry?.submittedAt === "string" ? entry.submittedAt : new Date(0).toISOString();

  if (!name || !playerId || !Number.isFinite(score)) {
    return null;
  }

  return {
    playerId,
    name,
    score,
    submittedAt
  };
}

function getFirebaseApp() {
  const config = ensureFirebaseReady();
  return getApps().length ? getApp() : initializeApp(config);
}

function getDb() {
  return getFirestore(getFirebaseApp());
}

async function readRankingEntry(playerId) {
  const snapshot = await getDoc(doc(getDb(), COLLECTION_NAME, playerId));
  return snapshot.exists() ? sanitizeEntry(snapshot.data()) : null;
}

async function readTopRankings() {
  const rankingQuery = query(
    collection(getDb(), COLLECTION_NAME),
    orderBy("score", "desc"),
    limit(MAX_RANKINGS)
  );
  const snapshot = await getDocs(rankingQuery);

  return snapshot.docs
    .map((entryDoc) => sanitizeEntry(entryDoc.data()))
    .filter(Boolean)
    .sort(compareRankings)
    .slice(0, MAX_RANKINGS);
}

export async function fetchRankings() {
  ensureFirebaseReady();
  return { rankings: await readTopRankings() };
}

export async function submitScore({ playerId, name, score }) {
  ensureFirebaseReady();

  const safePlayerId = normalizePlayerId(playerId);
  const safeName = normalizeName(name);
  const safeScore = Math.floor(Number(score));

  if (!safePlayerId) {
    throw new Error("Player identity is missing.");
  }

  if (!safeName) {
    throw new Error("Nickname is required.");
  }

  if (!Number.isFinite(safeScore)) {
    throw new Error("Score is invalid.");
  }

  const submittedAt = new Date().toISOString();
  const rankingRef = doc(getDb(), COLLECTION_NAME, safePlayerId);

  let accepted = false;

  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(rankingRef);
    const existing = snapshot.exists() ? sanitizeEntry(snapshot.data()) : null;

    if (!existing || safeScore > existing.score) {
      transaction.set(rankingRef, {
        playerId: safePlayerId,
        name: safeName,
        score: safeScore,
        submittedAt
      });
      accepted = true;
      return;
    }

    if (existing.name !== safeName) {
      transaction.set(rankingRef, {
        playerId: safePlayerId,
        name: safeName,
        score: existing.score,
        submittedAt: existing.submittedAt
      });
    }
  });

  const currentEntry = await readRankingEntry(safePlayerId);
  const rankings = await readTopRankings();

  return {
    accepted,
    rank: currentEntry ? rankings.findIndex((entry) => entry.playerId === currentEntry.playerId) + 1 || null : null,
    rankings
  };
}
