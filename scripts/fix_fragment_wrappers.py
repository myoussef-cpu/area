"""Add wrapper divs to SPA fragment HTML files that lack <body> tags."""
import os

ROOT = r"D:\my project\app\st_manegar\area-main\area"

SCREEN_NS = {
    'calculator': 'screen-calc', 'main_screen': 'screen-main',
    'saved_results': 'screen-saved', 'all_tools': 'screen-alltools',
    'profile': 'screen-profile', 'settings': 'screen-settings',
    'login': 'screen-login', 'setup': 'screen-setup', 'smart_tool': 'screen-smart',
}

screens_dir = os.path.join(ROOT, 'ui', 'screens')
for fname in sorted(os.listdir(screens_dir)):
    if not fname.endswith('.html'):
        continue
    basename = os.path.splitext(fname)[0]
    ns = SCREEN_NS.get(basename)
    if not ns:
        continue

    fpath = os.path.join(screens_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    if f'class="{ns}"' in content:
        print(f'  - {basename}: already wrapped')
        continue

    if '<body>' in content:
        content = content.replace('<body>', f'<body>\n<div class="{ns}">')
        content = content.replace('</body>', f'</div>\n</body>')
    else:
        content = f'<div class="{ns}">\n{content}\n</div>'

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  OK {basename} -> .{ns}')

print("Done")
