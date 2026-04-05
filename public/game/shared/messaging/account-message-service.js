import { collection, doc, getDb, getDoc, getDocs, normalizeMessage, normalizeMessageId, normalizeNonNegativeInt, normalizeUid, runTransaction, serverTimestamp } from "../api/account-firestore-core.js";

export const ACCOUNT_MESSAGE_INBOX_ENABLED = true;
export const ACCOUNT_MESSAGE_CLAIM_ENABLED = false;

export function isAccountMessageInboxEnabled() {
  return ACCOUNT_MESSAGE_INBOX_ENABLED;
}

export function isAccountMessageClaimEnabled() {
  return ACCOUNT_MESSAGE_CLAIM_ENABLED;
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
