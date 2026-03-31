import { getRankingProvider } from "./config/runtime.js";

async function getProvider() {
  return getRankingProvider() === "firebase"
    ? import("./services/firebase-ranking.js")
    : import("./services/rest-ranking.js");
}

export async function fetchRankingsFromProvider() {
  return (await getProvider()).fetchRankings();
}

export async function checkNicknameAvailabilityFromProvider(payload) {
  return (await getProvider()).checkNicknameAvailability(payload);
}

export async function submitScoreToProvider(payload) {
  return (await getProvider()).submitScore(payload);
}
