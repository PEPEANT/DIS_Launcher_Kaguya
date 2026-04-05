import { createAccountDataService } from "./account-data-service.js";
import { createAccountSyncService } from "./account-sync-service.js";
import { createProfileLoaderService } from "./profile-loader-service.js";

export function createSharedServices({
  currentSeason,
  fetchAccountIdentity,
  fetchAccountMessages,
  fetchAllRankingsFromProvider,
  fetchSeasonProfile,
  getMemberDisplayName,
  isAccountMessageInboxEnabled,
  isAccountWalletEnabled,
  isPlaytestActive,
  normalizeName,
  profileSeason,
  state,
  submitScoreToProvider,
  syncAccountIdentity
}) {
  const accountSyncService = createAccountSyncService({
    currentSeason,
    fetchAccountIdentity,
    fetchAllRankingsFromProvider,
    getMemberDisplayName,
    isPlaytestActive,
    normalizeName,
    profileSeason,
    state,
    submitScoreToProvider,
    syncAccountIdentity
  });

  const accountDataService = createAccountDataService({
    currentSeason,
    fetchAccountIdentity,
    fetchSeasonProfile,
    isAccountWalletEnabled
  });

  const profileLoaderService = createProfileLoaderService({
    currentSeason,
    fetchAccountMessages,
    fetchSeasonProfile,
    isAccountMessageInboxEnabled,
    profileSeason
  });

  return {
    accountDataService,
    accountSyncService,
    profileLoaderService
  };
}
