// الـ AI Agent — الحلقة الرئيسية + الأدوات المتاحة
window.AIAgent = (function () {
    const NVIDIA_API = 'https://integrate.api.nvidia.com/v1/chat/completions';
    const CORS_PROXY = 'https://corsproxy.io/?url=';
    const MODEL = 'google/diffusiongemma-26b-a4b-it';
    const MAX_TOOL_ROUNDS = 10;

    let conversation = [];
    let isRunning = false;
    let onMessage = null; // callback لكل رد جديد

    const SYSTEM_PROMPT = `أنت مساعد ذكي لتطبيق "حساب المساحات" — تطبيق موبايل لحساب مساحات الأشكال الهندسية والتحويلات الهندسية.
أنت تقدر تستخدم الأدوات المتاحة عشان:
1. تحسب مساحات أشكال هندسية مختلفة
2. تتنقل المستخدم لصفحة الأداة المناسبة
3. تعرض عليه النتائج المحفوظة
4. تحول وحدات القياس
5. تعرض معلومات عن أي أداة في التطبيق

التعليمات:
- استخدم الأدوات لما المستخدم يطلب حساب أو معلومة
- ردد بالعربي بشكل واضح ومختصر
- لو المستخدم سأل عن حاجة مش في نطاق الأدوات، رد عادي من غير tool
- لما تحسب مساحة، وضح المعادلة والخطوات باختصار
- لو المستخدم عايز يفتح أداة معينة، استخدم navigate_to_tool`;

    // ═══════════════════════════════════════════════════
    // تعريف الأدوات (OpenAI function calling format)
    // ═══════════════════════════════════════════════════
    const toolsDef = [
        {
            type: 'function',
            function: {
                name: 'calculate_area',
                description: 'حساب مساحة شكل هندسي. أرسل الأبعاد والشكل وهيحسب المساحة والمحيط.',
                parameters: {
                    type: 'object',
                    properties: {
                        shape: {
                            type: 'string',
                            enum: ['trapezoid', 'triangle', 'rectangle', 'square', 'circle', 'circle_sector', 'regular_polygon', 'parallelogram', 'rhombus', 'kite', 'annulus', 'cyclic_quadrilateral', 'irregular_quadrilateral'],
                            description: 'نوع الشكل الهندسي'
                        },
                        dimensions: {
                            type: 'object',
                            description: 'أبعاد الشكل (المتغيرات حسب الشكل)',
                            properties: {
                                a: { type: 'number', description: 'القاعدة الصغرى (لمشبه المنحرف والمساوية)' },
                                b: { type: 'number', description: 'القاعدة الكبرى (لمشبه المنحرف)' },
                                c: { type: 'number', description: 'الضلع الثالث (للمثلث)' },
                                d: { type: 'number', description: 'الضلع الرابع (للأشكال الرباعية)' },
                                side: { type: 'number', description: 'طول الضلع (للمربع)' },
                                length: { type: 'number', description: 'الطول (للمستطيل)' },
                                width: { type: 'number', description: 'العرض (للمستطيل)' },
                                radius: { type: 'number', description: 'نصف القطر (للدائرة)' },
                                height: { type: 'number', description: 'الارتفاع (للمثلث وشبه المنحرف)' },
                                L1: { type: 'number', description: 'المائل الأول (لمشبه المنحرف)' },
                                L2: { type: 'number', description: 'المائل الثاني (لمشبه المنحرف)' },
                                angle: { type: 'number', description: 'الزاوية بالدرجات (للقطاع)' },
                                diagonal1: { type: 'number', description: 'القطر الأول (للمعين)' },
                                diagonal2: { type: 'number', description: 'القطر الثاني (للمعين)' },
                                sides: { type: 'string', description: 'الأضلاع مفصولة بفاصلة (للأشكال غير المنتظمة)' }
                            }
                        }
                    },
                    required: ['shape', 'dimensions']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'navigate_to_tool',
                description: 'يفتح صفحة أداة معينة في التطبيق. مفيد لما المستخدم عايز يستخدم الأداة يدوياً.',
                parameters: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'string',
                            enum: [
                                'trapezoid', 'trapezoid_height_division', 'triangle', 'square', 'rectangle',
                                'parallelogram', 'rhombus', 'kite', 'annulus', 'circle_sector',
                                'regular_polygon', 'cyclicQuadrilateral', 'irregular_quadrilateral',
                                'volumes_3d', 'cube', 'pyramid', 'frustum_cone', 'capsule', 'ellipsoid',
                                'concrete_calc', 'land_leveling', 'bricks_calc', 'tiles_calc',
                                'paint_calc', 'steel_weight', 'steel_plate', 'excavation', 'plastering',
                                'divide_area', 'length_conv', 'weight_conv', 'temp_conv',
                                'pressure_conv', 'power_conv', 'ohms_law', 'elec_power',
                                'volt_drop', 'wire_size', 'speed_dist', 'force_calc',
                                'torque_calc', 'hydraulic_force', 'percentage', 'quadratic',
                                'pythagoras', 'trigonometry', 'scale_map', 'avg_calc',
                                'slope_deg', 'ratio_calc', 'unit_price', 'calculator', 'saved_results'
                            ],
                            description: 'اسم الصفحة المطلوبة'
                        },
                        description: { type: 'string', description: 'وصف مختصر للأداة (اختياري)' }
                    },
                    required: ['page']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_saved_results',
                description: 'يجيب النتائج المحفوظة من التطبيق (محلياً)',
                parameters: { type: 'object', properties: {} }
            }
        },
        {
            type: 'function',
            function: {
                name: 'list_tools',
                description: 'يرجع قائمة بكل الأدوات المتاحة في التطبيق مرتبة حسب الفئات',
                parameters: {
                    type: 'object',
                    properties: {
                        category: {
                            type: 'string',
                            enum: ['area', 'volumes', 'const', 'conv', 'elec', 'mech', 'math', 'all'],
                            description: 'الفئة المطلوبة (all لكل الأدوات)'
                        }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'convert_units',
                description: 'تحويل وحدات القياس (أطوال، أوزان، مساحات، حرارة، ضغط، قدرة)',
                parameters: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['length', 'weight', 'area', 'temperature', 'pressure', 'power'],
                            description: 'نوع التحويل'
                        },
                        value: { type: 'number', description: 'القيمة المطلوب تحويلها' },
                        from: { type: 'string', description: 'الوحدة المطلوب التحويل منها' },
                        to: { type: 'string', description: 'الوحدة المطلوب التحويل لها' }
                    },
                    required: ['type', 'value', 'from', 'to']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_tool_info',
                description: 'معلومات تفصيلية عن أداة معينة وإزاي تستخدمها',
                parameters: {
                    type: 'object',
                    properties: {
                        tool_name: { type: 'string', description: 'اسم الأداة المطلوبة' }
                    },
                    required: ['tool_name']
                }
            }
        }
    ];

    // ═══════════════════════════════════════════════════
    // تنفيذ الأدوات
    // ═══════════════════════════════════════════════════
    function executeTool(name, args) {
        switch (name) {
            case 'calculate_area': return toolCalculateArea(args);
            case 'navigate_to_tool': return toolNavigate(args);
            case 'get_saved_results': return toolGetSavedResults();
            case 'list_tools': return toolListTools(args);
            case 'convert_units': return toolConvertUnits(args);
            case 'get_tool_info': return toolGetInfo(args);
            default: return JSON.stringify({ error: 'أداة مش معروفة: ' + name });
        }
    }

    function toolCalculateArea(args) {
        const { shape, dimensions: d } = args;
        let area = 0, perimeter = 0, formula = '', details = '';

        switch (shape) {
            case 'square':
                area = d.side * d.side;
                perimeter = 4 * d.side;
                formula = 'المربع: المساحة = الضلع²';
                details = `الضلع = ${d.side}\nالمساحة = ${d.side}² = ${area}\nالمحيط = 4 × ${d.side} = ${perimeter}`;
                break;
            case 'rectangle':
                area = d.length * d.width;
                perimeter = 2 * (d.length + d.width);
                formula = 'المستطيل: المساحة = الطول × العرض';
                details = `الطول = ${d.length}, العرض = ${d.width}\nالمساحة = ${d.length} × ${d.width} = ${area}\nالمحيط = 2 × (${d.length} + ${d.width}) = ${perimeter}`;
                break;
            case 'triangle':
                if (d.a && d.b && d.c) {
                    const s = (d.a + d.b + d.c) / 2;
                    area = Math.sqrt(s * (s - d.a) * (s - d.b) * (s - d.c));
                    perimeter = d.a + d.b + d.c;
                    formula = 'مثلث (هيرن): s = (a+b+c)/2, المساحة = √(s(s-a)(s-b)(s-c))';
                    details = `a=${d.a}, b=${d.b}, c=${d.c}\ns = ${s.toFixed(3)}\nالمساحة = ${area.toFixed(3)}\nالمحيط = ${perimeter}`;
                } else if (d.base && d.height) {
                    area = 0.5 * d.base * d.height;
                    formula = 'مثلث: المساحة = ½ × القاعدة × الارتفاع';
                    details = `القاعدة = ${d.base}, الارتفاع = ${d.height}\nالمساحة = ½ × ${d.base} × ${d.height} = ${area}`;
                } else {
                    return JSON.stringify({ error: 'محتاج أضلاع الـ 3 أو القاعدة والارتفاع' });
                }
                break;
            case 'trapezoid':
                if (d.a && d.b && d.L1 && d.L2) {
                    const diff = d.b - d.a;
                    if (diff <= 0) return JSON.stringify({ error: 'القاعدة الكبرى لازم تكون أكبر من الصغرى' });
                    const x1 = (diff + (d.L1 * d.L1 - d.L2 * d.L2) / diff) / 2;
                    const h = Math.sqrt(d.L1 * d.L1 - x1 * x1);
                    if (h <= 0 || isNaN(h)) return JSON.stringify({ error: 'الأبعاد دي مش ممكن تكوّن شبه منحرف' });
                    area = ((d.a + d.b) / 2) * h;
                    perimeter = d.a + d.b + d.L1 + d.L2;
                    formula = 'شبه المنحرف: المساحة = ((a+b)/2) × h';
                    details = `a=${d.a}, b=${d.b}, L1=${d.L1}, L2=${d.L2}\nالارتفاع = ${h.toFixed(3)}\nالمساحة = ${area.toFixed(3)}\nالمحيط = ${perimeter}`;
                } else if (d.a && d.b && d.height) {
                    area = ((d.a + d.b) / 2) * d.height;
                    perimeter = d.a + d.b + d.L1 + d.L2;
                    formula = 'شبه المنحرف: المساحة = ((a+b)/2) × h';
                    details = `a=${d.a}, b=${d.b}, h=${d.height}\nالمساحة = ${area.toFixed(3)}`;
                } else {
                    return JSON.stringify({ error: 'محتاج القاعدتين والضلعين المائلين أو الارتفاع' });
                }
                break;
            case 'circle':
                area = Math.PI * d.radius * d.radius;
                perimeter = 2 * Math.PI * d.radius;
                formula = 'الدائرة: المساحة = π × r²';
                details = `نصف القطر = ${d.radius}\nالمساحة = π × ${d.radius}² = ${area.toFixed(3)}\nالمحيط = 2π × ${d.radius} = ${perimeter.toFixed(3)}`;
                break;
            case 'circle_sector':
                if (d.radius && d.angle) {
                    area = (d.angle / 360) * Math.PI * d.radius * d.radius;
                    const arc = (d.angle / 360) * 2 * Math.PI * d.radius;
                    perimeter = 2 * d.radius + arc;
                    formula = 'القطاع الدائري: المساحة = (θ/360) × π × r²';
                    details = `r=${d.radius}, θ=${d.angle}°\nالمساحة = ${area.toFixed(3)}\nطول القوس = ${arc.toFixed(3)}\nالمحيط = ${perimeter.toFixed(3)}`;
                } else {
                    return JSON.stringify({ error: 'محتاج نصف القطر والزاوية' });
                }
                break;
            case 'parallelogram':
                area = d.base * d.height;
                perimeter = 2 * (d.base + d.side);
                formula = 'متوازي الأضلاع: المساحة = القاعدة × الارتفاع';
                details = `القاعدة = ${d.base}, الارتفاع = ${d.height}\nالمساحة = ${area}\nالمحيط = 2 × (${d.base} + ${d.side}) = ${perimeter}`;
                break;
            case 'rhombus':
                area = (d.diagonal1 * d.diagonal2) / 2;
                const sideR = Math.sqrt((d.diagonal1 / 2) ** 2 + (d.diagonal2 / 2) ** 2);
                perimeter = 4 * sideR;
                formula = 'المعين: المساحة = (d1 × d2) / 2';
                details = `d1=${d.diagonal1}, d2=${d.diagonal2}\nالمساحة = ${area}\nالمحيط = ${perimeter.toFixed(3)}`;
                break;
            default:
                return JSON.stringify({ error: `حساب ${shape} مش متاح لسه` });
        }

        return JSON.stringify({
            shape, area: +area.toFixed(4), perimeter: perimeter ? +perimeter.toFixed(4) : undefined,
            formula, details, unit: 'م²'
        });
    }

    function toolNavigate(args) {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo(args.page);
            return JSON.stringify({ success: true, message: `تم فتح صفحة ${args.page}` });
        }
        return JSON.stringify({ success: false, message: 'navigateTo مش متاح' });
    }

    function toolGetSavedResults() {
        try {
            const raw = localStorage.getItem('savedResults');
            const results = raw ? JSON.parse(raw) : [];
            if (results.length === 0) return JSON.stringify({ results: [], message: 'مفيش نتائج محفوظة' });
            const summary = results.slice(0, 10).map((r, i) =>
                `${i + 1}. ${r.type || 'بدون نوع'} — ${(r.result || '').substring(0, 80)}...`
            ).join('\n');
            return JSON.stringify({ count: results.length, summary, results: results.slice(0, 5) });
        } catch (e) {
            return JSON.stringify({ error: 'مش قادر أقرأ النتائج المحفوظة' });
        }
    }

    function toolListTools(args) {
        const TOOLS = [
            { id: 'trapezoid', name: 'مساحة شبه المنحرف', cat: 'area' },
            { id: 'trapezoid_height_division', name: 'تقسيم شبه المنحرف', cat: 'area' },
            { id: 'triangle', name: 'مساحة مثلث', cat: 'area' },
            { id: 'square', name: 'المربع', cat: 'area' },
            { id: 'rectangle', name: 'المستطيل', cat: 'area' },
            { id: 'parallelogram', name: 'متوازي الأضلاع', cat: 'area' },
            { id: 'rhombus', name: 'المعين', cat: 'area' },
            { id: 'kite', name: 'الطائرة الورقية', cat: 'area' },
            { id: 'annulus', name: 'الحلقة الدائرية', cat: 'area' },
            { id: 'circle_sector', name: 'الدائرة والقطاعات', cat: 'area' },
            { id: 'regular_polygon', name: 'مضلعات منتظمة', cat: 'area' },
            { id: 'cyclicQuadrilateral', name: 'رباعي دائري', cat: 'area' },
            { id: 'irregular_quadrilateral', name: 'رباعي غير منتظم', cat: 'area' },
            { id: 'volumes_3d', name: 'الأحجام الأساسية', cat: 'volumes' },
            { id: 'cube', name: 'المكعب', cat: 'volumes' },
            { id: 'pyramid', name: 'الهرم', cat: 'volumes' },
            { id: 'frustum_cone', name: 'مخروط ناقص', cat: 'volumes' },
            { id: 'capsule', name: 'الكبسولة', cat: 'volumes' },
            { id: 'ellipsoid', name: 'السطح الناقص', cat: 'volumes' },
            { id: 'concrete_calc', name: 'كميات الخرسانة', cat: 'const' },
            { id: 'land_leveling', name: 'تسوية وميول', cat: 'const' },
            { id: 'bricks_calc', name: 'حساب الطوب', cat: 'const' },
            { id: 'tiles_calc', name: 'حساب السيراميك', cat: 'const' },
            { id: 'paint_calc', name: 'حساب الدهانات', cat: 'const' },
            { id: 'steel_weight', name: 'وزن الحديد', cat: 'const' },
            { id: 'steel_plate', name: 'وزن الصاج', cat: 'const' },
            { id: 'excavation', name: 'أعمال الحفر', cat: 'const' },
            { id: 'plastering', name: 'أعمال المحارة', cat: 'const' },
            { id: 'divide_area', name: 'تحويل المساحات', cat: 'conv' },
            { id: 'length_conv', name: 'تحويل الأطوال', cat: 'conv' },
            { id: 'weight_conv', name: 'تحويل الأوزان', cat: 'conv' },
            { id: 'temp_conv', name: 'تحويل الحرارة', cat: 'conv' },
            { id: 'pressure_conv', name: 'تحويل الضغط', cat: 'conv' },
            { id: 'power_conv', name: 'تحويل القدرة', cat: 'conv' },
            { id: 'ohms_law', name: 'قانون أوم', cat: 'elec' },
            { id: 'elec_power', name: 'القدرة الكهربائية', cat: 'elec' },
            { id: 'volt_drop', name: 'هبوط الجهد', cat: 'elec' },
            { id: 'wire_size', name: 'مقاس الأسلاك', cat: 'elec' },
            { id: 'speed_dist', name: 'السرعة والزمن', cat: 'mech' },
            { id: 'force_calc', name: 'حساب القوة', cat: 'mech' },
            { id: 'torque_calc', name: 'حساب العزم', cat: 'mech' },
            { id: 'hydraulic_force', name: 'قوة الهيدروليك', cat: 'mech' },
            { id: 'percentage', name: 'النسبة المئوية', cat: 'math' },
            { id: 'quadratic', name: 'المعادلة التربيعية', cat: 'math' },
            { id: 'pythagoras', name: 'فيثاغورس', cat: 'math' },
            { id: 'trigonometry', name: 'حساب المثلثات', cat: 'math' },
            { id: 'scale_map', name: 'مقياس الرسم', cat: 'math' },
            { id: 'avg_calc', name: 'المتوسط الحسابي', cat: 'math' },
            { id: 'slope_deg', name: 'الميل بالدرجات', cat: 'math' },
            { id: 'ratio_calc', name: 'التناسب والنسبة', cat: 'math' },
            { id: 'unit_price', name: 'سعر الوحدة', cat: 'math' }
        ];

        const cat = args.category || 'all';
        const categories = {
            area: 'المساحة والأشكال',
            volumes: 'الأحجام والمجسمات',
            const: 'الإنشاءات والمباني',
            conv: 'التحويلات الهندسية',
            elec: 'الكهرباء والإلكترونيات',
            mech: 'الميكانيكا والحركة',
            math: 'الرياضيات الهندسية'
        };

        let filtered = cat === 'all' ? TOOLS : TOOLS.filter(t => t.cat === cat);

        let result = '';
        if (cat === 'all') {
            for (const [c, name] of Object.entries(categories)) {
                const tools = TOOLS.filter(t => t.cat === c);
                result += `\n【${name}】\n${tools.map(t => `• ${t.name} (${t.id})`).join('\n')}\n`;
            }
        } else {
            result = `【${categories[cat]}】\n${filtered.map(t => `• ${t.name} (${t.id})`).join('\n')}`;
        }

        return JSON.stringify({ category: cat, tools: filtered, formatted: result });
    }

    function toolConvertUnits(args) {
        const { type, value, from, to } = args;
        const conversions = {
            length: {
                متر: 1, cm: 0.01, ملليمتر: 0.001, كيلومتر: 1000,
                قدم: 0.3048, بوصة: 0.0254, يارد: 0.9144, ميل: 1609.34
            },
            weight: {
                كيلو: 1, جرام: 0.001, طن: 1000, رطل: 0.453592, أونصة: 0.0283495
            },
            area: {
                'م²': 1, 'كم²': 1e6, 'سم²': 1e-4, فدان: 4200.83, قيراط: 175.034, سهم: 7.293,
                'قدم²': 0.092903
            },
            temperature: {
                سليزيوس: 'C', فهرنهايت: 'F', كلفن: 'K'
            }
        };

        if (type === 'temperature') {
            let celsius;
            if (from === 'سليزيус') celsius = value;
            else if (from === 'فهرنهايت') celsius = (value - 32) * 5 / 9;
            else celsius = value - 273.15;

            let result;
            if (to === 'سليزيوس') result = celsius;
            else if (to === 'فهرنهايت') result = celsius * 9 / 5 + 32;
            else result = celsius + 273.15;

            return JSON.stringify({ from: value, fromUnit: from, to: +result.toFixed(4), toUnit: to });
        }

        const table = conversions[type];
        if (!table) return JSON.stringify({ error: 'نوع تحويل مش معروف' });
        if (!(from in table) || !(to in table)) return JSON.stringify({ error: 'وحدة مش موجودة' });

        const baseValue = value * table[from];
        const result = baseValue / table[to];
        return JSON.stringify({ from: value, fromUnit: from, to: +result.toFixed(4), toUnit: to });
    }

    function toolGetInfo(args) {
        const info = {
            trapezoid: { name: 'مساحة شبه المنحرف', desc: 'يحسب مساحة شبه المنحرف العام بأبعاد القاعدتين والضلعين المائلين. بيحدد الارتفاع تلقائياً.', params: 'a (القاعدة الصغرى), b (القاعدة الكبرى), L1 (المائل الأول), L2 (المائل الثاني)' },
            triangle: { name: 'مساحة مثلث', desc: 'يحسب مساحة المثلث بطريقة هيرون (بأضلاع الـ 3) أو بالقاعدة والارتفاع.', params: 'أضلاع a, b, c أو القاعدة والارتفاع' },
            rectangle: { name: 'المستطيل', desc: 'مساحة ومحيط المستطيل.', params: 'الطول والعرض' },
            square: { name: 'المربع', desc: 'مساحة ومحيط المربع.', params: 'طول الضلع' },
            circle_sector: { name: 'الدائرة والقطاعات', desc: 'مساحة الدائرة الكاملة أو قطاع معين بالزاوية.', params: 'نصف القطر (والزاوية للقطاع)' },
            calculator: { name: 'الآلة الحاسبة', desc: 'آلة حاسبة علمية كاملة.', params: 'أرقام وعمليات حسابية' }
        };

        const i = info[args.tool_name];
        if (i) return JSON.stringify(i);
        return JSON.stringify({ name: args.tool_name, desc: 'أداة في التطبيق', params: 'متغير حسب الأداة' });
    }

    // ═══════════════════════════════════════════════════
    // الاتصال بـ NVIDIA API
    // ═══════════════════════════════════════════════════
    async function callNVIDIA(messages, tools) {
        const apiKey = window.AppConfig ? window.AppConfig.getApiKey() : localStorage.getItem('NVIDIA_API_KEY');
        if (!apiKey) throw new Error('مفتاح الـ API مش متاح. افتح setup.html عشان تدخله.');

        const body = {
            model: MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048
        };

        if (tools && tools.length > 0) {
            body.tools = tools;
            body.tool_choice = 'auto';
        }

        const fetchOpts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        };

        // نجرب مع CORS Proxy الأول، لو فشل نجرب من غير
        let resp;
        try {
            resp = await fetch(CORS_PROXY + encodeURIComponent(NVIDIA_API), fetchOpts);
        } catch (e) {
            resp = await fetch(NVIDIA_API, fetchOpts);
        }

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`API Error ${resp.status}: ${err}`);
        }

        return await resp.json();
    }

    // ═══════════════════════════════════════════════════
    // الحلقة الرئيسية (Agent Loop)
    // ═══════════════════════════════════════════════════
    async function agentLoop(userMessage) {
        if (isRunning) throw new Error('الـ agent شغال بالفعل');
        isRunning = true;

        try {
            conversation.push({ role: 'user', content: userMessage });

            for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
                const response = await callNVIDIA(conversation, toolsDef);
                const choice = response.choices[0];

                if (!choice) throw new Error('مفيش رد من الـ AI');

                conversation.push(choice.message);

                // لو فيه tool calls
                if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
                    for (const toolCall of choice.message.tool_calls) {
                        const fnName = toolCall.function.name;
                        let args;
                        try {
                            args = JSON.parse(toolCall.function.arguments);
                        } catch (e) {
                            args = {};
                        }

                        const result = executeTool(fnName, args);

                        // نبعتلها callback لو موجودة
                        if (onMessage) {
                            onMessage({ type: 'tool_call', name: fnName, args, result: JSON.parse(result) });
                        }

                        conversation.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: result
                        });
                    }
                    continue; // نكمل الحلقة
                }

                // رد نصي — خلصنا
                isRunning = false;
                return choice.message.content;
            }

            isRunning = false;
            return 'وصلت للحد الأقصى من مرات الاستدعاء. جرب تاني.';
        } catch (e) {
            isRunning = false;
            throw e;
        }
    }

    function clearHistory() {
        conversation = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];
    }

    function setOnMessage(cb) {
        onMessage = cb;
    }

    // نبدأ المحادثة
    clearHistory();

    return {
        agentLoop,
        clearHistory,
        setOnMessage,
        get isRunning() { return isRunning; }
    };
})();
