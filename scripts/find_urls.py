#!/usr/bin/env python3
"""
find_urls.py - 各都道府県の補助金ページURLを自動探索
複数パターンを試して200が返るURLを収集する
"""

import json
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from typing import List, Optional

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"

USER_AGENT = "Mozilla/5.0 (compatible; HojokinBot/1.0)"

# 各都道府県の英字コード（ドメイン用）
PREF_DOMAINS = {
    "01": ("hokkaido", "北海道"),
    "02": ("aomori", "青森県"),
    "03": ("iwate", "岩手県"),
    "04": ("miyagi", "宮城県"),
    "05": ("akita", "秋田県"),
    "06": ("yamagata", "山形県"),
    "07": ("fukushima", "福島県"),
    "08": ("ibaraki", "茨城県"),
    "09": ("tochigi", "栃木県"),
    "10": ("gunma", "群馬県"),
    "11": ("saitama", "埼玉県"),
    "12": ("chiba", "千葉県"),
    "13": ("tokyo", "東京都"),
    "14": ("kanagawa", "神奈川県"),
    "15": ("niigata", "新潟県"),
    "16": ("toyama", "富山県"),
    "17": ("ishikawa", "石川県"),
    "18": ("fukui", "福井県"),
    "19": ("yamanashi", "山梨県"),
    "20": ("nagano", "長野県"),
    "21": ("gifu", "岐阜県"),
    "22": ("shizuoka", "静岡県"),
    "23": ("aichi", "愛知県"),
    "24": ("mie", "三重県"),
    "25": ("shiga", "滋賀県"),
    "26": ("kyoto", "京都府"),
    "27": ("osaka", "大阪府"),
    "28": ("hyogo", "兵庫県"),
    "29": ("nara", "奈良県"),
    "30": ("wakayama", "和歌山県"),
    "31": ("tottori", "鳥取県"),
    "32": ("shimane", "島根県"),
    "33": ("okayama", "岡山県"),
    "34": ("hiroshima", "広島県"),
    "35": ("yamaguchi", "山口県"),
    "36": ("tokushima", "徳島県"),
    "37": ("kagawa", "香川県"),
    "38": ("ehime", "愛媛県"),
    "39": ("kochi", "高知県"),
    "40": ("fukuoka", "福岡県"),
    "41": ("saga", "佐賀県"),
    "42": ("nagasaki", "長崎県"),
    "43": ("kumamoto", "熊本県"),
    "44": ("oita", "大分県"),
    "45": ("miyazaki", "宮崎県"),
    "46": ("kagoshima", "鹿児島県"),
    "47": ("okinawa", "沖縄県"),
}

# 試すURLパターン（{eng}=都道府県英名）
URL_PATTERNS = [
    "https://www.pref.{eng}.lg.jp/sangyo/",
    "https://www.pref.{eng}.lg.jp/shoko/",
    "https://www.pref.{eng}.lg.jp/sangyou/",
    "https://www.pref.{eng}.lg.jp/soshiki/sangyo/",
    "https://www.pref.{eng}.lg.jp/soshiki/shoko/",
    "https://www.pref.{eng}.lg.jp/soshiki/chusho/",
    "https://www.pref.{eng}.lg.jp/search?q=%E8%A3%9C%E5%8A%A9%E9%87%91",
    "https://www.pref.{eng}.lg.jp/site/kigyo/",
    "https://www.pref.{eng}.jp/sangyo/",
    "https://www.pref.{eng}.jp/search?q=%E8%A3%9C%E5%8A%A9%E9%87%91",
]

# 特殊ドメインの都道府県
SPECIAL_URLS = {
    "13": ["https://www.tokyo-kosha.or.jp/support/josei/", "https://www.sangyo-rodo.metro.tokyo.lg.jp/"],
    "14": ["https://www.pref.kanagawa.jp/search?q=%E8%A3%9C%E5%8A%A9%E9%87%91"],
    "27": ["https://www.pref.osaka.lg.jp/sangyosozo/", "https://www.pref.osaka.lg.jp/chusho/"],
    "28": ["https://web.pref.hyogo.lg.jp/kk12/", "https://web.pref.hyogo.lg.jp/kk07/"],
}


def check_url(url: str) -> bool:
    """URLが200を返すか確認"""
    try:
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=8) as res:
            return res.status == 200
    except Exception:
        return False


def find_url_for_pref(code: str, eng: str) -> List[str]:
    """都道府県のURLを探索して有効なものを返す"""
    found = []

    # 特殊URLを先に確認
    if code in SPECIAL_URLS:
        for url in SPECIAL_URLS[code]:
            if check_url(url):
                found.append(url)
        if found:
            return found

    # パターンを試す
    for pattern in URL_PATTERNS:
        url = pattern.format(eng=eng)
        if check_url(url):
            found.append(url)
            if len(found) >= 2:
                break
        time.sleep(0.3)

    return found


def main():
    with open(DATA_DIR / "prefectures.json", encoding="utf-8") as f:
        current = {p["code"]: p for p in json.load(f)}

    results = []
    print(f"{'='*50}")
    print("🔍 都道府県URLスキャン開始")
    print(f"{'='*50}\n")

    for code, (eng, name) in PREF_DOMAINS.items():
        # すでに有効なURLがある場合はスキップ（コメントアウトで全件再スキャン可）
        existing = current.get(code, {}).get("urls", [])

        print(f"[{code}] {name} ({eng})... ", end="", flush=True)
        urls = find_url_for_pref(code, eng)

        if urls:
            print(f"✅ {len(urls)}件: {urls[0]}")
        else:
            # 既存URLをそのまま使う
            urls = existing
            print(f"❌ 見つからず（既存URL維持: {len(existing)}件）")

        results.append({
            "code": code,
            "name": name,
            "urls": urls or existing
        })
        time.sleep(0.5)

    # 結果保存
    out_path = DATA_DIR / "prefectures_verified.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    found_count = sum(1 for r in results if r["urls"])
    print(f"\n✅ スキャン完了: {found_count}/47都道府県のURLを確認")
    print(f"💾 保存: {out_path}")
    print("\n確認後、prefectures.jsonに上書きしてください:")
    print("  cp data/prefectures_verified.json data/prefectures.json")


if __name__ == "__main__":
    main()
