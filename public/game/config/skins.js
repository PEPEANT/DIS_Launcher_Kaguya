export const DEFAULT_SKIN_ID = "skin_0";

const DEFAULT_PLAYER_POSE_KEYS = Object.freeze({
  idle: "idle",
  walk1: "walk1",
  walk2: "walk2",
  jump: "jump",
  down: "down",
  damage: "damage"
});

export const SKIN_ASSET_DEFINITIONS = Object.freeze([
  { key: "skinBIdle", file: "character/skins/skin_b/0.png", sourceFile: "character/skins/skin_b/0.png", chromaKey: true },
  { key: "skinBWalk1", file: "character/skins/skin_b/1.png", sourceFile: "character/skins/skin_b/1.png", chromaKey: true },
  { key: "skinBWalk2", file: "character/skins/skin_b/2.png", sourceFile: "character/skins/skin_b/2.png", chromaKey: true },
  { key: "skinBDamage", file: "character/skins/skin_b/3.png", sourceFile: "character/skins/skin_b/3.png", chromaKey: true },
  { key: "skinBJump", file: "character/skins/skin_b/4.png", sourceFile: "character/skins/skin_b/4.png", chromaKey: true },
  { key: "skinBDown", file: "character/skins/skin_b/5.png", sourceFile: "character/skins/skin_b/5.png", chromaKey: true },
  { key: "skinBPreview", file: "character/skins/skin_b/6.png", sourceFile: "character/skins/skin_b/6.png", chromaKey: true }
]);

export const SHOP_SKINS = Object.freeze([
  {
    id: DEFAULT_SKIN_ID,
    price: 0,
    supported: true,
    purchasable: false,
    previewFile: "character/0.png",
    poseKeys: DEFAULT_PLAYER_POSE_KEYS,
    label: Object.freeze({
      ko: "기본 스킨",
      en: "Default Skin",
      ja: "デフォルトスキン"
    }),
    description: Object.freeze({
      ko: "카구야 (기본)",
      en: "Kaguya (default)",
      ja: "かぐや（デフォルト）"
    })
  },
  {
    id: "skin_b",
    price: 2500,
    supported: true,
    purchasable: true,
    previewFile: "character/skins/skin_b/6.png",
    poseKeys: Object.freeze({
      idle: "skinBIdle",
      walk1: "skinBWalk1",
      walk2: "skinBWalk2",
      jump: "skinBJump",
      down: "skinBDown",
      damage: "skinBDamage"
    }),
    label: Object.freeze({
      ko: "스킨 B",
      en: "Skin B",
      ja: "スキンB"
    }),
    description: Object.freeze({
      ko: "카구야 (교복)",
      en: "Kaguya (school uniform)",
      ja: "かぐや（制服）"
    })
  },
  {
    id: "skin_c",
    price: 3500,
    supported: false,
    purchasable: false,
    previewFile: null,
    poseKeys: DEFAULT_PLAYER_POSE_KEYS,
    label: Object.freeze({
      ko: "스킨 C",
      en: "Skin C",
      ja: "スキンC"
    }),
    description: Object.freeze({
      ko: "준비 중",
      en: "Coming soon",
      ja: "準備中"
    })
  }
]);

const SHOP_SKIN_MAP = new Map(SHOP_SKINS.map((skin) => [skin.id, skin]));

function getLocalizedCopy(copyByLang = {}, lang = "ko") {
  return copyByLang[lang] || copyByLang.ko || copyByLang.en || Object.values(copyByLang)[0] || "";
}

export function getShopSkinById(skinId) {
  return SHOP_SKIN_MAP.get(String(skinId || "").trim()) || null;
}

export function getShopSkinLabel(skin, lang = "ko") {
  return getLocalizedCopy(skin?.label, lang);
}

export function getShopSkinDescription(skin, lang = "ko") {
  return getLocalizedCopy(skin?.description, lang);
}

export function isEquippableSkin(skinId) {
  const skin = getShopSkinById(skinId);
  return Boolean(skin?.supported && skin?.poseKeys);
}

export function normalizeOwnedSkins(ownedSkins = []) {
  if (!Array.isArray(ownedSkins)) {
    return [];
  }

  return [...new Set(
    ownedSkins
      .map((skinId) => String(skinId || "").trim())
      .filter((skinId) => skinId && skinId !== DEFAULT_SKIN_ID && SHOP_SKIN_MAP.has(skinId))
  )];
}

export function normalizeEquippedSkin(skinId, ownedSkins = []) {
  const safeSkinId = String(skinId || "").trim();
  const ownedSet = new Set([DEFAULT_SKIN_ID, ...normalizeOwnedSkins(ownedSkins)]);

  if (!ownedSet.has(safeSkinId) || !isEquippableSkin(safeSkinId)) {
    return DEFAULT_SKIN_ID;
  }

  return safeSkinId;
}

export function getPlayerSkinAssetKey(skinId, poseKey = "idle") {
  const safeSkinId = isEquippableSkin(skinId) ? skinId : DEFAULT_SKIN_ID;
  const skin = getShopSkinById(safeSkinId) || getShopSkinById(DEFAULT_SKIN_ID);
  return skin?.poseKeys?.[poseKey] || DEFAULT_PLAYER_POSE_KEYS[poseKey] || DEFAULT_PLAYER_POSE_KEYS.idle;
}
