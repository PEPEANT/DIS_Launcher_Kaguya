import { loadAssets } from "./games/snack-rush/runtime/load-snack-rush-assets.js";
import { fetchAccountIdentity, syncAccountIdentity, updateAccountNickname } from "./shared/user/account-identity-service.js";
import { claimAccountMessageReward, fetchAccountMessages, isAccountMessageClaimEnabled, isAccountMessageInboxEnabled } from "./shared/messaging/account-message-service.js";
import { isAccountWalletEnabled } from "./shared/wallet/account-wallet-service.js";
import { equipSkin, isAccountShopEnabled, purchaseSkin } from "./shared/shop/account-shop-service.js";
import { initAuth, sendPasswordResetLink, signInWithEmail, signOutCurrentUser, signUpWithEmail, updateCurrentUserNickname } from "./shared/auth/auth-service.js";
import { sendLobbyChatMessage, subscribeLobbyChat } from "./shared/messaging/lobby-chat-service.js";
import { createAppBootHelpers } from "./core/create-app-boot-helpers.js";
import { createAppCopyHelpers } from "./core/create-app-copy-helpers.js";
import { createAppFormHelpers } from "./core/create-app-form-helpers.js";
import { createAppIdentityHelpers } from "./core/create-app-identity-helpers.js";
import { createAppRuntimeHelpers } from "./core/create-app-runtime-helpers.js";
import { createCoreRuntime } from "./core/create-core-runtime.js";
import { DEFAULT_GAME_ID, GAME_DEFINITIONS } from "./config/games.js";
import { createCookingRuntime } from "./games/cooking/runtime/create-cooking-runtime.js";
import { createSnackRushRuntime } from "./games/snack-rush/runtime/create-snack-rush-runtime.js";
import { getCurrentContentSeasonId, getCurrentRankingSeason, getRankingSeasonConfig, isPlaytestMode } from "./config/runtime.js";
import { createLauncherRuntime } from "./launcher/runtime/create-launcher-runtime.js";
import { applyPlaytestState, fetchRankings, spawnPlaytestItemByKey, startRound, updateGame } from "./games/snack-rush/gameplay/snack-rush-logic.js";
import { buildGuestNickname, clearSavedNickname, getOrCreatePlayerId } from "./shared/user/player-identity.js";
import { startPresenceTracking } from "./shared/user/presence-service.js";
import { fetchSeasonProfile } from "./shared/user/profile-record-service.js";
import { fetchAllRankingsFromProvider, checkNicknameAvailabilityFromProvider, submitScoreToProvider } from "./shared/ranking-core/ranking-service.js";
import { createSharedServices } from "./shared/create-shared-services.js";
import { normalizeName, state } from "./core/state.js";

const coreRuntime = createCoreRuntime();
const {
  audio: {
    ensureMusicEnabled,
    initAudio,
    playLobbyMusic,
    toggleMusic
  },
  device: {
    isPortraitTouchViewport,
    isTouchDevice
  },
  elements,
  i18n: {
    getLang,
    initI18n,
    t
  },
  render: {
    renderFrame
  },
  ui: {
    closeAuthModal,
    closeMessageArrivalModal,
    closeMessagesModal,
    closeProfileModal,
    closeSettingsModal,
    hideGameResult,
    openAuthModal,
    openMessageArrivalModal,
    openMessagesModal,
    openProfileModal,
    openSettingsModal,
    renderAllRankingsList,
    renderGuideImages,
    renderLobbyChatMessages,
    renderMessages,
    renderProfileSeasonRecord,
    renderProfileSeasonTopRankings,
    renderProfileSummary,
    renderRankingList,
    renderSeason1Archive,
    renderShopState,
    setActiveSeasonTab,
    setAllRankingsStatus,
    setAllRankingsToggle,
    setAuthModalMode,
    setAuthStatus,
    setLobbyChatComposerState,
    setLobbyChatStatus,
    setAuthSubmitState,
    setLobbyMobilePanel,
    setMessageAlertState,
    setMessageArrivalCopy,
    setMessagesStatus,
    setOrientationGateState,
    setProfileStatus,
    setRankingStatus,
    setStartButtonState,
    setTouchControlsVisible,
    setTouchControlCooldowns,
    showIntroScreen,
    showLobbyScreen
  }
} = coreRuntime;

let booted = false;
const RANKING_POLL_INTERVAL = 5000;
const ALL_RANKINGS_PREVIEW_COUNT = 10;
const AUTH_MIN_PASSWORD_LENGTH = 6;
const PROFILE_SEASON = 1;
const CURRENT_SEASON = getCurrentRankingSeason();
const PLAYTEST_ENABLED = isPlaytestMode();
const PLAYTEST_MESSAGE_SOURCE = "admin-playtest";
const PLAYTEST_STATUS_SOURCE = "game-playtest";
const PLAYTEST_BRIDGE_KEY = "__KAGUYA_PLAYTEST__";
const PLAYTEST_STATUS_INTERVAL = 300;
const LOBBY_CHAT_COOLDOWN_MS = 4_000;
const MESSAGE_SEEN_STORAGE_PREFIX = "kaguya_messages_seen_v1";
const MESSAGE_ALERTED_STORAGE_PREFIX = "kaguya_messages_alerted_v1";
const MAX_STORED_MESSAGE_IDS = 120;
const INTRO_BACKGROUND_VERSION = "20260402-intro";
const INTRO_BACKGROUND_BY_LANG = Object.freeze({
  ko: `/scene/Login_Main_kr.png?v=${INTRO_BACKGROUND_VERSION}`,
  ja: `/scene/Login_Main_jp.png?v=${INTRO_BACKGROUND_VERSION}`,
  en: `/scene/Login_Main_jp.png?v=${INTRO_BACKGROUND_VERSION}`
});
const authModalState = {
  mode: "login",
  busy: false,
  passwordVisible: false,
  confirmVisible: false,
  nicknameCheckedValue: "",
  nicknameAvailable: false
};
const profileModalState = {
  currentSeasonProfile: null,
  season1Profile: null,
  messages: [],
  editingNickname: false,
  nicknameBusy: false
};
const lobbyChatState = {
  messages: [],
  sending: false,
  cooldownUntil: 0,
  unsubscribe: null,
  cooldownTimerId: 0,
  statusTone: "info",
  statusText: ""
};
const messageNotificationState = {
  unreadCount: 0,
  pendingRewardPromptIds: []
};
let launcherApi = null;
let cookingEntryController = null;
let cookingRuntime = null;
let snackRushEntryController = null;
let snackRushResultController = null;
let snackRushSessionController = null;
let snackRushRuntime = null;
const appCopyHelpers = createAppCopyHelpers({
  authMinPasswordLength: AUTH_MIN_PASSWORD_LENGTH,
  elements,
  getLang,
  normalizeName
});
const {
  formatNumber,
  getAuthErrorMessage,
  getAuthNicknameAvailableMessage,
  getAuthNicknameCheckFailedMessage,
  getAuthNicknameNeedsCheckMessage,
  getAuthNicknameRequiredMessage,
  getAuthNicknameTakenMessage,
  getAutoNicknameMessage,
  getMessagesClaimFailedText,
  getMessagesClaimedText,
  getMessagesFailedText,
  getMessagesLoadingText,
  getNicknameCheckFailedMessage,
  getNicknameTakenMessage,
  getPasswordMismatchMessage,
  getPasswordTooShortMessage,
  getProfileFailedMessage,
  getProfileLoadingMessage,
  getProfileNicknameSavedMessage,
  getProfileNicknameUnchangedMessage,
  getProfilePartialFailedMessage,
  getRequestedAuthNickname,
  getRequestedProfileNickname,
  getResetAuthErrorMessage,
  getResetPasswordPromptMessage,
  getResetPasswordSentMessage,
  getSignedInIntroMessage,
  getSignedInSummary,
  getSignOutFailedMessage
} = appCopyHelpers;
const appIdentityHelpers = createAppIdentityHelpers({
  buildGuestNickname,
  checkNicknameAvailabilityFromProvider,
  elements,
  getLang,
  getSignOutFailedMessage,
  launcherApiGetter: () => launcherApi,
  normalizeName,
  postPlaytestStatus: (...args) => appRuntimeHelpers.postPlaytestStatus(...args),
  signOutCurrentUser,
  state
});
const {
  applyNickname,
  getOrientationGateCopy,
  handleSignOut,
  isNicknameAvailable
} = appIdentityHelpers;
const appRuntimeHelpers = createAppRuntimeHelpers({
  applyPlaytestState,
  buildGuestNickname,
  elements,
  fetchRankings,
  getCurrentContentSeasonId,
  getLang,
  getOrientationGateCopy,
  isPortraitTouchViewport,
  isTouchDevice,
  launcherApiGetter: () => launcherApi,
  normalizeName,
  playtestBridgeKey: PLAYTEST_BRIDGE_KEY,
  playtestEnabled: PLAYTEST_ENABLED,
  playtestMessageSource: PLAYTEST_MESSAGE_SOURCE,
  playtestStatusInterval: PLAYTEST_STATUS_INTERVAL,
  playtestStatusSource: PLAYTEST_STATUS_SOURCE,
  rankingPollInterval: RANKING_POLL_INTERVAL,
  renderFrame,
  setLobbyMobilePanel,
  setOrientationGateState,
  setTouchControlsVisible,
  setTouchControlCooldowns,
  showLobbyScreen,
  snackRushSessionControllerGetter: () => snackRushSessionController,
  spawnPlaytestItemByKey,
  startRound,
  state,
  t,
  updateGame
});
const {
  getActiveNickname,
  getCurrentRoundNickname,
  getGuestNickname,
  getMemberDisplayName,
  getProfileDisplayName,
  handlePlaytestMessage,
  installPlaytestBridge,
  isPlaytestActive,
  postPlaytestStatus,
  refreshRankingsInBackground,
  startPlaytestStatusLoop,
  startRankingPolling,
  syncResponsiveUi
} = appRuntimeHelpers;
const appFormHelpers = createAppFormHelpers({
  authModalState,
  elements,
  getAuthNicknameAvailableMessage,
  getAuthNicknameCheckFailedMessage,
  getAuthNicknameRequiredMessage,
  getAuthNicknameTakenMessage,
  getMemberDisplayName,
  getRequestedAuthNickname,
  profileModalState,
  setAuthModalMode,
  setAuthStatus,
  setAuthSubmitState,
  state,
  t,
  isNicknameAvailable
});
const {
  applySelectedEmailDomain,
  clearAuthStatusIfIdle,
  clearAuthValidation,
  resetAuthForm,
  resetAuthNicknameCheck,
  runAuthNicknameCheck,
  setAuthMode,
  setAuthNicknameStatus,
  setPasswordVisibility,
  setProfileNicknameBusy,
  setProfileNicknameEditing,
  syncEmailDomainSelect
} = appFormHelpers;

function initControllers() {
  const sharedServices = createSharedServices({
    currentSeason: CURRENT_SEASON,
    fetchAccountIdentity,
    fetchAccountMessages,
    fetchAllRankingsFromProvider,
    fetchSeasonProfile,
    getMemberDisplayName,
    isAccountMessageInboxEnabled,
    isAccountWalletEnabled,
    isPlaytestActive,
    normalizeName,
    profileSeason: PROFILE_SEASON,
    state,
    submitScoreToProvider,
    syncAccountIdentity
  });

  ({
    launcherApi
  } = createLauncherRuntime({
    accountDataService: sharedServices.accountDataService,
    accountSyncService: sharedServices.accountSyncService,
    accountUi: {
      ensureMusicEnabled,
      formatNumber,
      getSignedInIntroMessage,
      getSignedInSummary,
      isAccountWalletEnabled,
      playLobbyMusic,
      postPlaytestStatus
    },
    auth: {
      authMinPasswordLength: AUTH_MIN_PASSWORD_LENGTH,
      authModalState,
      applySelectedEmailDomain,
      clearAuthStatusIfIdle,
      clearAuthValidation,
      getAuthErrorMessage,
      getAuthNicknameCheckFailedMessage,
      getAuthNicknameNeedsCheckMessage,
      getAuthNicknameRequiredMessage,
      getAuthNicknameTakenMessage,
      getPasswordMismatchMessage,
      getPasswordTooShortMessage,
      getRequestedAuthNickname,
      getResetAuthErrorMessage,
      getResetPasswordPromptMessage,
      getResetPasswordSentMessage,
      handleSignOut,
      isLoggedIn: () => Boolean(state.authUser?.uid),
      resetAuthForm,
      resetAuthNicknameCheck,
      runAuthNicknameCheck,
      sendPasswordResetLink,
      setAuthMode,
      setAuthNicknameStatus,
      setAuthStatus,
      setAuthSubmitState,
      setPasswordVisibility,
      signInWithEmail,
      signUpWithEmail,
      syncEmailDomainSelect
    },
    authOverlay: {
      closeAuthDialog: () => launcherApi?.closeAuthDialog?.(),
      closeSettingsDialog: () => launcherApi?.closeSettingsDialog?.()
    },
    authUi: {
      closeAuthModal,
      closeSettingsModal,
      openAuthModal,
      openSettingsModal
    },
    currentSeason: CURRENT_SEASON,
    chat: {
      chatCooldownMs: LOBBY_CHAT_COOLDOWN_MS,
      getChatFailedText: () => t("chat.failed"),
      getChatLoadingText: () => t("chat.loading"),
      getChatLoginRequiredText: () => t("chat.loginRequired"),
      lobbyChatState,
      renderLobbyChatMessages,
      sendLobbyChatMessage,
      setLobbyChatComposerState,
      setLobbyChatStatus,
      subscribeLobbyChat
    },
    identity: {
      applyNickname,
      clearSavedNickname,
      getActiveNickname,
      getCurrentUid: () => state.authUser?.uid || "",
      getGuestNickname,
      getMemberDisplayName,
      getProfileDisplayName,
      normalizeName
    },
    messageOverlay: {
      closeMessageArrivalModal,
      closeMessagesModal,
      closeProfileModal,
      openMessageArrivalModal,
      openMessagesModal,
      openProfileModal
    },
    messageState: {
      maxStoredMessageIds: MAX_STORED_MESSAGE_IDS,
      messageAlertedStoragePrefix: MESSAGE_ALERTED_STORAGE_PREFIX,
      messageNotificationState,
      messageSeenStoragePrefix: MESSAGE_SEEN_STORAGE_PREFIX
    },
    messages: {
      canOpenMessagesInbox: () => isAccountMessageInboxEnabled(),
      getLang,
      getMessagesClaimFailedText,
      getMessagesClaimedText,
      getMessagesFailedText,
      getMessagesLoadingText,
      isAccountMessageInboxEnabled,
      renderMessages,
      setMessageAlertState,
      setMessageArrivalCopy,
      setMessagesStatus
    },
    profile: {
      claimAccountMessageReward,
      getProfileFailedMessage,
      getProfileLoadingMessage,
      getProfileNicknameSavedMessage,
      getProfileNicknameUnchangedMessage,
      getProfilePartialFailedMessage,
      getRequestedProfileNickname,
      isAccountMessageClaimEnabled,
      isNicknameAvailable,
      isPlaytestActive,
      renderProfileSeasonRecord,
      renderProfileSeasonTopRankings,
      renderProfileSummary,
      setProfileNicknameBusy,
      setProfileNicknameEditing,
      setProfileStatus,
      updateAccountNickname,
      updateCurrentUserNickname
    },
    profileLoaderService: sharedServices.profileLoaderService,
    profileModalState,
    profileSeason: PROFILE_SEASON,
    ranking: {
      getRankingSeasonConfig,
      renderRankingList,
      renderAllRankingsList,
      renderSeason1Archive,
      setActiveSeasonTab,
      setAllRankingsStatus,
      setAllRankingsToggle,
      setRankingStatus
    },
    routing: {
      defaultGameId: DEFAULT_GAME_ID,
      gameDefinitions: GAME_DEFINITIONS,
      openGamePrestart: (gameId, options = {}) => {
        if (gameId === "snack-rush") {
          snackRushSessionController?.openPrestart?.({
            refreshRankings: options.refreshRankings !== false
          });
        }
      },
      refreshGameEntry: (gameId, options = {}) => {
        if (gameId === "snack-rush" && options.refreshRankings !== false) {
          snackRushRuntime?.refreshEntryRankings?.();
        }
      },
      syncMobileNavigationState: () => launcherApi?.syncMobileNavigationState?.(),
      syncResponsiveUi
    },
    sharedState: state,
    shop: {
      equipSkin,
      getShopBuyConfirmText: () => t("shop.buyConfirm"),
      getShopErrorText: () => t("shop.error"),
      getShopNotEnoughText: () => t("shop.notEnough"),
      isAccountShopEnabled,
      purchaseSkin,
      renderShopState
    },
    t
  }));

  snackRushRuntime = createSnackRushRuntime({
    currentSeason: CURRENT_SEASON,
    entry: {
      getCurrentRoundNickname,
      isPlaytestActive,
      refreshRankings: () => fetchRankings(),
      setStartButtonState
    },
    ranking: {
      allRankingsPreviewCount: ALL_RANKINGS_PREVIEW_COUNT,
      fetchAllRankings: fetchAllRankingsFromProvider,
      fetchEntryRankings: fetchRankings,
      getRankingSeasonConfig,
      renderAllRankingsList,
      renderRankingList,
      renderSeason1Archive,
      setActiveSeasonTab,
      setAllRankingsStatus,
      setAllRankingsToggle,
      setRankingStatus
    },
    session: {
      getOrientationGateCopy,
      isPlaytestActive,
      postPlaytestStatus,
      refreshMessagesInbox: (options) => launcherApi?.refreshMessagesInbox?.(options) || [],
      refreshRankings: () => fetchRankings(),
      syncMobileNavigationState: () => launcherApi?.syncMobileNavigationState?.(),
      syncResponsiveUi,
      updateLobbyPlayerInfo: () => launcherApi?.updateLobbyPlayerInfo?.()
    },
    state,
    t
  });

  snackRushEntryController = snackRushRuntime.snackRushEntryController;
  snackRushResultController = snackRushRuntime.snackRushResultController;
  snackRushSessionController = snackRushRuntime.snackRushSessionController;

  cookingRuntime = createCookingRuntime();
  cookingEntryController = cookingRuntime.cookingEntryController;
}

const appBootHelpers = createAppBootHelpers({
  animate: (...args) => appRuntimeHelpers.animate(...args),
  applyNickname,
  clearSavedNickname,
  elements,
  fetchRankings,
  getGuestNickname: (...args) => appRuntimeHelpers.getGuestNickname(...args),
  getLang,
  getOrCreatePlayerId,
  hideGameResult,
  initAudio,
  initAuth,
  initI18n,
  installPlaytestBridge: (...args) => appRuntimeHelpers.installPlaytestBridge(...args),
  introBackgroundByLang: INTRO_BACKGROUND_BY_LANG,
  isPlaytestActive: (...args) => appRuntimeHelpers.isPlaytestActive(...args),
  launcherApiGetter: () => launcherApi,
  loadAssets,
  renderGuideImages,
  renderMessages,
  renderRankingList,
  setAuthMode,
  setRankingStatus,
  setStartButtonState,
  showIntroScreen,
  showLobbyScreen,
  snackRushRuntimeGetter: () => snackRushRuntime,
  startPlaytestStatusLoop: (...args) => appRuntimeHelpers.startPlaytestStatusLoop(...args),
  startPresenceTracking,
  startRankingPolling: (...args) => appRuntimeHelpers.startRankingPolling(...args),
  state,
  syncResponsiveUi: (...args) => appRuntimeHelpers.syncResponsiveUi(...args),
  t
});

function bindEvents() {
  elements.introForm.addEventListener("submit", (event) => {
    event.preventDefault();

    elements.introStartButton.disabled = true;
    try {
      applyNickname(getActiveNickname());
      showLobbyScreen();
      launcherApi?.updateLobbyPlayerInfo?.();
      ensureMusicEnabled();
      playLobbyMusic();
      syncResponsiveUi();
      void launcherApi?.refreshMessagesInbox?.({ triggerLobbyPrompt: true });
    } finally {
      elements.introStartButton.disabled = false;
    }
  });

  window.addEventListener("resize", syncResponsiveUi);
  window.addEventListener("orientationchange", syncResponsiveUi);
  if (isPlaytestActive()) {
    window.addEventListener("message", appRuntimeHelpers.handlePlaytestMessage);
  }
  document.addEventListener("visibilitychange", refreshRankingsInBackground);

  elements.musicToggleButton.addEventListener("click", () => {
    toggleMusic();
  });

  elements.settingsMusicToggleButton.addEventListener("click", () => {
    toggleMusic();
  });

  launcherApi?.bindEvents?.();
  cookingEntryController?.bindEvents?.();
  snackRushEntryController?.bindEvents();
  snackRushResultController?.bindEvents();
  snackRushSessionController?.bindEvents();
}

export async function boot() {
  if (booted) {
    return;
  }

  booted = true;
  initControllers();
  const activeGameBootPlan = appBootHelpers.createCurrentGameBootPlan();

  appBootHelpers.bootSharedRuntime();
  appBootHelpers.bootLauncher();
  appBootHelpers.bootSharedServices();
  bindEvents();
  appBootHelpers.registerLanguageChangeHandler({
    activeGameBootPlan,
    authModalState,
    getMessageList: () => profileModalState.messages || []
  });
  appBootHelpers.bootIntro();
  await appBootHelpers.bootCurrentGame(activeGameBootPlan);
  appBootHelpers.startBootRuntimeLoops();
}
