import { getRankingApiUrl } from "../config/runtime.js";

export async function fetchRankings() {
  const response = await fetch(getRankingApiUrl("/api/rankings"), { cache: "no-store" });

  if (!response.ok) {
    throw new Error("ranking fetch failed");
  }

  return response.json();
}

export async function checkNicknameAvailability({ playerId, name }) {
  const params = new URLSearchParams();
  params.set("name", String(name || ""));
  params.set("playerId", String(playerId || ""));

  const response = await fetch(getRankingApiUrl(`/api/rankings/name-available?${params.toString()}`), { cache: "no-store" });

  if (!response.ok) {
    throw new Error("nickname validation failed");
  }

  return response.json();
}

export async function submitScore({ playerId, name, score }) {
  const response = await fetch(getRankingApiUrl("/api/rankings"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ playerId, name, score })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "save failed");
  }

  return payload;
}
