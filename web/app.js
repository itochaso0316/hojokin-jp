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
// 業種チップ + フィルターチップ（共通ロジック）
// ============================================================
function initIndustryChips() {
  // 業種チップ
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

  // 事業ステージ・利用目的チップ（filter-chip共通）
  document.querySelectorAll(".filter-chip").forEach(label => {
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
  const keyword = (document.getElementById("keyword-search").value || "").trim();

  const checkedIndustries = Array.from(
    document.querySelectorAll(".industry-check:checked")
  ).map(cb => cb.value);

  const checkedStages = Array.from(
    document.querySelectorAll(".stage-check:checked")
  ).map(cb => cb.value);

  const checkedPurposes = Array.from(
    document.querySelectorAll(".purpose-check:checked")
  ).map(cb => cb.value);

  const results = filterHojokin({
    pref, regionFilter, employees, industries: checkedIndustries,
    stages: checkedStages, purposes: checkedPurposes, keyword
  });
  currentResults = results;

  sortResults();
  renderResults(currentResults);

  const resultsSection = document.getElementById("results-section");
  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

// 同義語マッピング（グローバルで共有）
const PURPOSE_SYNONYMS = {
  "DX": ["dx","デジタル","it","ict","情報","システム","ai","iot"],
  "設備投資": ["設備","機械","導入","整備"],
  "研究開発": ["研究","開発","r&d","実用化","技術"],
  "人材育成": ["人材","雇用","採用","研修","育成","女性活躍"],
  "賃上げ": ["賃上げ","賃金","給与","給料","環境整備"],
  "販路開拓": ["販路","海外","輸出","展示","マーケティング","販売"],
  "省エネ": ["省エネ","環境","グリーン","脱炭素","再エネ","電気料金","エネルギー"],
  "観光": ["観光","宿泊","旅行","インバウンド","コンベンション"],
};

// 直近の検索条件を保存（マッチ理由表示用）
let lastSearchParams = {};

function filterHojokin({ pref, regionFilter, employees, industries, stages, purposes, keyword }) {
  lastSearchParams = { pref, regionFilter, employees, industries, stages, purposes, keyword };
  const source = typeof HOJOKIN_DATA !== "undefined" ? HOJOKIN_DATA : [];

  const results = [];
  for (const item of source) {
    const matchReasons = [];

    // 地方フィルター
    if (regionFilter && REGIONS[regionFilter]) {
      if (!REGIONS[regionFilter].includes(item.prefecture)) continue;
      const regionNames = { hokkaido:"北海道", tohoku:"東北", kanto:"関東", chubu:"中部", kinki:"近畿", chugoku:"中国", shikoku:"四国", kyushu:"九州・沖縄" };
      matchReasons.push({ type: "region", label: `${regionNames[regionFilter] || regionFilter}地方`, icon: "&#x1F4CD;" });
    } else if (pref) {
      if (item.prefecture !== pref) continue;
      matchReasons.push({ type: "pref", label: `${pref}の補助金`, icon: "&#x1F4CD;" });
    }

    // 業種フィルター
    if (industries.length > 0) {
      const matched = industries.filter(ind =>
        (item.industries || []).includes(ind) || (item.industries || []).includes("その他")
      );
      if (matched.length === 0) continue;
      matchReasons.push({ type: "industry", label: `業種: ${matched.join("・")}`, icon: "&#x1F3ED;" });
    }

    // 事業ステージフィルター
    if (stages.length > 0) {
      const text = `${item.target || ""} ${item.summary || ""} ${item.name || ""}`.toLowerCase();
      const matched = stages.filter(stage => text.includes(stage.toLowerCase()));
      if (matched.length === 0) continue;
      matchReasons.push({ type: "stage", label: `ステージ: ${matched.join("・")}`, icon: "&#x1F3AF;" });
    }

    // 利用目的フィルター
    if (purposes.length > 0) {
      const text = `${item.name || ""} ${item.summary || ""} ${item.target || ""}`.toLowerCase();
      const matched = purposes.filter(purpose => {
        const words = PURPOSE_SYNONYMS[purpose] || [purpose.toLowerCase()];
        return words.some(w => text.includes(w));
      });
      if (matched.length === 0) continue;
      // マッチした具体的なキーワードも表示
      const details = matched.map(purpose => {
        const words = PURPOSE_SYNONYMS[purpose] || [purpose.toLowerCase()];
        const hit = words.find(w => text.includes(w));
        return hit && hit !== purpose.toLowerCase() ? `${purpose}（"${hit}"に該当）` : purpose;
      });
      matchReasons.push({ type: "purpose", label: `目的: ${details.join("・")}`, icon: "&#x1F4A1;" });
    }

    // フリーワード検索
    if (keyword) {
      const text = `${item.name || ""} ${item.summary || ""} ${item.target || ""} ${item.prefecture || ""}`.toLowerCase();
      const keywords = keyword.toLowerCase().split(/[\s　,、]+/).filter(Boolean);
      const allMatch = keywords.every(kw => text.includes(kw));
      if (!allMatch) continue;
      matchReasons.push({ type: "keyword", label: `キーワード「${keyword}」にマッチ`, icon: "&#x1F50D;" });
    }

    // マッチ理由を item に付与
    item._matchReasons = matchReasons;
    item._matchScore = matchReasons.length;
    results.push(item);
  }

  // マッチ理由が多い順にソート（デフォルト）
  results.sort((a, b) => b._matchScore - a._matchScore);
  return results;
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

  // マッチ理由バッジ
  const reasons = (item._matchReasons || []);
  const reasonsHtml = reasons.length > 0
    ? `<div class="match-reasons">
        <span class="match-label">&#x2705; マッチ理由:</span>
        ${reasons.map(r => `<span class="match-badge match-${r.type}">${r.icon} ${esc(r.label)}</span>`).join("")}
       </div>`
    : "";

  // 申請アドバイスを自動生成
  const advice = generateAdvice(item);

  return `
    <div class="hojokin-card" data-id="${item.id}" style="animation-delay:${index * 0.05}s">
      <div class="card-top">
        <h3>${esc(item.name)}</h3>
        <span class="badge-pref">${esc(item.prefecture)}</span>
      </div>
      ${reasonsHtml}
      <div class="card-tags">
        <span class="tag tag-amount">&#x1F4B0; ${amount}</span>
        <span class="tag tag-deadline">&#x1F4C5; ${esc(item.deadline || "要確認")}</span>
        <span class="tag tag-target">&#x1F3E2; ${esc(item.target || "中小企業")}</span>
      </div>
      <p class="card-summary">${esc(item.summary || "")}</p>
      <details class="card-advice-panel">
        <summary class="advice-toggle">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v5M10 6.5v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          申請のポイント・アドバイスを見る
        </summary>
        <div class="advice-body">
          ${advice}
        </div>
      </details>
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

// ============================================================
// 申請アドバイス自動生成
// ============================================================
function generateAdvice(item) {
  const tips = [];
  const text = `${item.name || ""} ${item.summary || ""} ${item.target || ""}`.toLowerCase();

  // 1. 対象者の適合性アドバイス
  if (item.target) {
    tips.push({
      icon: "&#x1F464;",
      title: "対象者の確認",
      body: `この補助金の対象は「${esc(item.target)}」です。自社がこの条件に当てはまるか、公式サイトで詳細な要件を必ず確認してください。`
    });
  }

  // 2. 申請期限アドバイス
  if (item.deadline && item.deadline !== "要確認") {
    const deadlineDate = new Date(item.deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 30) {
      tips.push({ icon: "&#x26A0;&#xFE0F;", title: "申請期限が近い！", body: `締切まであと${daysLeft}日です。書類準備を急ぎましょう。事業計画書の作成には通常2〜3週間かかります。` });
    } else if (daysLeft > 30) {
      tips.push({ icon: "&#x1F4C5;", title: "スケジュール", body: `締切は${item.deadline}です。余裕を持って1ヶ月前には書類を完成させましょう。` });
    } else {
      tips.push({ icon: "&#x1F6A8;", title: "期限切れの可能性", body: `記載の締切（${item.deadline}）を過ぎている可能性があります。次回公募がないか公式サイトを確認してください。` });
    }
  } else {
    tips.push({ icon: "&#x1F4C5;", title: "申請期限", body: "申請期限は「要確認」です。公式サイトで最新の公募スケジュールを確認してください。多くの補助金は年1〜2回の公募です。" });
  }

  // 3. 金額に関するアドバイス
  if (item.max_amount) {
    tips.push({ icon: "&#x1F4B0;", title: "補助金額", body: `上限${(item.max_amount / 10000).toLocaleString()}万円。実際の補助額は補助率（通常1/2〜2/3）で決まります。自己負担分の資金計画も立てておきましょう。` });
  } else {
    tips.push({ icon: "&#x1F4B0;", title: "金額確認", body: "補助金額の詳細は公式サイトで確認してください。補助率と上限額をあわせて確認し、自己負担額を把握しましょう。" });
  }

  // 4. カテゴリ別の具体的アドバイス
  if (text.includes("デジタル") || text.includes("it") || text.includes("dx") || text.includes("ict") || text.includes("ai")) {
    tips.push({ icon: "&#x1F4BB;", title: "DX・IT導入のポイント",
      body: "IT導入系の補助金では、導入するツールやシステムの「具体的な業務改善効果」を数値で示すことが重要です。例：「受注処理時間を50%短縮」「在庫管理コストを年間XX万円削減」など、Before/After を明確にしましょう。" });
  }
  if (text.includes("設備") || text.includes("機械") || text.includes("導入")) {
    tips.push({ icon: "&#x1F3ED;", title: "設備投資のポイント",
      body: "設備投資の補助金では、見積書を複数社から取得（相見積もり）することが原則必要です。また、補助金交付決定前の発注は対象外になる場合があるので、必ず交付決定を待ってから契約しましょう。" });
  }
  if (text.includes("創業") || text.includes("起業") || text.includes("スタートアップ")) {
    tips.push({ icon: "&#x1F680;", title: "創業支援のポイント",
      body: "創業系の補助金では、事業の新規性・独自性と、地域への経済効果をアピールすることが採択率アップにつながります。商工会議所やインキュベーション施設の支援を受けると評価が上がることもあります。" });
  }
  if (text.includes("賃上げ") || text.includes("賃金") || text.includes("雇用")) {
    tips.push({ icon: "&#x1F4B5;", title: "賃上げ・雇用関連のポイント",
      body: "賃上げ関連の補助金では、加点措置として「賃上げ計画」の提出が求められます。最低賃金+30円以上の引き上げ、給与総額の増加率など、具体的な数値目標を設定しましょう。" });
  }
  if (text.includes("省エネ") || text.includes("脱炭素") || text.includes("グリーン") || text.includes("エネルギー") || text.includes("電気")) {
    tips.push({ icon: "&#x1F33F;", title: "省エネ・環境対策のポイント",
      body: "省エネ補助金では、CO2削減量やエネルギー使用量の削減率を定量的に示す必要があります。導入前後のエネルギー消費データを準備し、投資回収年数も試算しておきましょう。" });
  }
  if (text.includes("販路") || text.includes("海外") || text.includes("輸出") || text.includes("マーケティング")) {
    tips.push({ icon: "&#x1F30D;", title: "販路開拓のポイント",
      body: "販路開拓の補助金では、ターゲット市場の分析と具体的な販売戦略が評価されます。展示会出展、ECサイト構築、海外展開など、実行可能なアクションプランを作成しましょう。" });
  }
  if (text.includes("観光") || text.includes("インバウンド") || text.includes("宿泊")) {
    tips.push({ icon: "&#x2708;&#xFE0F;", title: "観光・インバウンドのポイント",
      body: "観光関連の補助金では、地域の観光資源の活用と経済波及効果の見込みを示すことが大切です。多言語対応やデジタルプロモーションの計画を含めると評価が高まります。" });
  }
  if (text.includes("研究") || text.includes("開発") || text.includes("技術")) {
    tips.push({ icon: "&#x1F52C;", title: "研究開発のポイント",
      body: "研究開発の補助金では、技術的な新規性と事業化の見通しが重要です。大学や研究機関との連携体制があると加点される場合があります。知的財産戦略も計画に盛り込みましょう。" });
  }

  // 5. 共通アドバイス
  tips.push({ icon: "&#x1F4DD;", title: "申請の基本ステップ",
    body: `<ol class="advice-steps">
      <li>公式サイトで公募要領・申請書類をダウンロード</li>
      <li>GビズIDプライムの取得（未取得の場合、2〜3週間かかります）</li>
      <li>事業計画書の作成（認定支援機関の確認書が必要な場合あり）</li>
      <li>電子申請（jGrants等）で提出</li>
      <li>採択通知 → 交付決定 → 事業実施 → 実績報告 → 補助金受領</li>
    </ol>` });

  return tips.map(t => `
    <div class="advice-item">
      <div class="advice-item-header">
        <span class="advice-icon">${t.icon}</span>
        <strong>${t.title}</strong>
      </div>
      <div class="advice-text">${t.body}</div>
    </div>
  `).join("");
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
