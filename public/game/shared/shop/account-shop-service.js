import { doc, getDb, normalizeUid, runTransaction, serverTimestamp, setDoc } from "../api/account-firestore-core.js";

export const ACCOUNT_SHOP_ENABLED = false;

export function isAccountShopEnabled() {
  return ACCOUNT_SHOP_ENABLED;
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
