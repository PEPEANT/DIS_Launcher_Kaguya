import { ensureMusicEnabled, initAudio, playLobbyMusic, toggleMusic } from "./audio.js";
import { isLandscapeTouchViewport, isPortraitTouchViewport, isTouchDevice } from "./device.js";
import { elements } from "./dom.js";
import { getLang, initI18n, t } from "./i18n.js";
import { renderFrame } from "./render.js";
import {
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
  setAuthSubmitState,
  setLobbyChatComposerState,
  setLobbyChatStatus,
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
} from "./ui.js";

export function createCoreRuntime() {
  return {
    audio: {
      ensureMusicEnabled,
      initAudio,
      playLobbyMusic,
      toggleMusic
    },
    device: {
      isLandscapeTouchViewport,
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
      setAuthSubmitState,
      setLobbyChatComposerState,
      setLobbyChatStatus,
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
  };
}
