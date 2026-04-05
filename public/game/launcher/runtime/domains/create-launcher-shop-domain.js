import { createLauncherShopController } from "../../shop/launcher-shop-controller.js";

export function createLauncherShopDomain({
  sharedState,
  shop,
  getAuthStateController
}) {
  return createLauncherShopController({
    equipSkin: shop.equipSkin,
    getShopBuyConfirmText: shop.getShopBuyConfirmText,
    getShopErrorText: shop.getShopErrorText,
    getShopNotEnoughText: shop.getShopNotEnoughText,
    isAccountShopEnabled: shop.isAccountShopEnabled,
    purchaseSkin: shop.purchaseSkin,
    renderShopState: shop.renderShopState,
    state: sharedState,
    updateLobbyPlayerInfo: (...args) => getAuthStateController()?.updateLobbyPlayerInfo?.(...args)
  });
}
