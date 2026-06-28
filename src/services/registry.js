/**
 * Engineering Tools Registry
 * This file contains the configuration for 50+ tools.
 * Using a centralized registry ensures high performance and easy maintenance.
 */

export const TOOL_CATEGORIES = {
    AREA: { id: 'area', name: 'المساحة والأشكال', icon: 'fas fa-draw-polygon' },
    VOLUMES: { id: 'volumes', name: 'الأحجام والمجسمات', icon: 'fas fa-cube' },
    CONSTRUCTION: { id: 'const', name: 'الإنشاءات والمباني', icon: 'fas fa-hard-hat' },
    CONVERSION: { id: 'conv', name: 'التحويلات الهندسية', icon: 'fas fa-exchange-alt' },
    ELECTRICAL: { id: 'elec', name: 'الكهرباء والإلكترونيات', icon: 'fas fa-bolt' },
    MECHANICAL: { id: 'mech', name: 'الميكانيكا والحركة', icon: 'fas fa-cog' },
    MATH: { id: 'math', name: 'الرياضيات الهندسية', icon: 'fas fa-calculator' }
};

export const TOOLS = [
    // Existing tools (legacy compatibility)
    { id: 'trapezoid', name: 'مساحة شبه المنحرف', cat: 'area', icon: 'fas fa-draw-polygon', desc: 'حساب المساحة الأساسية' },
    { id: 'trapezoid_height_division', name: 'تقسيم شبه المنحرف', cat: 'area', icon: 'fas fa-ruler-combined', desc: 'التقسيم بناءً على الارتفاع' },
    { id: 'cyclicQuadrilateral', name: 'رباعي دائري', cat: 'area', icon: 'fas fa-circle-notch', desc: 'حساب المساحة' },
    { id: 'irregular_quadrilateral', name: 'رباعي غير منتظم', cat: 'area', icon: 'fas fa-vector-square', desc: 'أشكال حرة' },
    { id: 'triangle', name: 'مساحة مثلث', cat: 'area', icon: 'fas fa-triangle', desc: 'قاعدة هيرون' },
    { id: 'circle_sector', name: 'الدائرة والقطاعات', cat: 'area', icon: 'fas fa-circle', desc: 'دائرة، بيضاوي، قطاع' },
    { id: 'regular_polygon', name: 'مضلعات منتظمة', cat: 'area', icon: 'fas fa-draw-polygon', desc: 'خماسي، سداسي، إلخ' },
    
    // 2D Area Tools
    { id: 'square', name: 'المربع', cat: 'area', icon: 'fas fa-square', desc: 'مساحة ومحيط المربع' },
    { id: 'rectangle', name: 'المستطيل', cat: 'area', icon: 'fas fa-vector-square', desc: 'مساحة ومحيط المستطيل' },
    { id: 'parallelogram', name: 'متوازي الأضلاع', cat: 'area', icon: 'fas fa-shapes', desc: 'حساب المساحة والمحيط' },
    { id: 'rhombus', name: 'المعين', cat: 'area', icon: 'fas fa-diamond', desc: 'حساب المساحة عن طريق الأقطار' },
    { id: 'kite', name: 'الطائرة الورقية', cat: 'area', icon: 'fas fa-paper-plane', desc: 'مساحة شكل الطائرة الورقية' },
    { id: 'annulus', name: 'الحلقة الدائرية', cat: 'area', icon: 'fas fa-ring', desc: 'المساحة بين دائرتين' },
    
    // 3D Volume Tools
    { id: 'volumes_3d', name: 'الأحجام الأساسية', cat: 'volumes', icon: 'fas fa-cube', desc: 'أسطوانة، كرة، مخروط' },
    { id: 'cube', name: 'المكعب', cat: 'volumes', icon: 'fas fa-cubes', desc: 'حجم ومساحة سطح المكعب' },
    { id: 'pyramid', name: 'الهرم', cat: 'volumes', icon: 'fas fa-monument', desc: 'حجم الهرم القائم' },
    { id: 'frustum_cone', name: 'مخروط ناقص', cat: 'volumes', icon: 'fas fa-filter', desc: 'حجم المخروط الناقص' },
    { id: 'capsule', name: 'الكبسولة', cat: 'volumes', icon: 'fas fa-capsules', desc: 'حجم الخزانات الكبسولية' },
    { id: 'ellipsoid', name: 'السطح الناقص', cat: 'volumes', icon: 'fas fa-egg', desc: 'حجم المجسم البيضاوي' },
    
    // Construction Tools
    { id: 'concrete_calc', name: 'كميات الخرسانة', cat: 'const', icon: 'fas fa-hard-hat', desc: 'بلاطات، أعمدة، قواعد' },
    { id: 'land_leveling', name: 'تسوية وميول', cat: 'const', icon: 'fas fa-mountain', desc: 'حساب الميل والتسوية' },
    { id: 'bricks_calc', name: 'حساب الطوب', cat: 'const', icon: 'fas fa-th', desc: 'عدد الطوب في المتر المربع/المكعب' },
    { id: 'tiles_calc', name: 'حساب السيراميك', cat: 'const', icon: 'fas fa-border-all', desc: 'عدد البلاط والكراتين المطلوبة' },
    { id: 'paint_calc', name: 'حساب الدهانات', cat: 'const', icon: 'fas fa-paint-roller', desc: 'كمية الدهان لتغطية الجدران' },
    { id: 'steel_weight', name: 'وزن الحديد', cat: 'const', icon: 'fas fa-bars', desc: 'وزن أسياخ الحديد بالقطر والطول' },
    { id: 'steel_plate', name: 'وزن الصاج', cat: 'const', icon: 'fas fa-layer-group', desc: 'وزن ألواح الصاج والحديد' },
    { id: 'excavation', name: 'أعمال الحفر', cat: 'const', icon: 'fas fa-shovels', desc: 'حجم ناتج الحفر والردم' },
    { id: 'plastering', name: 'أعمال المحارة', cat: 'const', icon: 'fas fa-brush', desc: 'كميات الرمل والأسمنت للمحارة' },
    
    // Conversion Tools
    { id: 'divide_area', name: 'تحويل المساحات', cat: 'conv', icon: 'fas fa-exchange-alt', desc: 'فدان، قيراط، سهم' },
    { id: 'length_conv', name: 'تحويل الأطوال', cat: 'conv', icon: 'fas fa-ruler', desc: 'متر، قدم، بوصة، ميل' },
    { id: 'weight_conv', name: 'تحويل الأوزان', cat: 'conv', icon: 'fas fa-weight-hanging', desc: 'طن، كيلو، رطل' },
    { id: 'temp_conv', name: 'تحويل الحرارة', cat: 'conv', icon: 'fas fa-thermometer-half', desc: 'سليزيوس، فهرنهايت' },
    { id: 'pressure_conv', name: 'تحويل الضغط', cat: 'conv', icon: 'fas fa-compress-arrows-alt', desc: 'بار، PSI، باسكال' },
    { id: 'power_conv', name: 'تحويل القدرة', cat: 'conv', icon: 'fas fa-horse', desc: 'حصان، كيلوواط' },
    
    // Electrical Tools
    { id: 'ohms_law', name: 'قانون أوم', cat: 'elec', icon: 'fas fa-plug', desc: 'حساب الجهد، التيار، المقاومة' },
    { id: 'elec_power', name: 'القدرة الكهربائية', cat: 'elec', icon: 'fas fa-bolt', desc: 'حساب الواط والفولت أمبير' },
    { id: 'volt_drop', name: 'هبوط الجهد', cat: 'elec', icon: 'fas fa-chart-line', desc: 'Voltage Drop Calculator' },
    { id: 'wire_size', name: 'مقاس الأسلاك', cat: 'elec', icon: 'fas fa-ellipsis-v', desc: 'اختيار مقاس السلك المناسب' },
    
    // Mechanical Tools
    { id: 'speed_dist', name: 'السرعة والزمن', cat: 'mech', icon: 'fas fa-tachometer-alt', desc: 'المسافة، السرعة، الوقت' },
    { id: 'force_calc', name: 'حساب القوة', cat: 'mech', icon: 'fas fa-hand-rock', desc: 'قانون نيوتن الثاني F=ma' },
    { id: 'torque_calc', name: 'حساب العزم', cat: 'mech', icon: 'fas fa-wrench', desc: 'Torque Calculator' },
    { id: 'hydraulic_force', name: 'قوة الهيدروليك', cat: 'mech', icon: 'fas fa-water', desc: 'قوة السلندر الهيدروليكي' },
    
    // Math Tools
    { id: 'percentage', name: 'النسبة المئوية', cat: 'math', icon: 'fas fa-percent', desc: 'حساب النسب والزيادة والنقصان' },
    { id: 'quadratic', name: 'المعادلة التربيعية', cat: 'math', icon: 'fas fa-superscript', desc: 'حل معادلات الدرجة الثانية' },
    { id: 'pythagoras', name: 'فيثاغورس', cat: 'math', icon: 'fas fa-external-link-alt', desc: 'حساب الوتر وأضلاع القائمة' },
    { id: 'trigonometry', name: 'حساب المثلثات', cat: 'math', icon: 'fas fa-wave-square', desc: 'Sin, Cos, Tan' },
    { id: 'scale_map', name: 'مقياس الرسم', cat: 'math', icon: 'fas fa-map-marked-alt', desc: 'التحويل بين الخريطة والواقع' },
    { id: 'avg_calc', name: 'المتوسط الحسابي', cat: 'math', icon: 'fas fa-sort-numeric-up', desc: 'المتوسط، الوسيط، الانحراف' },
    { id: 'slope_deg', name: 'الميل بالدرجات', cat: 'math', icon: 'fas fa-angle-right', desc: 'التحويل بين النسبة والدرجة' },
    { id: 'ratio_calc', name: 'التناسب والنسبة', cat: 'math', icon: 'fas fa-balance-scale', desc: 'حساب التناسب الطردي والعكسي' },
    { id: 'unit_price', name: 'سعر الوحدة', cat: 'math', icon: 'fas fa-tag', desc: 'مقارنة الأسعار والكميات' }
];
