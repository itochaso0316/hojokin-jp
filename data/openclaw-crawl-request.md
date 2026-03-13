# OpenClaw クロールリクエスト — 市町村レベル補助金データ収集

## リクエスト日: 2026-03-13
## リクエスト元: MacBook Pro (Claude Cowork)
## 実行先: Mac Mini (OpenClaw)

---

## 1. 背景・目的

現在 hojokin-jp は 47都道府県の補助金データ（72件）を保有しているが、
市町村レベルの補助金・助成金はカバーできていない。
実際には市区町村独自の補助金が多数存在し、ユーザーにとってより具体的な情報となる。

**目標**: 主要市区町村（政令指定都市20市 + 中核市62市 + 東京23区 = 約105自治体）の
補助金データを段階的にクロールし、データベースに追加する。

---

## 2. クロール対象（Phase 1: 政令指定都市 + 東京23区）

### 2-1. 政令指定都市（20市）

| 都道府県 | 市名 | 想定クロールURL |
|---------|------|---------------|
| 北海道 | 札幌市 | https://www.city.sapporo.jp/keizai/ |
| 宮城県 | 仙台市 | https://www.city.sendai.jp/jigyosha/ |
| 埼玉県 | さいたま市 | https://www.city.saitama.jp/006/ |
| 千葉県 | 千葉市 | https://www.city.chiba.jp/keizainosei/ |
| 神奈川県 | 横浜市 | https://www.city.yokohama.lg.jp/business/ |
| 神奈川県 | 川崎市 | https://www.city.kawasaki.jp/jigyou/ |
| 神奈川県 | 相模原市 | https://www.city.sagamihara.kanagawa.jp/business/ |
| 新潟県 | 新潟市 | https://www.city.niigata.lg.jp/business/ |
| 静岡県 | 静岡市 | https://www.city.shizuoka.lg.jp/s5830/ |
| 静岡県 | 浜松市 | https://www.city.hamamatsu.shizuoka.jp/sangyo/ |
| 愛知県 | 名古屋市 | https://www.city.nagoya.jp/keizai/ |
| 京都府 | 京都市 | https://www.city.kyoto.lg.jp/sankan/ |
| 大阪府 | 大阪市 | https://www.city.osaka.lg.jp/keizaisenryaku/ |
| 大阪府 | 堺市 | https://www.city.sakai.lg.jp/sangyo/ |
| 兵庫県 | 神戸市 | https://www.city.kobe.lg.jp/a89051/ |
| 岡山県 | 岡山市 | https://www.city.okayama.jp/jigyousha/ |
| 広島県 | 広島市 | https://www.city.hiroshima.lg.jp/sangyo/ |
| 福岡県 | 北九州市 | https://www.city.kitakyushu.lg.jp/san-kei/ |
| 福岡県 | 福岡市 | https://www.city.fukuoka.lg.jp/keizai/ |
| 熊本県 | 熊本市 | https://www.city.kumamoto.jp/hpKiji/pub/List.aspx?c_id=5&class_set_id=3 |

### 2-2. 東京23区

| 区名 | 想定クロールURL |
|------|---------------|
| 千代田区 | https://www.city.chiyoda.lg.jp/koho/jigyosha/ |
| 中央区 | https://www.city.chuo.lg.jp/sigoto/ |
| 港区 | https://www.city.minato.tokyo.jp/sangyoushinkou/ |
| 新宿区 | https://www.city.shinjuku.lg.jp/jigyo/ |
| 文京区 | https://www.city.bunkyo.lg.jp/sangyo/ |
| 台東区 | https://www.city.taito.lg.jp/jigyousha/ |
| 墨田区 | https://www.city.sumida.lg.jp/sangyo_jigyosya/ |
| 江東区 | https://www.city.koto.lg.jp/jigyosha/ |
| 品川区 | https://www.city.shinagawa.tokyo.jp/sangyo/ |
| 目黒区 | https://www.city.meguro.tokyo.jp/sangyo/ |
| 大田区 | https://www.city.ota.tokyo.jp/sangyo/ |
| 世田谷区 | https://www.city.setagaya.lg.jp/jigyosha/ |
| 渋谷区 | https://www.city.shibuya.tokyo.jp/jigyosha/ |
| 中野区 | https://www.city.tokyo-nakano.lg.jp/sangyo/ |
| 杉並区 | https://www.city.suginami.tokyo.jp/jigyou/ |
| 豊島区 | https://www.city.toshima.lg.jp/sangyo/ |
| 北区 | https://www.city.kita.tokyo.jp/sangyoshinko/ |
| 荒川区 | https://www.city.arakawa.tokyo.jp/sangyo/ |
| 板橋区 | https://www.city.itabashi.tokyo.jp/sangyo/ |
| 練馬区 | https://www.city.nerima.tokyo.jp/jigyosha/ |
| 足立区 | https://www.city.adachi.tokyo.jp/sangyo/ |
| 葛飾区 | https://www.city.katsushika.lg.jp/sangyo/ |
| 江戸川区 | https://www.city.edogawa.tokyo.jp/jigyosha/ |

---

## 3. クロール仕様

### 3-1. 出力フォーマット

各補助金データは以下のJSON形式で `data/municipalities/` に都道府県コード別で出力:

```json
{
  "prefecture": "東京都",
  "municipality": "渋谷区",
  "municipality_code": "13113",
  "name": "渋谷区創業支援補助金",
  "max_amount": 500000,
  "subsidy_rate": "2/3",
  "deadline": "2026-06-30",
  "target": "区内で創業予定の個人・法人",
  "summary": "渋谷区内で新たに創業する事業者に対し...",
  "url": "https://www.city.shibuya.tokyo.jp/...",
  "industries": ["IT・情報通信", "その他"],
  "requirements": "区内に主たる事業所を有すること",
  "contact": "渋谷区産業振興課 03-XXXX-XXXX",
  "crawled_at": "2026-03-15T03:00:00+09:00",
  "source_page": "https://www.city.shibuya.tokyo.jp/jigyosha/..."
}
```

### 3-2. 追加フィールド（市町村固有）

| フィールド | 型 | 説明 |
|-----------|------|------|
| municipality | string | 市区町村名 |
| municipality_code | string | 総務省自治体コード（5桁） |
| subsidy_rate | string | 補助率（"1/2", "2/3" 等） |
| requirements | string | 申請要件 |
| contact | string | 問い合わせ先 |
| crawled_at | string | クロール日時（ISO8601） |
| source_page | string | クロール元ページURL |

### 3-3. クロールルール

- **robots.txt 厳守**: 各自治体サイトのrobots.txtに従う
- **リクエスト間隔**: 最低2秒間隔（自治体サーバーへの負荷軽減）
- **User-Agent**: `OpenClaw/1.0 (+https://hojokin-jp.pages.dev; subsidy-data-collection)`
- **深さ制限**: 入口ページから最大3階層
- **対象ページ**: 「補助金」「助成金」「支援金」「給付金」を含むページ
- **除外**: PDF（リンクのみ保存）、画像、動画

### 3-4. 構造化プロンプト（Claude Haiku）

```
以下の自治体Webページから、事業者向け補助金・助成金情報を抽出してください。
出力はJSON形式で、以下のフィールドを含めてください:
- name: 補助金・助成金の正式名称
- max_amount: 上限金額（円、数値。不明ならnull）
- subsidy_rate: 補助率（文字列。不明ならnull）
- deadline: 申請期限（YYYY-MM-DD形式。不明なら"要確認"）
- target: 対象者の説明
- summary: 100文字以内の日本語要約
- industries: 対象業種の配列（["IT・情報通信","製造業","農業・水産業","観光・宿泊","バイオ・医療","その他"] から選択）
- requirements: 主な申請要件
- contact: 問い合わせ先（電話番号含む）
- url: 詳細ページURL

個人向け（子育て、住居等）の補助金は除外し、事業者向けのみ抽出してください。
```

---

## 4. データフロー

```
OpenClaw (Mac Mini)
  ↓ クロール
  ↓ Claude Haiku で構造化
  ↓
data/municipalities/{prefecture_code}_{municipality_code}.json
  ↓ git commit & push (data/municipalities ブランチ)
  ↓
MacBook Pro (Claude Cowork)
  ↓ git pull
  ↓ scripts/merge_municipalities.py で data.js に統合
  ↓ git commit → main merge → Cloudflare Pages デプロイ
```

---

## 5. スケジュール

| Phase | 対象 | 件数 | 予定 |
|-------|------|------|------|
| Phase 1 | 政令指定都市 20市 + 東京23区 | 43自治体 | 即時開始 |
| Phase 2 | 中核市 62市 | 62自治体 | Phase 1完了後 |
| Phase 3 | 施行時特例市 + 残りの主要市 | ~100自治体 | Phase 2完了後 |
| Phase 4 | 全市区町村 | ~1,741自治体 | データ基盤安定後 |

---

## 6. Git ブランチ運用

- クロールデータ: `data/municipalities-phase1` ブランチ
- レビュー後: `main` にマージ
- コンフリクト防止: data/ 以下のみ変更

---

## 7. 優先クロール対象

現在のデータで **カバーされていない都道府県**（28府県）を優先:

宮城県, 秋田県, 茨城県, 埼玉県, 愛知県, 三重県, 滋賀県, 大阪府,
奈良県, 和歌山県, 鳥取県, 岡山県, 徳島県, 愛媛県, 高知県, 佐賀県,
大分県, 宮崎県, 鹿児島県, 沖縄県, 静岡県, 岐阜県, 富山県, 石川県,
福井県, 兵庫県, 京都府（市レベル）, 東京都（区レベル）

---

## 8. 期待されるデータ増加

| Phase | 推定追加件数 | 累計 |
|-------|------------|------|
| 現状 | 72件 | 72件 |
| Phase 1 | 200-400件 | 270-470件 |
| Phase 2 | 300-500件 | 570-970件 |
| Phase 3 | 400-600件 | 970-1,570件 |

---

## 実行指示

Mac Mini の OpenClaw で以下のコマンドを実行:

```bash
# 1. リポジトリを最新に
cd ~/hojokin-jp
git pull origin main

# 2. 市町村クロール用ブランチ作成
git checkout -b data/municipalities-phase1

# 3. クロール実行（Phase 1）
openclaw crawl \
  --config data/openclaw-crawl-request.md \
  --targets data/municipalities_phase1.json \
  --output data/municipalities/ \
  --structuring-model claude-haiku \
  --delay 2000 \
  --max-depth 3

# 4. 結果をコミット & プッシュ
git add data/municipalities/
git commit -m "data: Phase 1 市町村補助金データ（政令指定都市+東京23区）"
git push origin data/municipalities-phase1
```
