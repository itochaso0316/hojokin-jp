/**
 * Cloudflare Workers エントリーポイント
 * - 静的ファイル配信（Cloudflare Pages）
 * - 国税庁法人番号API プロキシ（CORS回避）
 * - 将来的にD1からデータを返すAPI
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // APIエンドポイント
    if (url.pathname.startsWith("/api/")) {
      return handleAPI(request, env, url);
    }

    // 静的ファイルはCloudflare Pagesで配信
    return new Response("Not Found", { status: 404 });
  },
};

async function handleAPI(request, env, url) {
  const headers = { "Content-Type": "application/json", ...CORS_HEADERS };

  // ================================================================
  // GET /api/corp/number?number=1234567890123
  // 法人番号（13桁）から会社情報を取得
  // ================================================================
  if (url.pathname === "/api/corp/number" && request.method === "GET") {
    const number = url.searchParams.get("number") || "";

    // バリデーション: 13桁の数字
    if (!/^\d{13}$/.test(number)) {
      return Response.json(
        { ok: false, error: "法人番号は13桁の数字で入力してください" },
        { status: 400, headers }
      );
    }

    try {
      const appId = env.NTA_APP_ID || "";
      if (!appId) {
        return Response.json(
          { ok: false, error: "国税庁APIのアプリケーションIDが設定されていません" },
          { status: 500, headers }
        );
      }

      const apiUrl = `https://api.houjin-bangou.nta.go.jp/4/num?id=${appId}&number=${number}&type=12&history=0`;
      const resp = await fetch(apiUrl);
      const xml = await resp.text();
      const corps = parseCorpXML(xml);

      return Response.json({ ok: true, data: corps }, { headers });
    } catch (e) {
      return Response.json(
        { ok: false, error: "法人情報の取得に失敗しました: " + e.message },
        { status: 500, headers }
      );
    }
  }

  // ================================================================
  // GET /api/corp/name?name=会社名
  // 会社名から法人情報を検索（最大10件）
  // ================================================================
  if (url.pathname === "/api/corp/name" && request.method === "GET") {
    const name = url.searchParams.get("name") || "";

    if (!name || name.length < 2) {
      return Response.json(
        { ok: false, error: "会社名を2文字以上入力してください" },
        { status: 400, headers }
      );
    }

    try {
      const appId = env.NTA_APP_ID || "";
      if (!appId) {
        return Response.json(
          { ok: false, error: "国税庁APIのアプリケーションIDが設定されていません" },
          { status: 500, headers }
        );
      }

      const encodedName = encodeURIComponent(name);
      const apiUrl = `https://api.houjin-bangou.nta.go.jp/4/name?id=${appId}&name=${encodedName}&type=12&mode=2&target=1&close=0`;
      const resp = await fetch(apiUrl);
      const xml = await resp.text();
      const corps = parseCorpXML(xml);

      // 最大10件に制限
      return Response.json({ ok: true, data: corps.slice(0, 10) }, { headers });
    } catch (e) {
      return Response.json(
        { ok: false, error: "法人検索に失敗しました: " + e.message },
        { status: 500, headers }
      );
    }
  }

  // ================================================================
  // GET /api/hojokin?pref=東京都&employees=10
  // 補助金データ取得（D1連携・将来用）
  // ================================================================
  if (url.pathname === "/api/hojokin" && request.method === "GET") {
    const pref = url.searchParams.get("pref") || "";

    try {
      let query = "SELECT * FROM hojokin WHERE structured = 1";
      const params = [];

      if (pref) {
        query += " AND (prefecture = ? OR prefecture LIKE '%全国%')";
        params.push(pref);
      }

      query += " ORDER BY max_amount DESC LIMIT 50";

      const result = await env.DB.prepare(query).bind(...params).all();
      return Response.json({ ok: true, data: result.results }, { headers });
    } catch (e) {
      return Response.json({ ok: false, error: e.message }, { status: 500, headers });
    }
  }

  return Response.json({ ok: false, error: "Not Found" }, { status: 404, headers });
}

/**
 * 国税庁API XML レスポンスをパースして法人情報配列に変換
 * XML形式 (type=12) のレスポンスを処理
 */
function parseCorpXML(xml) {
  const corps = [];

  // <corporation> 要素を正規表現で抽出
  const corpRegex = /<corporation>([\s\S]*?)<\/corporation>/g;
  let match;

  while ((match = corpRegex.exec(xml)) !== null) {
    const block = match[1];
    corps.push({
      corporateNumber: extractTag(block, "corporateNumber"),
      name: extractTag(block, "name"),
      prefectureName: extractTag(block, "prefectureName"),
      cityName: extractTag(block, "cityName"),
      streetNumber: extractTag(block, "streetNumber"),
      postCode: extractTag(block, "postCode"),
      // フルアドレスを組み立て
      address: [
        extractTag(block, "prefectureName"),
        extractTag(block, "cityName"),
        extractTag(block, "streetNumber"),
      ].filter(Boolean).join(""),
    });
  }

  return corps;
}

function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([^<]*)</${tagName}>`);
  const m = xml.match(regex);
  return m ? m[1].trim() : "";
}
