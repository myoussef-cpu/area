(function() {
    if (document.getElementById('mini-calc-styles')) return;

    const style = document.createElement('style');
    style.id = 'mini-calc-styles';
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

        #mini-calc-container {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 10000;
            direction: rtl;
            font-family: 'Tajawal', Arial, sans-serif;
            touch-action: none;
        }

        /* ========== Toggle — glass sphere ========== */
        #mini-calc-toggle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(145deg, rgba(255,255,255,0.75), rgba(240,244,255,0.3));
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            color: #007aff;
            border: 1px solid rgba(255,255,255,0.4);
            box-shadow:
                0 8px 32px rgba(0,0,0,0.06),
                inset 0 1px 0 rgba(255,255,255,0.6);
            cursor: move;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
        }

        #mini-calc-toggle:hover {
            transform: scale(1.08);
            box-shadow:
                0 12px 40px rgba(0,122,255,0.12),
                inset 0 1px 0 rgba(255,255,255,0.7);
        }

        #mini-calc-toggle:active {
            transform: scale(0.88);
        }

        .dark-mode #mini-calc-toggle {
            background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
            color: #5ac8fa;
            border-color: rgba(255,255,255,0.08);
            box-shadow:
                0 8px 32px rgba(0,0,0,0.3),
                inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .dark-mode #mini-calc-toggle:hover {
            box-shadow:
                0 12px 40px rgba(90,200,250,0.08),
                inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* ========== Calculator box ========== */
        #mini-calc-box {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 260px;
            background: linear-gradient(
                160deg,
                rgba(255, 255, 255, 0.55) 0%,
                rgba(240, 244, 255, 0.45) 40%,
                rgba(255, 255, 255, 0.6) 100%
            );
            backdrop-filter: blur(40px) saturate(140%);
            -webkit-backdrop-filter: blur(40px) saturate(140%);
            border: 1px solid rgba(255, 255, 255, 0.45);
            border-radius: 24px;
            box-shadow:
                0 25px 70px rgba(0, 0, 0, 0.06),
                0 8px 24px rgba(0, 0, 0, 0.04),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
            padding: 16px;
            display: none;
            flex-direction: column;
            gap: 10px;
            overflow: hidden;
            animation: miniReveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: bottom right;
        }

        #mini-calc-box.active {
            display: flex;
        }

        .dark-mode #mini-calc-box {
            background: linear-gradient(
                160deg,
                rgba(25, 28, 38, 0.75) 0%,
                rgba(18, 22, 35, 0.65) 40%,
                rgba(28, 32, 45, 0.75) 100%
            );
            border-color: rgba(255, 255, 255, 0.06);
            box-shadow:
                0 25px 70px rgba(0, 0, 0, 0.3),
                0 8px 24px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        @keyframes miniReveal {
            from {
                opacity: 0;
                transform: scale(0.5) translateY(40px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        /* ========== Glass highlight overlay ========== */
        .mini-highlight {
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            background: radial-gradient(
                farthest-side at 30% 20%,
                rgba(255, 255, 255, 0.08) 0%,
                transparent 60%
            );
        }

        .dark-mode .mini-highlight {
            background: radial-gradient(
                farthest-side at 30% 20%,
                rgba(120, 180, 255, 0.03) 0%,
                transparent 60%
            );
        }

        /* ========== Display ========== */
        .mini-display-wrapper {
            position: relative;
            background: linear-gradient(
                160deg,
                rgba(8, 12, 28, 0.92) 0%,
                rgba(14, 20, 40, 0.95) 50%,
                rgba(6, 10, 24, 0.92) 100%
            );
            border-radius: 16px;
            padding: 12px 14px;
            direction: ltr;
            text-align: left;
            box-shadow:
                inset 0 4px 30px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.04),
                0 10px 30px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.04);
            overflow: hidden;
        }

        #mini-history {
            color: rgba(180, 200, 255, 0.35);
            font-size: 11px;
            font-family: 'Roboto Mono', monospace;
            min-height: 14px;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            position: relative;
            z-index: 1;
        }

        #mini-display {
            color: rgba(255, 255, 255, 0.92);
            font-size: 22px;
            font-family: 'Roboto Mono', monospace;
            font-weight: 400;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            position: relative;
            z-index: 1;
            text-shadow:
                0 0 40px rgba(100, 180, 255, 0.06),
                0 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* ========== Button grid ========== */
        .mini-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            position: relative;
            z-index: 1;
        }

        .mini-grid button {
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 17px;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-family: 'Tajawal', sans-serif;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            touch-action: manipulation;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                        background 0.2s,
                        box-shadow 0.2s;
        }

        .mini-grid button i {
            font-size: 0.9rem;
        }

        .mini-grid button:active {
            transform: scale(0.9);
        }

        /* Number buttons */
        .mini-grid button {
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            color: #1c1c1e;
            border: 1px solid rgba(255, 255, 255, 0.35);
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow:
                0 4px 14px rgba(0, 0, 0, 0.04),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .mini-grid button:active {
            background: rgba(255, 255, 255, 0.35);
        }

        /* Operator buttons */
        .mini-grid .op {
            background: rgba(0, 122, 255, 0.06);
            color: #007aff;
            border-color: rgba(0, 122, 255, 0.1);
            border-bottom-color: rgba(0, 122, 255, 0.04);
        }

        .mini-grid .op:active {
            background: rgba(0, 122, 255, 0.12);
        }

        /* Equals button */
        .mini-grid .eq {
            background: linear-gradient(
                145deg,
                rgba(0, 122, 255, 0.6) 0%,
                rgba(0, 100, 220, 0.5) 100%
            );
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow:
                0 6px 20px rgba(0, 122, 255, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            grid-column: span 2;
            font-size: 20px;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }

        .mini-grid .eq:active {
            background: linear-gradient(
                145deg,
                rgba(0, 122, 255, 0.7) 0%,
                rgba(0, 100, 220, 0.6) 100%
            );
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
        }

        /* Clear button */
        .mini-grid .clr {
            background: rgba(255, 59, 48, 0.06);
            color: #ff3b30;
            border-color: rgba(255, 59, 48, 0.1);
            border-bottom-color: rgba(255, 59, 48, 0.04);
            grid-column: span 2;
            font-size: 14px;
        }

        .mini-grid .clr:active {
            background: rgba(255, 59, 48, 0.12);
        }

        /* ========== Dark mode overrides ========== */
        .dark-mode .mini-grid button {
            background: rgba(255, 255, 255, 0.04);
            color: rgba(255, 255, 255, 0.85);
            border-color: rgba(255, 255, 255, 0.06);
            border-bottom-color: rgba(255, 255, 255, 0.02);
            box-shadow:
                0 4px 14px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .dark-mode .mini-grid button:active {
            background: rgba(255, 255, 255, 0.08);
        }

        .dark-mode .mini-grid .op {
            background: rgba(90, 200, 250, 0.06);
            color: #5ac8fa;
            border-color: rgba(90, 200, 250, 0.08);
        }

        .dark-mode .mini-grid .op:active {
            background: rgba(90, 200, 250, 0.1);
        }

        .dark-mode .mini-grid .eq {
            background: linear-gradient(
                145deg,
                rgba(90, 200, 250, 0.25) 0%,
                rgba(60, 160, 220, 0.2) 100%
            );
            border-color: rgba(90, 200, 250, 0.1);
            box-shadow: 0 6px 20px rgba(90, 200, 250, 0.1);
        }

        .dark-mode .mini-grid .eq:active {
            background: linear-gradient(
                145deg,
                rgba(90, 200, 250, 0.3) 0%,
                rgba(60, 160, 220, 0.25) 100%
            );
        }

        .dark-mode .mini-grid .clr {
            background: rgba(255, 105, 97, 0.06);
            color: #ff6961;
            border-color: rgba(255, 105, 97, 0.06);
        }

        .dark-mode .mini-grid .clr:active {
            background: rgba(255, 105, 97, 0.1);
        }

        /* شوية تظبيط للموبايل */
        @media (max-width: 480px) {
            #mini-calc-box {
                width: 240px;
                bottom: 75px;
                right: -10px;
            }
            #mini-calc-toggle {
                width: 56px;
                height: 56px;
                font-size: 24px;
            }
        }
    `;
    document.head.appendChild(style);

    // بنبني الـ HTML بتاعنا هنا يا ريس
    const container = document.createElement('div');
    container.id = 'mini-calc-container';
    container.innerHTML = `
        <div id="mini-calc-box">
            <div class="mini-highlight"></div>
            <div class="mini-display-wrapper">
                <div id="mini-history"></div>
                <div id="mini-display">0</div>
            </div>
            <div class="mini-grid">
                <button class="clr" id="mini-clr" title="مسح الكل"><i class="fas fa-trash-alt"></i> مسح</button>
                <button class="op" data-val="/" title="قسمة"><i class="fas fa-divide"></i></button>
                <button class="op" data-val="*" title="ضرب"><i class="fas fa-times"></i></button>

                <button data-val="7">7</button>
                <button data-val="8">8</button>
                <button data-val="9">9</button>
                <button class="op" data-val="-" title="طرح"><i class="fas fa-minus"></i></button>

                <button data-val="4">4</button>
                <button data-val="5">5</button>
                <button data-val="6">6</button>
                <button class="op" data-val="+" title="جمع"><i class="fas fa-plus"></i></button>

                <button data-val="1">1</button>
                <button data-val="2">2</button>
                <button data-val="3">3</button>
                <button data-val=".">.</button>

                <button data-val="0">0</button>
                <button class="eq" id="mini-eq" title="يساوي"><i class="fas fa-equals"></i></button>
            </div>
        </div>
        <div id="mini-calc-toggle" title="سحب للتحريك، ضغطة للفتح">
            <i class="fas fa-calculator"></i>
        </div>
    `;
    document.body.appendChild(container);

    // شوية الـ Logic اللي بيشغلوا المكنة
    const box = document.getElementById('mini-calc-box');
    const toggle = document.getElementById('mini-calc-toggle');
    const display = document.getElementById('mini-display');
    const historyDisp = document.getElementById('mini-history');

    let currentInput = '0';
    let history = '';

    function updateMiniDisplay() {
        display.textContent = currentInput;
        historyDisp.textContent = history;
    }

    // هنا بنهندل كليكات الزراير
    const handleButtonClick = (e) => {
        let btn = e.target;
        // لو داس على الأيقونة اللي جوه الزرار، نطلع للزرار نفسه
        if (btn.tagName === 'I') btn = btn.parentElement;
        if (btn.tagName !== 'BUTTON') return;

        e.preventDefault();
        e.stopPropagation();

        // لو داس مسح
        if (btn.id === 'mini-clr') {
            currentInput = '0';
            history = '';
        }
        // لو داس يساوي
        else if (btn.id === 'mini-eq') {
            try {
                if (currentInput === '0' || !currentInput) return;
                history = currentInput + ' =';
                let expression = currentInput.replace(/×/g, '*').replace(/÷/g, '/');
                // بنستخدم Function بدل eval عشان الأمان والحلاوة
                let result = new Function('return ' + expression)();
                currentInput = String(Number(result.toFixed(8)));
            } catch {
                currentInput = 'Error';
                setTimeout(() => { currentInput = '0'; updateMiniDisplay(); }, 1000);
            }
        }
        // لو داس رقم أو عملية
        else {
            const val = btn.getAttribute('data-val');
            if (!val) return;

            if (currentInput === '0' && !isNaN(val)) {
                currentInput = val;
            } else {
                // نمنع تكرار العلامات العشرية
                if (val === '.' && currentInput.includes('.')) return;
                currentInput += val;
            }
        }
        updateMiniDisplay();
    };

    box.addEventListener('click', handleButtonClick);

    // دالة الفتح والقفل
    function toggleBox() {
        box.classList.toggle('active');
        if (box.classList.contains('active')) {
            toggle.style.transform = 'rotate(90deg) scale(0.8)';
            toggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            toggle.style.transform = '';
            toggle.innerHTML = '<i class="fas fa-calculator"></i>';
        }
    }

    // لوجيك السحب (Drag) عشان اليوزر يحطها في الحتة اللي تريحه
    let isDragging = false;
    let dragMoved = false;
    let startX, startY, initialX, initialY;
    const dragThreshold = 10; // حساسية السحب

    // استعادة المكان المتسجل لو موجود
    const savedPos = localStorage.getItem('mini-calc-position');
    if (savedPos) {
        const { left, top } = JSON.parse(savedPos);
        container.style.left = left;
        container.style.top = top;
        container.style.right = 'auto';
        container.style.bottom = 'auto';
    }

    const handleStart = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        startX = e.clientX;
        startY = e.clientY;
        initialX = container.offsetLeft;
        initialY = container.offsetTop;
        dragMoved = false;
        isDragging = true;

        toggle.setPointerCapture(e.pointerId);
    };

    const handleMove = (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!dragMoved && distance > dragThreshold) {
            dragMoved = true;
        }

        if (dragMoved) {
            let newX = initialX + dx;
            let newY = initialY + dy;

            // عشان متخرجش بره الشاشة
            newX = Math.max(0, Math.min(window.innerWidth - toggle.offsetWidth, newX));
            newY = Math.max(0, Math.min(window.innerHeight - toggle.offsetHeight, newY));

            container.style.left = newX + 'px';
            container.style.top = newY + 'px';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        }
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        toggle.releasePointerCapture(e.pointerId);

        // حفظ المكان لو اتحرك
        if (dragMoved) {
            localStorage.setItem('mini-calc-position', JSON.stringify({
                left: container.style.left,
                top: container.style.top
            }));
        }
    };

    // لما يدوس كليك عادية
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragMoved) {
            toggleBox();
        }
        dragMoved = false;
    });

    toggle.addEventListener('pointerdown', handleStart);
    toggle.addEventListener('pointermove', handleMove);
    toggle.addEventListener('pointerup', handleEnd);
    toggle.addEventListener('pointercancel', handleEnd);

    toggle.addEventListener('contextmenu', (e) => e.preventDefault());
    box.addEventListener('pointerdown', (e) => e.stopPropagation());
    box.addEventListener('click', (e) => e.stopPropagation());

})();
