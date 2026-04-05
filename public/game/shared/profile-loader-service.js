function buildUnavailableProfile() {
  return {
    unavailable: true,
    linkedPlayerIds: [],
    record: null,
    topRankings: []
  };
}

export function createProfileLoaderService({
  currentSeason,
  fetchAccountMessages,
  fetchSeasonProfile,
  isAccountMessageInboxEnabled,
  profileSeason
}) {
  async function loadMessagesInboxData({ user, currentPlayerId, seasonProfile = null }) {
    void currentPlayerId;
    if (!user?.uid || !isAccountMessageInboxEnabled()) {
      return {
        messages: [],
        seasonProfile,
        failed: false
      };
    }

    try {
      const messages = await fetchAccountMessages({ uid: user.uid });

      return {
        messages,
        seasonProfile,
        failed: false
      };
    } catch (error) {
      console.warn("Failed to refresh messages inbox.", error);
      return {
        messages: [],
        seasonProfile,
        failed: true
      };
    }
  }

  async function loadProfileModalData({ user, currentPlayerId }) {
    const [currentSeasonResult, profileSeasonResult] = await Promise.allSettled([
      fetchSeasonProfile({
        user,
        currentPlayerId,
        season: currentSeason
      }),
      fetchSeasonProfile({
        user,
        currentPlayerId,
        season: profileSeason
      })
    ]);

    const currentSeasonProfile = currentSeasonResult.status === "fulfilled"
      ? currentSeasonResult.value
      : buildUnavailableProfile();
    const archivedSeasonProfile = profileSeasonResult.status === "fulfilled"
      ? profileSeasonResult.value
      : buildUnavailableProfile();

    if (currentSeasonResult.status === "rejected") {
      console.warn("Failed to load current season profile.", currentSeasonResult.reason);
    }

    if (profileSeasonResult.status === "rejected") {
      console.warn("Failed to load season 1 profile.", profileSeasonResult.reason);
    }

    const status = currentSeasonResult.status === "rejected" && profileSeasonResult.status === "rejected"
      ? "failed"
      : currentSeasonResult.status === "rejected" || profileSeasonResult.status === "rejected"
        ? "partial"
        : "ready";

    return {
      currentSeasonProfile,
      profileSeasonProfile: archivedSeasonProfile,
      status
    };
  }

  return {
    loadMessagesInboxData,
    loadProfileModalData
  };
}
