"""Fix all dark-mode selector order issues in styles.css."""
import re

STYLES = r"D:\my project\app\st_manegar\area-main\area\styles\styles.css"

with open(STYLES, "r", encoding="utf-8") as f:
    css = f.read()

original = css

# Namespaces that need fixing (all tool- and screen- namespaces)
namespaces = [
    "screen-calc", "screen-main", "screen-profile", "screen-saved",
    "screen-settings", "tool-circlesector", "tool-volumes3d", "tool-dividearea",
]

# Fix 1: .namespace .dark-mode -> .dark-mode .namespace
for ns in namespaces:
    css = css.replace(f".{ns} .dark-mode ", f".dark-mode .{ns} ")

# Fix 2: .namespace :not(.dark-mode) -> .namespace (remove :not guard)
for ns in namespaces:
    css = css.replace(f".{ns} :not(.dark-mode) ", f".{ns} ")

if css == original:
    print("No changes made")
else:
    with open(STYLES, "w", encoding="utf-8") as f:
        f.write(css)
    print("Fixed all dark-mode selector order issues")

# Verify no more wrong patterns
wrong = re.findall(r'\.(screen-\w+|tool-\w+) \.dark-mode ', css)
print(f"Remaining wrong patterns: {len(wrong)}")

# Count correct patterns
for ns in namespaces:
    correct = len(re.findall(f'\\.dark-mode \\.{ns} ', css))
    print(f"  .dark-mode .{ns}: {correct} occurrences")
