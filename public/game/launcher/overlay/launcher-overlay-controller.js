import { elements } from "../../core/dom.js";

export function createLauncherOverlayController({
  authMinPasswordLength,
  authModalState,
  applySelectedEmailDomain,
  canOpenMessagesInbox,
  clearAuthStatusIfIdle,
  clearAuthValidation,
  closeLobbyRewardMessagePrompt,
  closeMessagesModal,
  closeProfileModal,
  closeSettingsModal,
  closeAuthModal,
  ensureMusicEnabled,
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
  isLoggedIn,
  isNicknameAvailable,
  loadMessagesInbox,
  loadProfileInfo,
  openAuthModal,
  openMessagesModal,
  openProfileModal,
  openSettingsModal,
  playLobbyMusic,
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
  syncAuthenticatedAccount,
  syncEmailDomainSelect,
  syncMobileNavigationState
}) {
  function hideAuthDialog({ reset = true } = {}) {
    authModalState.busy = false;
    setAuthSubmitState({ busy: false, mode: authModalState.mode });
    closeAuthModal();
    if (reset) {
      resetAuthForm({ preserveEmail: false });
    }
  }

  function hideProfileDialog() {
    closeProfileModal();
  }

  function hideMessagesDialog() {
    closeMessagesModal();
  }

  function hideSettingsDialog() {
    closeSettingsModal();
  }

  function resetOverlayState({ keep = null, closeRewardPrompt = false, markRewardPrompt = false } = {}) {
    if (keep !== "auth") {
      hideAuthDialog();
    }
    if (keep !== "profile") {
      hideProfileDialog();
    }
    if (keep !== "messages") {
      hideMessagesDialog();
    }
    if (keep !== "settings") {
      hideSettingsDialog();
    }
    if (closeRewardPrompt) {
      closeLobbyRewardMessagePrompt({ markAlerted: markRewardPrompt });
    }
  }

  function closeAuthDialog() {
    hideAuthDialog();
    syncMobileNavigationState();
  }

  function closeProfileDialog() {
    hideProfileDialog();
    syncMobileNavigationState();
  }

  function closeMessagesDialog() {
    hideMessagesDialog();
    syncMobileNavigationState();
  }

  function closeSettingsDialog() {
    hideSettingsDialog();
    syncMobileNavigationState();
  }

  function closeLobbyOverlays() {
    resetOverlayState({ closeRewardPrompt: true });
    syncMobileNavigationState();
  }

  function openAuthDialog(mode = "login") {
    setAuthMode(mode);
    resetAuthForm({ preserveEmail: true });
    resetOverlayState({ keep: "auth", closeRewardPrompt: true });
    openAuthModal();
    syncMobileNavigationState();
    requestAnimationFrame(() => {
      elements.authEmailInput.focus();
    });
  }

  async function openProfileDialog() {
    if (!isLoggedIn()) {
      openAuthDialog("login");
      return false;
    }

    resetOverlayState({ keep: "profile", closeRewardPrompt: true });
    openProfileModal();
    syncMobileNavigationState();
    await loadProfileInfo?.();
    return true;
  }

  async function openMessagesDialog({ markRewardPrompt = true } = {}) {
    if (!canOpenMessagesInbox?.()) {
      return false;
    }

    if (!isLoggedIn()) {
      openAuthDialog("login");
      return false;
    }

    resetOverlayState({ keep: "messages", closeRewardPrompt: true, markRewardPrompt });
    openMessagesModal();
    syncMobileNavigationState();
    await loadMessagesInbox?.();
    return true;
  }

  function openSettingsDialog() {
    resetOverlayState({ keep: "settings", closeRewardPrompt: true });
    openSettingsModal();
    syncMobileNavigationState();
  }

  async function handleAuthSubmit() {
    if (authModalState.busy) {
      return;
    }

    const email = elements.authEmailInput.value.trim();
    const requestedNickname = getRequestedAuthNickname();
    const password = elements.authPasswordInput.value;
    const confirmPassword = elements.authConfirmInput.value;

    clearAuthValidation();
    setAuthStatus("");

    if (authModalState.mode === "reset") {
      if (!email) {
        setAuthStatus(getResetPasswordPromptMessage(), "error");
        elements.authEmailInput.focus();
        return;
      }

      authModalState.busy = true;
      setAuthSubmitState({ busy: true, mode: authModalState.mode });

      try {
        await sendPasswordResetLink(email);
        setAuthStatus(getResetPasswordSentMessage(email), "success");
      } catch (error) {
        setAuthStatus(getResetAuthErrorMessage(error), "error");
      } finally {
        authModalState.busy = false;
        setAuthSubmitState({ busy: false, mode: authModalState.mode });
      }
      return;
    }

    if (authModalState.mode === "signup") {
      if (!requestedNickname) {
        setAuthStatus(getAuthNicknameRequiredMessage(), "error");
        elements.authNicknameInput.focus();
        return;
      }

      if (!authModalState.nicknameAvailable || authModalState.nicknameCheckedValue !== requestedNickname) {
        setAuthNicknameStatus(getAuthNicknameNeedsCheckMessage(), "error");
        elements.authNicknameCheckButton.focus();
        return;
      }

      if (password.length < authMinPasswordLength) {
        setAuthStatus(getPasswordTooShortMessage(), "error");
        return;
      }

      if (password !== confirmPassword) {
        const mismatchMessage = getPasswordMismatchMessage();
        elements.authConfirmInput.setCustomValidity(mismatchMessage);
        elements.authConfirmInput.reportValidity();
        setAuthStatus(mismatchMessage, "error");
        return;
      }

      try {
        const isAvailable = await isNicknameAvailable(requestedNickname);

        if (!isAvailable) {
          authModalState.nicknameAvailable = false;
          setAuthStatus(getAuthNicknameTakenMessage(), "error");
          setAuthNicknameStatus(getAuthNicknameTakenMessage(), "error");
          elements.authNicknameInput.focus();
          return;
        }
      } catch {
        setAuthStatus(getAuthNicknameCheckFailedMessage(), "error");
        return;
      }
    }

    authModalState.busy = true;
    setAuthSubmitState({ busy: true, mode: authModalState.mode });

    try {
      if (authModalState.mode === "signup") {
        await signUpWithEmail({
          email,
          password,
          nickname: requestedNickname
        });
      } else {
        await signInWithEmail({ email, password });
      }

      await syncAuthenticatedAccount();
      closeAuthDialog();
    } catch (error) {
      setAuthStatus(getAuthErrorMessage(error), "error");
    } finally {
      authModalState.busy = false;
      setAuthSubmitState({ busy: false, mode: authModalState.mode });
    }
  }

  function bindEvents() {
    elements.authEmailInput.addEventListener("input", () => {
      syncEmailDomainSelect();
      clearAuthStatusIfIdle();
    });

    elements.authEmailDomainSelect.addEventListener("change", () => {
      applySelectedEmailDomain();
      clearAuthStatusIfIdle();
    });

    elements.authNicknameInput.addEventListener("input", () => {
      resetAuthNicknameCheck();
      clearAuthStatusIfIdle();
    });

    elements.authPasswordInput.addEventListener("input", clearAuthStatusIfIdle);

    elements.authConfirmInput.addEventListener("input", () => {
      clearAuthValidation();
      clearAuthStatusIfIdle();
    });

    elements.introLoginButton.addEventListener("click", () => {
      if (isLoggedIn()) {
        void handleSignOut();
        return;
      }

      ensureMusicEnabled();
      playLobbyMusic();
      openAuthDialog("login");
    });

    elements.lobbyLoginButton.addEventListener("click", () => {
      if (isLoggedIn()) {
        void handleSignOut();
        return;
      }

      openAuthDialog("login");
    });

    elements.profileInfoButton.addEventListener("click", () => {
      void openProfileDialog();
    });

    elements.profileMessagesButton.addEventListener("click", () => {
      void openMessagesDialog();
    });

    elements.desktopMessagesButton?.addEventListener("click", () => {
      void openMessagesDialog();
    });

    elements.closeAuthModalButton.addEventListener("click", () => {
      closeAuthDialog();
    });

    elements.authModal.addEventListener("click", (event) => {
      if (event.target === elements.authModal) {
        closeAuthDialog();
      }
    });

    elements.closeProfileModalButton.addEventListener("click", () => {
      closeProfileDialog();
    });

    elements.profileModal.addEventListener("click", (event) => {
      if (event.target === elements.profileModal) {
        closeProfileDialog();
      }
    });

    elements.closeMessagesModalButton.addEventListener("click", () => {
      closeMessagesDialog();
    });

    elements.messagesModal.addEventListener("click", (event) => {
      if (event.target === elements.messagesModal) {
        closeMessagesDialog();
      }
    });

    elements.messageArrivalConfirmButton?.addEventListener("click", () => {
      void openMessagesDialog({ markRewardPrompt: true });
    });

    elements.messageArrivalCloseButton?.addEventListener("click", () => {
      closeLobbyRewardMessagePrompt({ markAlerted: true });
    });

    elements.messageArrivalModal?.addEventListener("click", (event) => {
      if (event.target === elements.messageArrivalModal) {
        closeLobbyRewardMessagePrompt({ markAlerted: true });
      }
    });

    elements.closeSettingsModalButton.addEventListener("click", () => {
      closeSettingsDialog();
    });

    elements.settingsModal.addEventListener("click", (event) => {
      if (event.target === elements.settingsModal) {
        closeSettingsDialog();
      }
    });

    elements.authLoginTab.addEventListener("click", () => {
      if (authModalState.mode === "login") {
        return;
      }

      setAuthMode("login");
    });

    elements.authSignupTab.addEventListener("click", () => {
      if (authModalState.mode === "signup") {
        return;
      }

      setAuthMode("signup");
    });

    elements.authModeSwitchButton.addEventListener("click", () => {
      setAuthMode(authModalState.mode === "signup" ? "login" : (authModalState.mode === "reset" ? "login" : "signup"));
    });

    elements.authNicknameCheckButton.addEventListener("click", async () => {
      if (authModalState.busy || authModalState.mode !== "signup") {
        return;
      }

      await runAuthNicknameCheck();
    });

    elements.authPasswordToggleButton.addEventListener("click", () => {
      authModalState.passwordVisible = !authModalState.passwordVisible;
      setPasswordVisibility("password", authModalState.passwordVisible);
    });

    elements.authConfirmToggleButton.addEventListener("click", () => {
      authModalState.confirmVisible = !authModalState.confirmVisible;
      setPasswordVisibility("confirm", authModalState.confirmVisible);
    });

    elements.authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleAuthSubmit();
    });

    elements.authResetPasswordButton.addEventListener("click", async () => {
      if (authModalState.busy) {
        return;
      }

      setAuthMode("reset");
      elements.authPasswordInput.value = "";
      elements.authConfirmInput.value = "";
      elements.authEmailInput.focus();
    });
  }

  return {
    bindEvents,
    closeAuthDialog,
    closeLobbyOverlays,
    closeMessagesDialog,
    closeProfileDialog,
    closeSettingsDialog,
    openAuthDialog,
    openMessagesDialog,
    openProfileDialog,
    openSettingsDialog
  };
}
