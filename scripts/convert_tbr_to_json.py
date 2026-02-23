import json
import re
from pathlib import Path

SRC = Path(r"D:\Download\2026_tbr.md")
DST = Path(r"D:\Download\tbr-web\data")
DST.mkdir(parents=True, exist_ok=True)

lines = SRC.read_text(encoding="utf-8").splitlines()
items = []

status_map = {
    " ": "tbr",
    "x": "done",
    "-": "dnf",
    "/": "reading",
}

item_re = re.compile(r"^- \[( |x|-|/)\] (.+)$")
rate_re = re.compile(r"\[(\d)/5\]")
date_re = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")

for line in lines:
    m = item_re.match(line)
    if not m:
        continue
    status = status_map[m.group(1)]
    text = m.group(2).strip()

    rating = None
    date_read = None

    rm = rate_re.search(text)
    if rm:
        rating = int(rm.group(1))
        text = rate_re.sub("", text).strip()

    dm = date_re.search(text)
    if dm:
        date_read = dm.group(1)
        text = date_re.sub("", text).strip()

    text = re.sub(r"\s*[—-]\s*$", "", text).strip()

    if " / " in text:
        title, author = text.rsplit(" / ", 1)
        title = title.strip()
        author = author.strip()
    else:
        title = text
        author = ""

    if not title:
        continue

    item_id = f"b{len(items)+1:04d}"

    items.append({
        "id": item_id,
        "title": title,
        "author": author,
        "status": status,
        "rating": rating,
        "date_read": date_read,
        "notes": "",
        "added_at": None,
    })

out = {
    "version": 1,
    "generated_from": SRC.name,
    "items": items,
}

(DST / "books.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"items: {len(items)}")
