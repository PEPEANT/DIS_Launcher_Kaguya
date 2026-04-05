export function createAccountDataService({
  currentSeason,
  fetchAccountIdentity,
  fetchSeasonProfile,
  isAccountWalletEnabled
}) {
  async function loadCurrentSeasonRank({ user, currentPlayerId }) {
    if (!user?.uid) {
      return { rank: null, stale: false };
    }

    const activeUid = user.uid;

    try {
      const profile = await fetchSeasonProfile({
        user,
        currentPlayerId,
        season: currentSeason
      });

      if (user?.uid !== activeUid) {
        return { rank: null, stale: true };
      }

      return {
        rank: profile?.record?.rank || null,
        stale: false
      };
    } catch (error) {
      console.warn("Failed to refresh current season rank.", error);
      return {
        rank: null,
        stale: false
      };
    }
  }

  async function loadAccountWallet({ user }) {
    if (!user?.uid || !isAccountWalletEnabled()) {
      return {
        hujupayBalance: 0,
        hujupayEarnedTotal: 0,
        equippedSkin: "skin_0",
        ownedSkins: [],
        stale: false
      };
    }

    const activeUid = user.uid;

    try {
      const identity = await fetchAccountIdentity({ uid: activeUid });

      if (user?.uid !== activeUid) {
        return { stale: true };
      }

      return {
        hujupayBalance: identity.hujupayBalance || 0,
        hujupayEarnedTotal: identity.hujupayEarnedTotal || 0,
        equippedSkin: identity.equippedSkin || "skin_0",
        ownedSkins: Array.isArray(identity.ownedSkins) ? identity.ownedSkins : [],
        stale: false
      };
    } catch (error) {
      console.warn("Failed to refresh HujuPay wallet.", error);
      return { stale: false };
    }
  }

  return {
    loadAccountWallet,
    loadCurrentSeasonRank
  };
}
