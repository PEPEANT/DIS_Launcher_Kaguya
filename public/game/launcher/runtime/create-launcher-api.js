export function createLauncherApi({
  launcherAuthStateController,
  launcherChatController,
  launcherController,
  launcherMessageOrchestrator,
  launcherOverlayController,
  launcherProfileController,
  launcherRankingSync,
  launcherShopController
}) {
  return {
    applyNicknameToProfileRankingState(nickname) {
      launcherProfileController?.applyNicknameToProfileRankingState?.(nickname);
    },
    bindEvents() {
      launcherOverlayController?.bindEvents?.();
      launcherProfileController?.bindEvents?.();
      launcherChatController?.bindEvents?.();
      launcherShopController?.bindEvents?.();
      launcherController?.bindEvents?.();
    },
    boot() {
      launcherChatController?.boot?.();
    },
    claimMessageById(messageId) {
      return launcherProfileController?.claimMessageById?.(messageId);
    },
    closeAuthDialog() {
      launcherOverlayController?.closeAuthDialog?.();
    },
    closeLobbyOverlays() {
      launcherOverlayController?.closeLobbyOverlays?.();
    },
    closeLobbyRewardMessagePrompt(options) {
      launcherMessageOrchestrator?.closeLobbyRewardMessagePrompt?.(options);
    },
    closeSettingsDialog() {
      launcherOverlayController?.closeSettingsDialog?.();
    },
    handleAuthStateChanged(user) {
      launcherAuthStateController?.handleAuthStateChanged?.(user);
    },
    handleLanguageChange() {
      launcherChatController?.handleLanguageChange?.();
    },
    markMessagesSeen(messages) {
      launcherMessageOrchestrator?.markMessagesSeen?.(messages);
    },
    markRewardMessagesAlerted(messages) {
      launcherMessageOrchestrator?.markRewardMessagesAlerted?.(messages);
    },
    maybeOpenLobbyRewardMessagePrompt(messages) {
      launcherMessageOrchestrator?.maybeOpenLobbyRewardMessagePrompt?.(messages);
    },
    openAuthDialog(mode = "login") {
      launcherOverlayController?.openAuthDialog?.(mode);
    },
    openGameEntry(gameId, options) {
      launcherController?.openGameEntry?.(gameId, options);
    },
    openMessagesInbox() {
      return launcherOverlayController?.openMessagesDialog?.();
    },
    openProfileInfo() {
      return launcherOverlayController?.openProfileDialog?.();
    },
    openSettingsDialog() {
      launcherOverlayController?.openSettingsDialog?.();
    },
    refreshAccountWallet() {
      return launcherAuthStateController?.refreshAccountWallet?.();
    },
    refreshCurrentSeasonRank() {
      return launcherAuthStateController?.refreshCurrentSeasonRank?.();
    },
    refreshMessagesInbox(options) {
      return launcherProfileController?.refreshMessagesInbox?.(options);
    },
    refreshShopState() {
      launcherShopController?.refreshShopState?.();
    },
    renderProfileFromState() {
      launcherProfileController?.renderProfileFromState?.();
    },
    resetMessageNotifications() {
      launcherMessageOrchestrator?.resetMessageNotifications?.();
    },
    saveProfileNickname() {
      return launcherProfileController?.saveProfileNickname?.();
    },
    syncAuthenticatedAccount() {
      return launcherRankingSync?.syncAuthenticatedAccount?.();
    },
    syncAuthenticatedRankingNicknames(payload) {
      return launcherRankingSync?.syncAuthenticatedRankingNicknames?.(payload);
    },
    syncLobbyChatUi(options) {
      launcherChatController?.syncLobbyChatUi?.(options);
    },
    syncMobileNavigationState() {
      launcherController?.syncMobileNavigationState?.();
    },
    updateAuthUi() {
      launcherAuthStateController?.updateAuthUi?.();
    },
    updateLobbyPlayerInfo() {
      launcherAuthStateController?.updateLobbyPlayerInfo?.();
    },
    updateMessageNotificationState(messages) {
      launcherMessageOrchestrator?.updateMessageNotificationState?.(messages);
    },
    updateMessagesButtonLabel() {
      launcherMessageOrchestrator?.updateMessagesButtonLabel?.();
    }
  };
}
