/**
 * وحدة المحرر - Editor
 * توفر واجهة تفاعلية لتحرير الأشكال المتجهة
 * تدعم: تحريك الرؤوس، تعديل الأطوال، إضافة/حذف الأضلاع، التدوير، التكبير
 */

export class ShapeEditor {
    constructor(vectorizer, canvas) {
        this.vectorizer = vectorizer;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // حالة التحرير
        this.mode = 'select'; // select, move_vertex, add_vertex, measure, pan, rotate, scale
        this.selectedShapeId = null;
        this.selectedVertexIndex = -1;
        this.selectedEdgeIndex = -1;
        this.hoveredVertexIndex = -1;
        this.hoveredEdgeIndex = -1;
        
        // تفاعل الماوس
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        // إعدادات
        this.vertexHitRadius = 15;
        this.edgeHitThreshold = 10;
        this.gridSize = 20;
        this.snapToGrid = false;
        this.snapToAngle = false;
        this.angleSnapIncrement = Math.PI / 18; // 10 درجات
        
        // قياسات مؤقتة أثناء التحرير
        this.tempMeasurement = null;
        this.measurementInputActive = false;
        
        // استدعاءات (callbacks)
        this.onChange = null;
        this.onVertexMove = null;
        this.onEdgeSelect = null;
        this.onMeasurementChange = null;
        
        this.bindEvents();
    }

    /**
     * ربط أحداث الماوس/اللمس
     */
    bindEvents() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        // دعم اللمس
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    /**
     * تعيين الشكل الحالي
     */
    setShape(shapeId) {
        this.selectedShapeId = shapeId;
        this.selectedVertexIndex = -1;
        this.selectedEdgeIndex = -1;
        this.render();
    }

    /**
     * تعيين وضع التحرير
     */
    setMode(mode) {
        this.mode = mode;
        this.canvas.style.cursor = this.getCursorForMode(mode);
        this.render();
    }

    getCursorForMode(mode) {
        const cursors = {
            'select': 'default',
            'move_vertex': 'grab',
            'add_vertex': 'crosshair',
            'measure': 'text',
            'pan': 'grab',
            'rotate': 'pointer',
            'scale': 'se-resize'
        };
        return cursors[mode] || 'default';
    }

    /**
     * تحويل إحداثيات الماوس إلى إحداثيات Canvas
     */
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    /**
     * أحداث الماوس
     */
    onMouseDown(event) {
        const pos = this.getMousePos(event);
        this.lastMousePos = pos;
        this.dragStart = { ...pos };
        
        if (event.button === 1 || (event.button === 0 && event.altKey)) {
            // زر وسط أو Alt + يسار = تحريك اللوحة
            this.setMode('pan');
            this.isDragging = true;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (event.button === 2) return; // زر يمين

        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        // التحقق من النقر على رأس
        const vertexHit = this.hitTestVertex(pos, shape);
        if (vertexHit >= 0) {
            this.selectedVertexIndex = vertexHit;
            if (this.mode === 'select' || this.mode === 'move_vertex') {
                this.setMode('move_vertex');
                this.isDragging = true;
            }
            this.render();
            return;
        }

        // التحقق من النقر على ضلع
        const edgeHit = this.hitTestEdge(pos, shape);
        if (edgeHit >= 0) {
            this.selectedEdgeIndex = edgeHit;
            if (this.onEdgeSelect) this.onEdgeSelect(edgeHit, shape.edges[edgeHit]);
            
            if (this.mode === 'measure') {
                this.startMeasurementInput(edgeHit);
            }
            this.render();
            return;
        }

        // نقر في منطقة فارغة
        if (this.mode === 'add_vertex') {
            this.addVertexAtPosition(pos);
        } else if (this.mode === 'pan') {
            this.isDragging = true;
            this.canvas.style.cursor = 'grabbing';
        }

        this.selectedVertexIndex = -1;
        this.selectedEdgeIndex = -1;
        this.render();
    }

    onMouseMove(event) {
        const pos = this.getMousePos(event);
        this.lastMousePos = pos;

        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        // تحديث التحويم
        this.hoveredVertexIndex = this.hitTestVertex(pos, shape);
        this.hoveredEdgeIndex = this.hoveredVertexIndex < 0 ? this.hitTestEdge(pos, shape) : -1;

        if (this.isDragging) {
            const dx = pos.x - this.dragStart.x;
            const dy = pos.y - this.dragStart.y;

            switch (this.mode) {
                case 'move_vertex':
                    if (this.selectedVertexIndex >= 0) {
                        let newX = pos.x;
                        let newY = pos.y;
                        
                        // snap to grid
                        if (this.snapToGrid) {
                            newX = Math.round(newX / this.gridSize) * this.gridSize;
                            newY = Math.round(newY / this.gridSize) * this.gridSize;
                        }
                        
                        this.vectorizer.updateVertex(this.selectedShapeId, this.selectedVertexIndex, { x: newX, y: newY });
                        if (this.onVertexMove) this.onVertexMove(this.selectedVertexIndex, { x: newX, y: newY });
                    }
                    break;

                case 'pan':
                    this.vectorizer.translate(this.selectedShapeId, dx, dy);
                    break;

                case 'rotate':
                    this.handleRotation(pos);
                    break;

                case 'scale':
                    this.handleScaling(pos);
                    break;
            }

            this.dragStart = { ...pos };
            this.render();
        }

        this.updateCursor(pos, shape);
    }

    onMouseUp(event) {
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        
        if (this.mode === 'pan') {
            this.setMode('select');
        }
        this.canvas.style.cursor = this.getCursorForMode(this.mode);
    }

    onWheel(event) {
        event.preventDefault();
        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        // تكبير/تصغير بالعجلة
        const factor = event.deltaY > 0 ? 0.9 : 1.1;
        const pos = this.getMousePos(event);
        this.vectorizer.scale(this.selectedShapeId, factor, pos);
        
        if (this.onChange) this.onChange();
        this.render();
    }

    onDoubleClick(event) {
        const pos = this.getMousePos(event);
        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        // النقر المزدوج على ضلع لإضافة رأس
        const edgeHit = this.hitTestEdge(pos, shape);
        if (edgeHit >= 0) {
            const edge = shape.edges[edgeHit];
            const midX = (edge.x1 + edge.x2) / 2;
            const midY = (edge.y1 + edge.y2) / 2;
            this.vectorizer.addVertex(this.selectedShapeId, edgeHit, { x: midX, y: midY });
            if (this.onChange) this.onChange();
            this.render();
        }
    }

    // أحداث اللمس
    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const fakeEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0,
                altKey: false,
                preventDefault: () => event.preventDefault()
            };
            this.onMouseDown(fakeEvent);
        } else if (event.touches.length === 2) {
            // إيماءة تكبير/تدوير بإصبعين
            this.initialTouchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
            this.initialTouchAngle = this.getTouchAngle(event.touches[0], event.touches[1]);
            this.initialTouchCenter = this.getTouchCenter(event.touches[0], event.touches[1]);
        }
    }

    onTouchMove(event) {
        if (event.touches.length === 1 && this.isDragging) {
            const touch = event.touches[0];
            const fakeEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault()
            };
            this.onMouseMove(fakeEvent);
        } else if (event.touches.length === 2) {
            // تكبير/تدوير
            const dist = this.getTouchDistance(event.touches[0], event.touches[1]);
            const angle = this.getTouchAngle(event.touches[0], event.touches[1]);
            
            const scaleFactor = dist / this.initialTouchDistance;
            const rotation = angle - this.initialTouchAngle;
            
            const shape = this.vectorizer.getShape(this.selectedShapeId);
            if (shape) {
                this.vectorizer.scale(this.selectedShapeId, scaleFactor, this.initialTouchCenter);
                this.vectorizer.rotate(this.selectedShapeId, rotation, this.initialTouchCenter);
                this.render();
            }
        }
    }

    onTouchEnd(event) {
        this.onMouseUp({});
    }

    getTouchDistance(t1, t2) {
        return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    }

    getTouchAngle(t1, t2) {
        return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
    }

    getTouchCenter(t1, t2) {
        return {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2
        };
    }

    /**
     * اختبار اصطدام الرأس
     */
    hitTestVertex(pos, shape) {
        for (let i = 0; i < shape.vertices.length; i++) {
            const v = shape.vertices[i];
            const dist = Math.hypot(pos.x - v.x, pos.y - v.y);
            if (dist <= this.vertexHitRadius / shape.transform.scale) {
                return i;
            }
        }
        return -1;
    }

    /**
     * اختبار اصطدام الضلع
     */
    hitTestEdge(pos, shape) {
        for (let i = 0; i < shape.edges.length; i++) {
            const edge = shape.edges[i];
            const dist = this.pointToLineDistance(pos, edge);
            if (dist <= this.edgeHitThreshold / shape.transform.scale) {
                return i;
            }
        }
        return -1;
    }

    /**
     * المسافة من نقطة لخط
     */
    pointToLineDistance(point, edge) {
        const { x1, y1, x2, y2 } = edge;
        const A = point.x - x1;
        const B = point.y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * C; yy = y1 + param * D; }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.hypot(dx, dy);
    }

    /**
     * معالجة التدوير
     */
    handleRotation(pos) {
        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        const center = shape.center;
        const startAngle = Math.atan2(this.dragStart.y - center.y, this.dragStart.x - center.x);
        const currentAngle = Math.atan2(pos.y - center.y, pos.x - center.x);
        let angleDiff = currentAngle - startAngle;

        // snap to angle
        if (this.snapToAngle) {
            angleDiff = Math.round(angleDiff / this.angleSnapIncrement) * this.angleSnapIncrement;
        }

        this.vectorizer.rotate(this.selectedShapeId, angleDiff, center);
    }

    /**
     * معالجة التكبير
     */
    handleScaling(pos) {
        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        const center = shape.center;
        const startDist = Math.hypot(this.dragStart.x - center.x, this.dragStart.y - center.y);
        const currentDist = Math.hypot(pos.x - center.x, pos.y - center.y);
        
        if (startDist > 0) {
            const factor = currentDist / startDist;
            this.vectorizer.scale(this.selectedShapeId, factor, center);
        }
    }

    /**
     * إضافة رأس في موضع
     */
    addVertexAtPosition(pos) {
        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        // إيجاد أقرب ضلع
        let minDist = Infinity;
        let closestEdge = -1;
        
        for (let i = 0; i < shape.edges.length; i++) {
            const dist = this.pointToLineDistance(pos, shape.edges[i]);
            if (dist < minDist) {
                minDist = dist;
                closestEdge = i;
            }
        }

        if (closestEdge >= 0 && minDist < 50) {
            this.vectorizer.addVertex(this.selectedShapeId, closestEdge, pos);
            if (this.onChange) this.onChange();
        }
    }

    /**
     * بدء إدخال القياس
     */
    startMeasurementInput(edgeIndex) {
        this.measurementInputActive = true;
        this.tempMeasurement = { edgeIndex };
        
        // إنشاء حقل إدخال
        this.showMeasurementInput(edgeIndex);
    }

    /**
     * عرض حقل إدخال القياس
     */
    showMeasurementInput(edgeIndex) {
        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        const edge = shape.edges[edgeIndex];
        const mx = (edge.x1 + edge.x2) / 2;
        const my = (edge.y1 + edge.y2) / 2;

        // تحويل إحداثيات canvas إلى إحداثيات الشاشة
        const rect = this.canvas.getBoundingClientRect();
        const screenX = rect.left + mx * (rect.width / this.canvas.width);
        const screenY = rect.top + my * (rect.height / this.canvas.height);

        // إزالة أي حقل سابق
        this.hideMeasurementInput();

        // إنشاء حقل الإدخال
        const input = document.createElement('input');
        input.id = 'edge-measurement-input';
        input.type = 'number';
        input.step = 'any';
        input.placeholder = 'الطول بالمتر';
        input.style.position = 'fixed';
        input.style.left = `${screenX}px`;
        input.style.top = `${screenY - 30}px`;
        input.style.transform = 'translateX(-50%)';
        input.style.zIndex = '1000';
        input.style.padding = '8px 12px';
        input.style.borderRadius = '8px';
        input.style.border = '2px solid #3498db';
        input.style.fontSize = '14px';
        input.style.fontFamily = 'Tajawal';
        input.style.direction = 'rtl';
        input.style.textAlign = 'center';
        input.style.minWidth = '100px';
        input.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

        // تعبئة القيمة الحالية
        if (edge.measurement) {
            const val = typeof edge.measurement === 'object' ? edge.measurement.value : edge.measurement;
            input.value = val;
        }

        document.body.appendChild(input);
        input.focus();

        const finish = () => {
            const value = parseFloat(input.value);
            if (!isNaN(value) && value > 0) {
                this.vectorizer.updateEdgeMeasurement(this.selectedShapeId, edgeIndex, value);
                if (this.onMeasurementChange) this.onMeasurementChange(edgeIndex, value);
                if (this.onChange) this.onChange();
            }
            this.hideMeasurementInput();
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') finish();
            if (e.key === 'Escape') this.hideMeasurementInput();
        });
    }

    hideMeasurementInput() {
        const input = document.getElementById('edge-measurement-input');
        if (input) input.remove();
        this.measurementInputActive = false;
        this.tempMeasurement = null;
    }

    /**
     * تحديث المؤشر بناءً على الوضع والموضع
     */
    updateCursor(pos, shape) {
        if (this.isDragging) return;

        if (this.hoveredVertexIndex >= 0) {
            this.canvas.style.cursor = this.mode === 'move_vertex' ? 'grabbing' : 'grab';
        } else if (this.hoveredEdgeIndex >= 0) {
            this.canvas.style.cursor = this.mode === 'measure' ? 'text' : 'pointer';
        } else {
            this.canvas.style.cursor = this.getCursorForMode(this.mode);
        }
    }

    /**
     * الرسم
     */
    render() {
        if (!this.ctx) return;
        
        const shape = this.vectorizer.getShape(this.selectedShapeId);
        if (!shape) return;

        // مسح الكانفاس
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // رسم شبكة خلفية
        if (this.snapToGrid) {
            this.drawGrid();
        }

        // رسم الشكل
        this.vectorizer.drawOnCanvas(this.ctx, this.selectedShapeId, {
            showVertices: true,
            showMeasurements: true,
            showEdgeNames: true
        });

        // تسليط الضوء على الرأس المحدد/المحوّم
        this.drawHighlights(shape);
    }

    drawGrid() {
        const gridSize = this.gridSize * this.vectorizer.getShape(this.selectedShapeId)?.transform.scale || this.gridSize;
        this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawHighlights(shape) {
        // الرأس المحوّم
        if (this.hoveredVertexIndex >= 0 && this.hoveredVertexIndex !== this.selectedVertexIndex) {
            const v = shape.vertices[this.hoveredVertexIndex];
            this.ctx.beginPath();
            this.ctx.arc(v.x, v.y, this.vertexHitRadius * 1.2, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#f39c12';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // الرأس المحدد
        if (this.selectedVertexIndex >= 0) {
            const v = shape.vertices[this.selectedVertexIndex];
            this.ctx.beginPath();
            this.ctx.arc(v.x, v.y, this.vertexHitRadius * 1.5, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        // الضلع المحوّم
        if (this.hoveredEdgeIndex >= 0 && this.hoveredEdgeIndex !== this.selectedEdgeIndex) {
            const edge = shape.edges[this.hoveredEdgeIndex];
            this.ctx.beginPath();
            this.ctx.moveTo(edge.x1, edge.y1);
            this.ctx.lineTo(edge.x2, edge.y2);
            this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
            this.ctx.lineWidth = 6;
            this.ctx.stroke();
        }

        // الضلع المحدد
        if (this.selectedEdgeIndex >= 0) {
            const edge = shape.edges[this.selectedEdgeIndex];
            this.ctx.beginPath();
            this.ctx.moveTo(edge.x1, edge.y1);
            this.ctx.lineTo(edge.x2, edge.y2);
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 6;
            this.ctx.stroke();
        }
    }

    /**
     * تنظيف
     */
    destroy() {
        this.hideMeasurementInput();
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('wheel', this.onWheel);
        this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    }
}

export default ShapeEditor;