/**
 * وحدة كشف الهندسة - Geometry Detector
 * تكتشف الخطوط، الرؤوس، الأضلاع، والزوايا من الصور المعالجة
 */

export class GeometryDetector {
    constructor(imageProcessor) {
        this.imageProcessor = imageProcessor;
        this.cv = null;
    }

    async init() {
        if (this.imageProcessor && this.imageProcessor.cv) {
            this.cv = this.imageProcessor.cv;
        }
        return !!this.cv;
    }

    /**
     * كشف الشكل الهندسي الكامل من صورة معالجة
     */
    async detectGeometry(processedMat, options = {}) {
        const {
            detectLines: doDetectLines = true,
            detectCorners: doDetectCorners = true,
            detectEdges: doDetectEdges = true,
            minLineLength = 30,
            maxLineGap = 15,
            cornerThreshold = 0.01
        } = options;

        const results = {};

        // 1. كشف الحواف
        if (doDetectEdges) {
            results.edges = await this.imageProcessor.detectEdges(processedMat);
            results.edgeMat = results.edges.clone();
        }

        // 2. كشف الخطوط
        if (doDetectLines && results.edgeMat) {
            results.lines = await this.imageProcessor.detectLines(results.edgeMat, {
                minLineLength,
                maxLineGap
            });
        }

        // 3. كشف الزوايا (الرؤوس)
        if (doDetectCorners) {
            results.corners = await this.imageProcessor.detectCorners(processedMat, {
                threshold: cornerThreshold
            });
        }

        // 4. تجميع الخطوط إلى أضلاع
        if (results.lines) {
            results.edges = this.mergeLinesToEdges(results.lines, processedMat.cols, processedMat.rows);
        }

        // 5. بناء المضلع من الرؤوس
        if (results.corners && results.corners.length >= 3) {
            results.polygon = this.buildPolygonFromCorners(results.corners);
        }

        // 6. حساب الزوايا بين الأضلاع
        if (results.edges && results.edges.length >= 3) {
            results.angles = this.calculateAngles(results.edges);
        }

        return results;
    }

    /**
     * دمج الخطوط المتقاربة لتكوين أضلاع موحدة
     */
    mergeLinesToEdges(lines, imgWidth, imgHeight) {
        const edges = [];
        const used = new Set();

        for (let i = 0; i < lines.length; i++) {
            if (used.has(i)) continue;
            
            const line1 = lines[i];
            const angle1 = this.getLineAngle(line1);
            const length1 = this.getLineLength(line1);
            
            // البحث عن خطوط متوازية ومتقاربة
            const group = [line1];
            used.add(i);
            
            for (let j = i + 1; j < lines.length; j++) {
                if (used.has(j)) continue;
                
                const line2 = lines[j];
                const angle2 = this.getLineAngle(line2);
                const angleDiff = Math.abs(this.normalizeAngle(angle1 - angle2));
                
                // إذا كانت الزاوية متقاربة (متوازية)
                if (angleDiff < Math.PI / 18) { // 10 درجات
                    // التحقق من التقارب المكاني
                    const dist = this.lineDistance(line1, line2);
                    if (dist < Math.max(imgWidth, imgHeight) * 0.05) { // 5% من حجم الصورة
                        group.push(line2);
                        used.add(j);
                    }
                }
            }

            // دمج المجموعة إلى ضلع واحد
            if (group.length > 0) {
                const merged = this.mergeLineGroup(group);
                edges.push({
                    ...merged,
                    originalLines: group.length,
                    angle: this.getLineAngle(merged),
                    length: this.getLineLength(merged)
                });
            }
        }

        return edges;
    }

    /**
     * حساب زاوية الخط
     */
    getLineAngle(line) {
        return Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
    }

    /**
     * تطبيع الزاوية لتكون بين -PI و PI
     */
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * حساب طول الخط
     */
    getLineLength(line) {
        return Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
    }

    /**
     * حساب المسافة بين خطين
     */
    lineDistance(line1, line2) {
        // المسافة بين منتصفي الخطين
        const mid1 = { x: (line1.x1 + line1.x2) / 2, y: (line1.y1 + line1.y2) / 2 };
        const mid2 = { x: (line2.x1 + line2.x2) / 2, y: (line2.y1 + line2.y2) / 2 };
        return Math.hypot(mid2.x - mid1.x, mid2.y - mid1.y);
    }

    /**
     * دمج مجموعة خطوط في خط واحد ممثل
     */
    mergeLineGroup(lines) {
        // إيجاد النقاط القصوى
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        for (const line of lines) {
            minX = Math.min(minX, line.x1, line.x2);
            minY = Math.min(minY, line.y1, line.y2);
            maxX = Math.max(maxX, line.x1, line.x2);
            maxY = Math.max(maxY, line.y1, line.y2);
        }

        // خط يمثل المدي الكامل
        const angle = this.getLineAngle(lines[0]);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const halfLen = Math.max(maxX - minX, maxY - minY) / 2;

        return {
            x1: cx - halfLen * Math.cos(angle),
            y1: cy - halfLen * Math.sin(angle),
            x2: cx + halfLen * Math.cos(angle),
            y2: cy + halfLen * Math.sin(angle)
        };
    }

    /**
     * بناء مضلع من الزوايا المكتشفة
     */
    buildPolygonFromCorners(corners) {
        if (corners.length < 3) return null;

        // حساب المركز
        const center = {
            x: corners.reduce((sum, c) => sum + c.x, 0) / corners.length,
            y: corners.reduce((sum, c) => sum + c.y, 0) / corners.length
        };

        // ترتيب الزوايا حسب الزاوية القطبية
        const sorted = [...corners].sort((a, b) => {
            const angleA = Math.atan2(a.y - center.y, a.x - center.x);
            const angleB = Math.atan2(b.y - center.y, b.x - center.x);
            return angleA - angleB;
        });

        // إزالة النقاط المكررة/القريبة جداً
        const unique = [];
        const threshold = 10; // بكسل
        for (const pt of sorted) {
            if (!unique.some(u => Math.hypot(u.x - pt.x, u.y - pt.y) < threshold)) {
                unique.push(pt);
            }
        }

        return {
            vertices: unique,
            center,
            vertexCount: unique.length,
            isClosed: true
        };
    }

    /**
     * حساب الزوايا الداخلية بين الأضلاع
     */
    calculateAngles(edges) {
        if (edges.length < 3) return [];

        const angles = [];
        for (let i = 0; i < edges.length; i++) {
            const e1 = edges[i];
            const e2 = edges[(i + 1) % edges.length];
            
            const angle1 = this.getLineAngle(e1);
            const angle2 = this.getLineAngle(e2);
            
            let diff = Math.abs(this.normalizeAngle(angle2 - angle1));
            // الزاوية الداخلية
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            
            angles.push({
                vertexIndex: i,
                angleRad: diff,
                angleDeg: (diff * 180 / Math.PI).toFixed(1),
                edge1: i,
                edge2: (i + 1) % edges.length
            });
        }

        return angles;
    }

    /**
     * تصفية الأضلاع - إزالة الأضلاع القصيرة جداً أو الزائدة
     */
    filterEdges(edges, minLength = 20) {
        return edges.filter(e => e.length >= minLength);
    }

    /**
     * اكتشاف الدوائر/المنحنيات (للأشكال المنحنية)
     */
    async detectCircles(edgeMat, options = {}) {
        const {
            dp = 1,
            minDist = 50,
            param1 = 100,
            param2 = 30,
            minRadius = 20,
            maxRadius = 0
        } = options;

        const circles = new this.cv.Mat();
        this.cv.HoughCircles(
            edgeMat, circles,
            this.cv.HOUGH_GRADIENT,
            dp, minDist, param1, param2,
            minRadius, maxRadius
        );

        const result = [];
        for (let i = 0; i < circles.cols; i++) {
            const data = circles.data32F;
            result.push({
                x: data[i * 3],
                y: data[i * 3 + 1],
                radius: data[i * 3 + 2]
            });
        }

        circles.delete();
        return result;
    }

    /**
     * كشف المضلعات المنتظمة
     */
    detectRegularPolygon(polygon, angleTolerance = 15) {
        if (!polygon || polygon.vertices.length < 3) return null;

        const vertices = polygon.vertices;
        const n = vertices.length;
        
        // حساب أطوال الأضلاع
        const lengths = [];
        for (let i = 0; i < n; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % n];
            lengths.push(Math.hypot(v2.x - v1.x, v2.y - v1.y));
        }

        // حساب الزوايا الداخلية
        const angles = [];
        for (let i = 0; i < n; i++) {
            const v0 = vertices[i];
            const v1 = vertices[(i + 1) % n];
            const v2 = vertices[(i + 2) % n];
            
            const v10 = { x: v0.x - v1.x, y: v0.y - v1.y };
            const v12 = { x: v2.x - v1.x, y: v2.y - v1.y };
            
            const dot = v10.x * v12.x + v10.y * v12.y;
            const mag1 = Math.hypot(v10.x, v10.y);
            const mag2 = Math.hypot(v12.x, v12.y);
            
            const angle = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
            angles.push(angle * 180 / Math.PI);
        }

        // التحقق من الانتظام
        const avgLength = lengths.reduce((a, b) => a + b, 0) / n;
        const avgAngle = angles.reduce((a, b) => a + b, 0) / n;
        
        const lengthVariance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / n;
        const angleVariance = angles.reduce((sum, a) => sum + Math.pow(a - avgAngle, 2), 0) / n;
        
        const lengthCV = Math.sqrt(lengthVariance) / avgLength;
        const angleCV = Math.sqrt(angleVariance) / avgAngle;

        const isRegular = lengthCV < 0.15 && angleCV < 0.15;

        return {
            isRegular,
            vertexCount: n,
            avgSideLength: avgLength,
            avgInternalAngle: avgAngle,
            lengthVariation: lengthCV,
            angleVariation: angleCV,
            sideLengths: lengths,
            internalAngles: angles
        };
    }
}

export default GeometryDetector;