/**
 * وحدة OCR - التعرف الضوئي على الحروف
 * تستخدم Tesseract.js لاستخراج النصوص والأرقام من الصور
 */

export class OCRProcessor {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.initPromise = this.initTesseract();
        this.supportedLanguages = ['ara', 'eng', 'ara+eng'];
        this.currentLanguage = 'ara+eng';
    }

    /**
     * تهيئة Tesseract.js مع Web Worker
     */
    async initTesseract() {
        return new Promise((resolve) => {
            // التحقق من وجود Tesseract محمل مسبقاً
            if (window.Tesseract && window.Tesseract.createWorker) {
                this.createWorker().then(resolve);
                return;
            }

            // انتظار تحميل المكتبة
            const checkTesseract = setInterval(() => {
                if (window.Tesseract && window.Tesseract.createWorker) {
                    clearInterval(checkTesseract);
                    this.createWorker().then(resolve);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkTesseract);
                if (!this.isReady) {
                    console.warn('Tesseract.js لم يتم تحميله خلال 30 ثانية');
                    resolve();
                }
            }, 30000);
        });
    }

    /**
     * إنشاء Worker للـ OCR
     */
    async createWorker() {
        try {
            this.worker = await window.Tesseract.createWorker({
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        this.onProgress?.(m.progress * 100);
                    }
                }
            });

            // تحميل اللغات
            await this.worker.loadLanguage(this.currentLanguage);
            await this.worker.initialize(this.currentLanguage);
            
            // إعدادات لتحسين التعرف على الأرقام
            await this.worker.setParameters({
                tessedit_char_whitelist: '0123456789.,/-+مسمتركلمليمترقدمبوصة',
                preserve_interword_spaces: '1',
                tessedit_pageseg_mode: window.Tesseract.PSM.SPARSE_TEXT,
            });

            this.isReady = true;
            console.log('Tesseract OCR جاهز');
        } catch (error) {
            console.error('فشل تهيئة Tesseract:', error);
            this.isReady = false;
        }
    }

    /**
     * تعيين دالة استدعاء للتقدم
     */
    onProgress(callback) {
        this.onProgress = callback;
    }

    /**
     * انتظار جاهزية OCR
     */
    async waitForReady() {
        await this.initPromise;
        return this.isReady;
    }

    /**
     * تغيير اللغة
     */
    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            throw new Error(`اللغة ${lang} غير مدعومة`);
        }
        if (lang === this.currentLanguage) return;

        this.currentLanguage = lang;
        if (this.worker) {
            await this.worker.terminate();
            await this.createWorker();
        }
    }

    /**
     * التعرف على النص من عنصر صورة
     * @param {HTMLImageElement|HTMLCanvasElement|string} imageSource - الصورة أو DataURL
     * @param {Object} options - خيارات التعرف
     */
    async recognize(imageSource, options = {}) {
        await this.waitForReady();
        if (!this.worker) throw new Error('OCR غير جاهز');

        const {
            language = this.currentLanguage,
            whitelist = null,
            psm = null,
            rectangle = null // { left, top, width, height } للنطاق المحدد
        } = options;

        try {
            // تعيين اللغة إذا مختلفة
            if (language !== this.currentLanguage) {
                await this.setLanguage(language);
            }

            // تعيين whitelist مخصص إذا ورد
            if (whitelist) {
                await this.worker.setParameters({
                    tessedit_char_whitelist: whitelist
                });
            }

            // تعيين PSM إذا ورد
            if (psm !== null) {
                await this.worker.setParameters({
                    tessedit_pageseg_mode: psm
                });
            }

            // تعيين منطقة محددة إذا وردت
            if (rectangle) {
                await this.worker.setRectangle(
                    rectangle.left,
                    rectangle.top,
                    rectangle.width,
                    rectangle.height
                );
            }

            // التعرف
            const { data } = await this.worker.recognize(imageSource);

            return this.parseResult(data);
        } catch (error) {
            console.error('خطأ في OCR:', error);
            throw error;
        }
    }

    /**
     * التعرف على مناطق متعددة (للأرقام على الأضلاع)
     */
    async recognizeMultipleRegions(imageSource, regions) {
        await this.waitForReady();
        if (!this.worker) throw new Error('OCR غير جاهز');

        const results = [];
        
        for (const region of regions) {
            try {
                await this.worker.setRectangle(
                    region.left,
                    region.top,
                    region.width,
                    region.height
                );
                
                const { data } = await this.worker.recognize(imageSource);
                const parsed = this.parseResult(data);
                parsed.region = region;
                results.push(parsed);
            } catch (error) {
                console.warn(`فشل التعرف على المنطقة ${region.id}:`, error);
                results.push({ region, error: error.message, text: '', confidence: 0 });
            }
        }

        // إعادة تعيين المستطيل
        await this.worker.setRectangle(0, 0, 0, 0);

        return results;
    }

    /**
     * تحليل نتيجة Tesseract
     */
    parseResult(data) {
        const lines = data.lines || [];
        const words = data.words || [];
        const paragraphs = data.paragraphs || [];
        const blocks = data.blocks || [];

        // استخراج الأرقام مع مواقعها
        const numbers = [];
        
        // من الكلمات
        for (const word of words) {
            const text = word.text.trim();
            if (this.isMeasurementText(text)) {
                numbers.push({
                    text: text,
                    value: this.parseMeasurement(text),
                    confidence: word.confidence,
                    bbox: word.bbox,
                    x: word.bbox.x0 + (word.bbox.x1 - word.bbox.x0) / 2,
                    y: word.bbox.y0 + (word.bbox.y1 - word.bbox.y0) / 2
                });
            }
        }

        // من السطور (للحصول على نص أطول)
        for (const line of lines) {
            const text = line.text.trim();
            if (this.isMeasurementText(text) && text.length > 2) {
                // التحقق من عدم تكرار
                const exists = numbers.some(n => n.text === text && 
                    Math.abs(n.x - (line.bbox.x0 + line.bbox.x1) / 2) < 20 &&
                    Math.abs(n.y - (line.bbox.y0 + line.bbox.y1) / 2) < 20);
                if (!exists) {
                    numbers.push({
                        text: text,
                        value: this.parseMeasurement(text),
                        confidence: line.confidence,
                        bbox: line.bbox,
                        x: (line.bbox.x0 + line.bbox.x1) / 2,
                        y: (line.bbox.y0 + line.bbox.y1) / 2
                    });
                }
            }
        }

        return {
            fullText: data.text,
            confidence: data.confidence,
            numbers: numbers,
            lines: lines.map(l => ({
                text: l.text,
                confidence: l.confidence,
                bbox: l.bbox
            })),
            words: words.map(w => ({
                text: w.text,
                confidence: w.confidence,
                bbox: w.bbox
            })),
            paragraphs: paragraphs.map(p => ({
                text: p.text,
                confidence: p.confidence,
                bbox: p.bbox
            }))
        };
    }

    /**
     * التحقق من كون النص قيماً رقمية (قياسات)
     */
    isMeasurementText(text) {
        // نمط للأرقام مع وحدات محتملة
        const patterns = [
            /^\d+([.,]\d+)?\s*(م|متر|سم|سنتيمتر|ملم|ملمتر|قدم|بوصة|مللي)?$/i,
            /^\d+([.,]\d+)?\s*(م٢|م2|م^2|سم٢|سم2)$/i,
            /^\d+([.,]\d+)?\s*[x×]\s*\d+([.,]\d+)?$/i, // أبعاد مثل 10x20
            /^\d+([.,]\d+)?$/ // رقم بسيط
        ];

        return patterns.some(p => p.test(text.trim()));
    }

    /**
     * تحويل نص القياس إلى قيمة رقمية
     */
    parseMeasurement(text) {
        const cleaned = text.replace(/[^\d.,x×\-]/g, '').trim();
        
        // التعامل مع أبعاد (10x20)
        if (/x|×/.test(cleaned)) {
            const parts = cleaned.split(/[x×]/).map(p => parseFloat(p.replace(',', '.')));
            return { type: 'dimension', values: parts };
        }

        const value = parseFloat(cleaned.replace(',', '.'));
        return isNaN(value) ? null : { type: 'length', value: value };
    }

    /**
     * التعرف المحسن للأرقام فقط
     */
    async recognizeNumbersOnly(imageSource, region = null) {
        return this.recognize(imageSource, {
            whitelist: '0123456789.,',
            psm: window.Tesseract.PSM.SINGLE_LINE,
            rectangle: region
        });
    }

    /**
     * إنهاء Worker
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isReady = false;
        }
    }
}

// مثيل وحيد
export const ocrProcessor = new OCRProcessor();
export default ocrProcessor;