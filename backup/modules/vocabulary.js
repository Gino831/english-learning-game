// 單字練習模組 - 含圖像、發音、拼寫、錯題本
const vocabularyModule = {
    currentQuestionIndex: 0,
    wrongQueue: [],
    sessionQuestions: [],
    mode: 'choice', // 'choice' 或 'spell'

    init: () => {
        // 初始化
    },

    // 設定模式（選擇題 / 拼寫）
    setMode: (mode) => {
        vocabularyModule.mode = mode;
        // 更新 Tab 樣式
        document.getElementById('tab-choice').classList.toggle('active', mode === 'choice');
        document.getElementById('tab-spell').classList.toggle('active', mode === 'spell');
        // 重新渲染目前題目
        vocabularyModule.renderQuestion();
    },

    start: () => {
        vocabularyModule.sessionQuestions = [...app.state.vocabulary];
        vocabularyModule.wrongQueue = [];
        vocabularyModule.currentQuestionIndex = 0;
        vocabularyModule.mode = 'choice';
        vocabularyModule.renderQuestion();
        vocabularyModule.updateProgress();
    },

    // 發音功能 - 使用 Web Speech API
    speak: (word) => {
        if ('speechSynthesis' in window) {
            // 取消之前的語音
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8; // 放慢速度，適合學生
            utterance.pitch = 1.1;
            speechSynthesis.speak(utterance);
        }
    },

    renderQuestion: () => {
        const container = document.getElementById('vocab-question-container');
        if (!container) return;

        // 檢查是否結束
        if (vocabularyModule.currentQuestionIndex >= vocabularyModule.sessionQuestions.length) {
            if (vocabularyModule.wrongQueue.length > 0) {
                // 進入錯題重練模式
                container.innerHTML = `
                    <div class="completion-screen animate-fade-in">
                        <span class="trophy">📖</span>
                        <h2 style="color:var(--neon-pink);">進入錯題重練！</h2>
                        <p>你有 ${vocabularyModule.wrongQueue.length} 題需要重練，加油！</p>
                        <button class="primary-btn" onclick="vocabularyModule.startRetry()">開始重練 💪</button>
                    </div>
                `;
                return;
            }

            // 全部完成
            container.innerHTML = `
                <div class="completion-screen animate-fade-in">
                    <span class="trophy">🏆</span>
                    <h2 style="background:linear-gradient(135deg, var(--neon-blue), var(--neon-green)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">任務完成！</h2>
                    <p>你今天學會了很多單字，太厲害了！</p>
                    <button class="primary-btn" onclick="app.navigate('home')">回到基地 🏠</button>
                </div>
            `;
            return;
        }

        const q = vocabularyModule.sessionQuestions[vocabularyModule.currentQuestionIndex];
        const image = q.image || '📝';
        const chinese = q.chinese || '';

        if (vocabularyModule.mode === 'spell') {
            // 拼寫模式
            container.innerHTML = `
                <div class="vocab-card-display animate-fade-in">
                    <span class="vocab-image">${image}</span>
                    <div class="vocab-word">${chinese || q.question}</div>
                    <p class="vocab-question">請拼出這個英文單字</p>
                    <button class="speak-btn" onclick="vocabularyModule.speak('${q.word}')" title="聽發音">🔊</button>
                    <div class="spell-input-area">
                        <input type="text" class="spell-input" id="spell-input"
                            placeholder="輸入英文..." autocomplete="off" autocapitalize="off"
                            onkeydown="if(event.key==='Enter') vocabularyModule.checkSpell()">
                        <button class="submit-spell-btn" onclick="vocabularyModule.checkSpell()">確認送出 🚀</button>
                    </div>
                </div>
            `;
            // 自動聚焦輸入框
            setTimeout(() => {
                const input = document.getElementById('spell-input');
                if (input) input.focus();
            }, 100);
        } else {
            // 選擇題模式
            let optionsHtml = '';
            q.options.forEach(opt => {
                // 轉義單引號避免 HTML 屬性問題
                const safeOpt = opt.replace(/'/g, "\\'");
                optionsHtml += `<button onclick="vocabularyModule.checkAnswer('${safeOpt}')" class="option-btn">${opt}</button>`;
            });

            container.innerHTML = `
                <div class="vocab-card-display animate-fade-in">
                    <span class="vocab-image">${image}</span>
                    <div class="vocab-word">${q.word}</div>
                    <div class="vocab-chinese">${chinese}</div>
                    <button class="speak-btn" onclick="vocabularyModule.speak('${q.word}')" title="聽發音">🔊</button>
                    <p class="vocab-question">${q.question}</p>
                    <div class="options-grid">
                        ${optionsHtml}
                    </div>
                </div>
            `;
        }
    },

    // 檢查選擇題答案
    checkAnswer: (selected) => {
        const q = vocabularyModule.sessionQuestions[vocabularyModule.currentQuestionIndex];
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);

        if (selected === q.correctAnswer) {
            // 正確
            buttons.forEach(btn => {
                if (btn.textContent === selected) btn.classList.add('correct');
            });
            const result = gameSystem.addXP(10);
            gameSystem.showXPPopup(result.xpGained, result.combo);
            if (result.leveledUp) {
                setTimeout(() => gameSystem.showLevelUpAnimation(), 600);
            }
            // 發音正確答案
            vocabularyModule.speak(q.word);

            setTimeout(() => {
                vocabularyModule.currentQuestionIndex++;
                vocabularyModule.renderQuestion();
                vocabularyModule.updateProgress();
            }, 1200);
        } else {
            // 錯誤
            buttons.forEach(btn => {
                if (btn.textContent === selected) {
                    btn.classList.add('wrong');
                    btn.classList.add('animate-shake');
                }
                if (btn.textContent === q.correctAnswer) btn.classList.add('correct');
            });
            gameSystem.onWrong();
            gameSystem.addMistake('vocabulary', q);

            if (!vocabularyModule.wrongQueue.find(item => item.id === q.id)) {
                vocabularyModule.wrongQueue.push(q);
            }

            setTimeout(() => {
                vocabularyModule.currentQuestionIndex++;
                vocabularyModule.renderQuestion();
                vocabularyModule.updateProgress();
            }, 2000);
        }
    },

    // 檢查拼寫答案
    checkSpell: () => {
        const input = document.getElementById('spell-input');
        if (!input) return;

        const q = vocabularyModule.sessionQuestions[vocabularyModule.currentQuestionIndex];
        const answer = input.value.trim().toLowerCase();
        const correct = q.word.toLowerCase();

        input.disabled = true;
        const submitBtn = document.querySelector('.submit-spell-btn');
        if (submitBtn) submitBtn.disabled = true;

        if (answer === correct) {
            // 拼寫正確
            input.classList.add('correct');
            input.value = q.word; // 顯示正確拼寫
            const result = gameSystem.addXP(15); // 拼寫獎勵更高
            gameSystem.showXPPopup(result.xpGained, result.combo);
            if (result.leveledUp) {
                setTimeout(() => gameSystem.showLevelUpAnimation(), 600);
            }
            vocabularyModule.speak(q.word);

            setTimeout(() => {
                vocabularyModule.currentQuestionIndex++;
                vocabularyModule.renderQuestion();
                vocabularyModule.updateProgress();
            }, 1200);
        } else {
            // 拼寫錯誤
            input.classList.add('wrong');
            gameSystem.onWrong();
            gameSystem.addMistake('vocabulary', q);

            if (!vocabularyModule.wrongQueue.find(item => item.id === q.id)) {
                vocabularyModule.wrongQueue.push(q);
            }

            // 顯示正確答案
            const hint = document.createElement('div');
            hint.style.cssText = 'margin-top:12px; font-size:16px; color:var(--neon-green); font-weight:700;';
            hint.textContent = `正確答案：${q.word}`;
            input.parentElement.appendChild(hint);

            vocabularyModule.speak(q.word);

            setTimeout(() => {
                vocabularyModule.currentQuestionIndex++;
                vocabularyModule.renderQuestion();
                vocabularyModule.updateProgress();
            }, 2500);
        }
    },

    // 開始重練錯題
    startRetry: () => {
        vocabularyModule.sessionQuestions = [...vocabularyModule.wrongQueue];
        vocabularyModule.wrongQueue = [];
        vocabularyModule.currentQuestionIndex = 0;
        vocabularyModule.renderQuestion();
        vocabularyModule.updateProgress();
    },

    updateProgress: () => {
        const bar = document.getElementById('vocab-progress');
        if (bar) {
            const total = vocabularyModule.sessionQuestions.length;
            const current = vocabularyModule.currentQuestionIndex;
            const pct = total > 0 ? (current / total) * 100 : 0;
            bar.style.width = `${pct}%`;
        }
    }
};
