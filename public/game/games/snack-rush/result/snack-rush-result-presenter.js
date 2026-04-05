import { t } from "../../../core/i18n.js";
import { hideGameResult, showGameResult } from "../../../core/ui.js";

export function hideSnackRushResult() {
  hideGameResult();
}

export function showSnackRushResult({
  noticeText = "",
  rankText = "-",
  score = 0
} = {}) {
  showGameResult({
    eyebrow: t("result.eyebrow"),
    title: t("result.title"),
    noticeText,
    score,
    rankText,
    restartLabel: t("result.restart"),
    restartDisabled: false,
    lobbyDisabled: false
  });
}
