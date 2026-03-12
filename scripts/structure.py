#!/usr/bin/env python3
"""
structure.py - SQLiteの生データをClaude Haikuで構造化（バッチ処理用）

使い方:
  python scripts/structure.py          # 未構造化データを全件処理
  python scripts/structure.py --limit 10  # 最初の10件だけ（テスト用）
  python scripts/structure.py --dry-run   # DBに書かずに確認

環境変数:
  ANTHROPIC_API_KEY  # 必須
"""

import json
import sqlite3
import time
import argparse
import os
import sys
from pathlib import Path
from datetime import datetime

# プロジェクトルートのパス
ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "hojokin.db"

# Haiku APIの設定
MODEL = "claude-haiku-4-5"
MAX_TOKENS = 512
BATCH_DELAY = 1  # APIレート制限対策
MAX_RAW_TEXT = 3000  # プロンプトに含めるテキストの上限

SYSTEM_PROMPT = """あなたは日本の補助金・助成金情報を構造化するAIです。
与えられたテキストから補助金の情報を抽出し、必ずJSON形式で返してください。
JSONのみ返し、前後に説明文を入れないでください。"""

USER_PROMPT_TEMPLATE = """以下のテキストから補助金・助成金の情報を抽出してください。

都道府県: {prefecture}
ソースURL: {url}
テキスト:
{raw_text}

以下のJSON形式で返してください（不明な項目はnullにしてください）:
{{
  "name": "補助金・助成金の正式名称",
  "target": "対象となる事業者・業種（例: 中小企業、製造業、農業など）",
  "max_amount": 最大補助金額（整数、円単位。不明はnull）,
  "deadline": "申請締め切り（例: 2024年3月31日、随時など。不明はnull）",
  "summary": "概要を100字以内で説明",
  "is_hojokin": true/false（これが補助金・助成金の情報かどうか）
}}"""


def get_api_client():
    """Anthropic APIクライアントを取得"""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY が設定されていません")
        print("   export ANTHROPIC_API_KEY=your_key_here")
        sys.exit(1)

    try:
        import anthropic
        return anthropic.Anthropic(api_key=api_key)
    except ImportError:
        print("❌ anthropicパッケージが必要です")
        print("   pip install anthropic")
        sys.exit(1)


def structure_item(client, item: dict) -> dict | None:
    """Claude Haikuで1件の補助金データを構造化"""
    raw_text = item["raw_text"] or ""
    raw_text = raw_text[:MAX_RAW_TEXT]

    prompt = USER_PROMPT_TEMPLATE.format(
        prefecture=item["prefecture"],
        url=item["source_url"] or item["url"] or "",
        raw_text=raw_text,
    )

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text.strip()

        # JSONパース
        # コードブロックを除去
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        data = json.loads(response_text)
        return data

    except json.JSONDecodeError as e:
        print(f"  ⚠️  JSONパースエラー: {e}")
        return None
    except Exception as e:
        print(f"  ⚠️  APIエラー: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Claude Haikuで補助金データを構造化")
    parser.add_argument("--limit", type=int, default=None, help="処理件数（テスト用）")
    parser.add_argument("--dry-run", action="store_true", help="DBに書かずに確認")
    args = parser.parse_args()

    print("=" * 50)
    print("🤖 補助金データ構造化スタート（Claude Haiku）")
    print(f"⏰  開始: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if args.dry_run:
        print("⚠️  DRY RUN モード（DBに書き込みません）")
    print("=" * 50)

    if not DB_PATH.exists():
        print(f"❌ DBが見つかりません: {DB_PATH}")
        print("   まず python scripts/crawl.py を実行してください")
        sys.exit(1)

    # APIクライアント初期化
    client = get_api_client()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # 未構造化データを取得
    query = "SELECT * FROM hojokin WHERE structured = 0 AND raw_text IS NOT NULL"
    if args.limit:
        query += f" LIMIT {args.limit}"

    rows = conn.execute(query).fetchall()
    print(f"📋 処理対象: {len(rows)} 件")

    if not rows:
        print("✅ 構造化済みデータのみです。crawl.py を再実行してください。")
        conn.close()
        return

    success = 0
    skip = 0

    for i, row in enumerate(rows, 1):
        item = dict(row)
        print(f"\n[{i}/{len(rows)}] {item['prefecture']} - {item['name'][:30]}")

        result = structure_item(client, item)

        if not result:
            skip += 1
            time.sleep(BATCH_DELAY)
            continue

        # 補助金情報でない場合はスキップ
        if not result.get("is_hojokin", True):
            print(f"  ↩️  補助金情報ではないためスキップ")
            if not args.dry_run:
                conn.execute("UPDATE hojokin SET structured = -1 WHERE id = ?", (item["id"],))
                conn.commit()
            skip += 1
            time.sleep(BATCH_DELAY)
            continue

        print(f"  📌 {result.get('name', '(名称不明)')}")
        print(f"  💰 最大: {result.get('max_amount') or '不明'} 円")
        print(f"  🎯 対象: {result.get('target') or '不明'}")

        if not args.dry_run:
            conn.execute("""
                UPDATE hojokin SET
                    name = COALESCE(?, name),
                    target = ?,
                    max_amount = ?,
                    deadline = ?,
                    summary = ?,
                    structured = 1
                WHERE id = ?
            """, (
                result.get("name"),
                result.get("target"),
                result.get("max_amount"),
                result.get("deadline"),
                result.get("summary"),
                item["id"],
            ))
            conn.commit()

        success += 1
        time.sleep(BATCH_DELAY)

    conn.close()

    print("\n" + "=" * 50)
    print(f"✅ 完了！ 成功: {success}件 / スキップ: {skip}件")
    print(f"⏰  終了: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)


if __name__ == "__main__":
    main()
