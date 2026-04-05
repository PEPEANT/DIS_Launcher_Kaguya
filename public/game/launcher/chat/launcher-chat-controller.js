import { elements } from "../../core/dom.js";

export function createLauncherChatController({
  chatCooldownMs,
  getActiveNickname,
  getChatFailedText,
  getChatLoadingText,
  getChatLoginRequiredText,
  getCurrentUid,
  lobbyChatState,
  openAuthDialog,
  renderLobbyChatMessages,
  sendLobbyChatMessage,
  setLobbyChatComposerState,
  setLobbyChatStatus,
  subscribeLobbyChat,
  t
}) {
  function getLobbyChatCooldownLabel(seconds) {
    return t("chat.cooldown").replace("{seconds}", String(Math.max(0, seconds)));
  }

  function setLobbyChatFeedback(text = "", tone = "info") {
    lobbyChatState.statusText = text;
    lobbyChatState.statusTone = tone;
    setLobbyChatStatus(text, tone);
  }

  function requestLoginGate() {
    setLobbyChatFeedback(getChatLoginRequiredText(), "error");
    openAuthDialog("login");
  }

  function renderLobbyChatFromState() {
    renderLobbyChatMessages(lobbyChatState.messages, {
      currentUid: getCurrentUid()
    });
  }

  function clearLobbyChatCooldownTimer() {
    if (lobbyChatState.cooldownTimerId) {
      window.clearTimeout(lobbyChatState.cooldownTimerId);
      lobbyChatState.cooldownTimerId = 0;
    }
  }

  function scheduleLobbyChatComposerRefresh() {
    clearLobbyChatCooldownTimer();

    const remainingMs = lobbyChatState.cooldownUntil - Date.now();
    if (remainingMs <= 0) {
      return;
    }

    lobbyChatState.cooldownTimerId = window.setTimeout(() => {
      syncLobbyChatComposerState();
      scheduleLobbyChatComposerRefresh();
    }, Math.min(remainingMs, 250));
  }

  function syncLobbyChatComposerState() {
    if (!elements.chatInput || !elements.chatSendButton) {
      return;
    }

    const isLoggedIn = Boolean(getCurrentUid());
    const cooldownSeconds = Math.max(0, Math.ceil((lobbyChatState.cooldownUntil - Date.now()) / 1000));
    const hasText = Boolean(String(elements.chatInput.value || "").trim());

    if (elements.chatGuestGate) {
      elements.chatGuestGate.hidden = isLoggedIn;
    }

    let placeholder = isLoggedIn ? t("chat.placeholder") : t("chat.loginPlaceholder");
    let buttonLabel = t("chat.send");
    let inputDisabled = !isLoggedIn;
    let sendDisabled = !isLoggedIn || !hasText;

    if (lobbyChatState.sending) {
      buttonLabel = t("chat.sending");
      inputDisabled = true;
      sendDisabled = true;
    } else if (cooldownSeconds > 0) {
      buttonLabel = getLobbyChatCooldownLabel(cooldownSeconds);
      sendDisabled = true;
    }

    setLobbyChatComposerState({
      inputDisabled,
      sendDisabled,
      placeholder,
      buttonLabel
    });
  }

  function stopLobbyChatSubscription() {
    if (typeof lobbyChatState.unsubscribe === "function") {
      lobbyChatState.unsubscribe();
    }

    lobbyChatState.unsubscribe = null;
  }

  function syncLobbyChatUi({ clearInput = false, clearFeedback = false } = {}) {
    if (clearInput && elements.chatInput) {
      elements.chatInput.value = "";
    }
    if (clearFeedback) {
      setLobbyChatFeedback("");
    }
    renderLobbyChatFromState();
    syncLobbyChatComposerState();
  }

  function startLobbyChatSubscription() {
    if (!elements.chatMessageList) {
      return;
    }

    stopLobbyChatSubscription();
    setLobbyChatFeedback(getChatLoadingText());

    try {
      lobbyChatState.unsubscribe = subscribeLobbyChat({
        onMessages(messages) {
          lobbyChatState.messages = messages;
          renderLobbyChatFromState();
          setLobbyChatFeedback("");
        },
        onError(error) {
          console.warn("Failed to subscribe to lobby chat.", error);
          setLobbyChatFeedback(getChatFailedText(), "error");
        }
      });
    } catch (error) {
      console.warn("Lobby chat is unavailable.", error);
      setLobbyChatFeedback(getChatFailedText(), "error");
    }
  }

  async function handleLobbyChatSubmit() {
    if (!elements.chatInput) {
      return;
    }

    const uid = getCurrentUid();
    if (!uid) {
      requestLoginGate();
      return;
    }

    const text = String(elements.chatInput.value || "").trim();
    if (!text || lobbyChatState.sending || lobbyChatState.cooldownUntil > Date.now()) {
      syncLobbyChatComposerState();
      return;
    }

    lobbyChatState.sending = true;
    syncLobbyChatComposerState();

    try {
      await sendLobbyChatMessage({
        uid,
        nickname: getActiveNickname(),
        text
      });
      elements.chatInput.value = "";
      lobbyChatState.cooldownUntil = Date.now() + chatCooldownMs;
      setLobbyChatFeedback("");
    } catch (error) {
      console.warn("Failed to send lobby chat message.", error);
      setLobbyChatFeedback(getChatFailedText(), "error");
    } finally {
      lobbyChatState.sending = false;
      syncLobbyChatComposerState();
      scheduleLobbyChatComposerRefresh();
    }
  }

  function boot() {
    startLobbyChatSubscription();
    syncLobbyChatComposerState();
  }

  function handleLanguageChange() {
    renderLobbyChatFromState();
    if (lobbyChatState.statusText) {
      setLobbyChatStatus(lobbyChatState.statusText, lobbyChatState.statusTone);
    }
    syncLobbyChatComposerState();
  }

  function handleLauncherPanelChange() {
    syncLobbyChatUi();
  }

  function bindEvents() {
    elements.chatInput?.addEventListener("input", () => {
      setLobbyChatFeedback("");
      syncLobbyChatComposerState();
    });

    elements.chatInput?.addEventListener("focus", () => {
      if (!getCurrentUid()) {
        requestLoginGate();
      }
    });

    elements.chatLoginButton?.addEventListener("click", () => {
      openAuthDialog("login");
    });

    elements.chatForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleLobbyChatSubmit();
    });
  }

  return {
    bindEvents,
    boot,
    handleLanguageChange,
    handleLauncherPanelChange,
    syncLobbyChatUi,
    syncLobbyChatComposerState
  };
}
