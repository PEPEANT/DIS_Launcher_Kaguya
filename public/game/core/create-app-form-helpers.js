export function createAppFormHelpers({
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
} = {}) {
  function clearAuthValidation() {
    elements.authConfirmInput.setCustomValidity("");
  }

  function setPasswordVisibility(target, visible) {
    const isVisible = Boolean(visible);
    const input = target === "confirm" ? elements.authConfirmInput : elements.authPasswordInput;
    const button = target === "confirm" ? elements.authConfirmToggleButton : elements.authPasswordToggleButton;

    input.type = isVisible ? "text" : "password";
    button.dataset.visible = String(isVisible);
    button.setAttribute("aria-label", isVisible ? t("auth.hidePassword") : t("auth.showPassword"));
  }

  function resetAuthVisibility() {
    authModalState.passwordVisible = false;
    authModalState.confirmVisible = false;
    setPasswordVisibility("password", false);
    setPasswordVisibility("confirm", false);
  }

  function setAuthNicknameStatus(text = "", tone = "info") {
    elements.authNicknameStatus.textContent = text;
    elements.authNicknameStatus.hidden = !text;

    if (!text) {
      delete elements.authNicknameStatus.dataset.tone;
      return;
    }

    elements.authNicknameStatus.dataset.tone = tone;
  }

  function resetAuthNicknameCheck() {
    authModalState.nicknameCheckedValue = "";
    authModalState.nicknameAvailable = false;
    setAuthNicknameStatus("");
  }

  async function runAuthNicknameCheck() {
    const requestedNickname = getRequestedAuthNickname();

    if (!requestedNickname) {
      setAuthNicknameStatus(getAuthNicknameRequiredMessage(), "error");
      elements.authNicknameInput.focus();
      return false;
    }

    try {
      const isAvailable = await isNicknameAvailable(requestedNickname);

      authModalState.nicknameCheckedValue = requestedNickname;
      authModalState.nicknameAvailable = isAvailable;

      if (!isAvailable) {
        setAuthNicknameStatus(getAuthNicknameTakenMessage(), "error");
        elements.authNicknameInput.focus();
        return false;
      }

      setAuthNicknameStatus(getAuthNicknameAvailableMessage(), "success");
      return true;
    } catch {
      resetAuthNicknameCheck();
      setAuthNicknameStatus(getAuthNicknameCheckFailedMessage(), "error");
      return false;
    }
  }

  function syncEmailDomainSelect() {
    const email = String(elements.authEmailInput.value || "").trim().toLowerCase();
    const [, domain = ""] = email.split("@");

    if (domain && [...elements.authEmailDomainSelect.options].some((option) => option.value === domain)) {
      elements.authEmailDomainSelect.value = domain;
      return;
    }

    elements.authEmailDomainSelect.value = "";
  }

  function applySelectedEmailDomain() {
    const domain = String(elements.authEmailDomainSelect.value || "").trim().toLowerCase();
    if (!domain) {
      return;
    }

    const currentEmail = String(elements.authEmailInput.value || "").trim();
    const [localPart = ""] = currentEmail.split("@");

    if (localPart) {
      elements.authEmailInput.value = `${localPart}@${domain}`;
      elements.authEmailInput.focus();
      return;
    }

    elements.authEmailInput.value = `@${domain}`;
    elements.authEmailInput.focus();
    elements.authEmailInput.setSelectionRange(0, 0);
  }

  function clearAuthStatusIfIdle() {
    if (!authModalState.busy) {
      setAuthStatus("");
    }
  }

  function resetAuthForm({ preserveEmail = true } = {}) {
    const currentEmail = preserveEmail ? elements.authEmailInput.value.trim() : "";
    elements.authForm.reset();
    elements.authEmailInput.value = currentEmail;
    syncEmailDomainSelect();
    elements.authNicknameInput.value = "";
    elements.authPasswordInput.value = "";
    elements.authConfirmInput.value = "";
    clearAuthValidation();
    resetAuthVisibility();
    resetAuthNicknameCheck();
  }

  function setAuthMode(mode = "login") {
    authModalState.mode = ["login", "signup", "reset"].includes(mode) ? mode : "login";
    clearAuthValidation();
    resetAuthNicknameCheck();
    setAuthModalMode(authModalState.mode);
    setAuthSubmitState({ busy: authModalState.busy, mode: authModalState.mode });
    setAuthStatus("");
  }

  function setProfileNicknameBusy(busy) {
    profileModalState.nicknameBusy = busy;
    elements.profileNicknameInput.disabled = busy;
    elements.profileNicknameSaveButton.disabled = busy;
    elements.profileNicknameCancelButton.disabled = busy;
    elements.profileNicknameEditButton.disabled = busy;
  }

  function setProfileNicknameEditing(editing, { focus = false } = {}) {
    profileModalState.editingNickname = Boolean(editing);
    elements.profileNicknameEditButton.hidden = profileModalState.editingNickname;
    elements.profileNicknameForm.hidden = !profileModalState.editingNickname;
    elements.profileNicknameInput.value = getMemberDisplayName(state.authUser) || state.nickname || "";
    setProfileNicknameBusy(profileModalState.nicknameBusy);

    if (profileModalState.editingNickname && focus) {
      requestAnimationFrame(() => {
        elements.profileNicknameInput.focus();
        elements.profileNicknameInput.select();
      });
    }
  }

  return {
    applySelectedEmailDomain,
    clearAuthStatusIfIdle,
    clearAuthValidation,
    resetAuthForm,
    resetAuthNicknameCheck,
    resetAuthVisibility,
    runAuthNicknameCheck,
    setAuthMode,
    setAuthNicknameStatus,
    setPasswordVisibility,
    setProfileNicknameBusy,
    setProfileNicknameEditing,
    syncEmailDomainSelect
  };
}
