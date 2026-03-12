# hojokin-jp 🏛️

**日本全国47都道府県の企業向け補助金・助成金チェッカー**

都道府県・従業員数・業種を入力するだけで、対象の補助金・助成金をすぐに確認できます。

---

## ✨ 機能

- 47都道府県 ＋ 国の補助金・助成金を一括検索
- チェックリスト形式で簡単に絞り込み
- 補助金申請エージェントへの送客（アフィリエイト）
- 週次自動クロールでデータを最新に維持

---

## 🏗️ 技術構成

| 用途 | 技術 |
|------|------|
| フロント | HTML + CSS + Vanilla JS |
| ホスティング | Cloudflare Pages / Workers |
| DB | SQLite (ローカル) / Cloudflare D1 (本番) |
| クロール | Python + urllib (標準ライブラリ) |
| 構造化 | Claude Haiku API (バッチのみ) |
| 自動クロール | OpenClaw cron (週次) |

---

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/itochaso0316/hojokin-jp.git
cd hojokin-jp
```

### 2. 環境変数の設定

```bash
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定
```

`.env` ファイル:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 3. クロール実行（Phase 1: 47都道府県）

```bash
# テスト（最初の3件だけ）
python scripts/crawl.py --limit 3

# 全件クロール（約5分、robots.txt準拠で2秒待機）
python scripts/crawl.py
```

### 4. データ構造化（Claude Haiku）

```bash
# テスト（10件）
python scripts/structure.py --limit 10 --dry-run

# 本番実行
python scripts/structure.py
```

### 5. Web確認（ローカル）

```bash
# ブラウザで直接開く
open web/index.html

# または簡易サーバー起動
cd web && python -m http.server 8080
# → http://localhost:8080
```

### 6. Cloudflare Pagesにデプロイ

```bash
# Wrangler インストール
npm install -g wrangler
wrangler login

# D1データベース作成
wrangler d1 create hojokin-jp
# → 出力されたdatabase_idをwrangler.tomlに設定

# Pages デプロイ
wrangler pages deploy web/ --project-name hojokin-jp
```

---

## 📁 ファイル構成

```
hojokin-jp/
├── README.md
├── .gitignore
├── wrangler.toml          # Cloudflare Workers設定
├── scripts/
│   ├── crawl.py           # 47都道府県クロール
│   └── structure.py       # Claude Haikuで構造化
├── data/
│   ├── prefectures.json   # 47都道府県リスト（クロール対象URL）
│   └── hojokin.db         # SQLite DB（gitignore）
└── web/
    ├── index.html         # トップページ
    ├── style.css          # スタイル
    ├── app.js             # フロントロジック
    └── worker.js          # Cloudflare Workers (API)
```

---

## 💰 収益モデル

1. **送客アフィリエイト**（メイン）- 補助金申請エージェントへの紹介料
2. **Google AdSense**（サブ）
3. **有料コンテンツ**（将来）

---

## 📊 コスト試算

| フェーズ | 対象 | 月コスト |
|---------|------|---------|
| Phase 1 | 47都道府県 | 約500円/月 |
| Phase 2 | 全国1741市区町村 | 約5,000円/月 |

ユーザーが増えてもコスト固定（ルールベースマッチング）。

---

## ⚠️ 注意事項

- クロールは robots.txt を遵守（2秒待機）
- 補助金情報は定期的に変わるため、申請前に必ず公式サイトで確認
- Claude APIはバッチ処理のみ使用（ユーザーリクエスト時はAPI不使用）

---

## 🗺️ ロードマップ

- [x] Phase 1: 47都道府県クロール・構造化・Web UI
- [ ] ドメイン取得（hojokin-jp.info 等）
- [ ] お問い合わせフォーム → 申請エージェントへの送客
- [ ] Phase 2: 全国1741市区町村対応
- [ ] SEO強化・記事コンテンツ追加
