/**
 * Export Image Utility
 * تحويل النتائج والرسومات إلى صور PNG
 */

window.ExportImage = {
    /**
     * التحقق من ظهور العنصر
     */
    isVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetHeight > 0;
    },

    /**
     * التقاط عنصر HTML وتحميله كصورة
     */
    async captureElement(elementId, filename) {
        const element = document.getElementById(elementId);
        if (!element || !this.isVisible(element)) {
            alert('لا توجد نتيجة لتصديرها');
            return;
        }
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: document.body.classList.contains('dark-mode') ? '#1c1c1e' : '#ffffff',
                useCORS: true,
                logging: false
            });
            this.downloadCanvas(canvas, filename);
        } catch (err) {
            console.error('Export error:', err);
            alert('حدث خطأ أثناء التصدير');
        }
    },

    /**
     * تحميل Canvas مباشرة كصورة
     */
    captureCanvas(canvasId, filename) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || canvas.offsetHeight === 0) {
            alert('لا توجد رسمة لتصديرها');
            return;
        }
        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#1c1c1e' : '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            ctx.drawImage(canvas, 0, 0);
            this.downloadCanvas(tempCanvas, filename);
        } catch (err) {
            console.error('Canvas export error:', err);
            alert('حدث خطأ أثناء التصدير');
        }
    },

    /**
     * التقاط النتيجة + الرسمة معاً
     */
    async captureCombined(resultId, canvasId, filename) {
        const resultEl = document.getElementById(resultId);
        if (!resultEl || !this.isVisible(resultEl)) {
            alert('لا توجد نتيجة لتصديرها');
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'padding: 20px; background: ' +
            (document.body.classList.contains('dark-mode') ? '#1c1c1e' : '#ffffff') +
            '; direction: rtl; font-family: Tajawal, sans-serif; width: 600px;';
        const resultClone = resultEl.cloneNode(true);
        resultClone.style.cssText = 'display: block; margin-bottom: 15px;';
        wrapper.appendChild(resultClone);
        const canvasEl = canvasId ? document.getElementById(canvasId) : null;
        if (canvasEl && canvasEl.offsetHeight > 0) {
            const img = new Image();
            img.src = canvasEl.toDataURL();
            img.style.cssText = 'max-width: 100%; border-radius: 12px; margin-top: 10px;';
            wrapper.appendChild(img);
            await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
        }
        wrapper.style.position = 'fixed';
        wrapper.style.top = '-9999px';
        document.body.appendChild(wrapper);
        try {
            const canvas = await html2canvas(wrapper, {
                scale: 2,
                backgroundColor: document.body.classList.contains('dark-mode') ? '#1c1c1e' : '#ffffff',
                useCORS: true,
                logging: false
            });
            this.downloadCanvas(canvas, filename);
        } catch (err) {
            console.error('Combined export error:', err);
            alert('حدث خطأ أثناء التصدير');
        } finally {
            document.body.removeChild(wrapper);
        }
    },

    /**
     * تحميل Canvas كملف PNG
     */
    downloadCanvas(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    /**
     * توليد اسم ملف تلقائي
     */
    generateFilename(toolName) {
        const date = new Date().toISOString().split('T')[0];
        const cleanName = toolName
            .replace(/[^\w\u0600-\u06FF]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 50);
        return cleanName + '_' + date;
    },

    /**
     * البحث عن أول عنصر نتيجة مرئي
     */
    findFirstVisibleResult() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return null;

        const selectors = [
            '#trapezoidResults', '#resultCard', '#initialArea', '#results',
            '.result-card', '.result-inline', '.result-box',
            '#res1', '#res2', '#res3',
            '#lengthResult', '#areaResult'
        ];

        for (const sel of selectors) {
            const elements = mainContent.querySelectorAll(sel);
            for (const el of elements) {
                if (this.isVisible(el)) return el;
            }
        }
        return null;
    },

    /**
     * البحث عن Canvas مرئي
     */
    findVisibleCanvas() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return null;
        // البحث عن أي canvas مرئي (shapeCanvas, quadCanvas, trapezoidCanvas, lengthCanvas, areaCanvas)
        const canvasSelectors = ['canvas#shapeCanvas', 'canvas#quadCanvas', 'canvas#trapezoidCanvas', 'canvas#lengthCanvas', 'canvas#areaCanvas'];
        for (const sel of canvasSelectors) {
            const canvas = mainContent.querySelector(sel);
            if (canvas && canvas.offsetHeight > 0) return canvas;
        }
        return null;
    },

    /**
     * حقن أزرار التصدير في الصفحة الحالية
     */
    injectExportButtons() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // إزالة الأزرار القديمة
        mainContent.querySelectorAll('.export-section').forEach(el => el.remove());

        // تحديد اسم الصفحة للسمة
        const titleEl = mainContent.querySelector('title');
        let pageName = 'result';
        if (titleEl) {
            pageName = titleEl.textContent || 'result';
        }
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== 'main') {
            pageName = hash;
        }

        // لا نحقن أزرار في الصفحات غير الأدوات
        const nonToolPages = ['main', 'calculator', 'saved_results', 'all_tools', 'smart_tool', 'settings', 'profile', 'login'];
        if (nonToolPages.includes(hash || 'main')) return;

        // إنشاء قسم التصدير
        const exportSection = document.createElement('div');
        exportSection.className = 'export-section card';
        exportSection.style.cssText = 'display: flex; gap: 10px; margin-top: 15px; padding: 15px; flex-wrap: wrap; justify-content: center;';

        // زر 1: تحميل النتيجة
        const btnExportResult = document.createElement('button');
        btnExportResult.className = 'btn-main';
        btnExportResult.style.cssText = 'flex: 1; min-width: 140px; background: #8e44ad; box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);';
        btnExportResult.innerHTML = '<i class="fas fa-camera"></i> تحميل النتيجة كصورة';
        btnExportResult.onclick = () => {
            const filename = this.generateFilename(pageName);
            const result = this.findFirstVisibleResult();
            if (result && result.id) {
                this.captureElement(result.id, filename);
            } else {
                this.captureElement('main-content', filename);
            }
        };
        exportSection.appendChild(btnExportResult);

        // زر 2: تحميل الرسمة
        const btnExportCanvas = document.createElement('button');
        btnExportCanvas.className = 'btn-main export-canvas-btn';
        btnExportCanvas.style.cssText = 'flex: 1; min-width: 140px; background: #e67e22; box-shadow: 0 4px 15px rgba(230, 126, 34, 0.3); display: none;';
        btnExportCanvas.innerHTML = '<i class="fas fa-image"></i> تحميل الرسمة كصورة';
        btnExportCanvas.onclick = () => {
            const filename = this.generateFilename(pageName + '_drawing');
            const canvas = this.findVisibleCanvas();
            if (canvas && canvas.id) {
                this.captureCanvas(canvas.id, filename);
            }
        };
        exportSection.appendChild(btnExportCanvas);

        // زر 3: تحميل الكل
        const btnExportCombined = document.createElement('button');
        btnExportCombined.className = 'btn-main export-combined-btn';
        btnExportCombined.style.cssText = 'flex: 1; min-width: 140px; background: #27ae60; box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3); display: none;';
        btnExportCombined.innerHTML = '<i class="fas fa-download"></i> تحميل الكل كصورة';
        btnExportCombined.onclick = () => {
            const filename = this.generateFilename(pageName);
            const result = this.findFirstVisibleResult();
            const resultId = (result && result.id) ? result.id : 'resultCard';
            const canvas = this.findVisibleCanvas();
            const canvasId = canvas ? canvas.id : null;
            this.captureCombined(resultId, canvasId, filename);
        };
        exportSection.appendChild(btnExportCombined);

        // مراقب التغييرات لإظهار/إخفاء أزرار الرسمة
        const updateCanvasButtons = () => {
            const hasCanvas = !!this.findVisibleCanvas();
            btnExportCanvas.style.display = hasCanvas ? 'flex' : 'none';
            btnExportCombined.style.display = hasCanvas ? 'flex' : 'none';
        };

        const observer = new MutationObserver(updateCanvasButtons);
        observer.observe(mainContent, { childList: true, subtree: true, attributes: true });
        updateCanvasButtons();

        // إدراج القسم
        const calcContainer = mainContent.querySelector('.calc-container');
        if (calcContainer) {
            calcContainer.appendChild(exportSection);
        } else {
            mainContent.appendChild(exportSection);
        }
    }
};
