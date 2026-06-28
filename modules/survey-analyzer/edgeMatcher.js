/**
 * وحدة مطابقة الأضلاع مع القياسات - Edge Matcher
 * تربط القيم المستخرجة من OCR بالأضلاع المكتشفة هندسياً
 */

export class EdgeMatcher {
    constructor() {
        this.maxDistance = 80; // أقصى مسافة بالبكسل للربط
        this.angleTolerance = Math.PI / 6; // 30 درجة
    }

    /**
     * المطابقة الرئيسية بين القياسات والأضلاع
     */
    matchMeasurementsToEdges(measurements, edges, vertices, imageWidth, imageHeight) {
        const matchedEdges = [];
        const usedMeasurements = new Set();
        const unmatchedMeasurements = [];

        // تحويل الأضلاع لتنسيق موحد
        const edgeData = edges.map((edge, index) => ({
            index,
            ...edge,
            center: {
                x: (edge.x1 + edge.x2) / 2,
                y: (edge.y1 + edge.y2) / 2
            },
            angle: Math.atan2(edge.y2 - edge.y1, edge.x2 - edge.x1),
            length: Math.hypot(edge.x2 - edge.x1, edge.y2 - edge.y1)
        }));

        // لكل قياس، إيجاد أقرب ضلع
        for (let i = 0; i < measurements.length; i++) {
            const measurement = measurements[i];
            const bestMatch = this.findBestEdgeMatch(
                measurement, 
                edgeData, 
                usedMeasurements,
                imageWidth, 
                imageHeight
            );

            if (bestMatch) {
                matchedEdges.push({
                    edgeIndex: bestMatch.edgeIndex,
                    measurementIndex: i,
                    measurement: measurement,
                    edge: edgeData[bestMatch.edgeIndex],
                    confidence: bestMatch.confidence,
                    distance: bestMatch.distance,
                    angleDiff: bestMatch.angleDiff
                });
                usedMeasurements.add(i);
            } else {
                unmatchedMeasurements.push({ ...measurement, measurementIndex: i });
            }
        }

        // الأضلاع غير المطابقة
        const unmatchedEdges = edgeData
            .filter((_, idx) => !matchedEdges.some(m => m.edgeIndex === idx))
            .map(e => ({ edgeIndex: e.index, edge: e }));

        return {
            matchedEdges,
            unmatchedEdges,
            unmatchedMeasurements,
            stats: {
                totalEdges: edges.length,
                totalMeasurements: measurements.length,
                matched: matchedEdges.length,
                unmatchedEdges: unmatchedEdges.length,
                unmatchedMeasurements: unmatchedMeasurements.length
            }
        };
    }

    /**
     * إيجاد أفضل ضلع لقياس معين
     */
    findBestEdgeMatch(measurement, edges, usedIndices, imgWidth, imgHeight) {
        let bestMatch = null;
        let bestScore = Infinity;

        for (let i = 0; i < edges.length; i++) {
            if (usedIndices.has(i)) continue;

            const edge = edges[i];
            const score = this.calculateMatchScore(measurement, edge, imgWidth, imgHeight);

            if (score < bestScore && score < 1.0) { // عتبة المطابقة
                bestScore = score;
                bestMatch = {
                    edgeIndex: i,
                    confidence: 1 - score,
                    distance: score * this.maxDistance,
                    angleDiff: 0
                };
            }
        }

        return bestMatch;
    }

    /**
     * حساب درجة المطابقة (0 = مثالي، 1 = غير متطابق)
     */
    calculateMatchScore(measurement, edge, imgWidth, imgHeight) {
        const measurementPos = { x: measurement.x, y: measurement.y };
        const edgeCenter = edge.center;
        
        // 1. المسافة المكانية (مُ 정규ة)
        const dx = measurementPos.x - edgeCenter.x;
        const dy = measurementPos.y - edgeCenter.y;
        const distance = Math.hypot(dx, dy);
        const normDistance = distance / Math.max(imgWidth, imgHeight);
        
        if (normDistance > 0.15) return 1.0; // بعيد جداً

        // 2. توافق الاتجاه (القياس يجب أن يكون موازياً للضلع أو عمودياً عليه)
        const edgeAngle = edge.angle;
        const toMeasurementAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(this.normalizeAngle(toMeasurementAngle - edgeAngle));
        
        // التقريب لأقرب اتجاه (موازٍ أو عمودي)
        const parallelDiff = Math.min(angleDiff, Math.abs(angleDiff - Math.PI));
        const perpendicularDiff = Math.min(
            Math.abs(angleDiff - Math.PI / 2), 
            Math.abs(angleDiff + Math.PI / 2)
        );
        const minAngleDiff = Math.min(parallelDiff, perpendicularDiff);
        const normAngleDiff = minAngleDiff / (Math.PI / 2); // 0 إلى 1

        // 3. قرب القياس من خط الضلع (المسافة العمودية)
        const perpDistance = Math.abs(dx * Math.sin(edgeAngle) - dy * Math.cos(edgeAngle));
        const normPerpDistance = perpDistance / Math.max(imgWidth, imgHeight);

        // وزن المجموع
        const score = normDistance * 0.4 + normAngleDiff * 0.4 + normPerpDistance * 0.2;
        
        return score;
    }

    /**
     * تطبيع الزاوية
     */
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * تحسين المطابقة باستخدام القياسات المعروفة (مثل a, b, L1, L2)
     */
    enhanceWithKnownNames(matchedEdges, shapeType) {
        // أسماء الأضلاع المتوقعة لكل شكل
        const expectedNames = this.getExpectedEdgeNames(shapeType);
        
        if (!expectedNames || matchedEdges.length !== expectedNames.length) {
            return matchedEdges;
        }

        // ترتيب الأضلاع والقياسات حسب الموضع
        const sortedEdges = [...matchedEdges].sort((a, b) => a.edge.angle - b.edge.angle);
        const sortedMeasurements = [...matchedEdges].sort((a, b) => a.measurement.x - b.measurement.x);

        // تعيين الأسماء المتوقعة
        return sortedEdges.map((match, idx) => ({
            ...match,
            expectedName: expectedNames[idx],
            assignedName: expectedNames[idx]
        }));
    }

    /**
     * الحصول على أسماء الأضلاع المتوقعة لكل شكل
     */
    getExpectedEdgeNames(shapeType) {
        const names = {
            'square': ['a', 'a', 'a', 'a'],
            'rectangle': ['a', 'b', 'a', 'b'],
            'parallelogram': ['a', 'b', 'a', 'b'],
            'rhombus': ['a', 'a', 'a', 'a'],
            'trapezoid': ['a', 'b', 'L1', 'L2'], // قاعدة علوية، سفلية، ضلع أيسر، ضلع أيمن
            'kite': ['a', 'a', 'b', 'b'],
            'triangle': ['a', 'b', 'c'],
            'right_triangle': ['a', 'b', 'c'],
            'pentagon': ['a', 'a', 'a', 'a', 'a'],
            'hexagon': ['a', 'a', 'a', 'a', 'a', 'a'],
            'irregular_quadrilateral': ['a', 'b', 'c', 'd'],
            'irregular_polygon': null
        };
        return names[shapeType];
    }

    /**
     * حل التضاربات - عندما يشير قياسان لنفس الضلع
     */
    resolveConflicts(matchedEdges) {
        const edgeToMeasurements = {};
        
        for (const match of matchedEdges) {
            if (!edgeToMeasurements[match.edgeIndex]) {
                edgeToMeasurements[match.edgeIndex] = [];
            }
            edgeToMeasurements[match.edgeIndex].push(match);
        }

        const resolved = [];
        
        for (const [edgeIndex, matches] of Object.entries(edgeToMeasurements)) {
            if (matches.length === 1) {
                resolved.push(matches[0]);
            } else {
                // اختيار القياس ذو أعلى ثقة
                const best = matches.reduce((best, curr) => 
                    curr.confidence > best.confidence ? curr : best
                );
                resolved.push(best);
                
                // الباقي تُضاف كقياسات غير مطابقة
                for (const m of matches) {
                    if (m !== best) {
                        // يمكن إضافتها لقائمة غير المطابقة
                    }
                }
            }
        }

        return resolved;
    }

    /**
     * تقدير طول الضلع من القياسات غير المرتبطة
     */
    estimateEdgeLengths(unmatchedEdges, unmatchedMeasurements, allMatchedEdges) {
        const estimates = [];

        for (const edge of unmatchedEdges) {
            // البحث عن قياسات قريبة
            const nearby = unmatchedMeasurements.filter(m => {
                const dist = Math.hypot(m.x - edge.center.x, m.y - edge.center.y);
                return dist < this.maxDistance;
            });

            if (nearby.length > 0) {
                // استخدام أقرب قياس
                const closest = nearby.reduce((best, curr) => {
                    const dBest = Math.hypot(best.x - edge.center.x, best.y - edge.center.y);
                    const dCurr = Math.hypot(curr.x - edge.center.x, curr.y - edge.center.y);
                    return dCurr < dBest ? curr : best;
                });

                estimates.push({
                    edgeIndex: edge.edgeIndex,
                    estimatedLength: closest.value?.value || closest.value,
                    sourceMeasurement: closest,
                    confidence: 0.5
                });
            }
        }

        return estimates;
    }
}

export default EdgeMatcher;