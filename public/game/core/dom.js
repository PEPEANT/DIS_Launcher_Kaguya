function repairBrokenLobbyMarkup() {
  const mobileShopButton = document.getElementById("mobileShopButton");
  if (mobileShopButton && mobileShopButton.dataset.i18n === "mobileNav.shop") {
    const currentLabel = String(mobileShopButton.textContent || "").trim();
    if (!currentLabel || currentLabel === "Chat" || currentLabel.includes("?")) {
      mobileShopButton.textContent = "\uC0C1\uC810";
    }
  }

  const shopBackButton = document.querySelector(".launcher-shop-panel .panel-back-button");
  if (shopBackButton) {
    shopBackButton.id = "shopBackButton";
  }

  const chatBackButton = document.querySelector(".lobby-chat-panel .panel-back-button");
  if (chatBackButton) {
    chatBackButton.id = "chatBackButton";
  }

  document.getElementById("buySkinBButton")?.replaceChildren("\uC900\uBE44\uC911");
  document.getElementById("buySkinCButton")?.replaceChildren("\uC900\uBE44\uC911");
}

repairBrokenLobbyMarkup();
export const elements = {
  body: document.body,
  introScreen: document.getElementById("introScreen"),
  introBackgroundImage: document.getElementById("introBackgroundImage"),
  introForm: document.getElementById("introForm"),
  introStartButton: document.getElementById("introStartButton"),
  introAuthActions: document.getElementById("introAuthActions"),
  introAuthState: document.getElementById("introAuthState"),
  introLoginButton: document.getElementById("introLoginButton"),
  lobbyScreen: document.getElementById("lobbyScreen"),
  launcherHome: document.getElementById("launcherHome"),
  snackRushEntryScreen: document.getElementById("snackRushEntryScreen"),
  gameScreen: document.getElementById("gameScreen"),
  snackRushPrestartOverlay: document.getElementById("snackRushPrestartOverlay"),
  snackRushPrestartBackButton: document.getElementById("snackRushPrestartBackButton"),
  musicToggleButton: document.getElementById("musicToggleButton"),
  settingsMusicToggleButton: document.getElementById("settingsMusicToggleButton"),
  accountCard: document.getElementById("accountCard"),
  lobbyRouteLabel: document.getElementById("lobbyRouteLabel"),
  lobbyRouteBadge: document.getElementById("lobbyRouteBadge"),
  canvas: document.getElementById("gameCanvas"),
  overlay: document.getElementById("gameOverlay"),
  overlayEyebrow: document.getElementById("overlayEyebrow"),
  overlayTitle: document.getElementById("overlayTitle"),
  resultNotice: document.getElementById("resultNotice"),
  lobbyNicknameDisplay: document.getElementById("lobbyNicknameDisplay"),
  lobbyRankDisplay: document.getElementById("lobbyRankDisplay"),
  hujupayCard: document.getElementById("hujupayCard"),
  hujupayBalanceDisplay: document.getElementById("hujupayBalanceDisplay"),
  authModeBadge: document.getElementById("authModeBadge"),
  authDisplayName: document.getElementById("authDisplayName"),
  authSummaryText: document.getElementById("authSummaryText"),
  desktopHujupayBalance: document.getElementById("desktopHujupayBalance"),
  desktopMessagesButton: document.getElementById("desktopMessagesButton"),
  profileInfoButton: document.getElementById("profileInfoButton"),
  lobbyLoginButton: document.getElementById("lobbyLoginButton"),
  openSnackRushEntryButton: document.getElementById("openSnackRushEntryButton"),
  snackRushEntryBackButton: document.getElementById("snackRushEntryBackButton"),
  startForm: document.getElementById("startForm"),
  startButton: document.getElementById("startButton"),
  heroGuideButton: document.getElementById("heroGuideButton"),
  snackRushGuideButton: document.getElementById("snackRushGuideButton"),
  nicknameInput: document.getElementById("nicknameInput"),
  openGuideButton: document.getElementById("openGuideButton"),
  mobileHomeButton: document.getElementById("mobileHomeButton"),
  mobileShopButton: document.getElementById("mobileShopButton"),
  mobileChatButton: document.getElementById("mobileChatButton"),
  mobileAccountButton: document.getElementById("mobileAccountButton"),
  mobileSettingsButton: document.getElementById("mobileSettingsButton"),
  shopBackButton: document.querySelector(".launcher-shop-panel .panel-back-button"),
  chatBackButton: document.querySelector(".lobby-chat-panel .panel-back-button"),
  chatGuestGate: document.getElementById("chatGuestGate"),
  chatLoginButton: document.getElementById("chatLoginButton"),
  chatStatus: document.getElementById("chatStatus"),
  chatMessageList: document.getElementById("chatMessageList"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  chatSendButton: document.getElementById("chatSendButton"),
  shopBalanceDisplay: document.getElementById("shopBalanceDisplay"),
  shopGuestGate: document.getElementById("shopGuestGate"),
  shopSkinList: document.getElementById("shopSkinList"),
  equipSkin0Button: document.getElementById("equipSkin0Button"),
  buySkinBButton: document.getElementById("buySkinBButton"),
  buySkinCButton: document.getElementById("buySkinCButton"),
  guideModal: document.getElementById("guideModal"),
  closeGuideModalButton: document.getElementById("closeGuideModalButton"),
  restartButton: document.getElementById("restartButton"),
  lobbyButton: document.getElementById("lobbyButton"),
  finalScoreValue: document.getElementById("finalScoreValue"),
  finalRankValue: document.getElementById("finalRankValue"),
  rankingStatus: document.getElementById("rankingStatus"),
  rankingList: document.getElementById("rankingList"),
  rankingSelfCard: document.getElementById("rankingSelfCard"),
  rankingSelfName: document.getElementById("rankingSelfName"),
  rankingSelfRank: document.getElementById("rankingSelfRank"),
  refreshRankingButton: document.getElementById("refreshRankingButton"),
  viewAllRankingsButton: document.getElementById("viewAllRankingsButton"),
  rankingViewAllBottomButton: document.getElementById("rankingViewAllBottomButton"),
  allRankingsModal: document.getElementById("allRankingsModal"),
  allRankingsTitle: document.getElementById("allRankingsTitle"),
  closeAllRankingsButton: document.getElementById("closeAllRankingsButton"),
  allRankingsStatus: document.getElementById("allRankingsStatus"),
  allRankingsList: document.getElementById("allRankingsList"),
  allRankingsFooter: document.getElementById("allRankingsFooter"),
  toggleAllRankingsButton: document.getElementById("toggleAllRankingsButton"),
  seasonTab1: document.getElementById("seasonTab1"),
  seasonTab2: document.getElementById("seasonTab2"),
  authModal: document.getElementById("authModal"),
  closeAuthModalButton: document.getElementById("closeAuthModalButton"),
  authModalTitle: document.getElementById("authModalTitle"),
  authLoginTab: document.getElementById("authLoginTab"),
  authSignupTab: document.getElementById("authSignupTab"),
  authForm: document.getElementById("authForm"),
  authEmailInput: document.getElementById("authEmailInput"),
  authEmailDomainSelect: document.getElementById("authEmailDomainSelect"),
  authNicknameField: document.getElementById("authNicknameField"),
  authNicknameInput: document.getElementById("authNicknameInput"),
  authNicknameCheckButton: document.getElementById("authNicknameCheckButton"),
  authNicknameStatus: document.getElementById("authNicknameStatus"),
  authPasswordField: document.getElementById("authPasswordField"),
  authPasswordInput: document.getElementById("authPasswordInput"),
  authPasswordToggleButton: document.getElementById("authPasswordToggleButton"),
  authConfirmField: document.getElementById("authConfirmField"),
  authConfirmInput: document.getElementById("authConfirmInput"),
  authConfirmToggleButton: document.getElementById("authConfirmToggleButton"),
  authStatus: document.getElementById("authStatus"),
  authSubmitButton: document.getElementById("authSubmitButton"),
  authSwitchRow: document.getElementById("authSwitchRow"),
  authResetPasswordButton: document.getElementById("authResetPasswordButton"),
  authHelp: document.getElementById("authHelp"),
  authModeSwitchButton: document.getElementById("authModeSwitchButton"),
  profileModal: document.getElementById("profileModal"),
  closeProfileModalButton: document.getElementById("closeProfileModalButton"),
  profileStatus: document.getElementById("profileStatus"),
  profileAccountName: document.getElementById("profileAccountName"),
  profileAccountSummary: document.getElementById("profileAccountSummary"),
  profileHujupayBalance: document.getElementById("profileHujupayBalance"),
  profileHujupaySummary: document.getElementById("profileHujupaySummary"),
  profileMessagesButton: document.getElementById("profileMessagesButton"),
  profileNicknameEditButton: document.getElementById("profileNicknameEditButton"),
  profileLogoutButton: document.getElementById("profileLogoutButton"),
  profileNicknameForm: document.getElementById("profileNicknameForm"),
  profileNicknameInput: document.getElementById("profileNicknameInput"),
  profileNicknameSaveButton: document.getElementById("profileNicknameSaveButton"),
  profileNicknameCancelButton: document.getElementById("profileNicknameCancelButton"),
  profileCurrentSeasonRecord: document.getElementById("profileCurrentSeasonRecord"),
  profileSeason1Period: document.getElementById("profileSeason1Period"),
  profileSeason1Record: document.getElementById("profileSeason1Record"),
  profileSeason1TopList: document.getElementById("profileSeason1TopList"),
  messagesModal: document.getElementById("messagesModal"),
  closeMessagesModalButton: document.getElementById("closeMessagesModalButton"),
  messagesStatus: document.getElementById("messagesStatus"),
  messagesList: document.getElementById("messagesList"),
  messageArrivalModal: document.getElementById("messageArrivalModal"),
  messageArrivalTitle: document.getElementById("messageArrivalTitle"),
  messageArrivalBody: document.getElementById("messageArrivalBody"),
  messageArrivalConfirmButton: document.getElementById("messageArrivalConfirmButton"),
  messageArrivalCloseButton: document.getElementById("messageArrivalCloseButton"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsModalButton: document.getElementById("closeSettingsModalButton"),
  mobileControls: document.getElementById("mobileControls"),
  moveLeftButton: document.getElementById("moveLeftButton"),
  moveRightButton: document.getElementById("moveRightButton"),
  duckButton: document.getElementById("duckButton"),
  duckButtonCooldown: document.getElementById("duckButtonCooldown"),
  jumpButton: document.getElementById("jumpButton"),
  orientationGate: document.getElementById("orientationGate"),
  orientationEyebrow: document.getElementById("orientationEyebrow"),
  orientationTitle: document.getElementById("orientationTitle"),
  orientationBody: document.getElementById("orientationBody"),
  guideImages: [...document.querySelectorAll("[data-guide-item]")]
};

Object.assign(elements, {
  openCookingEntryButton: document.getElementById("openCookingEntryButton"),
  cookingEntryScreen: document.getElementById("cookingEntryScreen"),
  cookingEntryBackButton: document.getElementById("cookingEntryBackButton"),
  cookingStartButton: document.getElementById("cookingStartButton"),
  cookingEntryStatus: document.getElementById("cookingEntryStatus")
});

const launcherGameTileButtons = [...document.querySelectorAll("[data-game-launch]")];
const gameEntryScreens = [...document.querySelectorAll("[data-game-entry-screen]")];
const gameEntryBackButtons = [...document.querySelectorAll("[data-game-entry-back]")];

elements.launcher = {
  home: elements.launcherHome,
  gameTileButtons: launcherGameTileButtons,
  gameTileButtonsById: Object.fromEntries(
    launcherGameTileButtons
      .map((button) => [button.dataset.gameId || "", button])
      .filter(([gameId]) => Boolean(gameId))
  ),
  gameEntryBackButtons,
  panels: {
    chat: document.querySelector(".lobby-chat-panel")
  }
};

elements.games = {
  entryScreens: gameEntryScreens,
  entryScreensById: Object.fromEntries(
    gameEntryScreens
      .map((screen) => [screen.dataset.gameEntryScreen || "", screen])
      .filter(([gameId]) => Boolean(gameId))
  ),
  snackRush: {
    entryScreen: elements.snackRushEntryScreen,
    entryBackButton: elements.snackRushEntryBackButton,
    prestartOverlay: elements.snackRushPrestartOverlay,
    prestartBackButton: elements.snackRushPrestartBackButton,
    rankingCard: document.querySelector("#snackRushPrestartOverlay .snack-rush-ranking-panel"),
    startButton: elements.startButton,
    startForm: elements.startForm
  },
  cooking: {
    entryScreen: elements.cookingEntryScreen,
    entryBackButton: elements.cookingEntryBackButton,
    startButton: elements.cookingStartButton,
    status: elements.cookingEntryStatus
  }
};

