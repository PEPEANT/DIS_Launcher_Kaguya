import { createLauncherController } from "../controllers/launcher-routing-controller.js";

export function createLauncherRoutingDomain({
  routing,
  getChatController,
  getOverlayController
}) {
  return createLauncherController({
    closeLobbyOverlays: (...args) => getOverlayController()?.closeLobbyOverlays?.(...args),
    defaultGameId: routing.defaultGameId,
    gameDefinitions: routing.gameDefinitions,
    openGamePrestart: routing.openGamePrestart,
    refreshGameEntry: routing.refreshGameEntry,
    openProfileInfo: (...args) => getOverlayController()?.openProfileDialog?.(...args),
    openSettingsDialog: (...args) => getOverlayController()?.openSettingsDialog?.(...args),
    handleChatPanelChange: () => getChatController()?.handleLauncherPanelChange?.(),
    syncResponsiveUi: routing.syncResponsiveUi
  });
}
