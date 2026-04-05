import { elements } from "../../core/dom.js";

export function createLauncherMessageOrchestrator({
  closeMessageArrivalModal,
  getLang,
  isAccountMessageInboxEnabled,
  maxStoredMessageIds,
  messageAlertedStoragePrefix,
  messageNotificationState,
  messageSeenStoragePrefix,
  openMessageArrivalModal,
  profileModalState,
  setMessageAlertState,
  setMessageArrivalCopy,
  state,
  t
}) {
  function getPendingMessageCount() {
    return (profileModalState.messages || []).filter((message) => message.claimable && !message.claimed).length;
  }

  function getMessageStorageKey(prefix, uid = state.authUser?.uid) {
    const safeUid = String(uid || "").trim();
    return safeUid ? `${prefix}:${safeUid}` : "";
  }

  function readStoredMessageIds(prefix, uid = state.authUser?.uid) {
    const storageKey = getMessageStorageKey(prefix, uid);
    if (!storageKey) {
      return [];
    }

    try {
      const rawValue = window.localStorage.getItem(storageKey);
      const parsed = rawValue ? JSON.parse(rawValue) : [];
      return Array.isArray(parsed)
        ? [...new Set(parsed.map((value) => String(value || "").trim()).filter(Boolean))]
        : [];
    } catch {
      return [];
    }
  }

  function writeStoredMessageIds(prefix, ids = [], uid = state.authUser?.uid) {
    const storageKey = getMessageStorageKey(prefix, uid);
    if (!storageKey) {
      return;
    }

    const uniqueIds = [...new Set(ids.map((value) => String(value || "").trim()).filter(Boolean))].slice(-maxStoredMessageIds);

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(uniqueIds));
    } catch {
      // Ignore storage failures on restricted browsers.
    }
  }

  function appendStoredMessageIds(prefix, ids = [], uid = state.authUser?.uid) {
    if (!ids.length) {
      return;
    }

    const nextIds = [...readStoredMessageIds(prefix, uid), ...ids];
    writeStoredMessageIds(prefix, nextIds, uid);
  }

  function getUnreadMessages(messages = []) {
    const seenIds = new Set(readStoredMessageIds(messageSeenStoragePrefix));
    return messages.filter((message) => message.messageId && !seenIds.has(message.messageId));
  }

  function getUnalertedRewardMessages(messages = []) {
    const alertedIds = new Set(readStoredMessageIds(messageAlertedStoragePrefix));
    return messages.filter((message) => (
      message.messageId
      && message.claimable
      && !message.claimed
      && !alertedIds.has(message.messageId)
    ));
  }

  function markMessagesSeen(messages = []) {
    const messageIds = messages
      .map((message) => String(message?.messageId || "").trim())
      .filter(Boolean);
    appendStoredMessageIds(messageSeenStoragePrefix, messageIds);
  }

  function markRewardMessagesAlerted(messages = []) {
    const rewardMessageIds = messages
      .filter((message) => message?.claimable && !message?.claimed)
      .map((message) => String(message?.messageId || "").trim())
      .filter(Boolean);
    appendStoredMessageIds(messageAlertedStoragePrefix, rewardMessageIds);
  }

  function resetMessageNotifications() {
    messageNotificationState.unreadCount = 0;
    messageNotificationState.pendingRewardPromptIds = [];
    setMessageAlertState(false);
  }

  function updateMessageNotificationState(messages = profileModalState.messages || []) {
    const unreadMessages = getUnreadMessages(messages);
    messageNotificationState.unreadCount = unreadMessages.length;
    setMessageAlertState(unreadMessages.length > 0);
  }

  function updateMessagesButtonLabel() {
    const pendingCount = getPendingMessageCount();
    const baseLabel = t("messages.open");
    const nextLabel = pendingCount > 0
      ? `${baseLabel} (${pendingCount})`
      : baseLabel;
    const canOpenInbox = Boolean(state.authUser?.uid) && isAccountMessageInboxEnabled();

    [elements.profileMessagesButton, elements.desktopMessagesButton]
      .filter(Boolean)
      .forEach((button) => {
        button.hidden = !canOpenInbox;
        button.textContent = nextLabel;
      });
  }

  function getMessageArrivalBody(count = 1) {
    const safeCount = Math.max(1, Math.floor(Number(count) || 1));

    switch (getLang()) {
      case "ja":
        return safeCount > 1
          ? `新しい報酬メッセージが ${safeCount} 件届きました。ロビーのメッセージボックスで内容を確認してください。`
          : "新しい報酬メッセージが届きました。ロビーのメッセージボックスで内容を確認してください。";
      case "en":
        return safeCount > 1
          ? `${safeCount} new reward messages have arrived. Please check the message box in the lobby.`
          : "A new reward message has arrived. Please check the message box in the lobby.";
      default:
        return safeCount > 1
          ? `새 보상 메시지 ${safeCount}개가 도착했습니다. 로비의 메시지함에서 내용을 확인해주세요.`
          : "새 보상 메시지가 도착했습니다. 로비의 메시지함에서 내용을 확인해주세요.";
    }
  }

  function maybeOpenLobbyRewardMessagePrompt(messages = []) {
    if (!state.authUser?.uid || elements.lobbyScreen.hidden || state.phase !== "ready") {
      return;
    }

    const pendingRewardMessages = getUnalertedRewardMessages(messages);
    if (!pendingRewardMessages.length || !elements.messageArrivalModal?.hidden) {
      return;
    }

    messageNotificationState.pendingRewardPromptIds = pendingRewardMessages
      .map((message) => message.messageId)
      .filter(Boolean);

    setMessageArrivalCopy({
      title: t("messages.arrivalTitle"),
      body: getMessageArrivalBody(pendingRewardMessages.length)
    });
    openMessageArrivalModal();
  }

  function closeLobbyRewardMessagePrompt({ markAlerted = true } = {}) {
    if (markAlerted && messageNotificationState.pendingRewardPromptIds.length) {
      const promptMessages = (profileModalState.messages || []).filter((message) => messageNotificationState.pendingRewardPromptIds.includes(message.messageId));
      markRewardMessagesAlerted(promptMessages);
    }

    messageNotificationState.pendingRewardPromptIds = [];
    closeMessageArrivalModal();
  }

  return {
    closeLobbyRewardMessagePrompt,
    markMessagesSeen,
    markRewardMessagesAlerted,
    maybeOpenLobbyRewardMessagePrompt,
    resetMessageNotifications,
    updateMessageNotificationState,
    updateMessagesButtonLabel
  };
}
