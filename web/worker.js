/**
 * Cloudflare Workers エントリーポイント
 * 静的ファイルの配信 + 将来的にD1からデータを返すAPI
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // APIエンドポイント（将来拡張用）
    if (url.pathname.startsWith("/api/")) {
      return handleAPI(request, env, url);
    }

    // 静的ファイルはCloudflare Pagesで配信（Workers Sitesは非推奨）
    return new Response("Not Found", { status: 404 });
  },
};

async function handleAPI(request, env, url) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // GET /api/hojokin?pref=東京都&employees=10
  if (url.pathname === "/api/hojokin" && request.method === "GET") {
    const pref = url.searchParams.get("pref") || "";
    const employees = parseInt(url.searchParams.get("employees")) || 0;

    try {
      // D1からデータ取得（DBバインディング設定後に有効化）
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
