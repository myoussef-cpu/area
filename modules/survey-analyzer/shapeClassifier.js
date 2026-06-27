/**
 * وحدة تصنيف الأشكال - Shape Classifier
 * تصنف الأشكال الهندسية بناءً على الخصائص المستخرجة
 */

export class ShapeClassifier {
    constructor() {
        this.shapeTypes = {
            // رباعيات الأضلاع
            'square': { minVertices: 4, maxVertices: 4, name: 'مربع', category: 'quadrilateral' },
            'rectangle': { minVertices: 4, maxVertices: 4, name: 'مستطيل', category: 'quadrilateral' },
            'parallelogram': { minVertices: 4, maxVertices: 4, name: 'متوازي أضلاع', category: 'quadrilateral' },
            'rhombus': { minVertices: 4, maxVertices: 4, name: 'معين', category: 'quadrilateral' },
            'trapezoid': { minVertices: 4, maxVertices: 4, name: 'شبه منحرف', category: 'quadrilateral' },
            'kite': { minVertices: 4, maxVertices: 4, name: 'طائرة ورقية', category: 'quadrilateral' },
            'cyclic_quadrilateral': { minVertices: 4, maxVertices: 4, name: 'رباعي دائري', category: 'quadrilateral' },
            
            // مثلثات
            'triangle': { minVertices: 3, maxVertices: 3, name: 'مثلث', category: 'triangle' },
            'right_triangle': { minVertices: 3, maxVertices: 3, name: 'مثلث قائم', category: 'triangle' },
            'equilateral_triangle': { minVertices: 3, maxVertices: 3, name: 'مثلث متساوي الأضلاع', category: 'triangle' },
            'isosceles_triangle': { minVertices: 3, maxVertices: 3, name: 'مثلث متساوي الساقين', category: 'triangle' },
            
            // مضلعات منتظمة
            'pentagon': { minVertices: 5, maxVertices: 5, name: 'مخمس منتظم', category: 'polygon' },
            'hexagon': { minVertices: 6, maxVertices: 6, name: 'مسدس منتظم', category: 'polygon' },
            'heptagon': { minVertices: 7, maxVertices: 7, name: 'مسبع منتظم', category: 'polygon' },
            'octagon': { minVertices: 8, maxVertices: 8, name: 'منظم منتظم', category: 'polygon' },
            
            // دوائر ومنحنيات
            'circle': { minVertices: 0, maxVertices: 0, name: 'دائرة', category: 'curve' },
            'ellipse': { minVertices: 0, maxVertices: 0, name: 'قطع ناقص', category: 'curve' },
            'sector': { minVertices: 0, maxVertices: 0, name: 'قطاع دائري', category: 'curve' },
            
            // أشكال غير منتظمة
            'irregular_polygon': { minVertices: 3, maxVertices: 20, name: 'مضلع غير منتظم', category: 'irregular' },
            'irregular_quadrilateral': { minVertices: 4, maxVertices: 4, name: 'رباعي غير منتظم', category: 'irregular' }
        };
    }

    /**
     * تصنيف الشكل بناءً على البيانات المستخرجة
     */
    classify(geometryData, measurements = {}) {
        const {
            polygon,
            edges = [],
            angles = [],
            circles = [],
            regularity = null
        } = geometryData;

        // إذا كان هناك دوائر
        if (circles && circles.length > 0) {
            return this.classifyCurvedShape(circles, edges, polygon);
        }

        // إذا لم يكن هناك مضلع
        if (!polygon || !polygon.vertices || polygon.vertices.length < 3) {
            return { type: 'unknown', confidence: 0, reason: 'لا يوجد شكل واضح' };
        }

        const vertexCount = polygon.vertices.length;
        
        // تصنيف حسب عدد الرؤوس
        switch (vertexCount) {
            case 3:
                return this.classifyTriangle(polygon, edges, angles, measurements);
            case 4:
                return this.classifyQuadrilateral(polygon, edges, angles, measurements, regularity);
            case 5:
            case 6:
            case 7:
            case 8:
                return this.classifyRegularPolygon(polygon, edges, angles, regularity);
            default:
                if (vertexCount > 8) {
                    return this.classifyIrregularPolygon(polygon, edges, angles);
                }
                return { type: 'unknown', confidence: 0 };
        }
    }

    /**
     * تصنيف الأشكال المنحنية
     */
    classifyCurvedShape(circles, edges, polygon) {
        const mainCircle = circles.reduce((max, c) => c.radius > max.radius ? c : max);
        
        // التحقق من القطع الناقص (بمقارنة المحاور)
        if (polygon && polygon.vertices.length >= 5) {
            // تقدير المحاور
            const bounds = this.getBounds(polygon.vertices);
            const aspectRatio = bounds.width / bounds.height;
            if (aspectRatio > 1.2 || aspectRatio < 0.83) {
                return {
                    type: 'ellipse',
                    confidence: 0.85,
                    properties: { ...mainCircle, aspectRatio }
                };
            }
        }

        // التحقق من القطاع الدائري
        if (edges.length > 0 && edges.length < 5) {
            const hasStraightEdges = edges.some(e => e.length > mainCircle.radius * 0.5);
            if (hasStraightEdges) {
                return {
                    type: 'sector',
                    confidence: 0.75,
                    properties: { ...mainCircle, straightEdges: edges.length }
                };
            }
        }

        return {
            type: 'circle',
            confidence: 0.9,
            properties: mainCircle
        };
    }

    /**
     * تصنيف المثلثات
     */
    classifyTriangle(polygon, edges, angles, measurements) {
        if (!edges || edges.length < 3) {
            return { type: 'triangle', confidence: 0.7 };
        }

        const lengths = edges.map(e => e.length).sort((a, b) => a - b);
        const [a, b, c] = lengths;
        
        // التحقق من المساواة
        const tolerance = 0.08; // 8%
        const isEquilateral = Math.abs(a - b) / a < tolerance && Math.abs(b - c) / b < tolerance;
        
        if (isEquilateral) {
            return {
                type: 'equilateral_triangle',
                confidence: 0.95,
                properties: { sideLength: (a + b + c) / 3 }
            };
        }

        // التحقق من متساوي الساقين
        const isIsosceles = Math.abs(a - b) / a < tolerance || Math.abs(b - c) / b < tolerance || Math.abs(a - c) / a < tolerance;
        
        // التحقق من القائم (نظرية فيثاغورس)
        const isRight = Math.abs(a * a + b * b - c * c) / (c * c) < 0.05;
        
        if (isRight && isIsosceles) {
            return {
                type: 'right_triangle',
                confidence: 0.9,
                properties: { legs: [a, b], hypotenuse: c, isIsosceles: true }
            };
        }
        
        if (isRight) {
            return {
                type: 'right_triangle',
                confidence: 0.9,
                properties: { legs: [a, b], hypotenuse: c }
            };
        }
        
        if (isIsosceles) {
            return {
                type: 'isosceles_triangle',
                confidence: 0.85,
                properties: { equalSides: isIsosceles ? 'two' : 'none', base: isIsosceles ? c : 'none' }
            };
        }

        return {
            type: 'triangle',
            confidence: 0.95,
            properties: { sides: lengths }
        };
    }

    /**
     * تصنيف رباعيات الأضلاع
     */
    classifyQuadrilateral(polygon, edges, angles, measurements, regularity) {
        if (!edges || edges.length < 4) {
            return { type: 'irregular_quadrilateral', confidence: 0.6 };
        }

        const lengths = edges.map(e => e.length);
        const angleValues = angles.map(a => a.angleDeg);
        
        // متوسطات
        const avgAngle = angleValues.reduce((a, b) => a + b, 0) / 4;
        
        // التحقق من الزوايا القائمة (90 درجة)
        const rightAngles = angleValues.filter(a => Math.abs(a - 90) < 8).length;
        
        // التحقق من الأضلاع المتساوية
        const equalSides = this.countEqualGroups(lengths, 0.08);
        
        // التحقق من الأضلاع المتوازية (زوايا متقابلة متساوية)
        const oppAnglesEqual = Math.abs(angleValues[0] - angleValues[2]) < 10 && 
                               Math.abs(angleValues[1] - angleValues[3]) < 10;
        
        // التحقق من الأضلاع المتقابلة المتساوية
        const oppSidesEqual = Math.abs(lengths[0] - lengths[2]) / lengths[0] < 0.08 &&
                              Math.abs(lengths[1] - lengths[3]) / lengths[1] < 0.08;

        // مربع: 4 زوايا قائمة + 4 أضلاع متساوية
        if (rightAngles === 4 && equalSides >= 4) {
            return {
                type: 'square',
                confidence: 0.98,
                properties: { sideLength: lengths.reduce((a, b) => a + b, 0) / 4 }
            };
        }

        // مستطيل: 4 زوايا قائمة + أضلاع متقابلة متساوية
        if (rightAngles === 4 && oppSidesEqual) {
            return {
                type: 'rectangle',
                confidence: 0.95,
                properties: { width: Math.min(...lengths), height: Math.max(...lengths) }
            };
        }

        // معين: 4 أضلاع متساوية + زوايا متقابلة متساوية (وليس 90)
        if (equalSides >= 4 && oppAnglesEqual && rightAngles === 0) {
            return {
                type: 'rhombus',
                confidence: 0.9,
                properties: { sideLength: lengths.reduce((a, b) => a + b, 0) / 4, angles: angleValues }
            };
        }

        // متوازي أضلاع: أضلاع متقابلة متساوية + زوايا متقابلة متساوية
        if (oppSidesEqual && oppAnglesEqual) {
            return {
                type: 'parallelogram',
                confidence: 0.85,
                properties: { base: lengths[0], side: lengths[1], angles: angleValues }
            };
        }

        // شبه منحرف: زوج واحد من الأضلاع المتوازية
        // التحقق من التوازي عبر زوايا القاعدة
        const hasParallelPair = this.hasParallelSides(edges, angles);
        if (hasParallelPair) {
            // التحقق من شبه منحرف متساوي الساقين
            const isIsosceles = this.isIsoscelesTrapezoid(lengths, angles);
            
            return {
                type: isIsosceles ? 'trapezoid' : 'trapezoid',
                confidence: 0.8,
                properties: { 
                    isIsosceles,
                    bases: this.identifyBases(lengths, angles),
                    legs: this.identifyLegs(lengths, angles)
                }
            };
        }

        // طائرة ورقية: زوجان من الأضلاع المتجاورة متساوية
        if (this.isKite(lengths)) {
            return {
                type: 'kite',
                confidence: 0.75,
                properties: { pairs: this.getKitePairs(lengths) }
            };
        }

        // رباعي دائري: مجموع الزوايا المتقابلة = 180
        if (Math.abs(angleValues[0] + angleValues[2] - 180) < 10 &&
            Math.abs(angleValues[1] + angleValues[3] - 180) < 10) {
            return {
                type: 'cyclic_quadrilateral',
                confidence: 0.8,
                properties: { angles: angleValues }
            };
        }

        return {
            type: 'irregular_quadrilateral',
            confidence: 0.9,
            properties: { sides: lengths, angles: angleValues }
        };
    }

    /**
     * تصنيف المضلعات المنتظمة (5-8 أضلاع)
     */
    classifyRegularPolygon(polygon, edges, angles, regularity) {
        if (regularity && regularity.isRegular) {
            const names = { 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' };
            return {
                type: names[polygon.vertices.length] || 'regular_polygon',
                confidence: 0.9,
                properties: { 
                    sides: polygon.vertices.length,
                    sideLength: regularity.avgSideLength,
                    internalAngle: regularity.avgInternalAngle
                }
            };
        }

        return {
            type: 'irregular_polygon',
            confidence: 0.8,
            properties: { 
                sides: polygon.vertices.length,
                vertices: polygon.vertices
            }
        };
    }

    /**
     * تصنيف المضلعات غير المنتظمة (أكثر من 8 أضلاع)
     */
    classifyIrregularPolygon(polygon, edges, angles) {
        return {
            type: 'irregular_polygon',
            confidence: 0.85,
            properties: { 
                sides: polygon.vertices.length,
                vertices: polygon.vertices,
                perimeter: edges.reduce((sum, e) => sum + e.length, 0)
            }
        };
    }

    /**
     * دوال مساعدة
     */
    countEqualGroups(values, tolerance) {
        const groups = [];
        for (const v of values) {
            let found = false;
            for (const g of groups) {
                if (Math.abs(v - g.value) / g.value < tolerance) {
                    g.count++;
                    found = true;
                    break;
                }
            }
            if (!found) groups.push({ value: v, count: 1 });
        }
        return Math.max(...groups.map(g => g.count));
    }

    getBounds(vertices) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const v of vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }
        return { width: maxX - minX, height: maxY - minY };
    }

    hasParallelSides(edges, angles) {
        // التحقق من وجود زوج من الأضلاع المتوازية
        // في شبه المنحرف، زوايا القاعدة المتجاورة مع الضلع المتوازي تكون متممة (180)
        for (let i = 0; i < 4; i++) {
            const j = (i + 1) % 4;
            if (Math.abs(angles[i].angleDeg + angles[j].angleDeg - 180) < 15) {
                return true;
            }
        }
        return false;
    }

    isIsoscelesTrapezoid(lengths, angles) {
        // الأرجل متساوية في شبه المنحرف متساوي الساقين
        return Math.abs(lengths[1] - lengths[3]) / lengths[1] < 0.1;
    }

    identifyBases(lengths, angles) {
        // القاعدتان هما الأضلاع المتوازية (الأطول والأقصر عادةً)
        const sorted = [...lengths].sort((a, b) => b - a);
        return { longBase: sorted[0], shortBase: sorted[3] };
    }

    identifyLegs(lengths, angles) {
        const sorted = [...lengths].sort((a, b) => b - a);
        return { leg1: sorted[1], leg2: sorted[2] };
    }

    isKite(lengths) {
        // زوجان من الأضلاع المتجاورة متساوية
        return (Math.abs(lengths[0] - lengths[1]) < lengths[0] * 0.08 && 
                Math.abs(lengths[2] - lengths[3]) < lengths[2] * 0.08) ||
               (Math.abs(lengths[1] - lengths[2]) < lengths[1] * 0.08 && 
                Math.abs(lengths[3] - lengths[0]) < lengths[3] * 0.08);
    }

    getKitePairs(lengths) {
        if (Math.abs(lengths[0] - lengths[1]) < lengths[0] * 0.08) {
            return [{ pair: [0, 1], length: (lengths[0] + lengths[1]) / 2 }, 
                    { pair: [2, 3], length: (lengths[2] + lengths[3]) / 2 }];
        }
        return [{ pair: [1, 2], length: (lengths[1] + lengths[2]) / 2 }, 
                { pair: [3, 0], length: (lengths[3] + lengths[0]) / 2 }];
    }

    /**
     * الحصول على معلومات الشكل للعرض
     */
    getShapeInfo(type) {
        return this.shapeTypes[type] || { name: type, category: 'unknown' };
    }
}

export default ShapeClassifier;