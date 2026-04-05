import { elements } from "../../core/dom.js";

export function createLauncherProfileController({
  applyNickname,
  claimAccountMessageReward,
  currentSeason,
  formatNumber,
  getAuthErrorMessage,
  getAuthNicknameCheckFailedMessage,
  getAuthNicknameRequiredMessage,
  getAuthNicknameTakenMessage,
  getMemberDisplayName,
  getMessagesClaimFailedText,
  getMessagesClaimedText,
  getMessagesFailedText,
  getMessagesLoadingText,
  getProfileDisplayName,
  getProfileFailedMessage,
  getProfileLoadingMessage,
  getProfileNicknameSavedMessage,
  getProfileNicknameUnchangedMessage,
  getProfilePartialFailedMessage,
  getRankingSeasonConfig,
  getRequestedProfileNickname,
  isAccountMessageClaimEnabled,
  isAccountMessageInboxEnabled,
  isAccountWalletEnabled,
  isNicknameAvailable,
  isPlaytestActive,
  markMessagesSeen,
  markRewardMessagesAlerted,
  maybeOpenLobbyRewardMessagePrompt,
  normalizeName,
  handleSignOut,
  profileLoaderService,
  profileModalState,
  profileSeason,
  refreshCurrentSeasonRank,
  renderMessages,
  renderProfileSeasonRecord,
  renderProfileSeasonTopRankings,
  renderProfileSummary,
  resetMessageNotifications,
  setMessagesStatus,
  setProfileNicknameBusy,
  setProfileNicknameEditing,
  setProfileStatus,
  state,
  syncAuthenticatedRankingNicknames,
  t,
  updateAccountNickname,
  updateAuthUi,
  updateCurrentUserNickname,
  updateLobbyPlayerInfo,
  updateMessageNotificationState,
  updateMessagesButtonLabel
}) {
  function renderProfileFromState() {
    const currentSeasonProfile = profileModalState.currentSeasonProfile;
    const season1Profile = profileModalState.season1Profile;
    const period = getRankingSeasonConfig(profileSeason).period || t("ranking.season1ArchivePeriod");
    const accountName = getProfileDisplayName(state.authUser) || "-";
    const walletEnabled = isAccountWalletEnabled();
    const walletBalance = walletEnabled ? (currentSeasonProfile?.identity?.hujupayBalance ?? state.hujupayBalance) : 0;

    renderProfileSummary({
      name: accountName,
      summary: "",
      period,
      walletBalance: formatNumber(walletBalance),
      walletSummary: walletEnabled ? t("wallet.profileHint") : ""
    });
    renderProfileSeasonRecord(currentSeasonProfile?.record || null, {
      container: elements.profileCurrentSeasonRecord,
      emptyText: currentSeasonProfile?.unavailable
        ? t("profile.unavailable")
        : t("profile.currentSeasonNoRecord")
    });
    renderProfileSeasonRecord(season1Profile?.record || null, {
      container: elements.profileSeason1Record,
      emptyText: season1Profile?.unavailable
        ? t("profile.unavailable")
        : t("profile.noRecord")
    });
    renderProfileSeasonTopRankings(season1Profile?.topRankings || [], {
      listElement: elements.profileSeason1TopList,
      emptyText: season1Profile?.unavailable
        ? t("profile.unavailable")
        : t("ranking.norecords")
    });
    setProfileNicknameEditing(profileModalState.editingNickname);
    updateMessagesButtonLabel();
  }

  function applyNicknameToProfileRankingState(nickname) {
    const safeNickname = normalizeName(nickname);
    if (!safeNickname) {
      return;
    }

    [profileModalState.currentSeasonProfile, profileModalState.season1Profile].forEach((seasonProfile) => {
      if (seasonProfile?.record) {
        seasonProfile.record.name = safeNickname;
        seasonProfile.record.nicknameSnapshot = safeNickname;
      }

      if (Array.isArray(seasonProfile?.topRankings)) {
        seasonProfile.topRankings = seasonProfile.topRankings.map((entry) => {
          if (String(entry?.playerId || "").trim() !== state.playerId) {
            return entry;
          }

          return {
            ...entry,
            name: safeNickname,
            nicknameSnapshot: safeNickname
          };
        });
      }
    });
  }

  async function refreshMessagesInbox({ showLoading = false, triggerLobbyPrompt = false } = {}) {
    if (!state.authUser?.uid || !isAccountMessageInboxEnabled()) {
      profileModalState.messages = [];
      renderMessages([]);
      setMessagesStatus("");
      updateMessagesButtonLabel();
      resetMessageNotifications();
      return [];
    }

    if (showLoading) {
      setMessagesStatus(getMessagesLoadingText());
    }

    const inboxResult = await profileLoaderService?.loadMessagesInboxData?.({
      currentPlayerId: state.playerId,
      seasonProfile: profileModalState.season1Profile,
      user: state.authUser
    });

    if (inboxResult?.seasonProfile) {
      profileModalState.season1Profile = inboxResult.seasonProfile;
    }

    if (inboxResult?.failed) {
      profileModalState.messages = [];
      renderMessages([]);
      setMessagesStatus(getMessagesFailedText(), "error");
      resetMessageNotifications();
      updateMessagesButtonLabel();
      return [];
    }

    const messages = Array.isArray(inboxResult?.messages) ? inboxResult.messages : [];
    profileModalState.messages = messages;
    renderMessages(messages);
    setMessagesStatus("");
    updateMessageNotificationState(messages);
    if (triggerLobbyPrompt) {
      maybeOpenLobbyRewardMessagePrompt(messages);
    }
    updateMessagesButtonLabel();
    return messages;
  }

  async function loadMessagesInbox() {
    renderMessages(profileModalState.messages || []);
    const messages = await refreshMessagesInbox({ showLoading: true });
    markMessagesSeen(messages);
    markRewardMessagesAlerted(messages);
    updateMessageNotificationState(messages);
    updateMessagesButtonLabel();
  }

  async function claimMessageById(messageId) {
    if (!state.authUser?.uid || !messageId || !isAccountMessageClaimEnabled()) {
      return;
    }

    const button = elements.messagesList.querySelector(`[data-message-id="${messageId}"]`);
    if (button) {
      button.disabled = true;
      button.textContent = t("messages.claiming");
    }

    try {
      const result = await claimAccountMessageReward({
        uid: state.authUser.uid,
        messageId
      });

      state.hujupayBalance = result.hujupayBalance ?? state.hujupayBalance;
      state.hujupayEarnedTotal = result.hujupayEarnedTotal ?? state.hujupayEarnedTotal;
      updateLobbyPlayerInfo();

      if (!profileModalState.currentSeasonProfile) {
        profileModalState.currentSeasonProfile = {};
      }

      if (!profileModalState.currentSeasonProfile.identity) {
        profileModalState.currentSeasonProfile.identity = {};
      }

      profileModalState.currentSeasonProfile.identity.hujupayBalance = state.hujupayBalance;
      profileModalState.currentSeasonProfile.identity.hujupayEarnedTotal = state.hujupayEarnedTotal;
      renderProfileFromState();

      await refreshMessagesInbox();
      setMessagesStatus(getMessagesClaimedText(result.awardedAmount || 0), "success");
    } catch (error) {
      console.warn("Failed to claim message reward.", error);
      setMessagesStatus(getMessagesClaimFailedText(), "error");
      await refreshMessagesInbox();
    }
  }

  async function saveProfileNickname() {
    if (isPlaytestActive()) {
      setProfileStatus("Playtest mode does not save account changes.", "error");
      return;
    }

    if (!state.authUser?.uid || profileModalState.nicknameBusy) {
      return;
    }

    const requestedNickname = getRequestedProfileNickname();
    const currentNickname = getMemberDisplayName(state.authUser);

    if (!requestedNickname) {
      setProfileStatus(getAuthNicknameRequiredMessage(), "error");
      elements.profileNicknameInput.focus();
      return;
    }

    if (requestedNickname === currentNickname) {
      setProfileStatus(getProfileNicknameUnchangedMessage());
      setProfileNicknameEditing(false);
      return;
    }

    setProfileNicknameBusy(true);

    try {
      const isAvailable = await isNicknameAvailable(requestedNickname);

      if (!isAvailable) {
        setProfileStatus(getAuthNicknameTakenMessage(), "error");
        elements.profileNicknameInput.focus();
        return;
      }

      const updatedUser = await updateCurrentUserNickname(requestedNickname);
      await updateAccountNickname({
        uid: updatedUser.uid,
        nickname: requestedNickname
      });

      state.authUser = updatedUser;
      applyNickname(requestedNickname);
      await syncAuthenticatedRankingNicknames({
        user: updatedUser,
        nickname: requestedNickname
      });
      await refreshCurrentSeasonRank();
      applyNicknameToProfileRankingState(requestedNickname);
      updateAuthUi();
      setProfileNicknameEditing(false);
      renderProfileFromState();
      setProfileStatus(getProfileNicknameSavedMessage(), "success");
    } catch (error) {
      console.warn("Failed to update nickname.", error);
      setProfileStatus(
        error?.code ? getAuthErrorMessage(error) : getAuthNicknameCheckFailedMessage(),
        "error"
      );
    } finally {
      setProfileNicknameBusy(false);
    }
  }

  async function loadProfileInfo() {
    profileModalState.currentSeasonProfile = null;
    profileModalState.season1Profile = null;
    profileModalState.messages = [];
    profileModalState.editingNickname = false;
    profileModalState.nicknameBusy = false;
    renderProfileSummary({
      name: getProfileDisplayName(state.authUser) || "-",
      summary: "",
      period: getRankingSeasonConfig(profileSeason).period || t("ranking.season1ArchivePeriod"),
      walletBalance: formatNumber(state.hujupayBalance),
      walletSummary: t("wallet.profileHint")
    });
    if (elements.profileCurrentSeasonRecord) {
      elements.profileCurrentSeasonRecord.innerHTML = "";
    }
    if (elements.profileSeason1Record) {
      elements.profileSeason1Record.innerHTML = "";
    }
    if (elements.profileSeason1TopList) {
      elements.profileSeason1TopList.innerHTML = "";
    }
    renderMessages([]);
    setProfileStatus(getProfileLoadingMessage());

    const profileData = await profileLoaderService?.loadProfileModalData?.({
      currentPlayerId: state.playerId,
      user: state.authUser
    });

    profileModalState.currentSeasonProfile = profileData?.currentSeasonProfile || null;
    profileModalState.season1Profile = profileData?.profileSeasonProfile || null;

    if (profileData?.currentSeasonProfile) {
      state.hujupayBalance = profileData.currentSeasonProfile?.identity?.hujupayBalance ?? state.hujupayBalance;
      state.hujupayEarnedTotal = profileData.currentSeasonProfile?.identity?.hujupayEarnedTotal ?? state.hujupayEarnedTotal;
    }

    if (profileData?.status === "failed") {
      setProfileStatus(getProfileFailedMessage(), "error");
    } else if (profileData?.status === "partial") {
      setProfileStatus(getProfilePartialFailedMessage(), "error");
    } else {
      setProfileStatus("");
    }

    renderProfileFromState();
    void refreshMessagesInbox();
  }

  function bindEvents() {
    elements.profileNicknameInput.addEventListener("input", () => {
      if (!profileModalState.nicknameBusy) {
        setProfileStatus("");
      }
    });

    elements.profileNicknameEditButton.addEventListener("click", () => {
      setProfileStatus("");
      setProfileNicknameEditing(true, { focus: true });
    });

    elements.profileNicknameCancelButton.addEventListener("click", () => {
      setProfileStatus("");
      setProfileNicknameEditing(false);
    });

    elements.profileNicknameForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveProfileNickname();
    });

    elements.profileLogoutButton.addEventListener("click", () => {
      void handleSignOut();
    });

    elements.messagesList.addEventListener("click", (event) => {
      const button = event.target instanceof HTMLElement
        ? event.target.closest("[data-message-id]")
        : null;

      if (!button) {
        return;
      }

      const messageId = button.dataset.messageId || "";
      void claimMessageById(messageId);
    });
  }

  return {
    applyNicknameToProfileRankingState,
    bindEvents,
    claimMessageById,
    loadMessagesInbox,
    loadProfileInfo,
    refreshMessagesInbox,
    renderProfileFromState,
    saveProfileNickname
  };
}
