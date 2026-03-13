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
from typing import Optional, Dict, Any
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

SYSTEM_PROMPT = """You are a Japanese subsidy/grant information extractor.
Extract information from Japanese text and return ONLY valid JSON.
Rules:
- Return ONLY the JSON object, no other text
- Use null for unknown values
- Keep all string values short and clean
- Do not include Japanese special quotes like 「」 in JSON strings
- Escape any special characters properly"""

USER_PROMPT_TEMPLATE = """Extract subsidy/grant info from this Japanese text.

Prefecture: {prefecture}
URL: {url}
Text:
{raw_text}

Return ONLY this JSON (use null for unknown):
{{"name":"string","target":"string","max_amount":null,"deadline":null,"summary":"string","is_hojokin":true}}

Replace values with actual data found. Keep strings plain ASCII-safe Japanese. No markdown, no explanation."""


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


def structure_item(client, item: dict) -> Optional[Dict[str, Any]]:
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

        # コードブロックを除去
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        # JSONの開始・終了を抽出
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start >= 0 and end > start:
            response_text = response_text[start:end]

        # 壊れたJSONを修復: 未終了の文字列を閉じる
        try:
            data = json.loads(response_text)
        except json.JSONDecodeError:
            # 行ごとに修復を試みる
            import re
            # 途中で切れた行を削除してから再パース
            lines = response_text.split("\n")
            clean_lines = []
            for line in lines:
                stripped = line.rstrip()
                # 値が途中で終わっている行を修正
                if stripped.endswith("...") or (
                    ":" in stripped and
                    stripped.count('"') % 2 != 0 and
                    not stripped.rstrip(",").endswith(("null", "true", "false"))
                ):
                    continue
                clean_lines.append(line)
            try:
                data = json.loads("\n".join(clean_lines))
            except json.JSONDecodeError:
                # 最終手段: 正規表現でキーと値を抽出
                result = {}
                for key in ["name", "target", "summary", "deadline", "is_hojokin"]:
                    m = re.search(rf'"{key}"\s*:\s*"([^"]*)"', response_text)
                    if m:
                        result[key] = m.group(1)
                for key in ["max_amount"]:
                    m = re.search(rf'"{key}"\s*:\s*(\d+)', response_text)
                    if m:
                        result[key] = int(m.group(1))
                if not result:
                    return None
                data = result

        # リストが返ってきた場合は最初の要素を使う
        if isinstance(data, list):
            data = data[0] if data else None
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
