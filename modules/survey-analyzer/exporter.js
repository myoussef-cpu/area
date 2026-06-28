/**
 * Exporter Module
 */

export class Exporter {
    exportToJSON(shape) {
        if (!shape) return null;
        return JSON.stringify({
            type: shape.type,
            vertices: shape.vertices,
            edges: shape.edges.map(e => ({ start: e.startVertex, end: e.endVertex, length: e.length, name: e.name, measurement: e.measurement })),
            center: shape.center,
            metadata: shape.metadata
        }, null, 2);
    }

    exportToSVG(shape, width = 800, height = 600, padding = 50) {
        if (!shape) return null;
        const bounds = shape.bounds;
        const scale = Math.min((width - 2 * padding) / bounds.width, (height - 2 * padding) / bounds.height) * 0.9;
        const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale;
        const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale;

        let svg = '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">';
        svg += '<rect width="100%" height="100%" fill="white"/>';
        svg += '<g transform="translate(' + offsetX + ',' + offsetY + ') scale(' + scale + ')">';

        if (shape.vertices.length >= 3) {
            const pts = shape.vertices.map(v => v.x + ',' + v.y).join(' ');
            svg += '<polygon points="' + pts + '" fill="rgba(52,152,219,0.1)" stroke="#3498db" stroke-width="' + (3/scale) + '" />';
        }

        for (const edge of shape.edges) {
            if (!edge.isDiagonal) {
                svg += '<line x1="' + edge.x1 + '" y1="' + edge.y1 + '" x2="' + edge.x2 + '" y2="' + edge.y2 + '" stroke="#3498db" stroke-width="' + (3/scale) + '" />';
                if (edge.measurement) {
                    const mx = (edge.x1 + edge.x2) / 2;
                    const my = (edge.y1 + edge.y2) / 2;
                    const val = typeof edge.measurement === 'object' ? (edge.measurement.value?.toFixed(2) || edge.measurement.value) : Number(edge.measurement).toFixed(2);
                    svg += '<text x="' + mx + '" y="' + (my-5/scale) + '" text-anchor="middle" fill="#e67e22" font-size="' + (14/scale) + '">' + val + 'm</text>';
                }
            }
        }

        for (let i = 0; i < shape.vertices.length; i++) {
            const v = shape.vertices[i];
            svg += '<circle cx="' + v.x + '" cy="' + v.y + '" r="' + (8/scale) + '" fill="#e74c3c" stroke="white" stroke-width="' + (2/scale) + '" />';
            svg += '<text x="' + v.x + '" y="' + (v.y+4/scale) + '" text-anchor="middle" fill="white" font-size="' + (12/scale) + '">' + (i+1) + '</text>';
        }

        svg += '</g></svg>';
        return svg;
    }

    downloadSVG(svgString, filename = 'shape.svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        this.downloadBlob(blob, filename);
    }

    downloadJSON(jsonString, filename = 'shape.json') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export default Exporter;