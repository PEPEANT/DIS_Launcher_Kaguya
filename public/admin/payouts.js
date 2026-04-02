import { getCurrentAuthIdToken, initAuth } from "../game/auth.js";
import {
  getAdminAccessConfig,
  getAvailableRankingSeasons,
  getCurrentRankingSeason,
  getRankingSeasonConfig
} from "../game/config/runtime.js";

const CURRENT_SEASON = getCurrentRankingSeason();
const RANKING_SEASONS = getAvailableRankingSeasons().sort((left, right) => right.id - left.id);
const adminAccessConfig = getAdminAccessConfig();

const elements = {
  payoutRefreshButton: document.getElementById("payoutRefreshButton"),
  payoutSeason: document.getElementById("payoutSeason"),
  payoutLimit: document.getElementById("payoutLimit"),
  payoutLoadButton: document.getElementById("payoutLoadButton"),
  payoutStatus: document.getElementById("payoutStatus"),
  payoutRecipientCount: document.getElementById("payoutRecipientCount"),
  payoutRewardTotal: document.getElementById("payoutRewardTotal"),
  payoutLastRewardedAt: document.getElementById("payoutLastRewardedAt"),
  payoutResultMeta: document.getElementById("payoutResultMeta"),
  payoutTableBody: document.getElementById("payoutTableBody")
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char] || char));
}

function formatText(value, fallback = "-") {
  const safeValue = String(value ?? "").trim();
  return safeValue || fallback;
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString("ko-KR") : "-";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function canBypassAdminAllowlist() {
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function isAuthorizedAdmin(user) {
  if (!adminAccessConfig.requiresSignIn) {
    return true;
  }

  if (!user?.email) {
    return false;
  }

  if (!adminAccessConfig.allowedEmails.length) {
    return canBypassAdminAllowlist();
  }

  return adminAccessConfig.allowedEmails.includes(normalizeEmail(user.email));
}

function getGameEntryUrl() {
  return new URL("/", window.location.origin).toString();
}

function renderAccessGate({ title, body }) {
  document.body.innerHTML = `
    <main class="admin-shell">
      <section class="panel-card admin-access-card">
        <div class="panel-head">
          <h2>${escapeHtml(title)}</h2>
        </div>
        <p class="admin-access-copy">${escapeHtml(body)}</p>
        <div class="admin-access-actions">
          <a class="refresh-button" href="${escapeHtml(getGameEntryUrl())}">게임 열기</a>
          <button class="refresh-button refresh-button--secondary" type="button" id="retryAdminAccess">다시 시도</button>
        </div>
      </section>
    </main>
  `;

  document.getElementById("retryAdminAccess")?.addEventListener("click", () => {
    window.location.reload();
  });
}

async function requireAuthorizedAdmin() {
  if (!adminAccessConfig.requiresSignIn && !adminAccessConfig.allowedEmails.length) {
    return null;
  }

  const { user } = await initAuth();

  if (!user?.uid) {
    renderAccessGate({
      title: "관리자 로그인 필요",
      body: "먼저 메인 게임에서 관리자 계정으로 로그인한 뒤 이 페이지를 다시 열어주세요."
    });
    throw new Error("관리자 로그인이 필요합니다.");
  }

  if (!isAuthorizedAdmin(user)) {
    renderAccessGate({
      title: "접근 권한 없음",
      body: adminAccessConfig.allowedEmails.length
        ? `현재 로그인한 계정(${normalizeEmail(user.email)})은 관리자 허용 목록에 없습니다.`
        : "앱 서버의 ADMIN_ALLOWED_EMAILS 설정 후 다시 로그인해주세요."
    });
    throw new Error("관리자 허용 목록에서 거부되었습니다.");
  }

  return user;
}

async function runAdminActionRequest(action, payload) {
  const idToken = await getCurrentAuthIdToken();
  const response = await fetch("/api/admin/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({ action, payload })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(formatText(data.error, `관리자 요청 실패 (${response.status})`));
  }

  return data.result;
}

function populateSeasonSelect() {
  elements.payoutSeason.innerHTML = RANKING_SEASONS.map((seasonConfig) => `
    <option value="${seasonConfig.id}">
      ${escapeHtml(seasonConfig.displayName)}${seasonConfig.period ? ` (${escapeHtml(seasonConfig.period)})` : ""}
    </option>
  `).join("");
  elements.payoutSeason.value = String(CURRENT_SEASON);
}

function getSelectedSeason() {
  const season = Number.parseInt(String(elements.payoutSeason.value || ""), 10);
  return Number.isInteger(season) && season >= 1 ? season : CURRENT_SEASON;
}

function getSelectedSeasonLabel() {
  return getRankingSeasonConfig(getSelectedSeason()).displayName;
}

function renderEmptyRow(message) {
  elements.payoutTableBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="7">${escapeHtml(message)}</td>
    </tr>
  `;
}

function renderPayoutRows(recipients) {
  if (!Array.isArray(recipients) || !recipients.length) {
    renderEmptyRow("아직 지급 완료된 내역이 없습니다.");
    return;
  }

  elements.payoutTableBody.innerHTML = recipients.map((entry) => `
    <tr>
      <td>${escapeHtml(formatDateTime(entry.rewardedAt))}</td>
      <td>${escapeHtml(formatText(entry.nickname, "이름 없음"))}</td>
      <td>#${escapeHtml(formatNumber(entry.rank))}</td>
      <td>${escapeHtml(formatNumber(entry.rewardAmount))} HujuPay</td>
      <td>${escapeHtml(formatNumber(entry.score))}</td>
      <td>${escapeHtml(formatText(entry.uid))}</td>
      <td>${escapeHtml(formatText(entry.playerId))}</td>
    </tr>
  `).join("");
}

function applySummary(result) {
  elements.payoutRecipientCount.textContent = formatNumber(result.totalRecipients);
  elements.payoutRewardTotal.textContent = `${formatNumber(result.totalRewardedAmount)} H`;
  elements.payoutLastRewardedAt.textContent = formatDateTime(result.lastRewardedAt);
  elements.payoutResultMeta.textContent = `${formatText(result.seasonLabel)} 기준 ${formatNumber(result.totalRecipients)}명 지급 완료`;
}

async function refreshPayoutReport() {
  const season = getSelectedSeason();
  const seasonLabel = getSelectedSeasonLabel();
  const limit = Math.max(0, Math.floor(Number(elements.payoutLimit.value) || 0));

  elements.payoutLoadButton.disabled = true;
  elements.payoutRefreshButton.disabled = true;
  elements.payoutStatus.textContent = "지급 완료 내역을 불러오는 중...";
  renderEmptyRow("지급 내역을 불러오는 중입니다.");

  try {
    const result = await runAdminActionRequest("season-payout-report", {
      season,
      seasonLabel,
      limit
    });

    applySummary(result);
    renderPayoutRows(result.recipients);
    elements.payoutStatus.textContent = `${formatText(result.seasonLabel)} 지급 내역을 불러왔습니다.`;
  } catch (error) {
    console.error(error);
    elements.payoutStatus.textContent = formatText(error?.message, "지급 내역을 불러오지 못했습니다.");
    elements.payoutRecipientCount.textContent = "-";
    elements.payoutRewardTotal.textContent = "-";
    elements.payoutLastRewardedAt.textContent = "-";
    elements.payoutResultMeta.textContent = "불러오기에 실패했습니다.";
    renderEmptyRow(formatText(error?.message, "지급 내역을 불러오지 못했습니다."));
  } finally {
    elements.payoutLoadButton.disabled = false;
    elements.payoutRefreshButton.disabled = false;
  }
}

async function bootstrapPayoutPage() {
  try {
    await requireAuthorizedAdmin();
  } catch (error) {
    console.warn("관리자 지급 내역 페이지 접근이 차단되었습니다.", error);
    return;
  }

  populateSeasonSelect();
  elements.payoutLoadButton?.addEventListener("click", () => {
    void refreshPayoutReport();
  });
  elements.payoutRefreshButton?.addEventListener("click", () => {
    void refreshPayoutReport();
  });

  await refreshPayoutReport();
}

void bootstrapPayoutPage();
