export const ITEM_TYPES = [
  { key: "iroha", points: 50, weight: 0.014, size: 130, radius: 42, color: "#ede0ff", soundKey: "special" },
  { key: "snack1", points: 18, weight: 0.15, size: 122, radius: 38, color: "#fff6e0", soundKey: "pickup" },
  { key: "snack2", points: 32, weight: 0.15, size: 138, radius: 44, color: "#fff6e0", soundKey: "pickup" },
  { key: "snack3", points: 26, weight: 0.13, size: 144, radius: 48, color: "#fff6e0", soundKey: "pickup" },
  { key: "snack4", points: 14, weight: 0.11, size: 108, radius: 36, color: "#fff6e0", soundKey: "pickup" },
  { key: "snack5", points: 24, weight: 0.09, size: 136, radius: 44, color: "#fff3da", soundKey: "pickup" },
  {
    key: "special1",
    points: 0,
    timeBonus: 10,
    weight: 0.022,
    size: 126,
    radius: 38,
    color: "#d8f2ff",
    maxActive: 1,
    spawnCooldown: 9,
    soundKey: "special",
    sourceCrop: { x: 386, y: 120, width: 590, height: 566 }
  },
  {
    key: "heal1",
    points: 0,
    heal: 1,
    weight: 0.014,
    size: 110,
    radius: 36,
    color: "#ffe6f3",
    minRound: 4,
    maxActive: 1,
    spawnCooldown: 12,
    requiresMissingHealth: true,
    soundKey: "special"
  },
  { key: "danger1", points: -32, damage: 2, weight: 0.085, size: 110, radius: 42, color: "#ff8b89", soundKey: "damage" },
  { key: "danger2", points: -20, damage: 1, weight: 0.095, size: 118, radius: 46, color: "#ffb3ae", soundKey: "damage" },
  { key: "danger3", points: -26, damage: 1, weight: 0.075, size: 104, radius: 40, color: "#ff9d96", soundKey: "damage" }
];
