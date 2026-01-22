(function() {
    // يعني يا باشا لو الاستايلات موجودة خلاص مش هنحطها تاني
    if (document.getElementById('mini-calc-styles')) return;

    // هنا بقى بنعمل الاستايلات اللي هتخلي الآلة الحاسبة شكلها "برنس"
    const style = document.createElement('style');
    style.id = 'mini-calc-styles';
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Roboto+Mono:wght@500&display=swap');
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

        /* الزرار اللي بيفتح الآلة الحاسبة، عاملينه عايم وشيك */
        #mini-calc-toggle {
            width: 65px;
            height: 65px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
            cursor: move;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
        }

        #mini-calc-toggle:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 30px rgba(52, 152, 219, 0.5);
        }

        #mini-calc-toggle:active {
            transform: scale(0.9);
        }

        /* الصندوق بتاع الآلة الحاسبة نفسه */
        #mini-calc-box {
            position: absolute;
            bottom: 85px;
            right: 0;
            width: 260px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.15);
            padding: 18px;
            display: none;
            flex-direction: column;
            gap: 12px;
            border: 1px solid rgba(255, 255, 255, 0.4);
            animation: calcReveal 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            transform-origin: bottom right;
        }

        #mini-calc-box.active {
            display: flex;
        }

        @keyframes calcReveal {
            from { 
                opacity: 0; 
                transform: scale(0.5) translateY(40px);
                filter: blur(10px);
            }
            to { 
                opacity: 1; 
                transform: scale(1) translateY(0);
                filter: blur(0);
            }
        }

        /* الشاشة اللي بتعرض الأرقام */
        .mini-display-wrapper {
            background: #1a1a1a;
            padding: 15px;
            border-radius: 18px;
            text-align: right;
            direction: ltr;
            box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
        }

        #mini-history {
            color: rgba(255, 255, 255, 0.4);
            font-size: 11px;
            font-family: 'Roboto Mono', monospace;
            min-height: 14px;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        #mini-display {
            color: #2ecc71;
            font-size: 24px;
            font-family: 'Roboto Mono', monospace;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* تقسيمة الزراير */
        .mini-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }

        .mini-grid button {
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 600;
            border: none;
            border-radius: 14px;
            cursor: pointer;
            background: #ffffff;
            color: #2c3e50;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: 'Tajawal', sans-serif;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            -webkit-tap-highlight-color: transparent;
        }

        .mini-grid button:hover {
            background: #f0f3f5;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.08);
        }

        .mini-grid button:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            background: #e8ecef;
        }

        /* زراير العمليات الحسابية */
        .mini-grid .op {
            background: #f8f9fa;
            color: #3498db;
        }

        /* زرار التساوي الأخضر */
        .mini-grid .eq {
            background: #2ecc71;
            color: white;
            grid-column: span 2;
            box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
        }
        
        .mini-grid .eq:hover {
            background: #27ae60;
            box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
        }

        /* زرار المسح الأحمر */
        .mini-grid .clr {
            background: #ff7675;
            color: white;
            grid-column: span 2;
            box-shadow: 0 4px 15px rgba(255, 118, 117, 0.3);
        }

        .mini-grid .clr:hover {
            background: #d63031;
            box-shadow: 0 6px 20px rgba(255, 118, 117, 0.4);
        }

        /* شوية تظبيط للموبايل */
        @media (max-width: 480px) {
            #mini-calc-box {
                width: 240px;
                bottom: 80px;
                right: -10px;
            }
            #mini-calc-toggle {
                width: 60px;
                height: 60px;
                font-size: 26px;
            }
        }
    `;
    document.head.appendChild(style);

    // بنبني الـ HTML بتاعنا هنا يا ريس
    const container = document.createElement('div');
    container.id = 'mini-calc-container';
    container.innerHTML = `
        <div id="mini-calc-box">
            <div class="mini-display-wrapper">
                <div id="mini-history"></div>
                <div id="mini-display">0</div>
            </div>
            <div class="mini-grid">
                <button class="clr" id="mini-clr" title="مسح الكل"><i class="fas fa-trash-alt"></i></button>
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
            // انيميشن بسيط للزرار لما يفتح
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