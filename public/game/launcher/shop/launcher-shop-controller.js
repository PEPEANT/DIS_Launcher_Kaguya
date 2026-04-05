import { elements } from "../../core/dom.js";

export function createLauncherShopController({
  equipSkin,
  getShopBuyConfirmText,
  getShopErrorText,
  getShopNotEnoughText,
  isAccountShopEnabled,
  purchaseSkin,
  renderShopState,
  state,
  updateLobbyPlayerInfo
}) {
  function refreshShopState() {
    const isGuest = !state.authUser?.uid || !isAccountShopEnabled();
    renderShopState({
      balance: isAccountShopEnabled() ? (state.hujupayBalance || 0) : 0,
      isGuest,
      equippedSkin: state.equippedSkin || "skin_0",
      ownedSkins: state.ownedSkins || []
    });
  }

  async function handleShopButtonClick(button) {
    if (!isAccountShopEnabled()) {
      return;
    }

    const skinId = button?.dataset.skinId;
    const price = button?.dataset.skinPrice ? Number(button.dataset.skinPrice) : null;
    const uid = state.authUser?.uid;

    if (!skinId || !uid || !button) {
      return;
    }

    if (price !== null) {
      if ((state.hujupayBalance || 0) < price) {
        alert(getShopNotEnoughText());
        return;
      }

      if (!confirm(getShopBuyConfirmText())) {
        return;
      }

      button.disabled = true;
      try {
        const result = await purchaseSkin({ uid, skinId, price });
        state.hujupayBalance = result.newBalance;
        state.ownedSkins = result.ownedSkins;
        updateLobbyPlayerInfo();
        refreshShopState();
      } catch {
        alert(getShopErrorText());
        button.disabled = false;
      }
      return;
    }

    button.disabled = true;
    try {
      await equipSkin({ uid, skinId });
      state.equippedSkin = skinId;
      refreshShopState();
    } catch {
      alert(getShopErrorText());
      button.disabled = false;
    }
  }

  function bindEvents() {
    [elements.equipSkin0Button, elements.buySkinBButton, elements.buySkinCButton].forEach((button) => {
      button?.addEventListener("click", () => void handleShopButtonClick(button));
    });
  }

  return {
    bindEvents,
    handleShopButtonClick,
    refreshShopState
  };
}
