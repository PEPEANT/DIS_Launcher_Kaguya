import { createLauncherAuthStateDomain } from "./domains/create-launcher-auth-state-domain.js";
import { createLauncherChatDomain } from "./domains/create-launcher-chat-domain.js";
import { createLauncherApi } from "./create-launcher-api.js";
import { createLauncherOverlayDomain } from "./domains/create-launcher-overlay-domain.js";
import { createLauncherProfileDomain } from "./domains/create-launcher-profile-domain.js";
import { createLauncherRoutingDomain } from "./domains/create-launcher-routing-domain.js";
import { createLauncherShopDomain } from "./domains/create-launcher-shop-domain.js";

export function createLauncherRuntime({
  accountDataService,
  accountSyncService,
  accountUi,
  auth,
  authOverlay,
  authUi,
  currentSeason,
  chat,
  identity,
  messageOverlay,
  messageState,
  messages,
  profile,
  profileLoaderService,
  profileModalState,
  profileSeason,
  ranking,
  routing,
  sharedState,
  shop,
  t
}) {
  let launcherAuthStateController = null;
  let launcherChatController = null;
  let launcherOverlayController = null;
  let launcherProfileController = null;
  let launcherRankingSync = null;
  let launcherShopController = null;

  const {
    launcherAuthStateController: createdLauncherAuthStateController,
    launcherMessageOrchestrator,
    launcherRankingSync: createdLauncherRankingSync
  } = createLauncherAuthStateDomain({
    accountDataService,
    accountSyncService,
    accountUi,
    authOverlay,
    identity,
    messageOverlay,
    messageState,
    messages,
    profileModalState,
    ranking,
    routing,
    sharedState,
    t,
    getChatController: () => launcherChatController,
    getProfileController: () => launcherProfileController,
    getShopController: () => launcherShopController
  });
  launcherAuthStateController = createdLauncherAuthStateController;
  launcherRankingSync = createdLauncherRankingSync;

  launcherProfileController = createLauncherProfileDomain({
    accountDataService,
    accountUi,
    auth,
    currentSeason,
    identity,
    messages,
    profile,
    profileLoaderService,
    profileModalState,
    profileSeason,
    ranking,
    sharedState,
    t,
    launcherRankingSync,
    launcherMessageOrchestrator,
    getAuthStateController: () => launcherAuthStateController
  });

  launcherOverlayController = createLauncherOverlayDomain({
    accountUi,
    auth,
    authUi,
    messages,
    messageOverlay,
    profile,
    routing,
    launcherRankingSync,
    launcherMessageOrchestrator,
    getProfileController: () => launcherProfileController
  });

  launcherChatController = createLauncherChatDomain({
    chat,
    identity,
    t,
    getOverlayController: () => launcherOverlayController
  });

  launcherShopController = createLauncherShopDomain({
    sharedState,
    shop,
    getAuthStateController: () => launcherAuthStateController
  });

  const launcherController = createLauncherRoutingDomain({
    routing,
    getChatController: () => launcherChatController,
    getOverlayController: () => launcherOverlayController
  });

  const launcherApi = createLauncherApi({
    launcherAuthStateController,
    launcherChatController,
    launcherController,
    launcherMessageOrchestrator,
    launcherOverlayController,
    launcherProfileController,
    launcherRankingSync,
    launcherShopController
  });

  return {
    launcherApi
  };
}
