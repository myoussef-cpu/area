/**
 * Survey Analyzer - Main Orchestrator
 */

import { imageProcessor } from './imageProcessor.js';
import { ocrProcessor } from './ocr.js';
import GeometryDetector from './geometryDetector.js';
import ShapeClassifier from './shapeClassifier.js';
import EdgeMatcher from './edgeMatcher.js';
import { Vectorizer } from './vectorizer.js';
import { DataValidator } from './validator.js';
import { Exporter } from './exporter.js';

export class SurveyAnalyzer {
    constructor(options = {}) {
        this.imageProcessor = imageProcessor;
        this.ocr = ocrProcessor;
        this.geometry = new GeometryDetector(imageProcessor);
        this.classifier = new ShapeClassifier();
        this.edgeMatcher = new EdgeMatcher();
        this.vectorizer = new Vectorizer();
        this.validator = new DataValidator();
        this.exporter = new Exporter();

        this.state = {
            currentImage: null,
            processedImage: null,
            geometryData: null,
            ocrData: null,
            classification: null,
            matchedData: null,
            shape: null,
            validation: null
        };

        this.onProgress = options.onProgress || (() => {});
        this.onStateChange = options.onStateChange || (() => {});
        this.onError = options.onError || console.error;
    }

    async init() {
        await this.imageProcessor.waitForReady().catch(() => {});
        await this.ocr.waitForReady().catch(() => {});
        return true;
    }

    async analyze(imageElement, options = {}) {
        try {
            this.onProgress(10, 'Processing image');
            this.state.processedImage = await this.imageProcessor.processImage(imageElement, options.processOptions);

            this.onProgress(30, 'Detecting geometry');
            this.state.geometryData = await this.geometry.detectGeometry(this.state.processedImage, options.geometryOptions);

            this.onProgress(50, 'Extracting text');
            this.state.ocrData = await this.ocr.recognize(imageElement, options.ocrOptions);

            this.onProgress(60, 'Classifying shape');
            this.state.classification = this.classifier.classify(this.state.geometryData, this.state.ocrData.numbers);

            this.onProgress(70, 'Matching measurements');
            this.state.matchedData = this.edgeMatcher.matchMeasurementsToEdges(
                this.state.ocrData.numbers,
                this.state.geometryData.edges || [],
                this.state.geometryData.polygon?.vertices || [],
                imageElement.width || 1920,
                imageElement.height || 1080
            );

            this.onProgress(80, 'Creating vector model');
            this.state.shape = this.vectorizer.createShape(
                this.state.geometryData,
                this.state.matchedData.matchedEdges,
                this.state.classification?.type || 'unknown',
                { sourceImage: imageElement.src }
            );

            this.onProgress(90, 'Validating');
            this.state.validation = this.validator.validate(
                this.state.geometryData,
                this.state.ocrData.numbers,
                this.state.classification?.type
            );

            this.onProgress(100, 'Complete');
            this.onStateChange('complete', this.state);
            return this.state;
        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    exportSVG() {
        return this.exporter.exportToSVG(this.state.shape);
    }

    exportJSON() {
        return this.exporter.exportToJSON(this.state.shape);
    }
}

export default SurveyAnalyzer;