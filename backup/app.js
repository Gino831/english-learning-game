// 主應用程式 - 整合遊戲化系統、錯題本、模組管理
const app = {
    state: {
        currentMode: 'home',
        vocabulary: [],
        grammar: [],
        stars: 0,
    },

    // 模組引用
    importer: null,

    // 初始化
    init: async () => {
        // 初始化儲存模組
        if (window.storageModule) storageModule.init();

        // 初始化遊戲系統
        if (window.gameSystem) gameSystem.init();

        // 載入資料
        try {
            app.state.vocabulary = await storageModule.getVocabulary();
            app.state.grammar = await storageModule.getGrammar();
        } catch (e) {
            console.error('載入資料失敗，使用範例資料:', e);
            app.state.vocabulary = [...mockData.vocabulary];
            app.state.grammar = [...mockData.grammar];
        }

        // 載入星星數
        const savedStars = localStorage.getItem('englishApp_stars');
        if (savedStars) {
            app.state.stars = parseInt(savedStars);
        }

        // 初始化各模組
        if (window.vocabularyModule) vocabularyModule.init();
        if (window.grammarModule) grammarModule.init();
        if (window.importerModule) {
            importerModule.init();
            app.importer = importerModule;
        }

        // 更新 HUD 顯示
        app.updateStarDisplay();
        if (window.gameSystem) gameSystem.updateHUD();

        // 顯示首頁
        app.navigate('home');
    },

    // 儲存設定
    saveSettings: () => {
        const url = document.getElementById('api-url-input').value.trim();
        if (!url) {
            alert('請輸入網址！');
            return;
        }
        storageModule.setApiUrl(url);
    },

    // 頁面導航
    navigate: (viewId) => {
        const container = document.getElementById('app-container');
        const template = document.getElementById(`tpl-${viewId}`);

        if (!template) {
            console.error(`找不到視圖: ${viewId}`);
            return;
        }

        container.innerHTML = '';
        const content = template.content.cloneNode(true);
        container.appendChild(content);

        app.state.currentMode = viewId;

        // 觸發對應模組邏輯
        if (viewId === 'vocabulary') {
            vocabularyModule.start();
        } else if (viewId === 'grammar') {
            grammarModule.start();
        } else if (viewId === 'import') {
            // 不需要 reset，讓面板預設顯示手動輸入
        } else if (viewId === 'vocab-list') {
            app.renderVocabList();
        } else if (viewId === 'grammar-list') {
            app.renderGrammarList();
        } else if (viewId === 'mistakes') {
            app.showMistakes('vocabulary');
        } else if (viewId === 'home') {
            app.updateHomeStats();
        }

        // 更新 HUD
        if (window.gameSystem) gameSystem.updateHUD();
    },

    // 更新首頁玩家資訊
    updateHomeStats: () => {
        if (!window.gameSystem) return;
        const gs = gameSystem.state;
        const lvl = gameSystem.getCurrentLevel();

        const avatar = document.getElementById('home-avatar');
        const title = document.getElementById('home-player-title');
        const level = document.getElementById('home-player-level');
        const correct = document.getElementById('home-correct');
        const wrong = document.getElementById('home-wrong');
        const combo = document.getElementById('home-combo');

        if (avatar) avatar.textContent = lvl.icon;
        if (title) title.textContent = `${lvl.icon} ${lvl.title}`;
        if (level) level.textContent = `Lv.${lvl.level}`;
        if (correct) correct.textContent = gs.totalCorrect;
        if (wrong) wrong.textContent = gs.totalWrong;
        if (combo) combo.textContent = gs.maxCombo;

        // 每日進度
        const dailyPct = Math.min(100, (gs.dailyXP / gs.dailyGoal) * 100);
        const dailyBar = document.getElementById('daily-bar');
        const dailyText = document.getElementById('daily-text');
        if (dailyBar) dailyBar.style.width = `${dailyPct}%`;
        if (dailyText) dailyText.textContent = `今日 ${gs.dailyXP} / ${gs.dailyGoal} XP`;
    },

    // 更新星星顯示
    updateStarDisplay: () => {
        const el = document.getElementById('star-count');
        if (window.gameSystem) {
            if (el) el.textContent = gameSystem.state.xp;
        } else {
            if (el) el.textContent = app.state.stars;
        }
        localStorage.setItem('englishApp_stars', app.state.stars);
    },

    addStar: () => {
        app.state.stars++;
        app.updateStarDisplay();
        if (window.confetti) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    },

    // ========== 發音功能 ==========
    speak: (word) => {
        if ('speechSynthesis' in window) {
            // 取消正在播放的語音
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.85; // 稍慢一些方便學生聽
            speechSynthesis.speak(utterance);
        } else {
            alert('您的瀏覽器不支援語音功能。');
        }
    },

    // ========== 錯題本 ==========
    showMistakes: (type) => {
        // 更新 Tab 樣式
        const vocabTab = document.getElementById('tab-mistake-vocab');
        const grammarTab = document.getElementById('tab-mistake-grammar');
        if (vocabTab) vocabTab.classList.toggle('active', type === 'vocabulary');
        if (grammarTab) grammarTab.classList.toggle('active', type === 'grammar');

        const container = document.getElementById('mistakes-container');
        if (!container) return;

        const mistakes = gameSystem.getMistakes(type);

        if (mistakes.length === 0) {
            container.innerHTML = `
                <div class="empty-state animate-fade-in">
                    <span class="empty-icon">✨</span>
                    <p class="empty-title">
                        ${type === 'vocabulary' ? '單字' : '文法'}錯題本是空的！
                    </p>
                    <p class="empty-subtitle">太棒了，繼續保持！</p>
                </div>
            `;
            return;
        }

        let html = `<h4 class="section-title">
            ${type === 'vocabulary' ? '📚 單字' : '✍️ 文法'}錯題（${mistakes.length} 題）</h4>`;

        mistakes.forEach(m => {
            const display = type === 'vocabulary' ? (m.word || m.question) : m.question;
            html += `
                <div class="mistake-item animate-fade-in">
                    <div class="mistake-info">
                        <h4>${display}</h4>
                        <p>正確答案：${m.correctAnswer} | 錯 <span class="mistake-count-badge">${m.mistakeCount} 次</span></p>
                    </div>
                </div>
            `;
        });

        html += `
            <button class="primary-btn full-width" onclick="app.retryMistakes('${type}')">
                🔥 全部重練
            </button>
        `;

        container.innerHTML = html;
    },

    // 重練錯題
    retryMistakes: (type) => {
        const mistakes = gameSystem.getMistakes(type);
        if (mistakes.length === 0) {
            alert('沒有錯題可以重練！');
            return;
        }

        if (type === 'vocabulary') {
            app.state.vocabulary = [...mistakes];
            app.navigate('vocabulary');
        } else {
            app.state.grammar = [...mistakes];
            app.navigate('grammar');
        }
    },

    // ========== 單字總表渲染（含發音按鈕）==========
    renderVocabList: () => {
        const tbody = document.getElementById('vocab-list-body');
        const empty = document.getElementById('vocab-empty-state');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (app.state.vocabulary.length === 0) {
            if (empty) empty.classList.remove('hidden');
            return;
        }
        if (empty) empty.classList.add('hidden');

        app.state.vocabulary.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="table-unit">${item.unit || '-'}</td>
                <td class="table-word">${item.image || ''} ${item.word}</td>
                <td>${item.chinese || '-'}</td>
                <td>
                    <button onclick="app.speak('${item.word.replace(/'/g, "\\'")}')" class="table-action-btn speak-btn" title="發音">🔊</button>
                </td>
                <td class="table-actions">
                    <button onclick="app.openEditModal('vocabulary', ${item.id})" class="table-action-btn" title="編輯">✏️</button>
                    <button onclick="app.deleteItem('vocabulary', ${item.id})" class="table-action-btn" title="刪除">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // ========== 文法總表渲染 ==========
    renderGrammarList: () => {
        const tbody = document.getElementById('grammar-list-body');
        const empty = document.getElementById('grammar-empty-state');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (app.state.grammar.length === 0) {
            if (empty) empty.classList.remove('hidden');
            return;
        }
        if (empty) empty.classList.add('hidden');

        app.state.grammar.forEach(item => {
            const tr = document.createElement('tr');
            const shortExplanation = item.explanation ? (item.explanation.substring(0, 30) + '...') : '-';
            tr.innerHTML = `
                <td class="table-unit">${item.unit || '-'}</td>
                <td class="table-question">${item.question}</td>
                <td class="table-answer">${item.correctAnswer}</td>
                <td class="table-explanation">${shortExplanation}</td>
                <td class="table-actions">
                    <button onclick="app.openEditModal('grammar', ${item.id})" class="table-action-btn" title="編輯">✏️</button>
                    <button onclick="app.deleteItem('grammar', ${item.id})" class="table-action-btn" title="刪除">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // ========== 新增單字 ==========
    addNewVocab: async () => {
        const word = document.getElementById('add-vocab-word').value.trim();
        const chinese = document.getElementById('add-vocab-chinese').value.trim();
        const unit = document.getElementById('add-vocab-unit').value.trim();

        if (!word || !chinese) {
            alert('請填寫英文單字和中文翻譯！');
            return;
        }

        const newItem = {
            id: Date.now(),
            word: word,
            chinese: chinese,
            image: '📝',
            unit: unit,
            type: 'choice',
            question: `'${word}' 的中文意思是什麼？`,
            options: [chinese, '蘋果', '書本', '老師'], // 預設選項
            correctAnswer: chinese,
        };

        app.state.vocabulary.push(newItem);
        await storageModule.addVocabulary(newItem);

        // 清空表單
        document.getElementById('add-vocab-word').value = '';
        document.getElementById('add-vocab-chinese').value = '';
        document.getElementById('add-vocab-unit').value = '';
        document.getElementById('add-vocab-modal').classList.add('hidden');

        alert(`✅ 已新增單字: ${word} (${chinese})`);
        app.renderVocabList();
    },

    // ========== 新增文法題 ==========
    addNewGrammar: async () => {
        const question = document.getElementById('add-grammar-question').value.trim();
        const answer = document.getElementById('add-grammar-answer').value.trim();
        const explanation = document.getElementById('add-grammar-explanation').value.trim();
        const unit = document.getElementById('add-grammar-unit').value.trim();

        if (!question || !answer) {
            alert('請填寫題目和正確答案！');
            return;
        }

        const newItem = {
            id: Date.now(),
            type: 'fill',
            question: question,
            correctAnswer: answer,
            explanation: explanation || '（尚無解說）',
            unit: unit,
            options: [answer],
        };

        app.state.grammar.push(newItem);
        await storageModule.addGrammar(newItem);

        // 清空表單
        document.getElementById('add-grammar-question').value = '';
        document.getElementById('add-grammar-answer').value = '';
        document.getElementById('add-grammar-explanation').value = '';
        document.getElementById('add-grammar-unit').value = '';
        document.getElementById('add-grammar-modal').classList.add('hidden');

        alert(`✅ 已新增文法題！`);
        app.renderGrammarList();
    },

    // ========== 編輯 & 刪除 ==========
    openEditModal: (type, id) => {
        const item = app.state[type].find(i => i.id === id);
        if (!item) return;

        document.getElementById('edit-id').value = id;
        document.getElementById('edit-type').value = type;
        document.getElementById('edit-unit').value = item.unit || '';
        document.getElementById('edit-question').value = item.question || '';

        // 單字特有欄位
        const wordInput = document.getElementById('edit-word');
        const chineseInput = document.getElementById('edit-chinese');
        if (wordInput) wordInput.value = item.word || '';
        if (chineseInput) chineseInput.value = item.chinese || '';

        document.getElementById('edit-modal').classList.remove('hidden');
    },

    saveEdit: async () => {
        const id = parseInt(document.getElementById('edit-id').value);
        const type = document.getElementById('edit-type').value;
        const unit = document.getElementById('edit-unit').value;
        const questionText = document.getElementById('edit-question').value;
        const wordText = document.getElementById('edit-word').value;
        const chineseText = document.getElementById('edit-chinese').value;

        const item = app.state[type].find(i => i.id === id);
        if (!item) return;

        item.unit = unit;
        item.question = questionText;

        if (type === 'vocabulary') {
            item.word = wordText || item.word;
            item.chinese = chineseText || item.chinese;
            item.correctAnswer = chineseText || item.correctAnswer;
        }

        if (type === 'vocabulary') {
            await storageModule.updateVocabulary(item);
            app.renderVocabList();
        } else {
            await storageModule.updateGrammar(item);
            app.renderGrammarList();
        }

        document.getElementById('edit-modal').classList.add('hidden');
        alert('修改已儲存！');
    },

    deleteItem: async (type, id) => {
        if (!confirm('確定要刪除這題嗎？')) return;

        if (type === 'vocabulary') {
            app.state.vocabulary = app.state.vocabulary.filter(i => i.id !== id);
            await storageModule.deleteVocabulary(id);
            app.renderVocabList();
        } else {
            app.state.grammar = app.state.grammar.filter(i => i.id !== id);
            await storageModule.deleteGrammar(id);
            app.renderGrammarList();
        }
    }
};

// DOM 載入後初始化
document.addEventListener('DOMContentLoaded', app.init);
