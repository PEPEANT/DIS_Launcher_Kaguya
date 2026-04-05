export function createAppCopyHelpers({
  authMinPasswordLength = 6,
  elements,
  getLang,
  normalizeName
} = {}) {
  function formatNumber(value) {
    const safeValue = Math.max(0, Math.floor(Number(value) || 0));
    return new Intl.NumberFormat(getLang()).format(safeValue);
  }

  function getHujupaySummaryText({ totalEarned = 0, seasonEarned = 0 } = {}) {
    const totalText = formatNumber(totalEarned);
    const seasonText = formatNumber(seasonEarned);

    switch (getLang()) {
      case "ja":
        return `今シーズンのイベント付与 ${seasonText} / 累計付与 ${totalText}`;
      case "en":
        return `This season event grants ${seasonText} / Lifetime credited ${totalText}`;
      default:
        return `이번 시즌 운영/이벤트 적립 ${seasonText} / 누적 지급 ${totalText}`;
    }
  }

  function getSeasonRewardMessageTitle(seasonLabel) {
    switch (getLang()) {
      case "ja":
        return `${seasonLabel} 精算案内`;
      case "en":
        return `${seasonLabel} Settlement Notice`;
      default:
        return `${seasonLabel} 정산 안내`;
    }
  }

  function getSeasonRewardMessageBody({ seasonLabel, rank, rewardAmount }) {
    const rewardText = formatNumber(rewardAmount);

    switch (getLang()) {
      case "ja":
        return `${seasonLabel} のレガシー精算として HujuPay ${rewardText} を付与しました。最終順位は #${rank} です。`;
      case "en":
        return `Legacy settlement for ${seasonLabel}: ${rewardText} HujuPay has been credited for your #${rank} finish.`;
      default:
        return `${seasonLabel} 최종 순위 #${rank} 기록에 대한 레거시 정산으로 후쥬페이 ${rewardText}가 지급되었어요.`;
    }
  }

  function getMessagesLoadingText() {
    switch (getLang()) {
      case "ja":
        return "メッセージを確認しています。";
      case "en":
        return "Checking your messages.";
      default:
        return "메세지를 확인하고 있어요.";
    }
  }

  function getMessagesClaimedText(rewardAmount) {
    const rewardText = formatNumber(rewardAmount);
    if (!rewardAmount) {
      switch (getLang()) {
        case "ja":
          return "この報酬はすでに受け取り済みです。";
        case "en":
          return "This reward has already been claimed.";
        default:
          return "이미 받은 보상이에요.";
      }
    }

    switch (getLang()) {
      case "ja":
        return `HujuPay ${rewardText} を受け取りました。`;
      case "en":
        return `Claimed ${rewardText} HujuPay.`;
      default:
        return `후쥬페이 ${rewardText}를 받았어요.`;
    }
  }

  function getMessagesFailedText() {
    switch (getLang()) {
      case "ja":
        return "メッセージを読み込めませんでした。もう一度お試しください。";
      case "en":
        return "Could not load messages. Please try again.";
      default:
        return "메세지를 불러오지 못했어요. 다시 시도해주세요.";
    }
  }

  function getMessagesClaimFailedText() {
    switch (getLang()) {
      case "ja":
        return "報酬を受け取れませんでした。もう一度お試しください。";
      case "en":
        return "Could not claim the reward. Please try again.";
      default:
        return "보상을 받지 못했어요. 다시 시도해주세요.";
    }
  }

  function getNicknameTakenMessage(suggestion) {
    switch (getLang()) {
      case "ja":
        return `That nickname is already taken. Try ${suggestion}.`;
      case "en":
        return `That nickname is already taken. Try ${suggestion}.`;
      default:
        return `이미 사용 중인 닉네임이에요. ${suggestion} 같은 이름을 써보세요.`;
    }
  }

  function getAutoNicknameMessage(nickname) {
    switch (getLang()) {
      case "ja":
        return `Nickname was empty, so ${nickname} was assigned.`;
      case "en":
        return `Nickname was empty, so ${nickname} was assigned.`;
      default:
        return `닉네임이 비어 있어서 ${nickname} 이름으로 시작했어요.`;
    }
  }

  function getNicknameCheckFailedMessage() {
    switch (getLang()) {
      case "ja":
        return "Could not verify the nickname. Please try again.";
      case "en":
        return "Could not verify the nickname. Please try again.";
      default:
        return "닉네임 중복확인을 하지 못했어요. 다시 시도해주세요.";
    }
  }

  function getRequestedAuthNickname() {
    return normalizeName(elements.authNicknameInput.value);
  }

  function getRequestedProfileNickname() {
    return normalizeName(elements.profileNicknameInput.value);
  }

  function getAuthNicknameRequiredMessage() {
    switch (getLang()) {
      case "ja":
        return "Please enter a nickname.";
      case "en":
        return "Please enter a nickname.";
      default:
        return "닉네임을 입력해주세요.";
    }
  }

  function getAuthNicknameTakenMessage() {
    switch (getLang()) {
      case "ja":
        return "That nickname is already taken. Please choose another one.";
      case "en":
        return "That nickname is already taken. Please choose another one.";
      default:
        return "이미 사용 중인 닉네임이에요. 다른 닉네임으로 정해주세요.";
    }
  }

  function getAuthNicknameCheckFailedMessage() {
    switch (getLang()) {
      case "ja":
        return "Could not verify the nickname. Please try again.";
      case "en":
        return "Could not verify the nickname. Please try again.";
      default:
        return "닉네임 확인에 실패했어요. 다시 시도해주세요.";
    }
  }

  function getAuthNicknameAvailableMessage() {
    switch (getLang()) {
      case "ja":
        return "That nickname is available.";
      case "en":
        return "That nickname is available.";
      default:
        return "사용 가능한 닉네임이에요.";
    }
  }

  function getAuthNicknameNeedsCheckMessage() {
    switch (getLang()) {
      case "ja":
        return "Please run nickname check first.";
      case "en":
        return "Please run nickname check first.";
      default:
        return "닉네임 중복확인을 먼저 해주세요.";
    }
  }

  function getProfileNicknameSavedMessage() {
    switch (getLang()) {
      case "ja":
        return "Your profile nickname was updated. Ranking names will update the next time you save a score.";
      case "en":
        return "Your profile nickname was updated. Ranking names will update the next time you save a score.";
      default:
        return "프로필 닉네임을 저장했어요. 랭킹 이름은 다음 점수 저장부터 반영돼요.";
    }
  }

  function getProfileNicknameUnchangedMessage() {
    switch (getLang()) {
      case "ja":
        return "That nickname is already your current one.";
      case "en":
        return "That nickname is already your current one.";
      default:
        return "지금 쓰는 닉네임과 같아요.";
    }
  }

  function getSignedInIntroMessage(email) {
    switch (getLang()) {
      case "ja":
        return `Signed in as ${email}.`;
      case "en":
        return `Signed in as ${email}.`;
      default:
        return `${email} 계정으로 로그인했어요.`;
    }
  }

  function getSignedInSummary(email) {
    switch (getLang()) {
      case "ja":
        return `Your ${email} account is ready to stay linked with this browser's play records.`;
      case "en":
        return `Your ${email} account is ready to stay linked with this browser's play records.`;
      default:
        return `${email} 계정과 이 브라우저 기록을 연결해서 계속 저장할 수 있어요.`;
    }
  }

  function getPasswordMismatchMessage() {
    switch (getLang()) {
      case "ja":
        return "Password confirmation does not match.";
      case "en":
        return "Password confirmation does not match.";
      default:
        return "비밀번호 확인이 일치하지 않아요.";
    }
  }

  function getPasswordTooShortMessage(minLength = authMinPasswordLength) {
    switch (getLang()) {
      case "ja":
        return `Password must be at least ${minLength} characters long.`;
      case "en":
        return `Password must be at least ${minLength} characters long.`;
      default:
        return `비밀번호는 ${minLength}자 이상으로 입력해주세요.`;
    }
  }

  function getResetPasswordPromptMessage() {
    switch (getLang()) {
      case "ja":
        return "Enter the email address you signed up with.";
      case "en":
        return "Enter the email address you signed up with.";
      default:
        return "가입한 이메일을 입력해주세요.";
    }
  }

  function getResetPasswordSentMessage(email) {
    switch (getLang()) {
      case "ja":
        return `Password reset link sent to ${email}.`;
      case "en":
        return `Password reset link sent to ${email}.`;
      default:
        return `${email} 주소로 비밀번호 재설정 링크를 보냈어요.`;
    }
  }

  function getSignOutFailedMessage() {
    switch (getLang()) {
      case "ja":
        return "Could not sign out. Please try again.";
      case "en":
        return "Could not sign out. Please try again.";
      default:
        return "로그아웃에 실패했어요. 다시 시도해주세요.";
    }
  }

  function getProfileLoadingMessage() {
    switch (getLang()) {
      case "ja":
        return "Checking your Season 0 record.";
      case "en":
        return "Checking your Season 0 record.";
      default:
        return "시즌 0 기록을 확인하고 있어요.";
    }
  }

  function getProfileFailedMessage() {
    switch (getLang()) {
      case "ja":
        return "Could not load your Season 0 record. Please try again.";
      case "en":
        return "Could not load your Season 0 record. Please try again.";
      default:
        return "시즌 0 기록을 불러오지 못했어요. 다시 시도해주세요.";
    }
  }

  function getProfilePartialFailedMessage() {
    switch (getLang()) {
      case "ja":
        return "Some season records could not be loaded.";
      case "en":
        return "Some season records could not be loaded.";
      default:
        return "일부 시즌 기록을 불러오지 못했어요.";
    }
  }

  function getAuthErrorMessage(error) {
    const code = String(error?.code || "").trim();

    switch (code) {
      case "auth/email-already-in-use":
        switch (getLang()) {
          case "ja":
            return "That email address is already in use.";
          case "en":
            return "That email address is already in use.";
          default:
            return "이미 사용 중인 이메일이에요.";
        }
      case "auth/invalid-email":
        switch (getLang()) {
          case "ja":
            return "Please check the email address format.";
          case "en":
            return "Please check the email address format.";
          default:
            return "이메일 형식을 다시 확인해주세요.";
        }
      case "auth/user-not-found":
      case "auth/invalid-credential":
      case "auth/wrong-password":
        switch (getLang()) {
          case "ja":
            return "Incorrect email address or password.";
          case "en":
            return "Incorrect email address or password.";
          default:
            return "이메일 또는 비밀번호가 올바르지 않아요.";
        }
      case "auth/weak-password":
        return getPasswordTooShortMessage();
      case "auth/too-many-requests":
        switch (getLang()) {
          case "ja":
            return "Too many attempts. Please wait a bit and try again.";
          case "en":
            return "Too many attempts. Please wait a bit and try again.";
          default:
            return "시도가 너무 많아요. 잠시 후 다시 시도해주세요.";
        }
      case "auth/network-request-failed":
        switch (getLang()) {
          case "ja":
            return "Please check your network connection and try again.";
          case "en":
            return "Please check your network connection and try again.";
          default:
            return "네트워크 연결을 확인한 뒤 다시 시도해주세요.";
        }
      case "auth/missing-email":
        return getResetPasswordPromptMessage();
      case "auth/operation-not-allowed":
        switch (getLang()) {
          case "ja":
            return "Enable Email/Password sign-in in Firebase Auth first.";
          case "en":
            return "Enable Email/Password sign-in in Firebase Auth first.";
          default:
            return "Firebase Auth에서 이메일/비밀번호 로그인을 먼저 켜주세요.";
        }
      default:
        switch (getLang()) {
          case "ja":
            return "Something went wrong during authentication. Please try again.";
          case "en":
            return "Something went wrong during authentication. Please try again.";
          default:
            return "인증 처리 중 오류가 발생했어요. 다시 시도해주세요.";
        }
    }
  }

  function getResetAuthErrorMessage(error) {
    const code = String(error?.code || "").trim();

    switch (code) {
      case "auth/invalid-email":
        return getAuthErrorMessage(error);
      case "auth/user-not-found":
        switch (getLang()) {
          case "ja":
            return "No account was found for that email address.";
          case "en":
            return "No account was found for that email address.";
          default:
            return "가입된 계정을 찾지 못했어요. 이메일을 다시 확인해주세요.";
        }
      case "auth/too-many-requests":
      case "auth/network-request-failed":
      case "auth/operation-not-allowed":
      case "auth/missing-email":
        return getAuthErrorMessage(error);
      default:
        switch (getLang()) {
          case "ja":
            return "Could not send the reset link. Please try again.";
          case "en":
            return "Could not send the reset link. Please try again.";
          default:
            return "재설정 링크를 보내지 못했어요. 다시 시도해주세요.";
        }
    }
  }

  return {
    formatNumber,
    getAuthErrorMessage,
    getAuthNicknameAvailableMessage,
    getAuthNicknameCheckFailedMessage,
    getAuthNicknameNeedsCheckMessage,
    getAuthNicknameRequiredMessage,
    getAuthNicknameTakenMessage,
    getAutoNicknameMessage,
    getHujupaySummaryText,
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
    getSeasonRewardMessageBody,
    getSeasonRewardMessageTitle,
    getSignedInIntroMessage,
    getSignedInSummary,
    getSignOutFailedMessage
  };
}
