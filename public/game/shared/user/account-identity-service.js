import { arrayUnion, doc, getDb, getDoc, normalizeEmail, normalizeLinkedPlayerIds, normalizePlayerId, normalizeProviderIds, normalizeUid, serverTimestamp, setDoc } from "../api/account-firestore-core.js";
import { normalizeName } from "../../core/state.js";
import { isAccountShopEnabled } from "../shop/account-shop-service.js";
import { isAccountWalletEnabled } from "../wallet/account-wallet-service.js";

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

export async function syncAccountIdentity({ user, playerId, nickname = "" }) {
  if (!user?.uid) {
    return { status: "skipped" };
  }

  const safePlayerId = normalizePlayerId(playerId);
  await upsertUserDocument({ user, playerId: safePlayerId, nickname });
  return upsertIdentityLink({ user, playerId: safePlayerId, nickname });
}

export async function fetchAccountIdentity({ uid }) {
  const safeUid = normalizeUid(uid);

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
    hujupayBalance: isAccountWalletEnabled() ? Math.max(0, Math.floor(Number(data.hujupayBalance) || 0)) : 0,
    hujupayEarnedTotal: isAccountWalletEnabled() ? Math.max(0, Math.floor(Number(data.hujupayEarnedTotal) || 0)) : 0,
    equippedSkin: isAccountShopEnabled() ? String(data.equippedSkin || "skin_0") : "skin_0",
    ownedSkins: isAccountShopEnabled() && Array.isArray(data.ownedSkins) ? data.ownedSkins.map(String) : []
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
