export const DEFAULT_GAME_ID = "snack-rush";
export const DEFAULT_RANKING_GAME_ID = "snack-rush";

export const GAME_DEFINITIONS = Object.freeze({
  "snack-rush": Object.freeze({
    id: "snack-rush",
    routeLabel: "\uC2A4\uB0B5\uB7EC\uC2DC",
    entrySurface: "game-prestart",
    supportsRanking: true
  }),
  cooking: Object.freeze({
    id: "cooking",
    routeLabel: "\uC694\uB9AC\uB300\uD68C",
    entrySurface: "lobby-entry",
    supportsRanking: false
  })
});

export function getGameDefinition(gameId = DEFAULT_GAME_ID) {
  return GAME_DEFINITIONS[gameId] || GAME_DEFINITIONS[DEFAULT_GAME_ID];
}

export function getRankingGameId(gameId = DEFAULT_RANKING_GAME_ID) {
  return getGameDefinition(gameId).supportsRanking
    ? getGameDefinition(gameId).id
    : DEFAULT_RANKING_GAME_ID;
}
