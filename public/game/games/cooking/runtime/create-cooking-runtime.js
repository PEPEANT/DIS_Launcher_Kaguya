import { createCookingEntryController } from "../entry/cooking-entry-controller.js";
import { createCookingRankingController } from "../ranking/cooking-ranking-controller.js";
import { createCookingResultController } from "../result/cooking-result-controller.js";
import { createCookingSessionController } from "../gameplay/cooking-session-controller.js";

export function createCookingRuntime() {
  const cookingEntryController = createCookingEntryController();
  const cookingRankingController = createCookingRankingController();
  const cookingResultController = createCookingResultController();
  const cookingSessionController = createCookingSessionController();

  return {
    cookingEntryController,
    cookingRankingController,
    cookingResultController,
    cookingSessionController
  };
}
