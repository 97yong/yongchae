#!/usr/bin/env python3
"""
Fetch Google Scholar citation data and save to data/citations.json.
Uses SerpAPI (free tier: 100 searches/month) for reliable access.
Set SERPAPI_KEY as a GitHub Actions secret.
"""

import json
import os
import sys
from datetime import date
from urllib.request import urlopen, Request
from urllib.parse import urlencode

SCHOLAR_ID = "qex9tLkAAAAJ"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "citations.json")


def fetch_via_serpapi(api_key):
    """Fetch author data via SerpAPI (reliable, free tier available)."""
    params = urlencode({
        "engine": "google_scholar_author",
        "author_id": SCHOLAR_ID,
        "api_key": api_key,
    })
    url = f"https://serpapi.com/search.json?{params}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    cited_by = data.get("cited_by", {})
    table = cited_by.get("table", [])
    graph = cited_by.get("graph", [])

    total = 0
    h_index = 0
    i10_index = 0
    for row in table:
        if "citations" in row:
            total = row["citations"].get("all", 0)
        if "h_index" in row:
            h_index = row["h_index"].get("all", 0)
        if "i10_index" in row:
            i10_index = row["i10_index"].get("all", 0)

    cites_per_year = {}
    for entry in graph:
        year = str(entry.get("year", ""))
        citations = entry.get("citations", 0)
        if year:
            cites_per_year[year] = citations

    return {
        "lastUpdated": date.today().isoformat(),
        "totalCitations": total,
        "hIndex": h_index,
        "i10Index": i10_index,
        "citesPerYear": cites_per_year,
    }


def fetch_via_scholarly():
    """Fallback: use scholarly library (may fail in CI due to bot detection)."""
    from scholarly import scholarly, ProxyGenerator

    try:
        pg = ProxyGenerator()
        success = pg.FreeProxies()
        if success:
            scholarly.use_proxy(pg)
            print("Using FreeProxy")
    except Exception as e:
        print(f"Proxy setup failed: {e}")

    print(f"Fetching author profile for ID: {SCHOLAR_ID}")
    author = scholarly.search_author_id(SCHOLAR_ID)
    author = scholarly.fill(author, sections=["basics", "indices", "counts"])

    cites_per_year = {str(k): v for k, v in author.get("cites_per_year", {}).items()}

    return {
        "lastUpdated": date.today().isoformat(),
        "totalCitations": author.get("citedby", 0),
        "hIndex": author.get("hindex", 0),
        "i10Index": author.get("i10index", 0),
        "citesPerYear": cites_per_year,
    }


def main():
    api_key = os.environ.get("SERPAPI_KEY", "")

    data = None
    if api_key:
        print("Using SerpAPI...")
        try:
            data = fetch_via_serpapi(api_key)
        except Exception as e:
            print(f"SerpAPI failed: {e}")
    else:
        print("No SERPAPI_KEY found, trying scholarly...")
        try:
            data = fetch_via_scholarly()
        except Exception as e:
            print(f"Scholarly failed: {e}")

    if data is None:
        print("ERROR: All methods failed to fetch citation data.")
        sys.exit(1)

    out_path = os.path.normpath(OUTPUT_PATH)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Saved citations data to {out_path}")
    print(f"  Total citations : {data['totalCitations']}")
    print(f"  h-index         : {data['hIndex']}")
    print(f"  i10-index       : {data['i10Index']}")
    print(f"  Years tracked   : {list(data['citesPerYear'].keys())}")


if __name__ == "__main__":
    main()
