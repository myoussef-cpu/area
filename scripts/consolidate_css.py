"""Consolidate page CSS into styles.css, add wrapper divs, remove <style> blocks."""
import re, os

ROOT = r"D:\my project\app\st_manegar\area-main\area"
STYLES = os.path.join(ROOT, "styles", "styles.css")

# Pages whose CSS is already handled by shared templates in styles.css
TEMPLATE_PAGES = {
    'tool-dark': {'concrete_calc','bricks_calc','tiles_calc','paint_calc',
                  'steel_weight','steel_plate','plastering','excavation','land_leveling',
                  'torque_calc','speed_dist','hydraulic_force','force_calc',
                  'ohms_law','wire_size','elec_power','slope_deg','scale_map'},
    'tool-volumes': {'capsule','ellipsoid','frustum_cone','annulus','kite'},
    'tool-area': {'trapezoid','triangle','cyclicQuadrilateral','irregular_quadrilateral',
                  'trapezoid_height_division'},
}

# Reverse map: basename -> namespace
NAMESPACE_MAP = {}
for ns, pages in TEMPLATE_PAGES.items():
    for p in pages:
        NAMESPACE_MAP[p] = ns

# Misc tools with unique CSS
MISC_TOOLS = {
    'volumes_3d': 'tool-volumes3d', 'circle_sector': 'tool-circlesector',
    'percentage': 'tool-math', 'ratio_calc': 'tool-math',
}

# Screen pages with unique CSS
SCREEN_PAGES = {
    'main_screen': 'screen-main', 'calculator': 'screen-calc',
    'saved_results': 'screen-saved', 'all_tools': 'screen-alltools',
    'profile': 'screen-profile', 'settings': 'screen-settings',
    'login': 'screen-login', 'setup': 'screen-setup', 'smart_tool': 'screen-smart',
}

NAMESPACE_MAP.update(MISC_TOOLS)
NAMESPACE_MAP.update(SCREEN_PAGES)

# Files that already have no <style> block
NO_STYLE = {'square','rectangle','parallelogram','rhombus',
            'quadratic','pythagoras','trigonometry','avg_calc','unit_price',
            'length_conv','weight_conv','temp_conv','pressure_conv','power_conv','volt_drop'}

def namespaced_css(css_text, ns):
    """Prefix CSS selectors with the namespace class."""
    lines = css_text.split('\n')
    result = []
    in_media = False
    
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('/*'):
            result.append(line)
            continue
        if stripped.startswith('@media'):
            in_media = True
            result.append(line)
            continue
        if stripped.startswith('@keyframes'):
            result.append(line)
            continue
        if in_media:
            result.append(line)
            if stripped == '}':
                in_media = False
            continue
        
        # Prefix selectors with .ns
        if '{' in stripped:
            idx = stripped.index('{')
            selectors = stripped[:idx].strip()
            rest = stripped[idx:]
            # Handle comma-separated selectors, skip body/html selectors
            parts = []
            for s in selectors.split(','):
                s = s.strip()
                if s in ('body', 'html'):
                    parts.append(f'.{ns} {s}')
                else:
                    parts.append(f'.{ns} {s}')
            result.append(', '.join(parts) + f' {rest}')
        else:
            result.append(line)
    
    return '\n'.join(result)


def process_file(filepath):
    basename = os.path.splitext(os.path.basename(filepath))[0]
    if basename in NO_STYLE:
        return None
    
    ns = NAMESPACE_MAP.get(basename)
    if not ns:
        return None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for style block
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    has_style = bool(style_match)
    
    # Remove <style> block if present
    if has_style:
        content = re.sub(r'<style>.*?</style>', '', content, flags=re.DOTALL)
    
    # Add wrapper div if not already present and namespace not already used
    if f'class="{ns}"' not in content:
        content = re.sub(r'<body([^>]*)>', f'<body\\1>\n<div class="{ns}">', content)
        content = content.replace('</body>', f'</div>\n</body>')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # For template pages: CSS is already in styles.css, just remove style block
    for template_pages in TEMPLATE_PAGES.values():
        if basename in template_pages:
            if has_style:
                print(f"  OK {basename} (template, style removed)")
            else:
                print(f"  - {basename} (already clean)")
            return None
    
    # For unique pages: extract and namespace CSS
    if has_style and style_match:
        raw_css = style_match.group(1).strip()
        ns_css = namespaced_css(raw_css, ns)
        print(f"  OK {basename} (CSS extracted -> styles.css)")
        return f"\n/* ---- {basename} ---- */\n{ns_css}\n"
    
    return None


import sys
sys.stdout.reconfigure(encoding='utf-8')  # type: ignore

def main():
    all_css_parts = []
    html_files = []
    
    # Collect all tool HTML files
    tools_dir = os.path.join(ROOT, "ui", "tools")
    for category in os.listdir(tools_dir):
        cat_path = os.path.join(tools_dir, category)
        if os.path.isdir(cat_path):
            for fname in os.listdir(cat_path):
                if fname.endswith('.html'):
                    html_files.append(os.path.join(cat_path, fname))
    
    # Collect all screen HTML files
    screens_dir = os.path.join(ROOT, "ui", "screens")
    for fname in os.listdir(screens_dir):
        if fname.endswith('.html'):
            html_files.append(os.path.join(screens_dir, fname))
    
    for fpath in sorted(html_files):
        result = process_file(fpath)
        if result:
            all_css_parts.append(result)
    
    # Append collected CSS to styles.css
    if all_css_parts:
        with open(STYLES, 'a', encoding='utf-8') as f:
            f.write('\n\n/* ===== Consolidated Unique Page CSS ===== */\n')
            for part in all_css_parts:
                f.write(part)
        print(f"\nOK Added {len(all_css_parts)} unique CSS blocks to styles.css")
    
    print("\nDone!")

if __name__ == '__main__':
    main()
