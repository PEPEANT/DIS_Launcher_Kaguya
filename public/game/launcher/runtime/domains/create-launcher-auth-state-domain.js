import { createLauncherMessageOrchestrator } from "../../notices/launcher-message-orchestrator.js";
import { createLauncherAuthStateController } from "../controllers/launcher-auth-state-controller.js";
import { createLauncherRankingSync } from "../controllers/launcher-ranking-sync.js";

export function createLauncherAuthStateDomain({
  accountDataService,
  accountSyncService,
  accountUi,
  authOverlay,
  identity,
  messageOverlay,
  messageState,
  messages,
  profileModalState,
  ranking,
  routing,
  sharedState,
  t,
  getChatController,
  getProfileController,
  getShopController
}) {
  const launcherRankingSync = createLauncherRankingSync({
    accountSyncService,
    renderRankingList: ranking.renderRankingList,
    setRankingStatus: ranking.setRankingStatus,
    state: sharedState,
    t
  });

  const launcherMessageOrchestrator = createLauncherMessageOrchestrator({
    closeMessageArrivalModal: messageOverlay.closeMessageArrivalModal,
    getLang: messages.getLang,
    isAccountMessageInboxEnabled: messages.isAccountMessageInboxEnabled,
    maxStoredMessageIds: messageState.maxStoredMessageIds,
    messageAlertedStoragePrefix: messageState.messageAlertedStoragePrefix,
    messageNotificationState: messageState.messageNotificationState,
    messageSeenStoragePrefix: messageState.messageSeenStoragePrefix,
    openMessageArrivalModal: messageOverlay.openMessageArrivalModal,
    profileModalState,
    setMessageAlertState: messages.setMessageAlertState,
    setMessageArrivalCopy: messages.setMessageArrivalCopy,
    state: sharedState,
    t
  });

  const launcherAuthStateController = createLauncherAuthStateController({
    accountDataService,
    applyNickname: identity.applyNickname,
    clearSavedNickname: identity.clearSavedNickname,
    closeAuthDialog: authOverlay.closeAuthDialog,
    closeLobbyRewardMessagePrompt: (...args) => launcherMessageOrchestrator.closeLobbyRewardMessagePrompt(...args),
    closeMessagesModal: messageOverlay.closeMessagesModal,
    closeProfileModal: messageOverlay.closeProfileModal,
    closeSettingsDialog: authOverlay.closeSettingsDialog,
    ensureMusicEnabled: accountUi.ensureMusicEnabled,
    formatNumber: accountUi.formatNumber,
    getActiveNickname: identity.getActiveNickname,
    getGuestNickname: identity.getGuestNickname,
    getMemberDisplayName: identity.getMemberDisplayName,
    getProfileDisplayName: identity.getProfileDisplayName,
    getSignedInIntroMessage: accountUi.getSignedInIntroMessage,
    getSignedInSummary: accountUi.getSignedInSummary,
    isAccountWalletEnabled: accountUi.isAccountWalletEnabled,
    playLobbyMusic: accountUi.playLobbyMusic,
    postPlaytestStatus: accountUi.postPlaytestStatus,
    profileModalState,
    refreshMessagesInbox: (...args) => getProfileController()?.refreshMessagesInbox?.(...args),
    refreshShopState: () => getShopController()?.refreshShopState?.(),
    resetMessageNotifications: () => launcherMessageOrchestrator.resetMessageNotifications(),
    state: sharedState,
    syncAuthenticatedAccount: (...args) => launcherRankingSync.syncAuthenticatedAccount(...args),
    syncAuthenticatedRankingNicknames: (...args) => launcherRankingSync.syncAuthenticatedRankingNicknames(...args),
    syncLobbyChatUi: (...args) => getChatController()?.syncLobbyChatUi?.(...args),
    syncMobileNavigationState: routing.syncMobileNavigationState,
    t,
    updateMessagesButtonLabel: () => launcherMessageOrchestrator.updateMessagesButtonLabel()
  });

  return {
    launcherAuthStateController,
    launcherMessageOrchestrator,
    launcherRankingSync
  };
}
