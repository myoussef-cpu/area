(function() {
    // يعني يا باشا لو الاستايلات موجودة خلاص مش هنحطها تاني
    if (document.getElementById('reset-btn-styles')) return;

    // استايلات الزرار العائم بتاع "تصفير" الحسابات
    const style = document.createElement('style');
    style.id = 'reset-btn-styles';
    style.textContent = `
        #reset-floating-btn {
            position: fixed;
            bottom: 100px; /* رفعناه أكتر عشان يبان */
            left: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff4b2b, #ff416c); /* لون برتقالي محمر شوية عشان يبان */
            color: white;
            border: 3px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 10px 25px rgba(255, 75, 43, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            z-index: 10001; /* فوق كل حاجة بما فيهم الآلة */
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            opacity: 0;
            visibility: hidden;
            transform: scale(0) rotate(-180deg);
        }

        #reset-floating-btn.visible {
            opacity: 1;
            visibility: visible;
            transform: scale(1) rotate(0deg);
        }

        #reset-floating-btn:hover {
            transform: scale(1.1) rotate(-15deg);
            box-shadow: 0 12px 30px rgba(231, 76, 60, 0.5);
        }

        #reset-floating-btn:active {
            transform: scale(0.9);
        }

        /* تلميح صغير يظهر فوق الزرار */
        #reset-floating-btn::after {
            content: "تصفير الحقول";
            position: absolute;
            bottom: 75px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-family: 'Tajawal', sans-serif;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }

        #reset-floating-btn:hover::after {
            opacity: 1;
        }

        @media (max-width: 480px) {
            #reset-floating-btn {
                width: 55px;
                height: 55px;
                bottom: 85px; /* نفس المكان عشان ميتداراش */
                left: 15px;
                font-size: 20px;
                border-width: 2px;
            }
        }
    `;
    document.head.appendChild(style);

    // إنشاء الزرار لو مش موجود
    let resetBtn = document.getElementById('reset-floating-btn');
    if (!resetBtn) {
        resetBtn = document.createElement('button');
        resetBtn.id = 'reset-floating-btn';
        resetBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
        resetBtn.title = 'تصفير كل الحقول';
        document.body.appendChild(resetBtn);
    }

    // دالة عشان تظهر الزرار بس في صفحات الأدوات
    function updateResetBtnVisibility() {
        const toolPages = [
            'cyclicQuadrilateral', 
            'divide_area', 
            'irregular_quadrilateral', 
            'trapezoid', 
            'trapezoid_height_division', 
            'triangle',
            'calculator' // ضيفنا الآلة الحاسبة كمان
        ];
        
        // بنشوف الصفحة الحالية من الـ hash أو من الـ URL
        const currentHash = window.location.hash.replace('#', '');
        
        if (toolPages.includes(currentHash)) {
            resetBtn.classList.add('visible');
        } else {
            resetBtn.classList.remove('visible');
        }
    }

    // نراقب التغيير في الـ URL بكل الطرق الممكنة
    window.addEventListener('hashchange', updateResetBtnVisibility);
    window.addEventListener('popstate', updateResetBtnVisibility);
    
    // وعشان الـ pushState مش بتعمل trigger لأي event، هنراقب الـ DOM نفسه
    const observer = new MutationObserver(() => {
        updateResetBtnVisibility();
    });
    
    // هنراقب الـ title بتاع الصفحة لأنه بيتغير مع كل صفحة جديدة
    const titleElement = document.querySelector('title');
    if (titleElement) {
        observer.observe(titleElement, { childList: true });
    }
    
    // وكمان نراقب الـ main-content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        observer.observe(mainContent, { childList: true });
    }

    // وكمان نشغلها أول ما السكريبت يحمل
    setTimeout(updateResetBtnVisibility, 100);

    // وظيفة التصفير
    resetBtn.onclick = function() {
        // 1. مسح كل الـ inputs و الـ selects
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else if (input.type === 'number' || input.type === 'text') {
                input.value = '';
            }
        });

        // 2. مسح مناطق النتائج
        const resultContainers = document.querySelectorAll('[id*="result"], [id*="Result"], [id*="Area"], .result-container, .result-card');
        resultContainers.forEach(container => {
            if (container.tagName === 'DIV' || container.tagName === 'SPAN' || container.tagName === 'P') {
                // لو هو الـ container الأساسي اللي جواه الـ h3 والـ p
                if (container.id === 'initialArea' || container.classList.contains('result-card')) {
                    container.classList.add('hidden');
                }
                container.innerText = '';
            }
        });

        // 3. إخفاء زرار الحفظ
        const saveBtns = document.querySelectorAll('[id*="save"], [id*="Save"], .save-btn');
        saveBtns.forEach(btn => {
            btn.style.display = 'none';
        });

        // 4. لو فيه حاجة مرسومة (Canvas) مثلاً في صفحات تانية
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        // أنيميشن خفيف عشان اليوزر يحس إنه عمل حاجة
        resetBtn.style.transform = 'rotate(-360deg) scale(0.9)';
        setTimeout(() => {
            resetBtn.style.transform = '';
        }, 500);

        console.log("🧹 All fields cleared!");
    };

    // جعل الزرار قابل للسحب (اختياري بس لذيذ)
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    resetBtn.addEventListener("touchstart", dragStart, false);
    resetBtn.addEventListener("touchend", dragEnd, false);
    resetBtn.addEventListener("touchmove", drag, false);

    resetBtn.addEventListener("mousedown", dragStart, false);
    document.addEventListener("mouseup", dragEnd, false);
    document.addEventListener("mousemove", drag, false);

    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }
        if (e.target === resetBtn || resetBtn.contains(e.target)) {
            isDragging = true;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }
            xOffset = currentX;
            yOffset = currentY;
            setTranslate(currentX, currentY, resetBtn);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
    }

})();
