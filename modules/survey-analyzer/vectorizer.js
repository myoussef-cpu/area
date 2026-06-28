/**
 * وحدة المتجهات - Vectorizer
 * تحول البيانات المستخرجة إلى نموذج هندسي متجه (SVG/Canvas)
 * تدعم الرسم، التكبير، التدوير، والتحرير
 */

export class Vectorizer {
    constructor() {
        this.shapes = new Map();
        this.currentShapeId = null;
        this.transform = {
            scale: 1,
            rotation: 0,
            translateX: 0,
            translateY: 0
        };
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
    }

    /**
     * إنشاء شكل هندسي من بيانات التحليل
     */
    createShape(geometryData, measurements, shapeType, options = {}) {
        const id = options.id || `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const shape = {
            id,
            type: shapeType,
            vertices: geometryData.polygon?.vertices || [],
            edges: this.buildEdgesFromVertices(geometryData.polygon?.vertices || []),
            measurements: this.assignMeasurementsToEdges(geometryData, measurements),
            center: geometryData.polygon?.center || { x: 0, y: 0 },
            bounds: this.calculateBounds(geometryData.polygon?.vertices || []),
            style: {
                strokeColor: '#3498db',
                strokeWidth: 3,
                fillColor: 'rgba(52, 152, 219, 0.1)',
                vertexColor: '#e74c3c',
                vertexRadius: 8,
                measurementFont: '14px Tajawal',
                measurementColor: '#2c3e50'
            },
            transform: { ...this.transform },
            metadata: {
                createdAt: new Date().toISOString(),
                sourceImage: options.sourceImage || null,
                confidence: options.confidence || 0,
                originalMeasurements: measurements
            },
            locked: false,
            visible: true
        };

        this.shapes.set(id, shape);
        this.currentShapeId = id;
        this.saveState();

        return shape;
    }

    /**
     * بناء الأضلاع من الرؤوس
     */
    buildEdgesFromVertices(vertices) {
        if (!vertices || vertices.length < 2) return [];
        
        const edges = [];
        for (let i = 0; i < vertices.length; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % vertices.length];
            
            edges.push({
                id: `edge_${i}`,
                startVertex: i,
                endVertex: (i + 1) % vertices.length,
                x1: v1.x,
                y1: v1.y,
                x2: v2.x,
                y2: v2.y,
                length: Math.hypot(v2.x - v1.x, v2.y - v1.y),
                angle: Math.atan2(v2.y - v1.y, v2.x - v1.x),
                name: `edge_${i}`,
                measurement: null,
                isSelected: false
            });
        }
        return edges;
    }

    /**
     * تعيين القياسات للأضلاع
     */
    assignMeasurementsToEdges(geometryData, measurements) {
        // يتم ملؤها بواسطة EdgeMatcher
        return measurements || [];
    }

    /**
     * حساب الحدود المحيطة
     */
    calculateBounds(vertices) {
        if (!vertices || vertices.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        for (const v of vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }

        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    /**
     * الحصول على الشكل الحالي
     */
    getCurrentShape() {
        if (!this.currentShapeId) return null;
        return this.shapes.get(this.currentShapeId);
    }

    /**
     * الحصول على شكل بواسطة المعرف
     */
    getShape(id) {
        return this.shapes.get(id);
    }

    /**
     * تحديث رأس
     */
    updateVertex(shapeId, vertexIndex, newPosition) {
        const shape = this.shapes.get(shapeId);
        if (!shape || shape.locked) return false;

        const oldPosition = { ...shape.vertices[vertexIndex] };
        shape.vertices[vertexIndex] = { ...newPosition };
        
        // تحديث الأضلاع المتصلة
        this.updateConnectedEdges(shape, vertexIndex);
        this.updateBounds(shape);
        this.saveState();

        return { oldPosition, newPosition };
    }

    /**
     * تحديث الأضلاع المتصلة برأس
     */
    updateConnectedEdges(shape, vertexIndex) {
        const n = shape.vertices.length;
        const prevIndex = (vertexIndex - 1 + n) % n;
        const nextIndex = (vertexIndex + 1) % n;
        const v = shape.vertices[vertexIndex];

        // الضلع السابق
        if (shape.edges[prevIndex]) {
            shape.edges[prevIndex].x2 = v.x;
            shape.edges[prevIndex].y2 = v.y;
            shape.edges[prevIndex].length = Math.hypot(v.x - shape.edges[prevIndex].x1, v.y - shape.edges[prevIndex].y1);
            shape.edges[prevIndex].angle = Math.atan2(v.y - shape.edges[prevIndex].y1, v.x - shape.edges[prevIndex].x1);
        }

        // الضلع التالي
        if (shape.edges[nextIndex]) {
            shape.edges[nextIndex].x1 = v.x;
            shape.edges[nextIndex].y1 = v.y;
            shape.edges[nextIndex].length = Math.hypot(shape.edges[nextIndex].x2 - v.x, shape.edges[nextIndex].y2 - v.y);
            shape.edges[nextIndex].angle = Math.atan2(shape.edges[nextIndex].y2 - v.y, shape.edges[nextIndex].x2 - v.x);
        }
    }

    /**
     * تحديث الحدود
     */
    updateBounds(shape) {
        shape.bounds = this.calculateBounds(shape.vertices);
        shape.center = {
            x: (shape.bounds.minX + shape.bounds.maxX) / 2,
            y: (shape.bounds.minY + shape.bounds.maxY) / 2
        };
    }

    /**
     * تحديث قياس ضلع
     */
    updateEdgeMeasurement(shapeId, edgeIndex, measurement) {
        const shape = this.shapes.get(shapeId);
        if (!shape || !shape.edges[edgeIndex]) return false;

        shape.edges[edgeIndex].measurement = measurement;
        this.saveState();
        return true;
    }

    /**
     * إضافة رأس جديد (تقسيم ضلع)
     */
    addVertex(shapeId, edgeIndex, position) {
        const shape = this.shapes.get(shapeId);
        if (!shape || shape.locked) return null;

        const newIndex = edgeIndex + 1;
        shape.vertices.splice(newIndex, 0, { ...position });
        
        // إعادة بناء الأضلاع
        shape.edges = this.buildEdgesFromVertices(shape.vertices);
        this.updateBounds(shape);
        this.saveState();

        return newIndex;
    }

    /**
     * حذف رأس
     */
    removeVertex(shapeId, vertexIndex) {
        const shape = this.shapes.get(shapeId);
        if (!shape || shape.locked || shape.vertices.length <= 3) return false;

        shape.vertices.splice(vertexIndex, 1);
        shape.edges = this.buildEdgesFromVertices(shape.vertices);
        this.updateBounds(shape);
        this.saveState();

        return true;
    }

    /**
     * إضافة ضلع جديد (بين رأسين موجودين)
     */
    addEdge(shapeId, vertexIndex1, vertexIndex2) {
        const shape = this.shapes.get(shapeId);
        if (!shape || shape.locked) return null;

        // التحقق من عدم وجود ضلع بالفعل
        const exists = shape.edges.some(e => 
            (e.startVertex === vertexIndex1 && e.endVertex === vertexIndex2) ||
            (e.startVertex === vertexIndex2 && e.endVertex === vertexIndex1)
        );
        if (exists) return null;

        // إضافة ضلع جديد - هذا يغير التوبولوجيا
        shape.edges.push({
            id: `edge_${Date.now()}`,
            startVertex: vertexIndex1,
            endVertex: vertexIndex2,
            x1: shape.vertices[vertexIndex1].x,
            y1: shape.vertices[vertexIndex1].y,
            x2: shape.vertices[vertexIndex2].x,
            y2: shape.vertices[vertexIndex2].y,
            length: Math.hypot(
                shape.vertices[vertexIndex2].x - shape.vertices[vertexIndex1].x,
                shape.vertices[vertexIndex2].y - shape.vertices[vertexIndex1].y
            ),
            angle: Math.atan2(
                shape.vertices[vertexIndex2].y - shape.vertices[vertexIndex1].y,
                shape.vertices[vertexIndex2].x - shape.vertices[vertexIndex1].x
            ),
            name: `edge_${shape.edges.length}`,
            measurement: null,
            isSelected: false,
            isDiagonal: true
        });

        this.saveState();
        return shape.edges.length - 1;
    }

    /**
     * حذف ضلع
     */
    removeEdge(shapeId, edgeIndex) {
        const shape = this.shapes.get(shapeId);
        if (!shape || shape.locked) return false;

        shape.edges.splice(edgeIndex, 1);
        this.saveState();
        return true;
    }

    /**
     * تطبيق تحويل (تكبير، تدوير، إزاحة)
     */
    applyTransform(shapeId, transform) {
        const shape = this.shapes.get(shapeId);
        if (!shape) return false;

        const t = { ...shape.transform, ...transform };
        shape.transform = t;
        this.saveState();
        return true;
    }

    /**
     * تكبير/تصغير
     */
    scale(shapeId, factor, center = null) {
        const shape = this.shapes.get(shapeId);
        if (!shape) return false;

        const cx = center?.x ?? shape.center.x;
        const cy = center?.y ?? shape.center.y;

        for (const v of shape.vertices) {
            v.x = cx + (v.x - cx) * factor;
            v.y = cy + (v.y - cy) * factor;
        }

        for (const e of shape.edges) {
            e.x1 = cx + (e.x1 - cx) * factor;
            e.y1 = cy + (e.y1 - cy) * factor;
            e.x2 = cx + (e.x2 - cx) * factor;
            e.y2 = cy + (e.y2 - cy) * factor;
            e.length *= factor;
        }

        shape.transform.scale *= factor;
        this.updateBounds(shape);
        this.saveState();
        return true;
    }

    /**
     * تدوير
     */
    rotate(shapeId, angle, center = null) {
        const shape = this.shapes.get(shapeId);
        if (!shape) return false;

        const cx = center?.x ?? shape.center.x;
        const cy = center?.y ?? shape.center.y;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const rotatePoint = (x, y) => {
            const dx = x - cx;
            const dy = y - cy;
            return {
                x: cx + dx * cos - dy * sin,
                y: cy + dx * sin + dy * cos
            };
        };

        for (const v of shape.vertices) {
            const r = rotatePoint(v.x, v.y);
            v.x = r.x;
            v.y = r.y;
        }

        for (const e of shape.edges) {
            const s = rotatePoint(e.x1, e.y1);
            const t = rotatePoint(e.x2, e.y2);
            e.x1 = s.x; e.y1 = s.y;
            e.x2 = t.x; e.y2 = t.y;
            e.angle += angle;
        }

        shape.transform.rotation += angle;
        this.updateBounds(shape);
        this.saveState();
        return true;
    }

    /**
     * نقل
     */
    translate(shapeId, dx, dy) {
        const shape = this.shapes.get(shapeId);
        if (!shape) return false;

        for (const v of shape.vertices) {
            v.x += dx;
            v.y += dy;
        }

        for (const e of shape.edges) {
            e.x1 += dx; e.y1 += dy;
            e.x2 += dx; e.y2 += dy;
        }

        shape.transform.translateX += dx;
        shape.transform.translateY += dy;
        shape.center.x += dx;
        shape.center.y += dy;
        shape.bounds.minX += dx; shape.bounds.maxX += dx;
        shape.bounds.minY += dy; shape.bounds.maxY += dy;

        this.saveState();
        return true;
    }

    /**
     * الرسم على Canvas
     */
    drawOnCanvas(ctx, shapeId, options = {}) {
        const shape = this.shapes.get(shapeId);
        if (!shape || !shape.visible) return;

        const {
            showVertices = true,
            showMeasurements = true,
            showEdgeNames = true,
            highlightSelected = true,
            scale = 1
        } = options;

        ctx.save();
        
        // تطبيق تحويل الشكل
        ctx.translate(shape.transform.translateX, shape.transform.translateY);
        ctx.rotate(shape.transform.rotation);
        ctx.scale(shape.transform.scale, shape.transform.scale);

        // رسم الأضلاع
        ctx.strokeStyle = shape.style.strokeColor;
        ctx.lineWidth = shape.style.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // تعبئة الشكل
        if (shape.vertices.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(shape.vertices[0].x, shape.vertices[0].y);
            for (let i = 1; i < shape.vertices.length; i++) {
                ctx.lineTo(shape.vertices[i].x, shape.vertices[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = shape.style.fillColor;
            ctx.fill();
        }

        // رسم الأضلاع
        for (let i = 0; i < shape.edges.length; i++) {
            const edge = shape.edges[i];
            if (edge.isDiagonal) {
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = '#95a5a6';
                ctx.lineWidth = 1;
            } else {
                ctx.setLineDash([]);
                ctx.strokeStyle = shape.style.strokeColor;
                ctx.lineWidth = shape.style.strokeWidth;
            }

            ctx.beginPath();
            ctx.moveTo(edge.x1, edge.y1);
            ctx.lineTo(edge.x2, edge.y2);
            ctx.stroke();

            // اسم الضلع
            if (showEdgeNames && edge.name) {
                const mx = (edge.x1 + edge.x2) / 2;
                const my = (edge.y1 + edge.y2) / 2;
                const angle = edge.angle;
                
                ctx.save();
                ctx.translate(mx, my);
                ctx.rotate(angle);
                ctx.fillStyle = shape.style.measurementColor;
                ctx.font = shape.style.measurementFont;
                ctx.textAlign = 'center';
                ctx.fillText(edge.name, 0, -20);
                ctx.restore();
            }

            // القياس
            if (showMeasurements && edge.measurement) {
                const mx = (edge.x1 + edge.x2) / 2;
                const my = (edge.y1 + edge.y2) / 2;
                const angle = edge.angle;
                
                ctx.save();
                ctx.translate(mx, my);
                ctx.rotate(angle);
                ctx.fillStyle = '#e67e22';
                ctx.font = 'bold ' + shape.style.measurementFont;
                ctx.textAlign = 'center';
                const text = typeof edge.measurement === 'object' ? 
                    (edge.measurement.value?.toFixed(2) || edge.measurement.value?.toFixed(2)) :
                    edge.measurement.toFixed(2);
                ctx.fillText(`${text} م`, 0, -5);
                ctx.restore();
            }
        }

        // رسم الرؤوس
        if (showVertices) {
            for (let i = 0; i < shape.vertices.length; i++) {
                const v = shape.vertices[i];
                const isSelected = shape.edges.some(e => e.isSelected && (e.startVertex === i || e.endVertex === i));
                
                ctx.beginPath();
                ctx.arc(v.x, v.y, shape.style.vertexRadius * (isSelected ? 1.3 : 1), 0, Math.PI * 2);
                ctx.fillStyle = isSelected ? '#f39c12' : shape.style.vertexColor;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // رقم الرأس
                ctx.fillStyle = '#fff';
                ctx.font = '12px Tajawal';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${i + 1}`, v.x, v.y);
            }
        }

        ctx.restore();
    }

    /**
     * التصدير إلى SVG
     */
    exportToSVG(shapeId, options = {}) {
        const shape = this.shapes.get(shapeId);
        if (!shape) return null;

        const { width = 800, height = 600, padding = 50 } = options;
        const bounds = shape.bounds;
        const scale = Math.min(
            (width - 2 * padding) / bounds.width,
            (height - 2 * padding) / bounds.height
        ) * 0.9;

        const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale;
        const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale;

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="100%" height="100%" fill="white"/>`;
        svg += `<g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">`;

        // الشكل
        if (shape.vertices.length >= 3) {
            const points = shape.vertices.map(v => `${v.x},${v.y}`).join(' ');
            svg += `<polygon points="${points}" fill="${shape.style.fillColor}" stroke="${shape.style.strokeColor}" stroke-width="${shape.style.strokeWidth}" />`;
        }

        // الأضلاع والقياسات
        for (const edge of shape.edges) {
            if (!edge.isDiagonal) {
                svg += `<line x1="${edge.x1}" y1="${edge.y1}" x2="${edge.x2}" y2="${edge.y2}" stroke="${shape.style.strokeColor}" stroke-width="${shape.style.strokeWidth}" />`;
                
                if (edge.measurement) {
                    const mx = (edge.x1 + edge.x2) / 2;
                    const my = (edge.y1 + edge.y2) / 2;
                    const text = typeof edge.measurement === 'object' ? 
                        (edge.measurement.value?.toFixed(2) || '') : edge.measurement.toFixed(2);
                    svg += `<text x="${mx}" y="${my - 10}" text-anchor="middle" font-family="Tajawal" font-size="14" fill="#e67e22">${text} م</text>`;
                }
            }
        }

        // الرؤوس
        for (let i = 0; i < shape.vertices.length; i++) {
            const v = shape.vertices[i];
            svg += `<circle cx="${v.x}" cy="${v.y}" r="${shape.style.vertexRadius}" fill="${shape.style.vertexColor}" stroke="white" stroke-width="2" />`;
            svg += `<text x="${v.x}" y="${v.y + 4}" text-anchor="middle" font-family="Tajawal" font-size="12" fill="white">${i + 1}</text>`;
        }

        svg += `</g></svg>`;
        return svg;
    }

    /**
     * التصدير إلى JSON
     */
    exportToJSON(shapeId) {
        const shape = this.shapes.get(shapeId);
        if (!shape) return null;

        return JSON.stringify({
            type: shape.type,
            vertices: shape.vertices,
            edges: shape.edges.map(e => ({
                startVertex: e.startVertex,
                endVertex: e.endVertex,
                length: e.length,
                angle: e.angle,
                name: e.name,
                measurement: e.measurement
            })),
            center: shape.center,
            bounds: shape.bounds,
            metadata: shape.metadata
        }, null, 2);
    }

    /**
     * استيراد من JSON
     */
    importFromJSON(jsonString, id = null) {
        try {
            const data = JSON.parse(jsonString);
            return this.createShape(
                { polygon: { vertices: data.vertices, center: data.center } },
                data.edges.map(e => e.measurement).filter(Boolean),
                data.type,
                { id }
            );
        } catch (error) {
            console.error('فشل الاستيراد:', error);
            return null;
        }
    }

    /**
     * حفظ الحالة للتراجع/الإعادة
     */
    saveState() {
        const currentShape = this.getCurrentShape();
        if (!currentShape) return;

        const state = JSON.stringify({
            vertices: currentShape.vertices.map(v => ({ x: v.x, y: v.y })),
            edges: currentShape.edges.map(e => ({ 
                ...e, 
                measurement: e.measurement 
            })),
            transform: currentShape.transform
        });

        // قطع التاريخ بعد الفهرس الحالي
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    /**
     * تراجع
     */
    undo() {
        if (this.historyIndex <= 0) return false;
        this.historyIndex--;
        this.restoreState(this.history[this.historyIndex]);
        return true;
    }

    /**
     * إعادة
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) return false;
        this.historyIndex++;
        this.restoreState(this.history[this.historyIndex]);
        return true;
    }

    /**
     * استعادة حالة
     */
    restoreState(stateStr) {
        const shape = this.getCurrentShape();
        if (!shape) return false;

        try {
            const state = JSON.parse(stateStr);
            shape.vertices = state.vertices;
            shape.edges = state.edges;
            shape.transform = state.transform;
            this.updateBounds(shape);
            return true;
        } catch (error) {
            console.error('فشل استعادة الحالة:', error);
            return false;
        }
    }

    /**
     * التحقق من إمكانية التراجع/الإعادة
     */
    canUndo() { return this.historyIndex > 0; }
    canRedo() { return this.historyIndex < this.history.length - 1; }

    /**
     * مسح كل الأشكال
     */
    clear() {
        this.shapes.clear();
        this.currentShapeId = null;
        this.history = [];
        this.historyIndex = -1;
    }
}

export default Vectorizer;