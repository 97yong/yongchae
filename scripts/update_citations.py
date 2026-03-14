#!/usr/bin/env python3
"""
Fetch Google Scholar citation data and save to data/citations.json.
Runs in GitHub Actions environment with proxy fallback.
"""

import json
import os
from datetime import date

SCHOLAR_ID = "qex9tLkAAAAJ"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "citations.json")


def fetch_author_data():
    from scholarly import scholarly, ProxyGenerator

    # Try FreeProxy first (needed in GitHub Actions to avoid bot detection)
    try:
        pg = ProxyGenerator()
        success = pg.FreeProxies()
        if success:
            scholarly.use_proxy(pg)
            print("Using FreeProxy")
        else:
            print("FreeProxy setup returned False, proceeding without proxy")
    except Exception as e:
        print(f"Proxy setup failed: {e}. Proceeding without proxy.")

    print(f"Fetching author profile for ID: {SCHOLAR_ID}")
    author = scholarly.search_author_id(SCHOLAR_ID)
    author = scholarly.fill(author, sections=["basics", "indices", "counts"])
    return author


def extract_data(author):
    cites_per_year = author.get("cites_per_year", {})
    # Ensure keys are strings
    cites_per_year = {str(k): v for k, v in cites_per_year.items()}

    return {
        "lastUpdated": date.today().isoformat(),
        "totalCitations": author.get("citedby", 0),
        "hIndex": author.get("hindex", 0),
        "i10Index": author.get("i10index", 0),
        "citesPerYear": cites_per_year,
    }


def main():
    try:
        author = fetch_author_data()
        data = extract_data(author)
    except Exception as e:
        print(f"ERROR fetching data: {e}")
        raise

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
