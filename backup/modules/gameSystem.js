// 遊戲化系統模組 - 經驗值、等級、成就
const gameSystem = {
    // 等級資料表
    levels: [
        { level: 1, title: "新兵", icon: "🔫", xpRequired: 0, color: "#9ca3af" },
        { level: 2, title: "步兵", icon: "🪖", xpRequired: 50, color: "#60a5fa" },
        { level: 3, title: "射手", icon: "🎯", xpRequired: 120, color: "#34d399" },
        { level: 4, title: "戰士", icon: "⚔️", xpRequired: 220, color: "#a78bfa" },
        { level: 5, title: "精英", icon: "🛡️", xpRequired: 350, color: "#f472b6" },
        { level: 6, title: "菁英射手", icon: "💥", xpRequired: 500, color: "#fb923c" },
        { level: 7, title: "指揮官", icon: "🎖️", xpRequired: 700, color: "#facc15" },
        { level: 8, title: "王牌", icon: "👑", xpRequired: 950, color: "#e879f9" },
        { level: 9, title: "傳奇戰士", icon: "🌟", xpRequired: 1250, color: "#f97316" },
        { level: 10, title: "英文大師", icon: "🏆", xpRequired: 1600, color: "#ef4444" },
    ],

    // 狀態
    state: {
        xp: 0,
        level: 1,
        combo: 0,
        maxCombo: 0,
        totalCorrect: 0,
        totalWrong: 0,
        dailyXP: 0,
        dailyGoal: 100,
        lastPlayDate: null,
        achievements: [],
        mistakeBook: { vocabulary: [], grammar: [] } // 錯題本
    },

    // 初始化 - 從 localStorage 載入
    init: () => {
        const saved = localStorage.getItem('englishApp_gameState');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.assign(gameSystem.state, parsed);
            } catch (e) {
                console.error('載入遊戲狀態失敗:', e);
            }
        }

        // 檢查是否為新的一天，重置每日進度
        const today = new Date().toDateString();
        if (gameSystem.state.lastPlayDate !== today) {
            gameSystem.state.dailyXP = 0;
            gameSystem.state.lastPlayDate = today;
        }

        gameSystem.save();
    },

    // 儲存到 localStorage
    save: () => {
        localStorage.setItem('englishApp_gameState', JSON.stringify(gameSystem.state));
    },

    // 取得目前等級資料
    getCurrentLevel: () => {
        let currentLevel = gameSystem.levels[0];
        for (const lvl of gameSystem.levels) {
            if (gameSystem.state.xp >= lvl.xpRequired) {
                currentLevel = lvl;
            }
        }
        return currentLevel;
    },

    // 取得下一等級資料
    getNextLevel: () => {
        const current = gameSystem.getCurrentLevel();
        const nextIndex = gameSystem.levels.findIndex(l => l.level === current.level) + 1;
        return nextIndex < gameSystem.levels.length ? gameSystem.levels[nextIndex] : null;
    },

    // 計算 XP 進度百分比
    getXPProgress: () => {
        const current = gameSystem.getCurrentLevel();
        const next = gameSystem.getNextLevel();
        if (!next) return 100; // 已達最高等級

        const xpInLevel = gameSystem.state.xp - current.xpRequired;
        const xpNeeded = next.xpRequired - current.xpRequired;
        return Math.min(100, (xpInLevel / xpNeeded) * 100);
    },

    // 獲得 XP（答對時呼叫）
    addXP: (baseAmount) => {
        const prevLevel = gameSystem.getCurrentLevel().level;

        // Combo 加成
        gameSystem.state.combo++;
        if (gameSystem.state.combo > gameSystem.state.maxCombo) {
            gameSystem.state.maxCombo = gameSystem.state.combo;
        }

        // 連續答對 3 題以上有加成
        let bonus = 1;
        if (gameSystem.state.combo >= 5) bonus = 2.0;
        else if (gameSystem.state.combo >= 3) bonus = 1.5;

        const finalXP = Math.round(baseAmount * bonus);
        gameSystem.state.xp += finalXP;
        gameSystem.state.dailyXP += finalXP;
        gameSystem.state.totalCorrect++;

        gameSystem.save();

        // 檢查升等
        const newLevel = gameSystem.getCurrentLevel().level;
        const leveledUp = newLevel > prevLevel;

        // 更新 UI
        gameSystem.updateHUD();

        return { xpGained: finalXP, combo: gameSystem.state.combo, bonus, leveledUp };
    },

    // 答錯時呼叫 - 重置 combo
    onWrong: () => {
        gameSystem.state.combo = 0;
        gameSystem.state.totalWrong++;
        gameSystem.save();
        gameSystem.updateHUD();
    },

    // 加入錯題本
    addMistake: (type, item) => {
        const book = gameSystem.state.mistakeBook[type];
        if (!book.find(m => m.id === item.id)) {
            book.push({ ...item, mistakeCount: 1, lastMistake: Date.now() });
        } else {
            const existing = book.find(m => m.id === item.id);
            existing.mistakeCount++;
            existing.lastMistake = Date.now();
        }
        gameSystem.save();
    },

    // 從錯題本移除（重練答對）
    removeMistake: (type, id) => {
        gameSystem.state.mistakeBook[type] = gameSystem.state.mistakeBook[type].filter(m => m.id !== id);
        gameSystem.save();
    },

    // 取得錯題本
    getMistakes: (type) => {
        return gameSystem.state.mistakeBook[type] || [];
    },

    // 更新遊戲 HUD 顯示
    updateHUD: () => {
        const lvl = gameSystem.getCurrentLevel();
        const next = gameSystem.getNextLevel();
        const progress = gameSystem.getXPProgress();

        // 更新等級圖示 & 稱號
        const levelIcon = document.getElementById('level-icon');
        const levelTitle = document.getElementById('level-title');
        const levelNum = document.getElementById('level-num');
        const xpText = document.getElementById('xp-text');
        const xpBar = document.getElementById('xp-bar');
        const comboEl = document.getElementById('combo-count');
        const dailyBar = document.getElementById('daily-bar');
        const dailyText = document.getElementById('daily-text');

        if (levelIcon) levelIcon.textContent = lvl.icon;
        if (levelTitle) levelTitle.textContent = lvl.title;
        if (levelNum) levelNum.textContent = `Lv.${lvl.level}`;
        if (xpBar) {
            xpBar.style.width = `${progress}%`;
            xpBar.style.background = `linear-gradient(90deg, ${lvl.color}, ${lvl.color}cc)`;
        }
        if (xpText) {
            if (next) {
                xpText.textContent = `${gameSystem.state.xp} / ${next.xpRequired} XP`;
            } else {
                xpText.textContent = `${gameSystem.state.xp} XP ⭐ MAX`;
            }
        }
        if (comboEl) {
            comboEl.textContent = gameSystem.state.combo > 0 ? `🔥 x${gameSystem.state.combo}` : '';
            if (gameSystem.state.combo >= 5) comboEl.className = 'combo-display combo-fire';
            else if (gameSystem.state.combo >= 3) comboEl.className = 'combo-display combo-hot';
            else comboEl.className = 'combo-display';
        }

        // 每日進度
        const dailyPct = Math.min(100, (gameSystem.state.dailyXP / gameSystem.state.dailyGoal) * 100);
        if (dailyBar) dailyBar.style.width = `${dailyPct}%`;
        if (dailyText) dailyText.textContent = `今日 ${gameSystem.state.dailyXP} / ${gameSystem.state.dailyGoal} XP`;
    },

    // 升等動畫
    showLevelUpAnimation: () => {
        const lvl = gameSystem.getCurrentLevel();
        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';
        overlay.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">${lvl.icon}</div>
                <div class="level-up-text">LEVEL UP!</div>
                <div class="level-up-title">${lvl.title}</div>
                <div class="level-up-detail">Lv.${lvl.level} 已解鎖！</div>
                <button class="level-up-btn" onclick="this.parentElement.parentElement.remove()">太棒了！💪</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // 彩帶效果
        if (window.confetti) {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
            setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.3 } }), 300);
        }
    },

    // 顯示 XP 獲得浮動提示
    showXPPopup: (amount, combo) => {
        const popup = document.createElement('div');
        popup.className = 'xp-popup';
        let text = `+${amount} XP`;
        if (combo >= 5) text += ' 🔥 COMBO x' + combo;
        else if (combo >= 3) text += ' 💥 x' + combo;
        popup.textContent = text;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
    }
};

window.gameSystem = gameSystem;
