(function() {
    // يعني يا باشا لو الاستايلات موجودة خلاص مش هنحطها تاني
    if (document.getElementById('reset-btn-styles')) return;

    // استايلات الزرار العائم بتاع "تصفير" الحسابات
    const style = document.createElement('style');
    style.id = 'reset-btn-styles';
    style.textContent = `
        /* ===== الزر العائم للتصفير — هوية زجاجية iOS متناسقة مع التطبيق ===== */
        #reset-floating-btn {
            position: fixed;
            bottom: 100px;
            left: 20px;
            width: 58px;
            height: 58px;
            border-radius: 50%;
            /* سطح زجاجي يطابق لغة التطبيق (backdrop-filter) مع لمسة حمراء خافتة كإشارة تحذير */
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(18px) saturate(180%);
            -webkit-backdrop-filter: blur(18px) saturate(180%);
            color: #ff3b30; /* iOS Red — إشارة لفعل هدّام */
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.12),
                0 2px 6px rgba(255, 59, 48, 0.18),
                inset 0 1px 1px rgba(255, 255, 255, 0.9);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 21px;
            z-index: 10001; /* فوق كل حاجة بما فيهم الآلة */
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                        box-shadow 0.3s ease,
                        background 0.3s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            opacity: 0;
            visibility: hidden;
            transform: scale(0) rotate(-180deg);
        }

        /* حلقة رفيعة دوّارة حول الزر — accent هادئ */
        #reset-floating-btn::before {
            content: "";
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 1.5px dashed rgba(255, 59, 48, 0.35);
            opacity: 0.6;
            animation: resetRingSpin 14s linear infinite;
            pointer-events: none;
        }

        @keyframes resetRingSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }

        #reset-floating-btn.visible {
            opacity: 1;
            visibility: visible;
            transform: scale(1) rotate(0deg);
        }

        #reset-floating-btn:hover {
            box-shadow:
                0 12px 30px rgba(0, 0, 0, 0.16),
                0 4px 10px rgba(255, 59, 48, 0.28),
                inset 0 1px 1px rgba(255, 255, 255, 0.9);
        }

        #reset-floating-btn:hover i {
            transform: rotate(-25deg);
        }

        #reset-floating-btn i {
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            filter: drop-shadow(0 1px 2px rgba(255, 59, 48, 0.3));
        }

        #reset-floating-btn:active {
            transform: scale(0.9) rotate(-8deg);
        }

        /* تلميح زجاجي يظهر فوق الزرار — متناسق مع باقي الواجهة */
        #reset-floating-btn::after {
            content: "تصفير الحقول";
            position: absolute;
            bottom: calc(100% + 14px);
            left: 50%;
            transform: translateX(-50%) translateY(6px);
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px) saturate(160%);
            -webkit-backdrop-filter: blur(12px) saturate(160%);
            color: #1c1c1e;
            padding: 6px 12px;
            border-radius: 10px;
            border: 1px solid rgba(0, 0, 0, 0.06);
            font-size: 12px;
            font-weight: 500;
            font-family: 'Tajawal', sans-serif;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        #reset-floating-btn:hover::after {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        /* ===== الوضع الليلي ===== */
        .dark-mode #reset-floating-btn {
            background: rgba(44, 44, 46, 0.7);
            color: #ff453a; /* iOS Red — نسخة الوضع الليلي */
            border-color: rgba(255, 255, 255, 0.12);
            box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.4),
                0 2px 6px rgba(255, 69, 58, 0.22),
                inset 0 1px 1px rgba(255, 255, 255, 0.08);
        }

        .dark-mode #reset-floating-btn::after {
            background: rgba(58, 58, 60, 0.85);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.1);
        }

        .dark-mode #reset-floating-btn::before {
            border-color: rgba(255, 69, 58, 0.4);
        }

        @media (max-width: 480px) {
            #reset-floating-btn {
                width: 52px;
                height: 52px;
                bottom: 85px;
                left: 15px;
                font-size: 19px;
            }
            #reset-floating-btn::before {
                inset: -3px;
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

        // 5. التأكد إن زر المحفوظات في شريط التنقل ظاهر
        const savedNavBtn = document.getElementById('nav-saved');
        if (savedNavBtn) {
            window.forceHideSaved = false;
            savedNavBtn.style.setProperty('display', 'flex', 'important');
        }

        // أنيميشن خفيف عشان اليوزر يحس إنه عمل حاجة
        const currentTransform = resetBtn.style.transform || '';
        resetBtn.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        resetBtn.style.transform = currentTransform.replace(/scale\([^)]*\)/, 'scale(0.9)').replace(/rotate\([^)]*\)/, 'rotate(-360deg)');
        setTimeout(() => {
            resetBtn.style.transition = '';
            // نرجع للوضع الطبيعي مع الحفاظ المكان
            const savedPos = localStorage.getItem('reset-btn-position');
            if (savedPos) {
                const { x, y } = JSON.parse(savedPos);
                setTranslate(x, y, resetBtn);
            } else {
                resetBtn.style.transform = '';
            }
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

    // استعادة المكان المتسجل لو موجود
    const savedResetPos = localStorage.getItem('reset-btn-position');
    if (savedResetPos) {
        const { x, y } = JSON.parse(savedResetPos);
        xOffset = x;
        yOffset = y;
        // نأجل التنفيذ ثانية عشان نتأكد إن الزرار اترسم
        setTimeout(() => {
            setTranslate(xOffset, yOffset, resetBtn);
        }, 200);
    }

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

        // حفظ المكان
        localStorage.setItem('reset-btn-position', JSON.stringify({
            x: xOffset,
            y: yOffset
        }));

        // التأكد إن الزرار مغطيش على شريط التنقل السفلي
        const navBar = document.querySelector('.bottom-nav');
        if (navBar) {
            const navRect = navBar.getBoundingClientRect();
            const btnRect = resetBtn.getBoundingClientRect();
            if (btnRect.bottom > navRect.top - 10) {
                // لو الزرار قريب من شريط التنقل، نطلعه لفوق
                const maxBottom = navRect.top - btnRect.height - 15;
                yOffset = maxBottom - window.innerHeight + btnRect.height;
                localStorage.setItem('reset-btn-position', JSON.stringify({
                    x: xOffset,
                    y: yOffset
                }));
                setTranslate(xOffset, yOffset, resetBtn);
            }
        }
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

            // منع السحب لحد ما يغطي على شريط التنقل السفلي
            const navBar = document.querySelector('.bottom-nav');
            if (navBar) {
                const navRect = navBar.getBoundingClientRect();
                const minY = navRect.top - resetBtn.offsetHeight - 75;
                if (currentY > minY) {
                    currentY = minY;
                }
            }

            xOffset = currentX;
            yOffset = currentY;
            setTranslate(currentX, currentY, resetBtn);
        }
    }

    function setTranslate(xPos, yPos, el) {
        // بنستخدم translate3d مع scale و rotate عشان ميتعارضش مع CSS visibility
        el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0) scale(1) rotate(0deg)";
    }

})();
