import { createLauncherChatController } from "../../chat/launcher-chat-controller.js";

export function createLauncherChatDomain({
  chat,
  identity,
  t,
  getOverlayController
}) {
  return createLauncherChatController({
    chatCooldownMs: chat.chatCooldownMs,
    getActiveNickname: identity.getActiveNickname,
    getChatFailedText: chat.getChatFailedText,
    getChatLoadingText: chat.getChatLoadingText,
    getChatLoginRequiredText: chat.getChatLoginRequiredText,
    getCurrentUid: identity.getCurrentUid,
    lobbyChatState: chat.lobbyChatState,
    openAuthDialog: (...args) => getOverlayController()?.openAuthDialog?.(...args),
    renderLobbyChatMessages: chat.renderLobbyChatMessages,
    sendLobbyChatMessage: chat.sendLobbyChatMessage,
    setLobbyChatComposerState: chat.setLobbyChatComposerState,
    setLobbyChatStatus: chat.setLobbyChatStatus,
    subscribeLobbyChat: chat.subscribeLobbyChat,
    t
  });
}
