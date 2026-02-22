// 文法練習模組 - 選擇題 & 填空、錯題詳解
const grammarModule = {
    currentQuestionIndex: 0,
    mode: 'choice', // 'choice' 或 'fill'
    wrongQueue: [],
    sessionQuestions: [],

    init: () => {
        // 初始化
    },

    // 設定模式
    setMode: (mode) => {
        grammarModule.mode = mode;
        const choiceTab = document.getElementById('tab-grammar-choice');
        const fillTab = document.getElementById('tab-grammar-fill');
        if (choiceTab) choiceTab.classList.toggle('active', mode === 'choice');
        if (fillTab) fillTab.classList.toggle('active', mode === 'fill');
        grammarModule.renderQuestion();
    },

    start: () => {
        grammarModule.sessionQuestions = [...app.state.grammar];
        grammarModule.wrongQueue = [];
        grammarModule.currentQuestionIndex = 0;
        grammarModule.mode = 'choice';
        grammarModule.renderQuestion();
    },

    renderQuestion: () => {
        const container = document.getElementById('grammar-question-container');
        if (!container) return;

        // 檢查是否結束
        if (grammarModule.currentQuestionIndex >= grammarModule.sessionQuestions.length) {
            if (grammarModule.wrongQueue.length > 0) {
                container.innerHTML = `
                    <div class="completion-screen animate-fade-in">
                        <span class="trophy">📖</span>
                        <h2 style="color:var(--neon-pink);">進入錯題重練！</h2>
                        <p>你有 ${grammarModule.wrongQueue.length} 題文法需要重練！</p>
                        <button class="primary-btn" onclick="grammarModule.startRetry()">開始重練 💪</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="completion-screen animate-fade-in">
                    <span class="trophy">🎉</span>
                    <h2 style="background:linear-gradient(135deg, var(--neon-purple), var(--neon-pink)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">文法大師！</h2>
                    <p>你已經完成所有文法練習！</p>
                    <button class="primary-btn" style="background:linear-gradient(135deg, var(--neon-purple), var(--neon-pink));" onclick="app.navigate('home')">回到基地 🏠</button>
                </div>
            `;
            return;
        }

        const q = grammarModule.sessionQuestions[grammarModule.currentQuestionIndex];

        if (grammarModule.mode === 'fill') {
            // 填空模式
            // 將 _____ 替換為輸入框顯示
            const displayQuestion = q.question.replace(/_{2,}/, '<input type="text" class="fill-blank-input" id="fill-input" placeholder="?" autocomplete="off" onkeydown="if(event.key===\'Enter\') grammarModule.checkFill()">');

            container.innerHTML = `
                <div class="animate-fade-in">
                    <div style="margin-bottom:20px;">
                        <span style="background:rgba(180,74,255,0.1); color:var(--neon-purple); padding:4px 12px; border-radius:8px; font-size:12px; font-weight:700;">Question ${grammarModule.currentQuestionIndex + 1} / ${grammarModule.sessionQuestions.length}</span>
                    </div>
                    <h3 style="font-size:22px; font-weight:700; color:var(--text-primary); line-height:2; margin-bottom:20px;">${displayQuestion}</h3>
                    <button class="submit-spell-btn" style="background:linear-gradient(135deg, var(--neon-purple), var(--neon-pink));" onclick="grammarModule.checkFill()">確認答案 ✓</button>
                    <div id="grammar-explanation-box" class="explanation-box hidden" style="margin-top:20px;">
                        <h4>💡 為什麼？</h4>
                        <p>${q.explanation}</p>
                        <button class="next-btn" onclick="grammarModule.nextQuestion()">下一題 ➡</button>
                    </div>
                </div>
            `;
            setTimeout(() => {
                const input = document.getElementById('fill-input');
                if (input) input.focus();
            }, 100);
        } else {
            // 選擇題模式
            let optionsHtml = '';
            q.options.forEach(opt => {
                const safeOpt = opt.replace(/'/g, "\\'");
                optionsHtml += `<button onclick="grammarModule.checkAnswer('${safeOpt}')" class="option-btn">${opt}</button>`;
            });

            container.innerHTML = `
                <div class="animate-fade-in">
                    <div style="margin-bottom:20px;">
                        <span style="background:rgba(180,74,255,0.1); color:var(--neon-purple); padding:4px 12px; border-radius:8px; font-size:12px; font-weight:700;">Question ${grammarModule.currentQuestionIndex + 1} / ${grammarModule.sessionQuestions.length}</span>
                    </div>
                    <h3 style="font-size:22px; font-weight:700; color:var(--text-primary); line-height:1.6; margin-bottom:24px;">${q.question}</h3>
                    <div class="options-grid" style="margin-bottom:16px;">
                        ${optionsHtml}
                    </div>
                    <div id="grammar-explanation-box" class="explanation-box hidden">
                        <h4>💡 為什麼？</h4>
                        <p>${q.explanation}</p>
                        <button class="next-btn" onclick="grammarModule.nextQuestion()">下一題 ➡</button>
                    </div>
                </div>
            `;
        }
    },

    // 檢查選擇題答案
    checkAnswer: (selected) => {
        const q = grammarModule.sessionQuestions[grammarModule.currentQuestionIndex];
        const buttons = document.querySelectorAll('.option-btn');
        const explanationBox = document.getElementById('grammar-explanation-box');

        buttons.forEach(btn => btn.disabled = true);

        if (selected === q.correctAnswer) {
            buttons.forEach(btn => {
                if (btn.textContent === selected) btn.classList.add('correct');
            });
            const result = gameSystem.addXP(15);
            gameSystem.showXPPopup(result.xpGained, result.combo);
            if (result.leveledUp) {
                setTimeout(() => gameSystem.showLevelUpAnimation(), 600);
            }
        } else {
            buttons.forEach(btn => {
                if (btn.textContent === selected) {
                    btn.classList.add('wrong');
                    btn.classList.add('animate-shake');
                }
                if (btn.textContent === q.correctAnswer) btn.classList.add('correct');
            });
            gameSystem.onWrong();
            gameSystem.addMistake('grammar', q);

            if (!grammarModule.wrongQueue.find(item => item.id === q.id)) {
                grammarModule.wrongQueue.push(q);
            }
        }

        // 無論對錯都顯示解說
        if (explanationBox) explanationBox.classList.remove('hidden');
    },

    // 檢查填空答案
    checkFill: () => {
        const input = document.getElementById('fill-input');
        if (!input) return;

        const q = grammarModule.sessionQuestions[grammarModule.currentQuestionIndex];
        const answer = input.value.trim().toLowerCase();
        const correct = q.correctAnswer.toLowerCase();
        const explanationBox = document.getElementById('grammar-explanation-box');

        input.disabled = true;
        const submitBtn = document.querySelector('.submit-spell-btn');
        if (submitBtn) submitBtn.disabled = true;

        if (answer === correct) {
            input.style.borderColor = 'var(--neon-green)';
            input.style.color = 'var(--neon-green)';
            input.value = q.correctAnswer;
            const result = gameSystem.addXP(20); // 填空難度較高，XP 更多
            gameSystem.showXPPopup(result.xpGained, result.combo);
            if (result.leveledUp) {
                setTimeout(() => gameSystem.showLevelUpAnimation(), 600);
            }
        } else {
            input.style.borderColor = 'var(--neon-pink)';
            input.style.color = 'var(--neon-pink)';
            // 顯示正確答案
            const hint = document.createElement('span');
            hint.style.cssText = 'margin-left:8px; color:var(--neon-green); font-weight:700; font-size:18px;';
            hint.textContent = `→ ${q.correctAnswer}`;
            input.parentElement.insertBefore(hint, input.nextSibling);

            gameSystem.onWrong();
            gameSystem.addMistake('grammar', q);

            if (!grammarModule.wrongQueue.find(item => item.id === q.id)) {
                grammarModule.wrongQueue.push(q);
            }
        }

        if (explanationBox) explanationBox.classList.remove('hidden');
    },

    nextQuestion: () => {
        grammarModule.currentQuestionIndex++;
        grammarModule.renderQuestion();
    },

    // 開始重練錯題
    startRetry: () => {
        grammarModule.sessionQuestions = [...grammarModule.wrongQueue];
        grammarModule.wrongQueue = [];
        grammarModule.currentQuestionIndex = 0;
        grammarModule.renderQuestion();
    }
};
