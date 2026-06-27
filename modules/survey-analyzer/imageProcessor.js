/**
 * وحدة معالجة الصور - Image Processor
 * تستخدم OpenCV.js لمعالجة وتحسين الصور
 * 
 * الوظائف:
 * - إزالة الضوضاء
 * - زيادة التباين
 * - تصحيح المنظور (Perspective Correction)
 * - إزالة الظلال
 * - تحويل الصورة لصيغة مناسبة للتحليل
 */

export class ImageProcessor {
    constructor() {
        this.cv = null;
        this.isReady = false;
        this.initPromise = this.initOpenCV();
    }

    /**
     * تهيئة OpenCV.js
     */
    async initOpenCV() {
        return new Promise((resolve) => {
            // التحقق من وجود OpenCV محمل مسبقاً
            if (window.cv && window.cv.Mat) {
                this.cv = window.cv;
                this.isReady = true;
                resolve();
                return;
            }

            // انتظار تحميل OpenCV
            const checkOpenCV = setInterval(() => {
                if (window.cv && window.cv.Mat) {
                    clearInterval(checkOpenCV);
                    this.cv = window.cv;
                    this.isReady = true;
                    resolve();
                }
            }, 100);

            // مهلة انتظار قصوى 30 ثانية
            setTimeout(() => {
                clearInterval(checkOpenCV);
                if (!this.isReady) {
                    console.warn('OpenCV.js لم يتم تحميله خلال 30 ثانية');
                    resolve();
                }
            }, 30000);
        });
    }

    /**
     * انتظار جاهزية OpenCV
     */
    async waitForReady() {
        await this.initPromise;
        return this.isReady;
    }

    /**
     * تحويل عنصر صورة (img, canvas, file) إلى cv.Mat
     */
    async imageToMat(imageElement) {
        await this.waitForReady();
        if (!this.cv) throw new Error('OpenCV غير متاح');

        return new Promise((resolve, reject) => {
            try {
                let mat;
                if (imageElement instanceof HTMLCanvasElement) {
                    mat = this.cv.imread(imageElement);
                } else if (imageElement instanceof HTMLImageElement) {
                    const canvas = document.createElement('canvas');
                    canvas.width = imageElement.naturalWidth || imageElement.width;
                    canvas.height = imageElement.naturalHeight || imageElement.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(imageElement, 0, 0);
                    mat = this.cv.imread(canvas);
                } else {
                    reject(new Error('نوع عنصر صورة غير مدعوم'));
                    return;
                }
                resolve(mat);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * تحويل cv.Mar إلى DataURL
     */
    matToDataURL(mat, format = 'image/png') {
        const canvas = document.createElement('canvas');
        this.cv.imshow(canvas, mat);
        return canvas.toDataURL(format);
    }

    /**
     * معالجة الصورة الكاملة - Pipeline رئيسي
     */
    async processImage(imageElement, options = {}) {
        await this.waitForReady();
        if (!this.cv) throw new Error('OpenCV غير متاح');

        const {
            denoise = true,
            enhanceContrast = true,
            correctPerspective = true,
            removeShadows = true,
            targetWidth = 1920,
            targetHeight = 1080
        } = options;

        let src = await this.imageToMat(imageElement);
        let processed = src.clone();

        try {
            // 1. تغيير الحجم إذا كان كبيراً جداً
            processed = this.resizeIfNeeded(processed, targetWidth, targetHeight);

            // 2. تحويل للرمادي للمعالجة
            let gray = new this.cv.Mat();
            this.cv.cvtColor(processed, gray, this.cv.COLOR_RGBA2GRAY);

            // 3. إزالة الضوضاء
            if (denoise) {
                processed = this.denoiseImage(processed);
            }

            // 4. زيادة التباين (CLAHE)
            if (enhanceContrast) {
                processed = this.enhanceContrastCLAHE(processed);
            }

            // 5. إزالة الظلال
            if (removeShadows) {
                processed = this.removeShadows(processed);
            }

            // 6. تصحيح المنظور
            if (correctPerspective) {
                const corrected = await this.correctPerspectiveAuto(processed);
                if (corrected) {
                    processed.delete();
                    processed = corrected;
                }
            }

            // 7. شحذ الصورة (Sharpening)
            processed = this.sharpenImage(processed);

            // تنظيف المصفوفات المؤقتة
            src.delete();
            gray.delete();

            return processed;
        } catch (error) {
            src.delete();
            gray.delete();
            if (processed && !processed.isDeleted()) processed.delete();
            throw error;
        }
    }

    /**
     * تغيير الحجم مع الحفاظ على نسبة العرض للارتفاع
     */
    resizeIfNeeded(mat, maxWidth, maxHeight) {
        const scale = Math.min(maxWidth / mat.cols, maxHeight / mat.rows, 1);
        if (scale >= 1) return mat.clone();

        const dst = new this.cv.Mat();
        const dsize = new this.cv.Size(Math.round(mat.cols * scale), Math.round(mat.rows * scale));
        this.cv.resize(mat, dst, dsize, 0, 0, this.cv.INTER_AREA);
        return dst;
    }

    /**
     * إزالة الضوضاء باستخدام Fast NlMeans Denoising
     */
    denoiseImage(mat) {
        const dst = new this.cv.Mat();
        // h: قوة التنعيم (3-10)، hColor: للصور الملونة، templateWindowSize: 7، searchWindowSize: 21
        this.cv.fastNlMeansDenoisingColored(mat, dst, 3, 3, 7, 21);
        return dst;
    }

    /**
     * زيادة التباين باستخدام CLAHE (Contrast Limited Adaptive Histogram Equalization)
     */
    enhanceContrastCLAHE(mat) {
        // تحويل إلى مختبر (LAB) للعمل على قناة الإضاءة فقط
        const lab = new this.cv.Mat();
        this.cv.cvtColor(mat, lab, this.cv.COLOR_RGBA2RGB);
        this.cv.cvtColor(lab, lab, this.cv.COLOR_RGB2Lab);

        // فصل القنوات
        const channels = new this.cv.MatVector();
        this.cv.split(lab, channels);

        // تطبيق CLAHE على قناة L (الإضاءة)
        const clahe = new this.cv.CLAHE(2.0, new this.cv.Size(8, 8));
        const lChannel = channels.get(0);
        const enhancedL = new this.cv.Mat();
        clahe.apply(lChannel, enhancedL);

        // استبدال قناة L المحسنة
        channels.set(0, enhancedL);

        // دمج القنوات
        const merged = new this.cv.Mat();
        this.cv.merge(channels, merged);

        // تحويل للـ RGBA
        const rgb = new this.cv.Mat();
        this.cv.cvtColor(merged, rgb, this.cv.COLOR_Lab2RGB);
        const dst = new this.cv.Mat();
        this.cv.cvtColor(rgb, dst, this.cv.COLOR_RGB2RGBA);

        // تنظيف
        lab.delete();
        channels.delete();
        lChannel.delete();
        enhancedL.delete();
        merged.delete();
        rgb.delete();
        clahe.delete();

        return dst;
    }

    /**
     * إزالة الظلال باستخدام معالجة مورفولوجية
     */
    removeShadows(mat) {
        // تحويل للرمادي
        const gray = new this.cv.Mat();
        this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);

        // توسيع (Dilation) لتقدير الخلفية
        const kernel = this.cv.getStructuringElement(this.cv.MORPH_RECT, new this.cv.Size(15, 15));
        const bg = new this.cv.Mat();
        this.cv.dilate(gray, bg, kernel);

        // تمويه الخلفية
        this.cv.GaussianBlur(bg, bg, new this.cv.Size(15, 15), 0);

        // طرح الخلفية من الصورة الأصلية
        const diff = new this.cv.Mat();
        this.cv.absdiff(gray, bg, diff);

        // عكس (الخلفية تصبح فاتحة، النص داكن)
        const inverted = new this.cv.Mat();
        this.cv.bitwise_not(diff, inverted);

        // تطبيع
        const normalized = new this.cv.Mat();
        this.cv.normalize(inverted, normalized, 0, 255, this.cv.NORM_MINMAX);

        // تحويل للـ RGBA
        const dst = new this.cv.Mat();
        this.cv.cvtColor(normalized, dst, this.cv.COLOR_GRAY2RGBA);

        // تنظيف
        gray.delete();
        kernel.delete();
        bg.delete();
        diff.delete();
        inverted.delete();
        normalized.delete();

        return dst;
    }

    /**
     * تصحيح المنظور تلقائياً - يبحث عن أكبر مستطيل
     */
    async correctPerspectiveAuto(mat) {
        // تحويل للرمادي
        const gray = new this.cv.Mat();
        this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);

        // كشف الحواف
        const edges = new this.cv.Mat();
        this.cv.Canny(gray, edges, 50, 150);

        // عمليات مورفولوجية لغلق الفجوات
        const kernel = this.cv.getStructuringElement(this.cv.MORPH_RECT, new this.cv.Size(3, 3));
        const closed = new this.cv.Mat();
        this.cv.morphologyEx(edges, closed, this.cv.MORPH_CLOSE, kernel);

        // العثور على الكونتورات
        const contours = new this.cv.MatVector();
        const hierarchy = new this.cv.Mat();
        this.cv.findContours(closed, contours, hierarchy, this.cv.RETR_EXTERNAL, this.cv.CHAIN_APPROX_SIMPLE);

        let bestContour = null;
        let maxArea = 0;

        // البحث عن أكبر كونتور رباعي الزوايا
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = this.cv.contourArea(contour);
            
            if (area > maxArea && area > (mat.cols * mat.rows * 0.1)) { // على الأقل 10% من الصورة
                const peri = this.cv.arcLength(contour, true);
                const approx = new this.cv.Mat();
                this.cv.approxPolyDP(contour, approx, 0.02 * peri, true);
                
                if (approx.rows === 4) { // رباعي زوايا
                    maxArea = area;
                    if (bestContour) bestContour.delete();
                    bestContour = approx.clone();
                }
                approx.delete();
            }
            contour.delete();
        }

        // تنظيف
        gray.delete();
        edges.delete();
        kernel.delete();
        closed.delete();
        contours.delete();
        hierarchy.delete();

        if (!bestContour) return null;

        // ترتيب النقاط: أعلى يسار، أعلى يمين، أسفل يمين، أسفل يسار
        const pts = this.orderPoints(bestContour);
        bestContour.delete();

        // النقاط الهدف (مستطيل منتظم)
        const w = Math.max(
            Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
            Math.hypot(pts[2].x - pts[3].x, pts[2].y - pts[3].y)
        );
        const h = Math.max(
            Math.hypot(pts[0].x - pts[3].x, pts[0].y - pts[3].y),
            Math.hypot(pts[1].x - pts[2].x, pts[1].y - pts[2].y)
        );

        const dstPts = new this.cv.Mat(4, 1, this.cv.CV_32FC2);
        const dstData = dstPts.data32F;
        dstData[0] = 0; dstData[1] = 0;
        dstData[2] = w; dstData[3] = 0;
        dstData[4] = w; dstData[5] = h;
        dstData[6] = 0; dstData[7] = h;

        // تحويل المنظور
        const srcPts = new this.cv.Mat(4, 1, this.cv.CV_32FC2);
        const srcData = srcPts.data32F;
        for (let i = 0; i < 4; i++) {
            srcData[i * 2] = pts[i].x;
            srcData[i * 2 + 1] = pts[i].y;
        }

        const M = this.cv.getPerspectiveTransform(srcPts, dstPts);
        const warped = new this.cv.Mat();
        this.cv.warpPerspective(mat, warped, M, new this.cv.Size(w, h));

        // تنظيف
        srcPts.delete();
        dstPts.delete();
        M.delete();

        return warped;
    }

    /**
     * ترتيب نقاط الزوايا الأربع
     */
    orderPoints(contour) {
        const data = contour.data32F;
        const pts = [];
        for (let i = 0; i < 4; i++) {
            pts.push({ x: data[i * 2], y: data[i * 2 + 1] });
        }

        // الترتيب: مجموع الإحداثيات (x+y) - الأصغر = أعلى يسار، الأكبر = أسفل يمين
        // الفرق (y-x) - الأصغر = أعلى يمين، الأكبر = أسفل يسار
        pts.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        const topLeft = pts[0];
        const bottomRight = pts[3];
        
        const remaining = [pts[1], pts[2]];
        remaining.sort((a, b) => (a.y - a.x) - (b.y - b.x));
        const topRight = remaining[0];
        const bottomLeft = remaining[1];

        return [topLeft, topRight, bottomRight, bottomLeft];
    }

    /**
     * شحذ الصورة (Sharpening)
     */
    sharpenImage(mat) {
        const kernel = new this.cv.Mat(3, 3, this.cv.CV_32F);
        const kData = kernel.data32F;
        // مصفوفة شحذ قياسية
        kData[0] = 0; kData[1] = -1; kData[2] = 0;
        kData[3] = -1; kData[4] = 5; kData[5] = -1;
        kData[6] = 0; kData[7] = -1; kData[8] = 0;

        const dst = new this.cv.Mat();
        this.cv.filter2D(mat, dst, -1, kernel);
        kernel.delete();
        return dst;
    }

    /**
     * تحويل الصورة للثنائي (Binarization) لـ OCR
     */
    async binarizeForOCR(mat) {
        const gray = new this.cv.Mat();
        this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);

        // تكيفي (Adaptive Thresholding) - أفضل للنصوص
        const binary = new this.cv.Mat();
        this.cv.adaptiveThreshold(
            gray, binary, 255,
            this.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            this.cv.THRESH_BINARY,
            11, 2
        );

        // عمليات مورفولوجية لتنظيف النص
        const kernel = this.cv.getStructuringElement(this.cv.MORPH_RECT, new this.cv.Size(2, 2));
        const cleaned = new this.cv.Mat();
        this.cv.morphologyEx(binary, cleaned, this.cv.MORPH_CLOSE, kernel);

        // تحويل للـ RGBA للعرض
        const dst = new this.cv.Mat();
        this.cv.cvtColor(cleaned, dst, this.cv.COLOR_GRAY2RGBA);

        // تنظيف
        gray.delete();
        binary.delete();
        kernel.delete();
        cleaned.delete();

        return dst;
    }

    /**
     * كشف الحواف (Edge Detection)
     */
    async detectEdges(mat, lowThreshold = 50, highThreshold = 150) {
        const gray = new this.cv.Mat();
        this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);

        const edges = new this.cv.Mat();
        this.cv.Canny(gray, edges, lowThreshold, highThreshold);

        // توسيع الحواف قليلاً
        const kernel = this.cv.getStructuringElement(this.cv.MORPH_RECT, new this.cv.Size(2, 2));
        const dilated = new this.cv.Mat();
        this.cv.dilate(edges, dilated, kernel);

        gray.delete();
        edges.delete();
        kernel.delete();

        return dilated;
    }

    /**
     * كشف الخطوط باستخدام Hough Line Transform
     */
    async detectLines(edgeMat, options = {}) {
        const {
            rho = 1,
            theta = Math.PI / 180,
            threshold = 100,
            minLineLength = 50,
            maxLineGap = 10
        } = options;

        const lines = new this.cv.Mat();
        this.cv.HoughLinesP(
            edgeMat, lines,
            rho, theta, threshold,
            minLineLength, maxLineGap
        );

        const result = [];
        for (let i = 0; i < lines.rows; i++) {
            const data = lines.data32S;
            result.push({
                x1: data[i * 4],
                y1: data[i * 4 + 1],
                x2: data[i * 4 + 2],
                y2: data[i * 4 + 3]
            });
        }

        lines.delete();
        return result;
    }

    /**
     * كشف الزوايا (Corner Detection) - Harris Corner Detector
     */
    async detectCorners(mat, options = {}) {
        const {
            blockSize = 2,
            ksize = 3,
            k = 0.04,
            threshold = 0.01
        } = options;

        const gray = new this.cv.Mat();
        this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);

        const dst = new this.cv.Mat();
        this.cv.cornerHarris(gray, dst, blockSize, ksize, k);

        // تطبيع
        const dstNorm = new this.cv.Mat();
        this.cv.normalize(dst, dstNorm, 0, 255, this.cv.NORM_MINMAX, this.cv.CV_32F);

        const corners = [];
        const data = dstNorm.data32F;
        const width = dstNorm.cols;
        const height = dstNorm.rows;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (data[idx] > threshold * 255) {
                    // Non-maximum suppression بسيط
                    let isLocalMax = true;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nIdx = ny * width + nx;
                                if (data[nIdx] > data[idx]) {
                                    isLocalMax = false;
                                    break;
                                }
                            }
                        }
                        if (!isLocalMax) break;
                    }
                    if (isLocalMax) {
                        corners.push({ x, y, strength: data[idx] });
                    }
                }
            }
        }

        gray.delete();
        dst.delete();
        dstNorm.delete();

        return corners;
    }

    /**
     * تحويل Mat إلى Blob للتحميل
     */
    matToBlob(mat, type = 'image/png') {
        const canvas = document.createElement('canvas');
        this.cv.imshow(canvas, mat);
        return new Promise(resolve => {
            canvas.toBlob(resolve, type);
        });
    }

    /**
     * تنظيف الموارد
     */
    cleanup(...mats) {
        mats.forEach(mat => {
            if (mat && !mat.isDeleted()) mat.delete();
        });
    }
}

// تصدير مثاف وحيد (Singleton)
export const imageProcessor = new ImageProcessor();
export default imageProcessor;