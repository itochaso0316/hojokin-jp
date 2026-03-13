/**
 * 助成金・補助金チェックサポーター
 * メインアプリケーションロジック
 * - 地方別フィルタリング
 * - 比較機能
 * - お気に入り機能
 * - ソート / 表示切替
 */

// ============================================================
// 定数
// ============================================================
const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const REGIONS = {
  hokkaido: ["北海道"],
  tohoku: ["青森県","岩手県","宮城県","秋田県","山形県","福島県"],
  kanto: ["茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県"],
  chubu: ["新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県"],
  kinki: ["三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県"],
  chugoku: ["鳥取県","島根県","岡山県","広島県","山口県"],
  shikoku: ["徳島県","香川県","愛媛県","高知県"],
  kyushu: ["福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"],
};

// ============================================================
// ステート
// ============================================================
let favorites = JSON.parse(localStorage.getItem("hojokin_favorites") || "[]");
let compareList = [];
let currentResults = [];
let currentView = "list";

// ============================================================
// 初期化
// ============================================================
// APIベースURL（Cloudflare Workers プロキシ）
// ローカルテスト時は "" にし、本番は自動検出
const API_BASE = location.hostname === "localhost" ? "" : "";

document.addEventListener("DOMContentLoaded", () => {
  initPrefectureSelect();
  initRegionChips();
  initIndustryChips();
  initNavbar();
  initViewToggle();
  initSortSelect();
  initCompare();
  initFavorites();
  initCorpLookup();

  document.getElementById("btn-search").addEventListener("click", onSearch);

  // ヒーローの補助金数を動的に設定
  const data = typeof HOJOKIN_DATA !== "undefined" ? HOJOKIN_DATA : [];
  const statEl = document.getElementById("stat-total");
  if (statEl && data.length) statEl.textContent = data.length;
});

// ============================================================
// 都道府県セレクト
// ============================================================
function initPrefectureSelect() {
  const sel = document.getElementById("pref-select");
  PREFECTURES.forEach(pref => {
    const opt = document.createElement("option");
    opt.value = pref;
    opt.textContent = pref;
    sel.appendChild(opt);
  });
}

// ============================================================
// 地方チップ
// ============================================================
function initRegionChips() {
  const chips = document.querySelectorAll(".region-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const wasActive = chip.classList.contains("active");
      chips.forEach(c => c.classList.remove("active"));
      const sel = document.getElementById("pref-select");

      if (wasActive) {
        sel.value = "";
      } else {
        chip.classList.add("active");
        const region = chip.dataset.region;
        const prefs = REGIONS[region] || [];
        // 地方の最初の都道府県をセレクトに設定（目安）
        // 実際の検索は地方全体で行う
        sel.value = prefs[0] || "";
        sel.dataset.regionFilter = region;
      }
      updateStepIndicator();
    });
  });

  document.getElementById("pref-select").addEventListener("change", () => {
    document.querySelectorAll(".region-chip").forEach(c => c.classList.remove("active"));
    document.getElementById("pref-select").dataset.regionFilter = "";
    updateStepIndicator();
  });
}

// ============================================================
// 業種チップ
// ============================================================
function initIndustryChips() {
  document.querySelectorAll(".industry-chip").forEach(label => {
    const cb = label.querySelector("input");
    label.addEventListener("click", (e) => {
      if (e.target === cb) return;
      cb.checked = !cb.checked;
      label.classList.toggle("checked", cb.checked);
      updateStepIndicator();
    });
    cb.addEventListener("change", () => {
      label.classList.toggle("checked", cb.checked);
      updateStepIndicator();
    });
  });
}

// ============================================================
// ステップインジケーター
// ============================================================
function updateStepIndicator() {
  const steps = document.querySelectorAll(".step");
  const prefVal = document.getElementById("pref-select").value;
  const industriesChecked = document.querySelectorAll(".industry-check:checked").length > 0;

  steps[0].classList.toggle("done", !!prefVal);
  steps[0].classList.toggle("active", !prefVal);
  steps[1].classList.toggle("done", industriesChecked);
  steps[1].classList.toggle("active", !!prefVal && !industriesChecked);
  steps[2].classList.toggle("active", !!prefVal || industriesChecked);
}

// ============================================================
// ナビゲーション
// ============================================================
function initNavbar() {
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("nav-hamburger");
  const links = document.querySelector(".nav-links");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });

  hamburger.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
}

// ============================================================
// 検索処理
// ============================================================
function onSearch() {
  const sel = document.getElementById("pref-select");
  const regionFilter = sel.dataset.regionFilter || "";
  const pref = sel.value;
  const employees = parseInt(document.getElementById("employee-count").value) || 0;
  const checkedIndustries = Array.from(
    document.querySelectorAll(".industry-check:checked")
  ).map(cb => cb.value);

  const results = filterHojokin({ pref, regionFilter, employees, industries: checkedIndustries });
  currentResults = results;

  sortResults();
  renderResults(currentResults);

  const resultsSection = document.getElementById("results-section");
  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

function filterHojokin({ pref, regionFilter, employees, industries }) {
  const source = typeof HOJOKIN_DATA !== "undefined" ? HOJOKIN_DATA : [];
  return source.filter(item => {
    // 地方フィルター
    if (regionFilter && REGIONS[regionFilter]) {
      if (!REGIONS[regionFilter].includes(item.prefecture)) return false;
    } else if (pref && item.prefecture !== pref) {
      return false;
    }

    // 業種フィルター
    if (industries.length > 0) {
      const hasMatch = industries.some(ind =>
        (item.industries || []).includes(ind) || (item.industries || []).includes("その他")
      );
      if (!hasMatch) return false;
    }

    return true;
  });
}

// ============================================================
// ソート
// ============================================================
function initSortSelect() {
  document.getElementById("sort-select").addEventListener("change", () => {
    sortResults();
    renderResults(currentResults);
  });
}

function sortResults() {
  const sortBy = document.getElementById("sort-select").value;
  currentResults.sort((a, b) => {
    switch (sortBy) {
      case "amount-desc": return (b.max_amount || 0) - (a.max_amount || 0);
      case "amount-asc": return (a.max_amount || 0) - (b.max_amount || 0);
      case "name-asc": return (a.name || "").localeCompare(b.name || "");
      case "pref-asc": return (a.prefecture || "").localeCompare(b.prefecture || "");
      default: return 0;
    }
  });
}

// ============================================================
// 表示切替
// ============================================================
function initViewToggle() {
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.dataset.view;
      const list = document.getElementById("results");
      list.classList.toggle("grid-view", currentView === "grid");
    });
  });
}

// ============================================================
// 結果表示
// ============================================================
function renderResults(items) {
  const container = document.getElementById("results");
  const countEl = document.getElementById("results-count");

  countEl.innerHTML = `<strong>${items.length}件</strong>の補助金・助成金が見つかりました`;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">&#x1F50D;</div>
        <p>条件に合う補助金が見つかりませんでした。</p>
        <p style="margin-top:0.5rem;font-size:0.85rem;color:var(--text-muted);">条件を変えて再検索してみてください。</p>
      </div>`;
    return;
  }

  container.innerHTML = items.map((item, i) => renderCard(item, i)).join("");
  container.classList.toggle("grid-view", currentView === "grid");

  // イベント再バインド
  bindCardEvents();
}

function renderCard(item, index) {
  const amount = item.max_amount
    ? `${(item.max_amount / 10000).toLocaleString()}万円`
    : "金額要確認";
  const isFav = favorites.includes(item.id);
  const isComp = compareList.includes(item.id);

  return `
    <div class="hojokin-card" data-id="${item.id}" style="animation-delay:${index * 0.05}s">
      <div class="card-top">
        <h3>${esc(item.name)}</h3>
        <span class="badge-pref">${esc(item.prefecture)}</span>
      </div>
      <div class="card-tags">
        <span class="tag tag-amount">&#x1F4B0; ${amount}</span>
        <span class="tag tag-deadline">&#x1F4C5; ${esc(item.deadline || "要確認")}</span>
        <span class="tag tag-target">&#x1F3E2; ${esc(item.target || "中小企業")}</span>
      </div>
      <p class="card-summary">${esc(item.summary || "")}</p>
      <div class="card-actions">
        <a href="${esc(item.url)}" target="_blank" rel="noopener" class="btn-detail">
          詳細を見る
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </a>
        <button class="btn-consult" onclick="onConsult('${esc(item.name)}')">申請を相談する</button>
        <div class="card-icon-btns">
          <button class="icon-btn btn-fav ${isFav ? 'favorited' : ''}" data-id="${item.id}" title="お気に入り">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <button class="icon-btn btn-comp ${isComp ? 'compared' : ''}" data-id="${item.id}" title="比較に追加">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19V6l12-3v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function bindCardEvents() {
  document.querySelectorAll(".btn-fav").forEach(btn => {
    btn.addEventListener("click", () => toggleFavorite(parseInt(btn.dataset.id)));
  });
  document.querySelectorAll(".btn-comp").forEach(btn => {
    btn.addEventListener("click", () => toggleCompare(parseInt(btn.dataset.id)));
  });
}

// ============================================================
// お気に入り
// ============================================================
function initFavorites() {
  updateFavBadge();
  document.getElementById("fab-favorites").addEventListener("click", toggleFavPanel);
  document.getElementById("panel-close").addEventListener("click", toggleFavPanel);
}

function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("hojokin_favorites", JSON.stringify(favorites));
  updateFavBadge();

  // カード内のボタン更新
  document.querySelectorAll(`.btn-fav[data-id="${id}"]`).forEach(btn => {
    const isFav = favorites.includes(id);
    btn.classList.toggle("favorited", isFav);
    btn.querySelector("svg").setAttribute("fill", isFav ? "currentColor" : "none");
  });
}

function updateFavBadge() {
  const fab = document.getElementById("fab-favorites");
  const badge = document.getElementById("fab-badge");
  fab.style.display = favorites.length > 0 ? "flex" : "none";
  badge.textContent = favorites.length;
}

function toggleFavPanel() {
  const panel = document.getElementById("favorites-panel");
  const isOpen = panel.style.display !== "none";
  panel.style.display = isOpen ? "none" : "flex";
  if (!isOpen) renderFavorites();
}

function renderFavorites() {
  const container = document.getElementById("favorites-list");
  const source = typeof HOJOKIN_DATA !== "undefined" ? HOJOKIN_DATA : [];
  const favItems = source.filter(item => favorites.includes(item.id));

  if (favItems.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">お気に入りはありません</p>';
    return;
  }

  container.innerHTML = favItems.map(item => `
    <div class="fav-card">
      <h4>${esc(item.name)}</h4>
      <p>${esc(item.prefecture)} | ${item.max_amount ? (item.max_amount / 10000).toLocaleString() + '万円' : '金額要確認'}</p>
      <button class="fav-remove" onclick="removeFavorite(${item.id})">削除する</button>
    </div>
  `).join("");
}

function removeFavorite(id) {
  toggleFavorite(id);
  renderFavorites();
}

// ============================================================
// 比較機能
// ============================================================
function initCompare() {
  document.getElementById("btn-compare").addEventListener("click", showCompareModal);
  document.getElementById("btn-compare-clear").addEventListener("click", clearCompare);
  document.getElementById("modal-close").addEventListener("click", closeCompareModal);
  document.getElementById("compare-modal").addEventListener("click", (e) => {
    if (e.target.id === "compare-modal") closeCompareModal();
  });
}

function toggleCompare(id) {
  const idx = compareList.indexOf(id);
  if (idx >= 0) {
    compareList.splice(idx, 1);
  } else {
    if (compareList.length >= 5) {
      alert("比較できるのは最大5件です。");
      return;
    }
    compareList.push(id);
  }
  updateCompareBar();

  document.querySelectorAll(`.btn-comp[data-id="${id}"]`).forEach(btn => {
    btn.classList.toggle("compared", compareList.includes(id));
  });
}

function updateCompareBar() {
  const bar = document.getElementById("compare-bar");
  const count = document.getElementById("compare-count");
  bar.style.display = compareList.length > 0 ? "block" : "none";
  count.textContent = compareList.length;
}

function clearCompare() {
  compareList = [];
  updateCompareBar();
  document.querySelectorAll(".btn-comp").forEach(btn => btn.classList.remove("compared"));
}

function showCompareModal() {
  if (compareList.length < 2) {
    alert("2件以上選択してください。");
    return;
  }
  const source = typeof HOJOKIN_DATA !== "undefined" ? HOJOKIN_DATA : [];
  const items = source.filter(item => compareList.includes(item.id));

  const headers = items.map(item => `<th style="min-width:180px;">${esc(item.name)}</th>`).join("");
  const rows = [
    { label: "都道府県", key: "prefecture" },
    { label: "上限金額", fn: (item) => item.max_amount ? (item.max_amount / 10000).toLocaleString() + "万円" : "要確認" },
    { label: "締切", key: "deadline" },
    { label: "対象", key: "target" },
    { label: "業種", fn: (item) => (item.industries || []).join(", ") },
    { label: "概要", key: "summary" },
  ];

  const tableRows = rows.map(row => {
    const cells = items.map(item => {
      const val = row.fn ? row.fn(item) : (item[row.key] || "—");
      return `<td>${esc(val)}</td>`;
    }).join("");
    return `<tr><td style="font-weight:600;white-space:nowrap;background:var(--bg);">${row.label}</td>${cells}</tr>`;
  }).join("");

  document.getElementById("compare-table-container").innerHTML = `
    <table class="compare-table">
      <thead><tr><th>項目</th>${headers}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;

  document.getElementById("compare-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeCompareModal() {
  document.getElementById("compare-modal").style.display = "none";
  document.body.style.overflow = "";
}

// ============================================================
// 申請相談
// ============================================================
function onConsult(name) {
  alert(`「${name}」の申請相談ページは準備中です。\n近日公開予定！`);
  return false;
}

// ============================================================
// 法人番号・会社名 検索機能
// ============================================================
let selectedCorp = null;

function initCorpLookup() {
  // トグル開閉
  const toggle = document.getElementById("corp-toggle");
  const body = document.getElementById("corp-lookup-body");
  toggle.addEventListener("click", () => {
    const isOpen = body.style.display !== "none";
    body.style.display = isOpen ? "none" : "block";
    toggle.setAttribute("aria-expanded", !isOpen);
    toggle.querySelector("svg").style.transform = isOpen ? "" : "rotate(180deg)";
  });

  // タブ切り替え
  document.querySelectorAll(".corp-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".corp-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".corp-tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
      clearCorpState();
    });
  });

  // 法人番号検索ボタン
  document.getElementById("btn-corp-number").addEventListener("click", searchByNumber);
  document.getElementById("corp-number").addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchByNumber();
  });

  // 会社名検索ボタン
  document.getElementById("btn-corp-name").addEventListener("click", searchByName);
  document.getElementById("corp-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchByName();
  });

  // 反映ボタン
  document.getElementById("btn-corp-apply").addEventListener("click", applyCorpInfo);
}

function clearCorpState() {
  selectedCorp = null;
  document.getElementById("corp-result").style.display = "none";
  document.getElementById("corp-error").style.display = "none";
  document.getElementById("corp-candidates").style.display = "none";
}

function showCorpLoading(show) {
  document.getElementById("corp-loading").style.display = show ? "flex" : "none";
}

function showCorpError(msg) {
  const el = document.getElementById("corp-error");
  el.textContent = msg;
  el.style.display = "block";
  document.getElementById("corp-result").style.display = "none";
}

function showCorpResult(corp) {
  selectedCorp = corp;
  document.getElementById("corp-result-name").textContent = corp.name;
  document.getElementById("corp-result-meta").innerHTML = `
    <span>法人番号: ${esc(corp.corporateNumber)}</span>
    <span>所在地: ${esc(corp.address)}</span>
  `;
  document.getElementById("corp-result").style.display = "block";
  document.getElementById("corp-error").style.display = "none";
}

async function searchByNumber() {
  const number = document.getElementById("corp-number").value.replace(/[^0-9]/g, "");
  if (number.length !== 13) {
    showCorpError("法人番号は13桁の数字で入力してください。");
    return;
  }

  clearCorpState();
  showCorpLoading(true);

  try {
    const resp = await fetch(`${API_BASE}/api/corp/number?number=${number}`);
    const json = await resp.json();

    if (!json.ok || !json.data || json.data.length === 0) {
      showCorpError(json.error || "法人情報が見つかりませんでした。");
      return;
    }

    showCorpResult(json.data[0]);
  } catch (e) {
    showCorpError("通信エラーが発生しました。ネットワーク接続を確認してください。");
  } finally {
    showCorpLoading(false);
  }
}

async function searchByName() {
  const name = document.getElementById("corp-name").value.trim();
  if (name.length < 2) {
    showCorpError("会社名を2文字以上入力してください。");
    return;
  }

  clearCorpState();
  showCorpLoading(true);

  try {
    const resp = await fetch(`${API_BASE}/api/corp/name?name=${encodeURIComponent(name)}`);
    const json = await resp.json();

    if (!json.ok || !json.data || json.data.length === 0) {
      showCorpError(json.error || "該当する法人が見つかりませんでした。");
      return;
    }

    // 1件ならそのまま表示、複数なら候補リスト
    if (json.data.length === 1) {
      showCorpResult(json.data[0]);
    } else {
      showCorpCandidates(json.data);
    }
  } catch (e) {
    showCorpError("通信エラーが発生しました。ネットワーク接続を確認してください。");
  } finally {
    showCorpLoading(false);
  }
}

function showCorpCandidates(corps) {
  const container = document.getElementById("corp-candidates");
  container.innerHTML = `
    <p class="candidates-label">${corps.length}件の候補が見つかりました。選択してください:</p>
    ${corps.map((corp, i) => `
      <div class="candidate-item" data-index="${i}">
        <strong>${esc(corp.name)}</strong>
        <span>${esc(corp.address)}</span>
        <span class="candidate-num">${esc(corp.corporateNumber)}</span>
      </div>
    `).join("")}
  `;
  container.style.display = "block";

  // 候補クリックイベント
  container.querySelectorAll(".candidate-item").forEach(item => {
    item.addEventListener("click", () => {
      const idx = parseInt(item.dataset.index);
      showCorpResult(corps[idx]);
      container.style.display = "none";
    });
  });
}

function applyCorpInfo() {
  if (!selectedCorp) return;

  // 都道府県を自動設定
  const prefName = selectedCorp.prefectureName;
  if (prefName) {
    const sel = document.getElementById("pref-select");
    // prefectureName は「東京都」「大阪府」等の形式
    const matchPref = PREFECTURES.find(p => p === prefName || prefName.startsWith(p.replace(/[都道府県]$/, "")));
    if (matchPref) {
      sel.value = matchPref;
      sel.dataset.regionFilter = "";
      // 地方チップをクリア
      document.querySelectorAll(".region-chip").forEach(c => c.classList.remove("active"));
      updateStepIndicator();
    }
  }

  // 適用完了をビジュアルフィードバック
  const applyBtn = document.getElementById("btn-corp-apply");
  const origText = applyBtn.textContent;
  applyBtn.textContent = "反映しました!";
  applyBtn.style.background = "var(--success)";
  setTimeout(() => {
    applyBtn.textContent = origText;
    applyBtn.style.background = "";
  }, 2000);

  // スクロールして都道府県フォームへ
  document.querySelector(".step-indicator").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
// ユーティリティ
// ============================================================
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
