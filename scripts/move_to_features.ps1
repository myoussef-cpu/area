$ErrorActionPreference='SilentlyContinue'
$base = 'D:\my project\app\st_manegar\area-main\area'
$moveMap = @{
    'trapezoid.html'='area'; 'trapezoid_height_division.html'='area'
    'cyclicQuadrilateral.html'='area'; 'irregular_quadrilateral.html'='area'
    'triangle.html'='area'; 'circle_sector.html'='area'; 'regular_polygon.html'='area'
    'square.html'='area'; 'rectangle.html'='area'; 'parallelogram.html'='area'
    'rhombus.html'='area'; 'kite.html'='area'; 'annulus.html'='area'
    'volumes_3d.html'='volumes'; 'cube.html'='volumes'; 'pyramid.html'='volumes'
    'frustum_cone.html'='volumes'; 'capsule.html'='volumes'; 'ellipsoid.html'='volumes'
    'concrete_calc.html'='construction'; 'land_leveling.html'='construction'
    'bricks_calc.html'='construction'; 'tiles_calc.html'='construction'
    'paint_calc.html'='construction'; 'steel_weight.html'='construction'
    'steel_plate.html'='construction'; 'excavation.html'='construction'
    'plastering.html'='construction'
    'divide_area.html'='conversion'; 'length_conv.html'='conversion'
    'weight_conv.html'='conversion'; 'temp_conv.html'='conversion'
    'pressure_conv.html'='conversion'; 'power_conv.html'='conversion'
    'ohms_law.html'='electrical'; 'elec_power.html'='electrical'
    'volt_drop.html'='electrical'; 'wire_size.html'='electrical'
    'speed_dist.html'='mechanical'; 'force_calc.html'='mechanical'
    'torque_calc.html'='mechanical'; 'hydraulic_force.html'='mechanical'
    'percentage.html'='math'; 'quadratic.html'='math'; 'pythagoras.html'='math'
    'trigonometry.html'='math'; 'scale_map.html'='math'; 'avg_calc.html'='math'
    'slope_deg.html'='math'; 'ratio_calc.html'='math'; 'unit_price.html'='math'
}
foreach ($file in $moveMap.Keys) {
    $cat = $moveMap[$file]
    $src = Join-Path $base $file
    $dst = Join-Path $base "features\$cat"
    if (Test-Path $src) {
        Move-Item $src $dst -Force
        Write-Host "Moved $file -> features\$cat\"
    } else {
        Write-Host "SKIP (not found): $file"
    }
}
Write-Host "`nDone."
