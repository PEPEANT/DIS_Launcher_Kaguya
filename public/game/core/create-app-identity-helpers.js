export function createAppIdentityHelpers({
  buildGuestNickname,
  checkNicknameAvailabilityFromProvider,
  elements,
  getLang,
  getSignOutFailedMessage,
  launcherApiGetter,
  normalizeName,
  postPlaytestStatus,
  signOutCurrentUser,
  state
} = {}) {
  function getGuestNickname() {
    return buildGuestNickname(state.playerId, getLang());
  }

  function getOrientationGateCopy(mode = "game") {
    switch (mode) {
      case "start":
        switch (getLang()) {
          case "ja":
            return {
              eyebrow: "Loading",
              title: "Rotate to Continue",
              body: "\u7AEF\u672B\u3092\u6A2A\u5411\u304D\u306B\u3059\u308B\u3068\u3001\u30B9\u30BF\u30FC\u30C8\u753B\u9762\u304C\u958B\u304D\u307E\u3059\u3002\u305D\u306E\u5F8C\u306B Start \u3092\u62BC\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
            };
          case "en":
            return {
              eyebrow: "Loading",
              title: "Rotate to Continue",
              body: "Turn your device to landscape to open the start screen, then tap Start to begin."
            };
          default:
            return {
              eyebrow: "Loading",
              title: "\uAC00\uB85C\uB85C \uB3CC\uB824 \uACC4\uC18D\uD574\uC8FC\uC138\uC694",
              body: "\uAE30\uAE30\uB97C \uAC00\uB85C\uB85C \uB3CC\uB9AC\uBA74 \uC2DC\uC791 \uD654\uBA74\uC774 \uC5F4\uB9BD\uB2C8\uB2E4. \uADF8 \uB2E4\uC74C Start \uBC84\uD2BC\uC744 \uB20C\uB7EC \uAC8C\uC784\uC744 \uC2DC\uC791\uD574\uC8FC\uC138\uC694."
            };
        }
      case "portrait":
        switch (getLang()) {
          case "ja":
            return {
              eyebrow: "Portrait",
              title: "Use Portrait Here",
              body: "Login and lobby screens work in portrait. The game switches to landscape after you start playing."
            };
          case "en":
            return {
              eyebrow: "Portrait",
              title: "Use Portrait Here",
              body: "Login and lobby screens work in portrait. The game switches to landscape after you start playing."
            };
          default:
            return {
              eyebrow: "Portrait",
              title: "\uC138\uB85C\uB85C \uC774\uC6A9\uD574\uC8FC\uC138\uC694",
              body: "\uB85C\uADF8\uC778\uACFC \uB7F0\uCC98 \uD654\uBA74\uC740 \uC138\uB85C\uB85C \uBCF4\uACE0, \uAC8C\uC784 \uC2DC\uC791 \uD6C4\uC5D0 \uAC00\uB85C\uB85C \uC804\uD658\uD574\uC8FC\uC138\uC694."
            };
        }
      default:
        switch (getLang()) {
          case "ja":
            return {
              eyebrow: "Landscape",
              title: "Rotate to Landscape",
              body: "Gameplay is available in landscape mode only."
            };
          case "en":
            return {
              eyebrow: "Landscape",
              title: "Rotate to Landscape",
              body: "Gameplay is available in landscape mode only."
            };
          default:
            return {
              eyebrow: "Landscape",
              title: "\uAC00\uB85C\uB85C \uB3CC\uB824\uC8FC\uC138\uC694",
              body: "\uAC8C\uC784 \uD50C\uB808\uC774\uB294 \uAC00\uB85C \uBAA8\uB4DC\uC5D0\uC11C\uB9CC \uC9C4\uD589\uB429\uB2C8\uB2E4."
            };
        }
    }
  }

  async function isNicknameAvailable(name) {
    const payload = await checkNicknameAvailabilityFromProvider({
      playerId: state.playerId,
      uid: state.authUser?.uid || "",
      name
    });

    return Boolean(payload?.available);
  }

  async function handleSignOut() {
    try {
      await signOutCurrentUser();
    } catch (error) {
      console.warn("Failed to sign out.", error);
      elements.authSummaryText.textContent = getSignOutFailedMessage();
    }
  }

  function applyNickname(nickname) {
    const resolvedNickname = normalizeName(nickname) || getGuestNickname();
    state.nickname = resolvedNickname;
    elements.nicknameInput.value = resolvedNickname;

    if (state.authUser) {
      void launcherApiGetter()?.syncAuthenticatedAccount?.();
    }

    launcherApiGetter()?.updateLobbyPlayerInfo?.();
    postPlaytestStatus();
  }

  return {
    applyNickname,
    getOrientationGateCopy,
    handleSignOut,
    isNicknameAvailable
  };
}
