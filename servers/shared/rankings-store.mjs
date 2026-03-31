import { promises as fs } from "node:fs";

import { DATA_DIR, MAX_RANKINGS, RANKINGS_FILE } from "./config.mjs";

export async function ensureRankingStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(RANKINGS_FILE);
  } catch {
    await fs.writeFile(RANKINGS_FILE, "[]\n", "utf8");
  }
}

export function normalizeName(input) {
  if (typeof input !== "string") {
    return "";
  }

  const collapsed = input.trim().replace(/\s+/g, " ");
  return Array.from(collapsed).slice(0, 12).join("");
}

export function normalizePlayerId(input) {
  if (typeof input !== "string") {
    return "";
  }

  const trimmed = input.trim();
  return /^[A-Za-z0-9_-]{16,64}$/u.test(trimmed) ? trimmed : "";
}

function compareRankings(left, right) {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  return String(left.submittedAt).localeCompare(String(right.submittedAt));
}

function getEntryIdentity(entry) {
  const playerId = normalizePlayerId(entry?.playerId);
  if (playerId) {
    return `player:${playerId}`;
  }

  const name = normalizeName(entry?.name);
  return name ? `legacy:${name}` : "";
}

function sanitizeRankings(rawRankings) {
  const bestByIdentity = new Map();

  for (const entry of Array.isArray(rawRankings) ? rawRankings : []) {
    const name = normalizeName(entry?.name);
    const playerId = normalizePlayerId(entry?.playerId);
    const score = Number(entry?.score);
    const submittedAt = typeof entry?.submittedAt === "string" ? entry.submittedAt : new Date(0).toISOString();
    const identity = getEntryIdentity({ name, playerId });

    if (!name || !identity || !Number.isFinite(score)) {
      continue;
    }

    const nextEntry = {
      name,
      score: Math.floor(score),
      submittedAt
    };

    if (playerId) {
      nextEntry.playerId = playerId;
    }

    const existing = bestByIdentity.get(identity);
    if (!existing || compareRankings(nextEntry, existing) < 0) {
      bestByIdentity.set(identity, nextEntry);
    }
  }

  return [...bestByIdentity.values()].sort(compareRankings).slice(0, MAX_RANKINGS);
}

export async function readRankings() {
  try {
    const fileContents = await fs.readFile(RANKINGS_FILE, "utf8");
    return sanitizeRankings(JSON.parse(fileContents));
  } catch {
    return [];
  }
}

export async function writeRankings(rankings) {
  const nextRankings = sanitizeRankings(rankings);
  const tempPath = `${RANKINGS_FILE}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(nextRankings, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, RANKINGS_FILE);
  return nextRankings;
}

export async function isNicknameAvailable({ playerId, name }) {
  const safePlayerId = normalizePlayerId(playerId);
  const safeName = normalizeName(name);

  if (!safeName) {
    return { available: false };
  }

  const rankings = await readRankings();
  const conflictingEntry = rankings.find((entry) => {
    if (entry.name !== safeName) {
      return false;
    }

    return normalizePlayerId(entry.playerId) !== safePlayerId;
  });

  return {
    available: !conflictingEntry
  };
}

export async function submitRanking({ playerId, name, score }) {
  const safePlayerId = normalizePlayerId(playerId);
  const safeName = normalizeName(name);
  const safeScore = Math.floor(Number(score));

  if (!safeName) {
    throw new Error("Nickname is required.");
  }

  if (!Number.isFinite(safeScore)) {
    throw new Error("Score is invalid.");
  }

  const availability = await isNicknameAvailable({ playerId: safePlayerId, name: safeName });
  if (!availability.available) {
    throw new Error("Nickname is already taken.");
  }

  const rankings = await readRankings();
  const samePlayerEntry = safePlayerId
    ? rankings.find((entry) => normalizePlayerId(entry.playerId) === safePlayerId)
    : null;
  const legacyNameEntry = rankings.find((entry) => !normalizePlayerId(entry.playerId) && entry.name === safeName);
  const existing = samePlayerEntry || legacyNameEntry || null;
  const submittedAt = new Date().toISOString();
  const shouldRenameExistingPlayer = Boolean(
    safePlayerId
    && samePlayerEntry
    && samePlayerEntry.name !== safeName
  );

  let accepted = false;
  let nextRankings = rankings;

  if (!existing || safeScore > existing.score) {
    const withoutCurrentPlayer = rankings.filter((entry) => {
      const entryPlayerId = normalizePlayerId(entry.playerId);

      if (safePlayerId && entryPlayerId === safePlayerId) {
        return false;
      }

      if (safePlayerId && !entryPlayerId && entry.name === safeName) {
        return false;
      }

      if (!safePlayerId && !entryPlayerId && entry.name === safeName) {
        return false;
      }

      return true;
    });
    const nextEntry = { name: safeName, score: safeScore, submittedAt };
    if (safePlayerId) {
      nextEntry.playerId = safePlayerId;
    }

    nextRankings = await writeRankings([
      ...withoutCurrentPlayer,
      nextEntry
    ]);
    accepted = true;
  } else if (shouldRenameExistingPlayer) {
    const withoutCurrentPlayer = rankings.filter((entry) => normalizePlayerId(entry.playerId) !== safePlayerId);
    nextRankings = await writeRankings([
      ...withoutCurrentPlayer,
      {
        playerId: safePlayerId,
        name: safeName,
        score: existing.score,
        submittedAt: existing.submittedAt
      }
    ]);
  } else {
    nextRankings = await writeRankings(rankings);
  }

  const rankIdentity = getEntryIdentity({ playerId: safePlayerId, name: safeName });

  return {
    accepted,
    rank: nextRankings.findIndex((entry) => getEntryIdentity(entry) === rankIdentity) + 1 || null,
    rankings: nextRankings
  };
}
