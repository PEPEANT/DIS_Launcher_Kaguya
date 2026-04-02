import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { arrayUnion, collection, doc, getDoc, getDocs, getFirestore, runTransaction, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { getFirebaseRuntimeConfig } from "./config/runtime.js";
import { normalizeName } from "./state.js";

export const ACCOUNT_WALLET_ENABLED = true;
export const ACCOUNT_MESSAGE_INBOX_ENABLED = true;
export const ACCOUNT_MESSAGE_CLAIM_ENABLED = false;
export const ACCOUNT_REWARD_AUTOMATION_ENABLED = false;
export const ACCOUNT_SHOP_ENABLED = false;

export function isAccountEconomyEnabled() {
  return ACCOUNT_WALLET_ENABLED || ACCOUNT_MESSAGE_INBOX_ENABLED || ACCOUNT_SHOP_ENABLED;
}

export function isAccountWalletEnabled() {
  return ACCOUNT_WALLET_ENABLED;
}

export function isAccountMessageInboxEnabled() {
  return ACCOUNT_MESSAGE_INBOX_ENABLED;
}

export function isAccountMessageClaimEnabled() {
  return ACCOUNT_MESSAGE_CLAIM_ENABLED;
}

export function isAccountRewardAutomationEnabled() {
  return ACCOUNT_REWARD_AUTOMATION_ENABLED;
}

export function isAccountShopEnabled() {
  return ACCOUNT_SHOP_ENABLED;
}

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

function getDb() {
  return getFirestore(getFirebaseApp());
}

function normalizePlayerId(playerId) {
  const trimmed = String(playerId || "").trim();
  return /^[A-Za-z0-9_-]{16,64}$/u.test(trimmed) ? trimmed : "";
}

function normalizeUid(uid) {
  const trimmed = String(uid || "").trim();
  return trimmed ? trimmed : "";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeProviderIds(providerIds) {
  return Array.isArray(providerIds)
    ? providerIds
      .map((providerId) => String(providerId || "").trim())
      .filter(Boolean)
    : [];
}

function normalizeLinkedPlayerIds(playerIds) {
  return Array.isArray(playerIds)
    ? [...new Set(playerIds.map((playerId) => normalizePlayerId(playerId)).filter(Boolean))]
    : [];
}

function normalizeSeasonNumber(season) {
  const safeSeason = Math.floor(Number(season));
  return Number.isFinite(safeSeason) && safeSeason >= 1 ? safeSeason : 1;
}

function normalizeRank(rank) {
  const safeRank = Math.floor(Number(rank));
  return Number.isFinite(safeRank) && safeRank >= 1 ? safeRank : null;
}

function normalizeScore(score) {
  const safeScore = Math.floor(Number(score));
  return Number.isFinite(safeScore) ? safeScore : null;
}

function normalizeIsoDate(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : "";
}

function normalizeNonNegativeInt(value) {
  const safeValue = Math.floor(Number(value));
  return Number.isFinite(safeValue) && safeValue >= 0 ? safeValue : 0;
}

function normalizeRewardIds(ids) {
  return Array.isArray(ids)
    ? [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))]
    : [];
}

function normalizeBoolean(value) {
  return value === true;
}

function normalizeMessageId(value) {
  const trimmed = String(value || "").trim();
  return /^[A-Za-z0-9_-]{1,80}$/u.test(trimmed) ? trimmed : "";
}

function normalizeMessageType(value) {
  return String(value || "").trim();
}

function normalizeRewardCurrency(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeMessage(snapshotOrData, messageId = "") {
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

export const HUJUPAY_SCORE_MILESTONES = Object.freeze([
  Object.freeze({ id: "score_500", score: 500, reward: 100 }),
  Object.freeze({ id: "score_1000", score: 1000, reward: 150 }),
  Object.freeze({ id: "score_2000", score: 2000, reward: 250 }),
  Object.freeze({ id: "score_3500", score: 3500, reward: 400 }),
  Object.freeze({ id: "score_5000", score: 5000, reward: 600 }),
  Object.freeze({ id: "score_7000", score: 7000, reward: 900 }),
  Object.freeze({ id: "score_9000", score: 9000, reward: 1300 }),
  Object.freeze({ id: "score_12000", score: 12000, reward: 1800 }),
  Object.freeze({ id: "score_16000", score: 16000, reward: 2500 }),
  Object.freeze({ id: "score_20000", score: 20000, reward: 3200 })
]);

export const SEASON_RANKING_REWARD_TIERS = Object.freeze([
  Object.freeze({ minRank: 1, maxRank: 1, reward: 8000 }),
  Object.freeze({ minRank: 2, maxRank: 3, reward: 5000 }),
  Object.freeze({ minRank: 4, maxRank: 10, reward: 2500 }),
  Object.freeze({ minRank: 11, maxRank: 50, reward: 500 })
]);

function getNewHujupayMilestones(bestScore, claimedIds = []) {
  const safeBestScore = normalizeScore(bestScore);
  if (safeBestScore === null) {
    return [];
  }

  const claimed = new Set(normalizeRewardIds(claimedIds));
  return HUJUPAY_SCORE_MILESTONES.filter((milestone) => safeBestScore >= milestone.score && !claimed.has(milestone.id));
}

export function getSeasonRankingRewardAmount(rank) {
  const safeRank = normalizeRank(rank);
  if (safeRank === null) {
    return 0;
  }

  const tier = SEASON_RANKING_REWARD_TIERS.find((entry) => safeRank >= entry.minRank && safeRank <= entry.maxRank);
  return tier ? tier.reward : 0;
}

async function upsertUserDocument({ user, playerId, nickname }) {
  const userRef = doc(getDb(), "users", user.uid);
  const snapshot = await getDoc(userRef);

  const payload = {
    uid: normalizeUid(user.uid),
    email: normalizeEmail(user.email),
    displayName: String(user.displayName || "").trim(),
    currentNickname: normalizeName(user.displayName),
    providerIds: normalizeProviderIds(user.providerIds),
    lastSeenPlayerId: playerId || "",
    lastNickname: normalizeName(nickname),
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (!snapshot.exists()) {
    payload.createdAt = serverTimestamp();
    payload.hujupayBalance = 0;
    payload.hujupayEarnedTotal = 0;
  }

  if (playerId) {
    payload.linkedPlayerIds = arrayUnion(playerId);

    if (!snapshot.exists() || !normalizePlayerId(snapshot.data()?.firstLinkedPlayerId)) {
      payload.firstLinkedPlayerId = playerId;
    }
  }

  await setDoc(userRef, payload, { merge: true });
}

async function upsertIdentityLink({ user, playerId, nickname }) {
  if (!playerId) {
    return { status: "skipped" };
  }

  const linkRef = doc(getDb(), "identityLinks", playerId);
  const snapshot = await getDoc(linkRef);
  const existingUid = String(snapshot.data()?.uid || "").trim();
  const safeNickname = normalizeName(nickname);
  const safeEmail = normalizeEmail(user.email);

  if (!snapshot.exists()) {
    await setDoc(linkRef, {
      uid: user.uid,
      email: safeEmail,
      playerId,
      lastNickname: safeNickname,
      linkedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    }, { merge: true });
    return { status: "linked" };
  }

  if (!existingUid || existingUid === user.uid) {
    await setDoc(linkRef, {
      uid: user.uid,
      email: safeEmail,
      playerId,
      lastNickname: safeNickname,
      lastSeenAt: serverTimestamp()
    }, { merge: true });
    return { status: "linked" };
  }

  await setDoc(linkRef, {
    playerId,
    conflictUid: user.uid,
    conflictEmail: safeEmail,
    conflictNickname: safeNickname,
    conflictAt: serverTimestamp(),
    lastSeenAt: serverTimestamp()
  }, { merge: true });

  return {
    status: "conflict",
    ownerUid: existingUid
  };
}

export async function purchaseSkin({ uid, skinId, price }) {
  if (!ACCOUNT_SHOP_ENABLED) {
    throw new Error("Account economy is disabled.");
  }

  const safeUid = normalizeUid(uid);
  const safeSkinId = String(skinId || "").trim();
  const safePrice = Math.floor(Number(price));

  if (!safeUid || !safeSkinId || !Number.isFinite(safePrice) || safePrice < 0) {
    throw new Error("Invalid purchaseSkin args");
  }

  const userRef = doc(getDb(), "users", safeUid);

  return runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data() || {};
    const currentBalance = Number(data.hujupayBalance) || 0;
    const ownedSkins = Array.isArray(data.ownedSkins) ? data.ownedSkins : [];

    if (ownedSkins.includes(safeSkinId)) {
      return { newBalance: currentBalance, ownedSkins };
    }

    if (currentBalance < safePrice) {
      throw new Error("Insufficient balance");
    }

    const newBalance = currentBalance - safePrice;
    const newOwned = [...ownedSkins, safeSkinId];

    tx.update(userRef, {
      hujupayBalance: newBalance,
      ownedSkins: newOwned,
      updatedAt: serverTimestamp()
    });

    return { newBalance, ownedSkins: newOwned };
  });
}

export async function equipSkin({ uid, skinId }) {
  if (!ACCOUNT_SHOP_ENABLED) {
    throw new Error("Account economy is disabled.");
  }

  const safeUid = normalizeUid(uid);
  const safeSkinId = String(skinId || "").trim();

  if (!safeUid || !safeSkinId) {
    throw new Error("Invalid equipSkin args");
  }

  const userRef = doc(getDb(), "users", safeUid);
  await setDoc(userRef, { equippedSkin: safeSkinId, updatedAt: serverTimestamp() }, { merge: true });
}

export async function syncAccountIdentity({ user, playerId, nickname = "" }) {
  if (!user?.uid) {
    return { status: "skipped" };
  }

  const safePlayerId = normalizePlayerId(playerId);
  await upsertUserDocument({ user, playerId: safePlayerId, nickname });
  return upsertIdentityLink({ user, playerId: safePlayerId, nickname });
}

export async function fetchAccountIdentity({ uid }) {
  const safeUid = String(uid || "").trim();

  if (!safeUid) {
    return {
      uid: "",
      email: "",
      displayName: "",
      currentNickname: "",
      firstLinkedPlayerId: "",
      lastSeenPlayerId: "",
      linkedPlayerIds: [],
      hujupayBalance: 0,
      hujupayEarnedTotal: 0,
      equippedSkin: "skin_0",
      ownedSkins: []
    };
  }

  const snapshot = await getDoc(doc(getDb(), "users", safeUid));
  const data = snapshot.exists() ? snapshot.data() || {} : {};

  return {
    uid: safeUid,
    email: normalizeEmail(data.email),
    displayName: String(data.displayName || "").trim(),
    currentNickname: normalizeName(data.currentNickname || data.displayName),
    firstLinkedPlayerId: normalizePlayerId(data.firstLinkedPlayerId),
    lastSeenPlayerId: normalizePlayerId(data.lastSeenPlayerId),
    linkedPlayerIds: normalizeLinkedPlayerIds(data.linkedPlayerIds),
    hujupayBalance: ACCOUNT_WALLET_ENABLED ? normalizeNonNegativeInt(data.hujupayBalance) : 0,
    hujupayEarnedTotal: ACCOUNT_WALLET_ENABLED ? normalizeNonNegativeInt(data.hujupayEarnedTotal) : 0,
    equippedSkin: ACCOUNT_SHOP_ENABLED ? String(data.equippedSkin || "skin_0") : "skin_0",
    ownedSkins: ACCOUNT_SHOP_ENABLED && Array.isArray(data.ownedSkins) ? data.ownedSkins.map(String) : []
  };
}

export async function updateAccountNickname({ uid, nickname }) {
  const safeUid = normalizeUid(uid);
  const safeNickname = normalizeName(nickname);

  if (!safeUid) {
    throw new Error("Authenticated user is required.");
  }

  if (!safeNickname) {
    throw new Error("Nickname is required.");
  }

  await setDoc(doc(getDb(), "users", safeUid), {
    uid: safeUid,
    displayName: safeNickname,
    currentNickname: safeNickname,
    lastNickname: safeNickname,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return {
    uid: safeUid,
    currentNickname: safeNickname
  };
}

export async function syncSeasonHujupayRewards({ uid, season }) {
  if (!ACCOUNT_REWARD_AUTOMATION_ENABLED) {
    return {
      hujupayBalance: 0,
      hujupayEarnedTotal: 0,
      rewardedAmount: 0,
      rewardedMilestones: []
    };
  }

  const safeUid = normalizeUid(uid);
  const safeSeason = normalizeSeasonNumber(season);

  if (!safeUid) {
    return {
      hujupayBalance: 0,
      hujupayEarnedTotal: 0,
      rewardedAmount: 0,
      rewardedMilestones: []
    };
  }

  const userRef = doc(getDb(), "users", safeUid);
  const seasonRef = doc(getDb(), "users", safeUid, "seasons", String(safeSeason));

  return runTransaction(getDb(), async (transaction) => {
    const [userSnapshot, seasonSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(seasonRef)
    ]);

    const userData = userSnapshot.exists() ? userSnapshot.data() || {} : {};
    const seasonData = seasonSnapshot.exists() ? seasonSnapshot.data() || {} : {};
    const bestScore = normalizeScore(seasonData.bestScore);
    const claimedRewardIds = normalizeRewardIds(seasonData.scoreRewardIds);
    const newlyClaimedMilestones = getNewHujupayMilestones(bestScore, claimedRewardIds);
    const rewardedAmount = newlyClaimedMilestones.reduce((sum, milestone) => sum + milestone.reward, 0);
    const nextBalance = normalizeNonNegativeInt(userData.hujupayBalance) + rewardedAmount;
    const nextEarnedTotal = normalizeNonNegativeInt(userData.hujupayEarnedTotal) + rewardedAmount;

    if (rewardedAmount > 0) {
      transaction.set(seasonRef, {
        scoreRewardIds: [...claimedRewardIds, ...newlyClaimedMilestones.map((milestone) => milestone.id)],
        hujupayEarned: normalizeNonNegativeInt(seasonData.hujupayEarned) + rewardedAmount,
        lastRewardedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      transaction.set(userRef, {
        uid: safeUid,
        hujupayBalance: nextBalance,
        hujupayEarnedTotal: nextEarnedTotal,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return {
      hujupayBalance: nextBalance,
      hujupayEarnedTotal: nextEarnedTotal,
      rewardedAmount,
      rewardedMilestones: newlyClaimedMilestones
    };
  });
}

export async function saveSeasonSummary({
  uid,
  season,
  playerId,
  nickname = "",
  score,
  rank,
  submittedAt = ""
}) {
  if (!ACCOUNT_REWARD_AUTOMATION_ENABLED) {
    return null;
  }

  const safeUid = String(uid || "").trim();
  const safeSeason = normalizeSeasonNumber(season);
  const safePlayerId = normalizePlayerId(playerId);
  const safeNickname = normalizeName(nickname);
  const safeScore = normalizeScore(score);
  const safeRank = normalizeRank(rank);
  const safeSubmittedAt = normalizeIsoDate(submittedAt) || new Date().toISOString();

  if (!safeUid || safeScore === null) {
    return null;
  }

  const userRef = doc(getDb(), "users", safeUid);
  const seasonRef = doc(getDb(), "users", safeUid, "seasons", String(safeSeason));
  return runTransaction(getDb(), async (transaction) => {
    const [userSnapshot, seasonSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(seasonRef)
    ]);

    const userData = userSnapshot.exists() ? userSnapshot.data() || {} : {};
    const existing = seasonSnapshot.exists() ? seasonSnapshot.data() || {} : {};
    const existingBestScore = normalizeScore(existing.bestScore);
    const existingBestRank = normalizeRank(existing.bestRank);
    const shouldUpdateBest = existingBestScore === null
      || safeScore > existingBestScore
      || (
        safeScore === existingBestScore
        && safeRank !== null
        && (existingBestRank === null || safeRank < existingBestRank)
      );

    const effectiveBestScore = shouldUpdateBest ? safeScore : existingBestScore;
    const claimedRewardIds = normalizeRewardIds(existing.scoreRewardIds);
    const newlyClaimedMilestones = getNewHujupayMilestones(effectiveBestScore, claimedRewardIds);
    const rewardedAmount = newlyClaimedMilestones.reduce((sum, milestone) => sum + milestone.reward, 0);

    const payload = {
      season: safeSeason,
      playerId: safePlayerId,
      lastNickname: safeNickname,
      lastScore: safeScore,
      lastRank: safeRank,
      lastSubmittedAt: safeSubmittedAt,
      updatedAt: serverTimestamp()
    };

    if (!seasonSnapshot.exists()) {
      payload.createdAt = serverTimestamp();
    }

    if (shouldUpdateBest) {
      payload.bestNickname = safeNickname;
      payload.bestScore = safeScore;
      payload.bestRank = safeRank;
      payload.bestSubmittedAt = safeSubmittedAt;
    }

    if (newlyClaimedMilestones.length) {
      payload.scoreRewardIds = [...claimedRewardIds, ...newlyClaimedMilestones.map((milestone) => milestone.id)];
      payload.hujupayEarned = normalizeNonNegativeInt(existing.hujupayEarned) + rewardedAmount;
      payload.lastRewardedAt = serverTimestamp();

      transaction.set(userRef, {
        uid: safeUid,
        hujupayBalance: normalizeNonNegativeInt(userData.hujupayBalance) + rewardedAmount,
        hujupayEarnedTotal: normalizeNonNegativeInt(userData.hujupayEarnedTotal) + rewardedAmount,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    transaction.set(seasonRef, payload, { merge: true });

    return {
      season: safeSeason,
      playerId: safePlayerId,
      lastNickname: safeNickname,
      lastScore: safeScore,
      lastRank: safeRank,
      lastSubmittedAt: safeSubmittedAt,
      bestNickname: shouldUpdateBest ? safeNickname : normalizeName(existing.bestNickname),
      bestScore: effectiveBestScore,
      bestRank: shouldUpdateBest ? safeRank : existingBestRank,
      bestSubmittedAt: shouldUpdateBest ? safeSubmittedAt : normalizeIsoDate(existing.bestSubmittedAt),
      hujupayBalance: normalizeNonNegativeInt(userData.hujupayBalance) + rewardedAmount,
      hujupayEarnedTotal: normalizeNonNegativeInt(userData.hujupayEarnedTotal) + rewardedAmount,
      rewardedAmount,
      rewardedMilestones: newlyClaimedMilestones
    };
  });
}

export async function fetchSeasonSummary({ uid, season }) {
  const safeUid = String(uid || "").trim();
  const safeSeason = normalizeSeasonNumber(season);

  if (!safeUid) {
    return {
      season: safeSeason,
      playerId: "",
      lastNickname: "",
      lastScore: null,
      lastRank: null,
      lastSubmittedAt: "",
      bestNickname: "",
      bestScore: null,
      bestRank: null,
      bestSubmittedAt: "",
      hujupayEarned: 0,
      scoreRewardIds: []
    };
  }

  const snapshot = await getDoc(doc(getDb(), "users", safeUid, "seasons", String(safeSeason)));
  const data = snapshot.exists() ? snapshot.data() || {} : {};

  return {
    season: safeSeason,
    playerId: normalizePlayerId(data.playerId),
    lastNickname: normalizeName(data.lastNickname),
    lastScore: normalizeScore(data.lastScore),
    lastRank: normalizeRank(data.lastRank),
    lastSubmittedAt: normalizeIsoDate(data.lastSubmittedAt),
    bestNickname: normalizeName(data.bestNickname),
    bestScore: normalizeScore(data.bestScore),
    bestRank: normalizeRank(data.bestRank),
    bestSubmittedAt: normalizeIsoDate(data.bestSubmittedAt),
    hujupayEarned: normalizeNonNegativeInt(data.hujupayEarned),
    scoreRewardIds: normalizeRewardIds(data.scoreRewardIds)
  };
}

export async function ensureSeasonRewardMessage({
  uid,
  season,
  seasonLabel = "",
  title = "",
  body = "",
  rank,
  rewardAmount
}) {
  if (!ACCOUNT_REWARD_AUTOMATION_ENABLED) {
    return null;
  }

  const safeUid = normalizeUid(uid);
  const safeSeason = normalizeSeasonNumber(season);
  const safeRank = normalizeRank(rank);
  const safeRewardAmount = normalizeNonNegativeInt(
    rewardAmount || getSeasonRankingRewardAmount(safeRank)
  );

  if (!safeUid || safeRank === null || safeRewardAmount <= 0) {
    return null;
  }

  const messageId = `season_reward_s${safeSeason}`;
  const messageRef = doc(getDb(), "users", safeUid, "messages", messageId);
  const existingSnapshot = await getDoc(messageRef);

  if (existingSnapshot.exists()) {
    return normalizeMessage(existingSnapshot);
  }

  const now = new Date().toISOString();
  const payload = {
    messageId,
    type: "season_reward",
    title: String(title || "").trim(),
    body: String(body || "").trim(),
    season: safeSeason,
    seasonLabel: String(seasonLabel || "").trim(),
    rank: safeRank,
    rewardCurrency: "hujupay",
    rewardAmount: safeRewardAmount,
    claimable: true,
    claimed: false,
    sentAt: now,
    claimedAt: ""
  };

  await setDoc(messageRef, payload, { merge: true });
  return normalizeMessage(payload, messageId);
}

export async function fetchAccountMessages({ uid }) {
  if (!ACCOUNT_MESSAGE_INBOX_ENABLED) {
    return [];
  }

  const safeUid = normalizeUid(uid);
  if (!safeUid) {
    return [];
  }

  const snapshot = await getDocs(collection(getDb(), "users", safeUid, "messages"));
  return snapshot.docs
    .map((messageSnapshot) => normalizeMessage(messageSnapshot))
    .filter((message) => message.messageId)
    .sort((left, right) => {
      const leftTime = left.sentAt || "";
      const rightTime = right.sentAt || "";
      return rightTime.localeCompare(leftTime);
    });
}

export async function claimAccountMessageReward({ uid, messageId }) {
  if (!ACCOUNT_MESSAGE_CLAIM_ENABLED) {
    throw new Error("Account messages are disabled.");
  }

  const safeUid = normalizeUid(uid);
  const safeMessageId = normalizeMessageId(messageId);

  if (!safeUid || !safeMessageId) {
    throw new Error("A valid message is required.");
  }

  const userRef = doc(getDb(), "users", safeUid);
  const messageRef = doc(getDb(), "users", safeUid, "messages", safeMessageId);

  return runTransaction(getDb(), async (transaction) => {
    const [userSnapshot, messageSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(messageRef)
    ]);

    if (!messageSnapshot.exists()) {
      throw new Error("Message does not exist.");
    }

    const message = normalizeMessage(messageSnapshot);
    const userData = userSnapshot.exists() ? userSnapshot.data() || {} : {};

    if (message.claimed || !message.claimable || message.rewardCurrency !== "hujupay") {
      return {
        ...message,
        awardedAmount: 0,
        hujupayBalance: normalizeNonNegativeInt(userData.hujupayBalance),
        hujupayEarnedTotal: normalizeNonNegativeInt(userData.hujupayEarnedTotal)
      };
    }

    const claimedAt = new Date().toISOString();
    const rewardAmount = normalizeNonNegativeInt(message.rewardAmount);
    const nextBalance = normalizeNonNegativeInt(userData.hujupayBalance) + rewardAmount;
    const nextEarnedTotal = normalizeNonNegativeInt(userData.hujupayEarnedTotal) + rewardAmount;

    transaction.set(messageRef, {
      claimable: false,
      claimed: true,
      claimedAt
    }, { merge: true });

    transaction.set(userRef, {
      uid: safeUid,
      hujupayBalance: nextBalance,
      hujupayEarnedTotal: nextEarnedTotal,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return {
      ...message,
      claimable: false,
      claimed: true,
      claimedAt,
      awardedAmount: rewardAmount,
      hujupayBalance: nextBalance,
      hujupayEarnedTotal: nextEarnedTotal
    };
  });
}
