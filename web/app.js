/**
 * hojokin-jp フロントエンドロジック
 * チェックリストの回答に基づいて補助金情報をフィルタリングして表示
 */

// ============================================================
// 実データ（crawl.py + structure.py で生成）
// data.js から読み込み
// ============================================================

// ============================================================
// 都道府県リスト
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

// ============================================================
// 初期化
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initPrefectureSelect();
  document.getElementById("btn-search").addEventListener("click", onSearch);
});

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
// 検索処理
// ============================================================
function onSearch() {
  const pref = document.getElementById("pref-select").value;
  const employees = parseInt(document.getElementById("employee-count").value) || 0;
  const checkedIndustries = Array.from(
    document.querySelectorAll(".industry-check:checked")
  ).map(cb => cb.value);

  const results = filterHojokin({ pref, employees, industries: checkedIndustries });
  renderResults(results);
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

function filterHojokin({ pref, employees, industries }) {
  const source = typeof HOJOKIN_DATA !== "undefined" ? HOJOKIN_DATA : [];
  return source.filter(item => {
    // 都道府県フィルター
    if (pref && item.prefecture !== pref) return false;

    // 業種フィルター（どれか1つ一致すればOK）
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
// 結果表示
// ============================================================
function renderResults(items) {
  const container = document.getElementById("results");

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <p>条件に合う補助金が見つかりませんでした。</p>
        <p style="margin-top:0.5rem;font-size:0.85rem;">条件を変えて再検索してみてください。</p>
      </div>`;
    return;
  }

  // 金額が大きい順にソート
  items.sort((a, b) => (b.max_amount || 0) - (a.max_amount || 0));

  const html = `
    <p class="result-count"><strong>${items.length}件</strong>の補助金・助成金が見つかりました</p>
    ${items.map(renderCard).join("")}
  `;
  container.innerHTML = html;
}

function renderCard(item) {
  const amount = item.max_amount
    ? `最大 ${(item.max_amount / 10000).toLocaleString()}万円`
    : "金額要確認";

  return `
    <div class="hojokin-card">
      <div class="card-header">
        <h3>${escHtml(item.name)}</h3>
        <span class="badge-pref">${escHtml(item.prefecture)}</span>
      </div>
      <div class="card-meta">
        <span>💰 ${amount}</span>
        <span>📅 ${escHtml(item.deadline || "要確認")}</span>
        <span>🏢 ${escHtml(item.target || "中小企業")}</span>
      </div>
      <p class="card-summary">${escHtml(item.summary || "")}</p>
      <div class="card-actions">
        <a href="${escHtml(item.url)}" target="_blank" rel="noopener" class="btn-detail">
          詳細を見る →
        </a>
        <a href="#consult" class="btn-consult" onclick="onConsult('${escHtml(item.name)}')">
          申請を相談する
        </a>
      </div>
    </div>
  `;
}

function onConsult(name) {
  // TODO: アフィリエイトリンクまたは問い合わせフォームへ
  alert(`「${name}」の申請相談ページは準備中です。\n近日公開予定！`);
  return false;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
