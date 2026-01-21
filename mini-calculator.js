(function() {
    // Check if style already exists
    if (document.getElementById('mini-calc-styles')) return;

    // Create Styles
    const style = document.createElement('style');
    style.id = 'mini-calc-styles';
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&family=Roboto+Mono&display=swap');
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

        #mini-calc-toggle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1abc9c, #16a085);
            color: white;
            border: none;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            cursor: move;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
        }

        #mini-calc-toggle:hover {
            transform: scale(1.1) rotate(10deg);
        }

        #mini-calc-toggle:active {
            transform: scale(0.9);
        }

        #mini-calc-box {
            position: absolute;
            bottom: 75px;
            right: 0;
            width: 240px;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            padding: 15px;
            display: none;
            flex-direction: column;
            gap: 10px;
            border: 1px solid rgba(0,0,0,0.05);
            animation: slideUp 0.3s ease-out;
            transform-origin: bottom right;
        }

        #mini-calc-box.active {
            display: flex;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: scale(0.8) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .mini-display-wrapper {
            background: #2c3e50;
            padding: 12px;
            border-radius: 12px;
            text-align: left;
            direction: ltr;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
        }

        #mini-history {
            color: rgba(255, 255, 255, 0.4);
            font-size: 10px;
            font-family: 'Roboto Mono', monospace;
            min-height: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        #mini-display {
            color: white;
            font-size: 18px;
            font-family: 'Roboto Mono', monospace;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-top: 2px;
        }

        .mini-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }

        .mini-grid button {
            padding: 12px 5px;
            font-size: 16px;
            font-weight: bold;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            background: #f8f9fa;
            color: #2c3e50;
            transition: all 0.2s;
            font-family: 'Tajawal', sans-serif;
            box-shadow: 0 2px 0 rgba(0,0,0,0.05);
            -webkit-tap-highlight-color: transparent;
        }

        .mini-grid button:hover {
            background: #eef2f3;
            transform: translateY(-2px);
        }

        .mini-grid button:active {
            transform: translateY(1px);
        }

        .mini-grid .op {
            background: #eef2f3;
            color: #3498db;
        }

        .mini-grid .eq {
            background: #2ecc71;
            color: white;
            grid-column: span 2;
        }

        .mini-grid .clr {
            background: #e74c3c;
            color: white;
            grid-column: span 2;
        }

        /* Mobile specific adjustments */
        @media (max-width: 480px) {
            #mini-calc-box {
                width: 220px;
                bottom: 70px;
            }
            #mini-calc-toggle {
                width: 55px;
                height: 55px;
                font-size: 24px;
            }
        }
    `;
    document.head.appendChild(style);

    // Create HTML
    const container = document.createElement('div');
    container.id = 'mini-calc-container';
    container.innerHTML = `
        <div id="mini-calc-box">
            <div class="mini-display-wrapper">
                <div id="mini-history"></div>
                <div id="mini-display">0</div>
            </div>
            <div class="mini-grid">
                <button class="clr" id="mini-clr"><i class="fas fa-trash-alt"></i></button>
                <button class="op" data-val="/"><i class="fas fa-divide"></i></button>
                <button class="op" data-val="*"><i class="fas fa-times"></i></button>
                
                <button data-val="7">7</button>
                <button data-val="8">8</button>
                <button data-val="9">9</button>
                <button class="op" data-val="-"><i class="fas fa-minus"></i></button>
                
                <button data-val="4">4</button>
                <button data-val="5">5</button>
                <button data-val="6">6</button>
                <button class="op" data-val="+"><i class="fas fa-plus"></i></button>
                
                <button data-val="1">1</button>
                <button data-val="2">2</button>
                <button data-val="3">3</button>
                <button data-val=".">.</button>
                
                <button data-val="0">0</button>
                <button class="eq" id="mini-eq"><i class="fas fa-equals"></i></button>
            </div>
        </div>
        <div id="mini-calc-toggle" title="سحب للتحريك، ضغطة للفتح">
            <i class="fas fa-calculator" style="font-size: 28px;"></i>
        </div>
    `;
    document.body.appendChild(container);

    // Logic
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

    // Calculator Logic
    const handleButtonClick = (e) => {
        const btn = e.target;
        if (btn.tagName !== 'BUTTON') return;
        
        e.preventDefault();
        e.stopPropagation();

        if (btn.id === 'mini-clr') {
            currentInput = '0';
            history = '';
        } else if (btn.id === 'mini-eq') {
            try {
                history = currentInput + ' =';
                let expression = currentInput.replace(/×/g, '*').replace(/÷/g, '/');
                let result = eval(expression);
                currentInput = String(Number(result.toFixed(8)));
            } catch {
                currentInput = 'Error';
                setTimeout(() => { currentInput = '0'; updateMiniDisplay(); }, 1000);
            }
        } else {
            const val = btn.getAttribute('data-val');
            if (!val) return;
            if (currentInput === '0' && !isNaN(val)) {
                currentInput = val;
            } else {
                currentInput += val;
            }
        }
        updateMiniDisplay();
    };

    box.addEventListener('click', handleButtonClick);

    // Simple toggle function
    function toggleBox() {
        box.classList.toggle('active');
    }

    // Drag Logic - completely separate from toggle
    let isDragging = false;
    let dragMoved = false;
    let startX, startY, initialX, initialY;
    let startTime;
    const dragThreshold = 25; // Very high threshold

    const handleStart = (e) => {
        // Only allow left click or touch/pointer
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        
        startX = e.clientX;
        startY = e.clientY;
        initialX = container.offsetLeft;
        initialY = container.offsetTop;
        dragMoved = false;
        isDragging = true;
        startTime = Date.now();

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
            
            // Boundary checks
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
        // No toggle logic here - only drag
    };

    // Simple click handler - completely separate from drag
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only toggle if not dragging
        if (!dragMoved) {
            toggleBox();
        }
        dragMoved = false; // Reset after click
    });

    toggle.addEventListener('pointerdown', handleStart);
    toggle.addEventListener('pointermove', handleMove);
    toggle.addEventListener('pointerup', handleEnd);
    toggle.addEventListener('pointercancel', handleEnd);
    
    // Disable default behaviors that might interfere
    toggle.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent closing when clicking inside the box
    box.addEventListener('pointerdown', (e) => e.stopPropagation());
    box.addEventListener('click', (e) => e.stopPropagation());

})();