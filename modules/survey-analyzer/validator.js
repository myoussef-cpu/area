/**
 * Data Validator Module
 */

export class DataValidator {
    constructor() {
        this.warnings = [];
        this.errors = [];
        this.rules = { minVertices: 3, maxVertices: 20, minLength: 0.001, maxLength: 100000 };
    }

    validate(geometryData, measurements, shapeType) {
        this.warnings = [];
        this.errors = [];

        if (!geometryData) {
            this.addError('No geometric data', 'critical');
            return { isValid: false, errors: this.errors, warnings: this.warnings };
        }

        this.validateVertices(geometryData);
        this.validateEdges(geometryData);
        this.validateAngles(geometryData, shapeType);
        this.validateMeasurements(measurements);
        this.validateShapeType(geometryData, shapeType);

        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            hasWarnings: this.warnings.length > 0
        };
    }

    validateVertices(geometryData) {
        const vertices = geometryData.polygon?.vertices || [];
        const count = vertices.length;

        if (count < this.rules.minVertices) {
            this.addError(`Vertex count ${count} below minimum ${this.rules.minVertices}`, 'error');
        }
        if (count > this.rules.maxVertices) {
            this.addWarning(`Vertex count ${count} very large`);
        }
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                const dist = Math.hypot(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y);
                if (dist < 2) {
                    this.addWarning(`Vertices ${i+1} and ${j+1} too close`);
                }
            }
        }
        const signedArea = this.calculateArea(vertices);
        if (signedArea < 0) {
            this.addWarning('Vertices clockwise');
        }
    }

    validateEdges(geometryData) {
        const edges = geometryData.edges || [];
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const length = edge.length || Math.hypot(edge.x2 - edge.x1, edge.y2 - edge.y1);
            if (length <= 0) {
                this.addError(`Edge ${i+1} zero length`, 'error');
            }
        }
    }

    validateAngles(geometryData, shapeType) {
        if (!geometryData.angles) return;
        const angles = geometryData.angles.map(a => typeof a === 'object' ? a.angleDeg : a);
        const n = angles.length;
        const expectedSum = (n - 2) * 180;
        const actualSum = angles.reduce((a, b) => a + b, 0);
        const diff = Math.abs(actualSum - expectedSum);
        if (diff > 2) {
            this.addWarning(`Angle sum ${actualSum.toFixed(1)} != ${expectedSum}`);
        }
    }

    validateMeasurements(measurements) {
        if (!measurements || measurements.length === 0) return;
        for (let i = 0; i < measurements.length; i++) {
            const m = measurements[i];
            const value = typeof m === 'object' ? (m.value?.value ?? m.value) : m;
            if (value <= 0) {
                this.addError(`Measurement ${i+1} invalid value`, 'error');
            }
        }
    }

    validateShapeType(geometryData, shapeType) {
        if (!shapeType || !geometryData.polygon) return;
        const vertices = geometryData.polygon.vertices || [];
        const expected = { triangle: 3, trapezoid: 4, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 };
        if (expected[shapeType] && vertices.length !== expected[shapeType]) {
            this.addWarning(`Vertex count mismatch for ${shapeType}`);
        }
    }

    calculateArea(vertices) {
        let sum = 0;
        for (let i = 0; i < vertices.length; i++) {
            const j = (i + 1) % vertices.length;
            sum += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
        }
        return sum / 2;
    }

    addError(message, severity = 'error', details = {}) {
        this.errors.push({ type: 'error', message, severity, details, timestamp: Date.now() });
    }

    addWarning(message, details = {}) {
        this.warnings.push({ type: 'warning', message, details, timestamp: Date.now() });
    }

    clear() {
        this.warnings = [];
        this.errors = [];
    }
}

export default DataValidator;