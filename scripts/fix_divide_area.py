"""Fix divide_area.html - extract CSS, namespace, add wrapper."""
import os, re

ROOT = r"D:\my project\app\st_manegar\area-main\area"
fpath = os.path.join(ROOT, "ui", "tools", "conversion", "divide_area.html")

with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()

style_match = re.search(r"<style>(.*?)</style>", content, re.DOTALL)
if not style_match:
    print("No style block found")
    exit()

raw_css = style_match.group(1).strip()
print(f"{len(raw_css)} chars CSS extracted")

# Namespace it
lines = raw_css.split("\n")
result = []
in_media = False
for line in lines:
    s = line.strip()
    if not s or s.startswith("/*"):
        result.append(line)
        continue
    if s.startswith("@media"):
        in_media = True
        result.append(line)
        continue
    if in_media:
        result.append(line)
        if s == "}":
            in_media = False
        continue
    if "{" in s:
        idx = s.index("{")
        selectors = s[:idx].strip()
        rest = s[idx:]
        parts = []
        for sel in selectors.split(","):
            sel = sel.strip()
            parts.append(f".tool-dividearea {sel}")
        result.append(", ".join(parts) + f" {rest}")
    else:
        result.append(line)

ns_css = "\n".join(result)

# Remove style blocks
content = re.sub(r"<style>.*?</style>", "", content, flags=re.DOTALL)

# Add wrapper (handle body with attributes)
content = re.sub(r'<body([^>]*)>', r'<body\1>\n<div class="tool-dividearea">', content)
content = content.replace("</body>", '</div>\n</body>')

with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)

# Append to styles.css
styles_path = os.path.join(ROOT, "styles", "styles.css")
with open(styles_path, "a", encoding="utf-8") as f:
    f.write(f"\n\n/* ---- divide_area ---- */\n{ns_css}\n")

print("Done! divide_area CSS moved to styles.css")
