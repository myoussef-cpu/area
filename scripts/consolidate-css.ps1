# Consolidate all page-specific CSS into styles.css and remove <style> blocks from HTML files
$root = "D:\my project\app\st_manegar\area-main\area"
$stylesFile = "$root\styles\styles.css"
$namespaceMap = @{
    # Template groups (tool pages)
    'concrete_calc' = 'tool-dark'; 'bricks_calc' = 'tool-dark'; 'tiles_calc' = 'tool-dark'
    'paint_calc' = 'tool-dark'; 'steel_weight' = 'tool-dark'; 'steel_plate' = 'tool-dark'
    'plastering' = 'tool-dark'; 'excavation' = 'tool-dark'; 'land_leveling' = 'tool-dark'
    'torque_calc' = 'tool-dark'; 'speed_dist' = 'tool-dark'; 'hydraulic_force' = 'tool-dark'
    'force_calc' = 'tool-dark'; 'ohms_law' = 'tool-dark'; 'wire_size' = 'tool-dark'
    'elec_power' = 'tool-dark'; 'slope_deg' = 'tool-dark'; 'scale_map' = 'tool-dark'
    'capsule' = 'tool-volumes'; 'ellipsoid' = 'tool-volumes'; 'frustum_cone' = 'tool-volumes'
    'annulus' = 'tool-volumes'; 'kite' = 'tool-volumes'
    'trapezoid' = 'tool-area'; 'triangle' = 'tool-area'; 'cyclicQuadrilateral' = 'tool-area'
    'irregular_quadrilateral' = 'tool-area'; 'trapezoid_height_division' = 'tool-area'
    # Screen pages
    'main_screen' = 'screen-main'; 'calculator' = 'screen-calc'
    'saved_results' = 'screen-saved'; 'all_tools' = 'screen-alltools'
    'profile' = 'screen-profile'; 'settings' = 'screen-settings'
    'login' = 'screen-login'; 'setup' = 'screen-setup'; 'smart_tool' = 'screen-smart'
}

$allCSS = ""

# Process all tool and screen HTML files
Get-ChildItem "$root\ui\tools", "$root\ui\screens" -Recurse -Filter "*.html" | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw
    $basename = $_.BaseName
    
    $ns = $namespaceMap[$basename]
    if (-not $ns) { return }  # skip files not in map
    
    # Extract <style> block
    if ($content -match '<style>(.*?)</style>') {
        $css = $matches[1]
        $css = $css.Trim()
        
        # Prepend each rule with the namespace
        $namespaced = $css -replace '(^|})', "`$1`n.$ns "
        $namespaced = $namespaced.Trim()
        $namespaced = "/* $basename */`n.$ns $namespaced`n"
        
        $allCSS += $namespaced
        
        # Remove <style> block from content
        $content = $content -replace '<style>.*?</style>', ''
        
        # Wrap body content in namespace div (only if not already wrapped)
        if ($content -notmatch "class=`".*$ns") {
            # Replace first occurrence of <body> with <body><div class="$ns">
            # Replace last occurrence of </body> with </div></body>
            $content = $content -replace '<body>', "<body>`n<div class=`"$ns`">"
            $content = $content -replace '</body>', "</div>`n</body>"
        }
        
        Set-Content $file $content -NoNewline -Encoding UTF8
        Write-Host "✓ $basename → $ns"
    }
}

# Append all collected CSS to styles.css
if ($allCSS) {
    Add-Content $stylesFile "`n$allCSS" -Encoding UTF8
    Write-Host "`n✅ Added all CSS to styles.css"
}
