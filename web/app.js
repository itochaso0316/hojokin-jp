/**
 * hojokin-jp フロントエンドロジック
 * チェックリストの回答に基づいて補助金情報をフィルタリングして表示
 */

// ============================================================
// モックデータ（crawl.py + structure.py で生成した本物に差し替え）
// ============================================================
const SAMPLE_DATA = [
  {
    id: 1, prefecture: "東京都", name: "東京都中小企業振興公社 経営革新助成金",
    target: "都内中小企業・スタートアップ", max_amount: 2000000,
    deadline: "2025年3月31日", url: "https://www.tokyo-kosha.or.jp/",
    summary: "新製品・新サービス開発、生産性向上に取り組む中小企業を支援",
    employee_min: 1, employee_max: 300, industry: ["製造業", "IT・情報通信", "サービス業"],
  },
  {
    id: 2, prefecture: "東京都", name: "東京都スタートアップ加速化助成事業",
    target: "創業5年以内のスタートアップ", max_amount: 15000000,
    deadline: "随時", url: "https://www.tokyo-kosha.or.jp/",
    summary: "革新的なビジネスモデルで急成長を目指すスタートアップへの助成",
    employee_min: 1, employee_max: 50, industry: ["IT・情報通信", "バイオ・医療", "その他"],
  },
  {
    id: 3, prefecture: "神奈川県", name: "かながわ中小企業成長支援補助金",
    target: "県内中小企業", max_amount: 5000000,
    deadline: "2025年6月30日", url: "https://www.pref.kanagawa.jp/",
    summary: "設備投資・IT化・海外展開を行う中小企業に最大500万円補助",
    employee_min: 1, employee_max: 300, industry: ["製造業", "建設業", "小売業"],
  },
  {
    id: 4, prefecture: "大阪府", name: "大阪府中小企業・小規模企業者等設備投資補助金",
    target: "府内中小企業・小規模事業者", max_amount: 3000000,
    deadline: "2025年2月28日", url: "https://www.pref.osaka.lg.jp/",
    summary: "生産設備・IT設備への投資を支援、補助率1/2以内",
    employee_min: 1, employee_max: 300, industry: ["製造業", "卸売業", "小売業"],
  },
  {
    id: 5, prefecture: "全国（国）", name: "IT導入補助金（デジタル化基盤導入枠）",
    target: "中小企業・小規模事業者", max_amount: 3500000,
    deadline: "随時（年数回）", url: "https://www.it-hojo.jp/",
    summary: "会計・受発注・決済・EC機能を持つITツール導入を支援",
    employee_min: 1, employee_max: 300, industry: ["製造業", "IT・情報通信", "サービス業", "小売業", "卸売業", "飲食業", "その他"],
  },
  {
    id: 6, prefecture: "全国（国）", name: "ものづくり・商業・サービス生産性向上促進補助金",
    target: "中小企業・小規模事業者", max_amount: 12500000,
    deadline: "年数回（公募期間あり）", url: "https://portal.monodukuri-hojo.jp/",
    summary: "生産性向上・イノベーション投資に最大1,250万円補助",
    employee_min: 1, employee_max: 300, industry: ["製造業", "サービス業", "その他"],
  },
  {
    id: 7, prefecture: "全国（国）", name: "小規模事業者持続化補助金",
    target: "小規模事業者（従業員20名以下）", max_amount: 2000000,
    deadline: "年数回（公募期間あり）", url: "https://s23.jizokukahojokin.info/",
    summary: "販路開拓・業務効率化に取り組む小規模事業者への補助",
    employee_min: 1, employee_max: 20, industry: ["製造業", "小売業", "サービス業", "飲食業", "その他"],
  },
  {
    id: 8, prefecture: "愛知県", name: "愛知県中小企業デジタル化支援補助金",
    target: "県内中小企業", max_amount: 1000000,
    deadline: "2025年4月30日", url: "https://www.pref.aichi.jp/",
    summary: "業務システム・ECサイト・テレワーク環境整備を支援",
    employee_min: 1, employee_max: 300, industry: ["製造業", "IT・情報通信", "サービス業", "小売業"],
  },
];

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
  return SAMPLE_DATA.filter(item => {
    // 都道府県フィルター（全国対応・都道府県一致）
    if (pref) {
      const isNational = item.prefecture.includes("全国");
      const isPrefMatch = item.prefecture === pref;
      if (!isNational && !isPrefMatch) return false;
    }

    // 従業員数フィルター
    if (employees > 0) {
      if (employees < item.employee_min || employees > item.employee_max) return false;
    }

    // 業種フィルター（どれか1つ一致すればOK）
    if (industries.length > 0) {
      const hasMatch = industries.some(ind => item.industry.includes(ind));
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
