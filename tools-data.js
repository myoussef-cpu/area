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
    { id: 'trapezoid', name: 'مساحة شبه المنحرف', cat: 'area', icon: 'fas fa-draw-polygon', desc: 'حساب المساحة الأساسية', legacy: true },
    { id: 'trapezoid_height_division', name: 'تقسيم شبه المنحرف', cat: 'area', icon: 'fas fa-ruler-combined', desc: 'التقسيم بناءً على الارتفاع', legacy: true },
    { id: 'cyclicQuadrilateral', name: 'رباعي دائري', cat: 'area', icon: 'fas fa-circle-notch', desc: 'حساب المساحة', legacy: true },
    { id: 'irregular_quadrilateral', name: 'رباعي غير منتظم', cat: 'area', icon: 'fas fa-vector-square', desc: 'أشكال حرة', legacy: true },
    { id: 'triangle', name: 'مساحة مثلث', cat: 'area', icon: 'fas fa-triangle', desc: 'قاعدة هيرون', legacy: true },
    { id: 'circle_sector', name: 'الدائرة والقطاعات', cat: 'area', icon: 'fas fa-circle', desc: 'دائرة، بيضاوي، قطاع', legacy: true },
    { id: 'regular_polygon', name: 'مضلعات منتظمة', cat: 'area', icon: 'fas fa-draw-polygon', desc: 'خماسي، سداسي، إلخ', legacy: true },
    
    // 2D Area Tools
    { id: 'square', name: 'المربع', cat: 'area', icon: 'fas fa-square', desc: 'مساحة ومحيط المربع', legacy: true },
    { id: 'rectangle', name: 'المستطيل', cat: 'area', icon: 'fas fa-vector-square', desc: 'مساحة ومحيط المستطيل', legacy: true },
    { id: 'parallelogram', name: 'متوازي الأضلاع', cat: 'area', icon: 'fas fa-shapes', desc: 'حساب المساحة والمحيط', legacy: true },
    { id: 'rhombus', name: 'المعين', cat: 'area', icon: 'fas fa-diamond', desc: 'حساب المساحة عن طريق الأقطار', legacy: true },
    { id: 'kite', name: 'الطائرة الورقية', cat: 'area', icon: 'fas fa-paper-plane', desc: 'مساحة شكل الطائرة الورقية', legacy: true },
    { id: 'annulus', name: 'الحلقة الدائرية', cat: 'area', icon: 'fas fa-ring', desc: 'المساحة بين دائرتين', legacy: true },
    
    // 3D Volume Tools
    { id: 'volumes_3d', name: 'الأحجام الأساسية', cat: 'volumes', icon: 'fas fa-cube', desc: 'أسطوانة، كرة، مخروط', legacy: true },
    { id: 'cube', name: 'المكعب', cat: 'volumes', icon: 'fas fa-cubes', desc: 'حجم ومساحة سطح المكعب', legacy: true },
    { id: 'pyramid', name: 'الهرم', cat: 'volumes', icon: 'fas fa-monument', desc: 'حجم الهرم القائم', legacy: true },
    { id: 'frustum_cone', name: 'مخروط ناقص', cat: 'volumes', icon: 'fas fa-filter', desc: 'حجم المخروط الناقص', legacy: true },
    { id: 'capsule', name: 'الكبسولة', cat: 'volumes', icon: 'fas fa-capsules', desc: 'حجم الخزانات الكبسولية', legacy: true },
    { id: 'ellipsoid', name: 'السطح الناقص', cat: 'volumes', icon: 'fas fa-egg', desc: 'حجم المجسم البيضاوي', legacy: true },
    
    // Construction Tools
    { id: 'concrete_calc', name: 'كميات الخرسانة', cat: 'const', icon: 'fas fa-hard-hat', desc: 'بلاطات، أعمدة، قواعد', legacy: true },
    { id: 'land_leveling', name: 'تسوية وميول', cat: 'const', icon: 'fas fa-mountain', desc: 'حساب الميل والتسوية', legacy: true },
    { id: 'bricks_calc', name: 'حساب الطوب', cat: 'const', icon: 'fas fa-th', desc: 'عدد الطوب في المتر المربع/المكعب', legacy: true },
    { id: 'tiles_calc', name: 'حساب السيراميك', cat: 'const', icon: 'fas fa-border-all', desc: 'عدد البلاط والكراتين المطلوبة', legacy: true },
    { id: 'paint_calc', name: 'حساب الدهانات', cat: 'const', icon: 'fas fa-paint-roller', desc: 'كمية الدهان لتغطية الجدران', legacy: true },
    { id: 'steel_weight', name: 'وزن الحديد', cat: 'const', icon: 'fas fa-bars', desc: 'وزن أسياخ الحديد بالقطر والطول', legacy: true },
    { id: 'steel_plate', name: 'وزن الصاج', cat: 'const', icon: 'fas fa-layer-group', desc: 'وزن ألواح الصاج والحديد', legacy: true },
    { id: 'excavation', name: 'أعمال الحفر', cat: 'const', icon: 'fas fa-shovels', desc: 'حجم ناتج الحفر والردم', legacy: true },
    { id: 'plastering', name: 'أعمال المحارة', cat: 'const', icon: 'fas fa-brush', desc: 'كميات الرمل والأسمنت للمحارة', legacy: true },
    
    // Conversion Tools
    { id: 'divide_area', name: 'تحويل المساحات', cat: 'conv', icon: 'fas fa-exchange-alt', desc: 'فدان، قيراط، سهم', legacy: true },
    { id: 'length_conv', name: 'تحويل الأطوال', cat: 'conv', icon: 'fas fa-ruler', desc: 'متر، قدم، بوصة، ميل', legacy: true },
    { id: 'weight_conv', name: 'تحويل الأوزان', cat: 'conv', icon: 'fas fa-weight-hanging', desc: 'طن، كيلو، رطل', legacy: true },
    { id: 'temp_conv', name: 'تحويل الحرارة', cat: 'conv', icon: 'fas fa-thermometer-half', desc: 'سليزيوس، فهرنهايت', legacy: true },
    { id: 'pressure_conv', name: 'تحويل الضغط', cat: 'conv', icon: 'fas fa-compress-arrows-alt', desc: 'بار، PSI، باسكال', legacy: true },
    { id: 'power_conv', name: 'تحويل القدرة', cat: 'conv', icon: 'fas fa-horse', desc: 'حصان، كيلوواط', legacy: true },
    
    // Electrical Tools
    { id: 'ohms_law', name: 'قانون أوم', cat: 'elec', icon: 'fas fa-plug', desc: 'حساب الجهد، التيار، المقاومة', legacy: true },
    { id: 'elec_power', name: 'القدرة الكهربائية', cat: 'elec', icon: 'fas fa-bolt', desc: 'حساب الواط والفولت أمبير', legacy: true },
    { id: 'volt_drop', name: 'هبوط الجهد', cat: 'elec', icon: 'fas fa-chart-line', desc: 'Voltage Drop Calculator', legacy: true },
    { id: 'wire_size', name: 'مقاس الأسلاك', cat: 'elec', icon: 'fas fa-ellipsis-v', desc: 'اختيار مقاس السلك المناسب', legacy: true },
    
    // Mechanical Tools
    { id: 'speed_dist', name: 'السرعة والزمن', cat: 'mech', icon: 'fas fa-tachometer-alt', desc: 'المسافة، السرعة، الوقت', legacy: true },
    { id: 'force_calc', name: 'حساب القوة', cat: 'mech', icon: 'fas fa-hand-rock', desc: 'قانون نيوتن الثاني F=ma', legacy: true },
    { id: 'torque_calc', name: 'حساب العزم', cat: 'mech', icon: 'fas fa-wrench', desc: 'Torque Calculator', legacy: true },
    { id: 'hydraulic_force', name: 'قوة الهيدروليك', cat: 'mech', icon: 'fas fa-water', desc: 'قوة السلندر الهيدروليكي', legacy: true },
    
    // Math Tools
    { id: 'percentage', name: 'النسبة المئوية', cat: 'math', icon: 'fas fa-percent', desc: 'حساب النسب والزيادة والنقصان', legacy: true },
    { id: 'quadratic', name: 'المعادلة التربيعية', cat: 'math', icon: 'fas fa-superscript', desc: 'حل معادلات الدرجة الثانية', legacy: true },
    { id: 'pythagoras', name: 'فيثاغورس', cat: 'math', icon: 'fas fa-external-link-alt', desc: 'حساب الوتر وأضلاع القائمة', legacy: true },
    { id: 'trigonometry', name: 'حساب المثلثات', cat: 'math', icon: 'fas fa-wave-square', desc: 'Sin, Cos, Tan', legacy: true },
    { id: 'scale_map', name: 'مقياس الرسم', cat: 'math', icon: 'fas fa-map-marked-alt', desc: 'التحويل بين الخريطة والواقع', legacy: true },
    { id: 'avg_calc', name: 'المتوسط الحسابي', cat: 'math', icon: 'fas fa-sort-numeric-up', desc: 'المتوسط، الوسيط، الانحراف', legacy: true },
    { id: 'slope_deg', name: 'الميل بالدرجات', cat: 'math', icon: 'fas fa-angle-right', desc: 'التحويل بين النسبة والدرجة', legacy: true },
    { id: 'ratio_calc', name: 'التناسب والنسبة', cat: 'math', icon: 'fas fa-balance-scale', desc: 'حساب التناسب الطردي والعكسي', legacy: true },
    { id: 'unit_price', name: 'سعر الوحدة', cat: 'math', icon: 'fas fa-tag', desc: 'مقارنة الأسعار والكميات', legacy: true }
];
