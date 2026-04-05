import { elements } from "../../../core/dom.js";
import { openGuideModal, setLobbyMobilePanel, setMobileNavState, showGameEntryScreen, showLobbyScreen } from "../../../core/ui.js";

export function createLauncherController({
  closeLobbyOverlays,
  defaultGameId,
  gameDefinitions,
  openGamePrestart,
  refreshGameEntry,
  openProfileInfo,
  openSettingsDialog,
  handleChatPanelChange,
  syncResponsiveUi
}) {
  let currentGameId = defaultGameId;

  function getGameDefinition(gameId = currentGameId) {
    return gameDefinitions[gameId] || gameDefinitions[defaultGameId];
  }

  function syncMobileNavigationState() {
    if (elements.settingsModal && !elements.settingsModal.hidden) {
      setMobileNavState("settings");
      return;
    }

    if (
      (elements.profileModal && !elements.profileModal.hidden)
      || (elements.messagesModal && !elements.messagesModal.hidden)
      || (elements.authModal && !elements.authModal.hidden)
    ) {
      setMobileNavState("account");
      return;
    }

    const mobilePanel = elements.lobbyScreen?.dataset.mobilePanel || "none";
    if (mobilePanel === "chat") {
      setMobileNavState("chat");
      return;
    }

    const lobbyView = elements.lobbyScreen?.dataset.lobbyView || "home";
    if (lobbyView === "game-entry") {
      const activeGame = getGameDefinition(elements.lobbyScreen?.dataset.entryGame || currentGameId);
      setMobileNavState("home", { labelText: activeGame.routeLabel });
      return;
    }

    if (lobbyView === "chat") {
      setMobileNavState("chat");
      return;
    }

    setMobileNavState("home");
  }

  function openGameEntry(gameId = defaultGameId, { refreshRankings = true } = {}) {
    currentGameId = gameId;
    const activeGame = getGameDefinition(gameId);
    closeLobbyOverlays();

    if (activeGame.entrySurface === "game-prestart") {
      openGamePrestart?.(activeGame.id, { refreshRankings });
      return;
    }

    showGameEntryScreen({
      gameId: activeGame.id,
      mobilePanel: "none"
    });
    syncMobileNavigationState();
    syncResponsiveUi();
    refreshGameEntry?.(activeGame.id, { refreshRankings });
  }

  function openLauncherHome() {
    closeLobbyOverlays();
    showLobbyScreen({ view: "home", mobilePanel: "none" });
    syncMobileNavigationState();
    syncResponsiveUi();
  }

  function openChatPanel() {
    closeLobbyOverlays();
    showLobbyScreen({ view: "chat", mobilePanel: "chat" });
    handleChatPanelChange?.();
    syncMobileNavigationState();
  }

  function openAccountPanel() {
    closeLobbyOverlays();
    setLobbyMobilePanel("none");
    void openProfileInfo();
  }

  function openSettingsPanel() {
    closeLobbyOverlays();
    setLobbyMobilePanel("none");
    openSettingsDialog();
  }

  function closeChatPanel() {
    setLobbyMobilePanel("none");
    handleChatPanelChange?.();
    syncMobileNavigationState();
  }

  function bindEvents() {
    elements.launcher?.gameTileButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        openGameEntry(button.dataset.gameId || defaultGameId);
      });
    });

    elements.openGuideButton?.addEventListener("click", () => {
      openGameEntry(defaultGameId);
      openGuideModal();
    });

    elements.heroGuideButton?.addEventListener("click", () => {
      openGuideModal();
    });

    elements.mobileHomeButton?.addEventListener("click", () => {
      openLauncherHome();
    });

    elements.mobileChatButton?.addEventListener("click", () => {
      openChatPanel();
    });

    elements.mobileAccountButton?.addEventListener("click", () => {
      openAccountPanel();
    });

    elements.mobileSettingsButton?.addEventListener("click", () => {
      openSettingsPanel();
    });

    elements.chatBackButton?.addEventListener("click", () => {
      closeChatPanel();
    });

    elements.launcher?.gameEntryBackButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        openLauncherHome();
      });
    });
  }

  return {
    bindEvents,
    openGameEntry,
    openLauncherHome,
    syncMobileNavigationState
  };
}
