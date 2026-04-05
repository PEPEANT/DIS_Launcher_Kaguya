import { elements } from "../../../core/dom.js";

export function createLauncherAuthStateController({
  accountDataService,
  applyNickname,
  clearSavedNickname,
  closeAuthDialog,
  closeLobbyRewardMessagePrompt,
  closeMessagesModal,
  closeProfileModal,
  closeSettingsDialog,
  ensureMusicEnabled,
  formatNumber,
  getActiveNickname,
  getGuestNickname,
  getMemberDisplayName,
  getProfileDisplayName,
  getSignedInIntroMessage,
  getSignedInSummary,
  isAccountWalletEnabled,
  playLobbyMusic,
  postPlaytestStatus,
  profileModalState,
  refreshMessagesInbox,
  refreshShopState,
  resetMessageNotifications,
  state,
  syncAuthenticatedAccount,
  syncAuthenticatedRankingNicknames,
  syncLobbyChatUi,
  syncMobileNavigationState,
  t,
  updateMessagesButtonLabel
}) {
  function updateLobbyPlayerInfo() {
    const displayName = getActiveNickname() || state.nickname || "-";
    const rankText = state.lastRank ? `#${state.lastRank}` : "-";

    elements.lobbyNicknameDisplay.textContent = displayName;
    elements.lobbyRankDisplay.textContent = rankText;
    elements.hujupayCard.hidden = !state.authUser?.uid || !isAccountWalletEnabled();
    elements.hujupayBalanceDisplay.textContent = formatNumber(state.hujupayBalance);
    if (elements.desktopHujupayBalance) {
      elements.desktopHujupayBalance.textContent = formatNumber(state.hujupayBalance);
    }
    elements.rankingSelfName.textContent = displayName;
    elements.rankingSelfRank.textContent = rankText;
    postPlaytestStatus();
  }

  async function refreshCurrentSeasonRank() {
    if (!state.authUser?.uid) {
      state.lastRank = null;
      updateLobbyPlayerInfo();
      return;
    }

    const rankSnapshot = await accountDataService?.loadCurrentSeasonRank?.({
      user: state.authUser,
      currentPlayerId: state.playerId
    });

    if (rankSnapshot?.stale) {
      return;
    }

    state.lastRank = rankSnapshot?.rank || null;
    updateLobbyPlayerInfo();
  }

  async function refreshAccountWallet() {
    const walletSnapshot = await accountDataService?.loadAccountWallet?.({
      user: state.authUser
    });

    if (walletSnapshot?.stale) {
      return;
    }

    state.hujupayBalance = walletSnapshot?.hujupayBalance ?? 0;
    state.hujupayEarnedTotal = walletSnapshot?.hujupayEarnedTotal ?? 0;
    state.equippedSkin = walletSnapshot?.equippedSkin || "skin_0";
    state.ownedSkins = Array.isArray(walletSnapshot?.ownedSkins) ? walletSnapshot.ownedSkins : [];
    updateLobbyPlayerInfo();
    refreshShopState();
  }

  function updateAuthUi() {
    const isLoggedIn = Boolean(state.authUser?.uid);
    const displayName = getProfileDisplayName();
    const email = state.authUser?.email || "";
    const authActionLabel = isLoggedIn ? t("auth.logout") : t("auth.login");
    const mobileAccountLabel = isLoggedIn ? t("mobileNav.info") : t("mobileNav.login");

    elements.accountCard.hidden = false;
    elements.accountCard.setAttribute("aria-hidden", "false");
    elements.authModeBadge.classList.toggle("account-badge--guest", !isLoggedIn);
    elements.authModeBadge.classList.toggle("account-badge--member", isLoggedIn);
    elements.authModeBadge.textContent = isLoggedIn ? t("auth.memberBadge") : t("auth.guestBadge");
    elements.authDisplayName.textContent = isLoggedIn ? displayName : (state.nickname || t("auth.guestTitle"));
    elements.authSummaryText.textContent = isLoggedIn
      ? getSignedInSummary(email || displayName)
      : "";
    elements.authSummaryText.hidden = true;
    elements.profileInfoButton.hidden = !isLoggedIn;
    if (elements.desktopMessagesButton) {
      elements.desktopMessagesButton.hidden = !isLoggedIn;
    }
    elements.introLoginButton.textContent = authActionLabel;
    elements.lobbyLoginButton.textContent = authActionLabel;
    elements.lobbyLoginButton.hidden = isLoggedIn;
    if (elements.mobileAccountButton) {
      elements.mobileAccountButton.textContent = mobileAccountLabel;
    }
    elements.introAuthState.hidden = true;
    elements.introAuthState.textContent = isLoggedIn ? getSignedInIntroMessage(email || displayName) : "";
    elements.introStartButton.textContent = t("intro.guestStart");
    updateMessagesButtonLabel();
    syncLobbyChatUi();
  }

  function handleAuthStateChanged(user) {
    state.authReady = true;
    state.authUser = user;
    profileModalState.nicknameBusy = false;

    if (state.authUser) {
      profileModalState.editingNickname = false;
      profileModalState.messages = [];
      applyNickname(getMemberDisplayName(state.authUser) || state.nickname || getGuestNickname());
      updateAuthUi();
      void (async () => {
        await syncAuthenticatedAccount();
        await syncAuthenticatedRankingNicknames({ user: state.authUser });
        await refreshCurrentSeasonRank();
      })().catch((error) => {
        console.warn("Failed to sync authenticated ranking metadata.", error);
      });
      void refreshAccountWallet();
      void refreshMessagesInbox({ triggerLobbyPrompt: true });
      ensureMusicEnabled();
      playLobbyMusic();
      closeAuthDialog();
    } else {
      clearSavedNickname();
      applyNickname(getGuestNickname());
      profileModalState.editingNickname = false;
      state.lastRank = null;
      state.hujupayBalance = 0;
      state.hujupayEarnedTotal = 0;
      updateAuthUi();
      profileModalState.currentSeasonProfile = null;
      profileModalState.season1Profile = null;
      profileModalState.messages = [];
      resetMessageNotifications();
      closeLobbyRewardMessagePrompt({ markAlerted: false });
      closeMessagesModal();
      closeProfileModal();
      closeSettingsDialog();
    }

    refreshShopState();
    syncLobbyChatUi({
      clearFeedback: true,
      clearInput: !state.authUser
    });
    syncMobileNavigationState();
    postPlaytestStatus();
  }

  return {
    handleAuthStateChanged,
    refreshAccountWallet,
    refreshCurrentSeasonRank,
    updateAuthUi,
    updateLobbyPlayerInfo
  };
}
