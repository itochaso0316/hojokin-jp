#!/usr/bin/env python3
"""
crawl.py - 47都道府県の補助金・助成金情報をクロールしてSQLiteに保存

使い方:
  python scripts/crawl.py          # 全都道府県クロール
  python scripts/crawl.py --limit 5  # 最初の5都道府県だけ（テスト用）
"""

import json
import sqlite3
import time
import argparse
import re
import os
from datetime import datetime
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import urljoin
from html.parser import HTMLParser

# プロジェクトルートのパス
ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "hojokin.db"
PREFECTURES_JSON = DATA_DIR / "prefectures.json"

# クロール設定
CRAWL_DELAY = 2  # robots.txt準拠: 2秒待機
REQUEST_TIMEOUT = 15  # タイムアウト15秒
MAX_TEXT_LENGTH = 5000  # 保存するテキストの最大文字数

USER_AGENT = "Mozilla/5.0 (compatible; HojokinBot/1.0; +https://hojokin-jp.info/bot)"


class TextExtractor(HTMLParser):
    """HTMLからテキストを抽出するシンプルなパーサー"""

    def __init__(self):
        super().__init__()
        self.texts = []
        self._skip = False
        self._skip_tags = {"script", "style", "nav", "footer", "header"}

    def handle_starttag(self, tag, attrs):
        if tag in self._skip_tags:
            self._skip = True

    def handle_endtag(self, tag):
        if tag in self._skip_tags:
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            text = data.strip()
            if text:
                self.texts.append(text)

    def get_text(self):
        return " ".join(self.texts)


def init_db():
    """データベースとテーブルを初期化"""
    DATA_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS hojokin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prefecture TEXT,
            prefecture_code TEXT,
            name TEXT,
            target TEXT,
            max_amount INTEGER,
            deadline TEXT,
            url TEXT,
            summary TEXT,
            raw_text TEXT,
            structured INTEGER DEFAULT 0,
            source_url TEXT,
            crawled_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS crawl_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prefecture TEXT,
            url TEXT,
            status TEXT,
            message TEXT,
            crawled_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
    print(f"✅ DB初期化完了: {DB_PATH}")


def fetch_url(url: str) -> str | None:
    """URLのHTMLを取得（エラー時はNone）"""
    try:
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=REQUEST_TIMEOUT) as res:
            charset = "utf-8"
            content_type = res.headers.get("Content-Type", "")
            # charsetを検出
            if "charset=" in content_type:
                charset = content_type.split("charset=")[-1].strip()
            raw = res.read()
            # shift_jisやeuc-jpにも対応
            for enc in [charset, "utf-8", "shift_jis", "euc-jp", "cp932"]:
                try:
                    return raw.decode(enc, errors="replace")
                except (LookupError, UnicodeDecodeError):
                    continue
            return raw.decode("utf-8", errors="replace")
    except HTTPError as e:
        print(f"  ⚠️  HTTP {e.code}: {url}")
        return None
    except URLError as e:
        print(f"  ⚠️  接続エラー: {url} - {e.reason}")
        return None
    except Exception as e:
        print(f"  ⚠️  エラー: {url} - {e}")
        return None


def extract_text(html: str) -> str:
    """HTMLからテキストを抽出"""
    parser = TextExtractor()
    try:
        parser.feed(html)
    except Exception:
        pass
    text = parser.get_text()
    # 余分な空白を削除
    text = re.sub(r"\s+", " ", text).strip()
    return text[:MAX_TEXT_LENGTH]


def extract_hojokin_keywords(text: str, url: str, prefecture: str) -> list[dict]:
    """
    テキストから補助金・助成金のキーワードを抽出して簡易構造化
    注: 本番はstructure.pyでClaude Haikuを使って精度アップ
    """
    results = []

    # 補助金・助成金名のパターン
    patterns = [
        r"([^\s。、]{2,20}(?:補助金|助成金|支援金|交付金|給付金))",
        r"([^\s。、]{2,20}(?:補助|助成|支援)(?:事業|制度|プログラム))",
    ]

    found_names = set()
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            if match not in found_names and len(match) < 50:
                found_names.add(match)

    # 金額のパターン（万円）
    amount_pattern = r"(\d+(?:,\d+)?)万円"
    amounts = re.findall(amount_pattern, text)
    max_amount = None
    if amounts:
        try:
            max_amount = max(int(a.replace(",", "")) * 10000 for a in amounts[:10])
        except ValueError:
            pass

    if found_names:
        for name in list(found_names)[:5]:  # 最大5件
            results.append({
                "prefecture": prefecture,
                "name": name,
                "target": "",  # structure.pyで補完
                "max_amount": max_amount,
                "deadline": "",  # structure.pyで補完
                "url": url,
                "summary": text[:500],
                "raw_text": text,
            })
    else:
        # キーワードが見つからなくてもraw_textとして保存
        if len(text) > 200:  # 内容がある程度あるページだけ
            results.append({
                "prefecture": prefecture,
                "name": f"{prefecture}補助金情報",
                "target": "",
                "max_amount": max_amount,
                "deadline": "",
                "url": url,
                "summary": text[:500],
                "raw_text": text,
            })

    return results


def save_to_db(conn: sqlite3.Connection, items: list[dict], prefecture_code: str):
    """補助金データをDBに保存"""
    for item in items:
        conn.execute("""
            INSERT INTO hojokin
              (prefecture, prefecture_code, name, target, max_amount, deadline,
               url, summary, raw_text, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["prefecture"],
            prefecture_code,
            item["name"],
            item["target"],
            item["max_amount"],
            item["deadline"],
            item["url"],
            item["summary"],
            item["raw_text"],
            item["url"],
        ))
    conn.commit()


def crawl_prefecture(conn: sqlite3.Connection, pref: dict):
    """1都道府県分のURLをクロール"""
    code = pref["code"]
    name = pref["name"]
    urls = pref["urls"]

    print(f"\n📍 {name} ({len(urls)}件のURL)")

    total_saved = 0
    for url in urls:
        print(f"  🌐 クロール中: {url}")

        html = fetch_url(url)
        if not html:
            # ログに記録
            conn.execute("""
                INSERT INTO crawl_log (prefecture, url, status, message)
                VALUES (?, ?, ?, ?)
            """, (name, url, "error", "取得失敗"))
            conn.commit()
            time.sleep(CRAWL_DELAY)
            continue

        text = extract_text(html)
        items = extract_hojokin_keywords(text, url, name)
        save_to_db(conn, items, code)

        conn.execute("""
            INSERT INTO crawl_log (prefecture, url, status, message)
            VALUES (?, ?, ?, ?)
        """, (name, url, "ok", f"{len(items)}件抽出"))
        conn.commit()

        print(f"  ✅ {len(items)}件を保存")
        total_saved += len(items)

        # robots.txt準拠の待機
        time.sleep(CRAWL_DELAY)

    return total_saved


def main():
    parser = argparse.ArgumentParser(description="47都道府県の補助金情報をクロール")
    parser.add_argument("--limit", type=int, default=None, help="クロールする都道府県数（テスト用）")
    parser.add_argument("--code", type=str, default=None, help="特定の都道府県コード（例: 13）")
    args = parser.parse_args()

    print("=" * 50)
    print("🏛️  補助金クロールスタート")
    print(f"⏰  開始: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # DB初期化
    init_db()

    # 都道府県リスト読み込み
    with open(PREFECTURES_JSON, encoding="utf-8") as f:
        prefectures = json.load(f)

    # フィルター適用
    if args.code:
        prefectures = [p for p in prefectures if p["code"] == args.code]
    if args.limit:
        prefectures = prefectures[:args.limit]

    print(f"📋 対象: {len(prefectures)}都道府県")

    conn = sqlite3.connect(DB_PATH)
    total = 0

    try:
        for pref in prefectures:
            saved = crawl_prefecture(conn, pref)
            total += saved
    finally:
        conn.close()

    print("\n" + "=" * 50)
    print(f"✅ クロール完了！合計 {total} 件保存")
    print(f"⏰  終了: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"💾 DB: {DB_PATH}")
    print("=" * 50)
    print("\n次のステップ: python scripts/structure.py でClaude Haikuを使って構造化")


if __name__ == "__main__":
    main()
