// 智慧匯入模組 - 以「手動貼上」為主、OCR 為輔
window.importerModule = {
    init: () => { },

    reset: () => {
        const uploadArea = document.getElementById('upload-area');
        const processingArea = document.getElementById('processing-area');
        const reviewArea = document.getElementById('review-area');
        const fileInput = document.getElementById('file-input');
        const ocrLogs = document.getElementById('ocr-logs');
        const questionsPreview = document.getElementById('questions-preview');
        const pasteInput = document.getElementById('paste-input');

        if (uploadArea) uploadArea.classList.remove('hidden');
        if (processingArea) processingArea.classList.add('hidden');
        if (reviewArea) reviewArea.classList.add('hidden');
        if (fileInput) fileInput.value = '';
        if (ocrLogs) ocrLogs.innerHTML = '';
        if (questionsPreview) questionsPreview.classList.add('hidden');
        if (pasteInput) pasteInput.value = '';
    },

    // ========== 模式切換 ==========
    switchTab: (tab) => {
        const pasteTab = document.getElementById('import-tab-paste');
        const ocrTab = document.getElementById('import-tab-ocr');
        const pastePanel = document.getElementById('paste-panel');
        const ocrPanel = document.getElementById('ocr-panel');

        if (tab === 'paste') {
            if (pasteTab) pasteTab.classList.add('active');
            if (ocrTab) ocrTab.classList.remove('active');
            if (pastePanel) pastePanel.classList.remove('hidden');
            if (ocrPanel) ocrPanel.classList.add('hidden');
        } else {
            if (pasteTab) pasteTab.classList.remove('active');
            if (ocrTab) ocrTab.classList.add('active');
            if (pastePanel) pastePanel.classList.add('hidden');
            if (ocrPanel) ocrPanel.classList.remove('hidden');
        }
    },

    // ========== 手動貼上 → 智慧解析 ==========

    // 從貼上的文字解析單字表
    parseFromPaste: () => {
        const pasteInput = document.getElementById('paste-input');
        const unitInput = document.getElementById('import-unit-input');
        if (!pasteInput) return;

        const text = pasteInput.value.trim();
        if (!text) {
            alert('請先貼上單字表文字！');
            return;
        }

        const unit = unitInput ? unitInput.value.trim() : '';
        const results = importerModule.smartParseWordList(text, unit);

        if (results.length === 0) {
            alert(
                '無法解析出單字！\n\n' +
                '💡 支援的格式：\n' +
                '• 1. life 生活\n' +
                '• apple 蘋果\n' +
                '• cat - 貓\n' +
                '• hello（你好）\n\n' +
                '每行一個單字，英文在前、中文在後。'
            );
            return;
        }

        importerModule.showParseResults(results);
    },

    // 智慧解析單字表（核心演算法）
    smartParseWordList: (text, unit) => {
        const lines = text.split('\n').filter(l => l.trim());
        const results = [];
        let currentCategory = ''; // 追蹤分類（如 Nouns, Verbs 等）

        for (const line of lines) {
            const trimmed = line.trim();

            // 跳過空行和表頭（Class, No., Name 等）
            if (!trimmed || /^(Class|No\.|Name|Score)/i.test(trimmed)) continue;

            // 偵測分類行（如 "Nouns 名詞", "Verbs 動詞", "Adjectives 形容詞"）
            const categoryMatch = trimmed.match(/^(Nouns|Verbs|Adjectives|Adverbs|Phrases?|Prepositions?|Conjunctions?|Pronouns?|認讀字|片語|名詞|動詞|形容詞|副詞|介系詞|連接詞|代名詞)\s*([\u4e00-\u9fff]*)/i);
            if (categoryMatch) {
                currentCategory = categoryMatch[0];
                continue;
            }

            // 跳過標題行（如 "Our World Book 4 Unit 3..."）
            if (/^(Our World|Book \d|Unit \d|Lesson)/i.test(trimmed)) {
                // 但可以從標題提取單元名稱
                const titleUnit = trimmed.match(/(?:Unit|Lesson)\s*\d+[^]*/i);
                if (titleUnit && !unit) {
                    unit = titleUnit[0].trim();
                }
                continue;
            }

            // 嘗試多種格式解析英文-中文配對
            const parsed = importerModule.parseWordLine(trimmed);

            if (parsed) {
                results.push({
                    id: Date.now() + results.length,
                    word: parsed.word,
                    chinese: parsed.chinese,
                    image: '📝',
                    unit: unit || currentCategory || '',
                    type: 'choice',
                    question: `'${parsed.word}' 的中文意思是什麼？`,
                    options: [], // 稍後自動產生
                    correctAnswer: parsed.chinese,
                    category: currentCategory,
                });
            }
        }

        // 為每個單字自動產生選項（從其他單字的中文中隨機取 3 個）
        results.forEach((item, idx) => {
            const otherChinese = results
                .filter((_, i) => i !== idx)
                .map(r => r.chinese)
                .filter(c => c && c !== item.chinese);

            // 隨機取 3 個干擾選項
            const distractors = importerModule.shuffle(otherChinese).slice(0, 3);

            // 如果干擾項不足 3 個，補充預設值
            while (distractors.length < 3) {
                const defaults = ['蘋果', '書本', '老師', '學校', '快樂', '跑步'];
                for (const d of defaults) {
                    if (!distractors.includes(d) && d !== item.chinese) {
                        distractors.push(d);
                        if (distractors.length >= 3) break;
                    }
                }
            }

            // 組合並打亂選項
            const options = importerModule.shuffle([item.chinese, ...distractors.slice(0, 3)]);
            item.options = options;
            item.correctAnswer = item.chinese;
        });

        return results;
    },

    // 解析單行文字為 {word, chinese}
    parseWordLine: (line) => {
        let match;

        // 格式 1：「數字. 英文 中文」如 "1. life 生活、生命" 或 "29. begin 開始"
        match = line.match(/^\d+\s*[\.\)、]\s*([a-zA-Z][a-zA-Z\s\-']*?)\s+([\u4e00-\u9fff][\u4e00-\u9fff、，,\s]*)/);
        if (match) return { word: match[1].trim(), chinese: match[2].trim() };

        // 格式 2：「數字. 複合英文 中文」如 "8. cell phone 手機" "42. instead of 代替"
        match = line.match(/^\d+\s*[\.\)、]\s*([a-zA-Z][a-zA-Z\s\-']+)\s+([\u4e00-\u9fff][\u4e00-\u9fff、，,\s]*)/);
        if (match) return { word: match[1].trim(), chinese: match[2].trim() };

        // 格式 3：純「英文 中文」無編號，如 "apple 蘋果" "washing machine 洗衣機"
        match = line.match(/^([a-zA-Z][a-zA-Z\s\-']*?)\s+([\u4e00-\u9fff][\u4e00-\u9fff、，,\s]*)/);
        if (match) return { word: match[1].trim(), chinese: match[2].trim() };

        // 格式 4：「英文 - 中文」或「英文：中文」分隔符
        match = line.match(/^([a-zA-Z][a-zA-Z\s\-']*?)\s*[\-:：→]\s*([\u4e00-\u9fff][\u4e00-\u9fff、，,\s]*)/);
        if (match) return { word: match[1].trim(), chinese: match[2].trim() };

        // 格式 5：「英文（中文）」或「英文(中文)」括號
        match = line.match(/^([a-zA-Z][a-zA-Z\s\-']*?)\s*[（(]\s*([\u4e00-\u9fff][\u4e00-\u9fff、，,\s]*)\s*[）)]/);
        if (match) return { word: match[1].trim(), chinese: match[2].trim() };

        // 格式 6：一行多個單字（表格行）如 "1. life 生活 8. cell phone 手機 15. battery 電池"
        // 改用提取所有配對
        const multiPattern = /(\d+)\s*[\.\)]\s*([a-zA-Z][a-zA-Z\s\-']*?)\s+([\u4e00-\u9fff][\u4e00-\u9fff、，,\s]*?)(?=\s*\d+\s*[\.\)]|$)/g;
        const multiResults = [];
        while ((match = multiPattern.exec(line)) !== null) {
            multiResults.push({ word: match[2].trim(), chinese: match[3].trim() });
        }
        if (multiResults.length > 1) return multiResults; // 回傳陣列
        if (multiResults.length === 1) return multiResults[0];

        return null;
    },

    // 陣列打亂（Fisher-Yates）
    shuffle: (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // ========== OCR 功能（保留但標示為輔助）==========

    handleFileSelect: async (input) => {
        const file = input.files[0];
        if (!file) return;

        document.getElementById('upload-area').classList.add('hidden');
        document.getElementById('processing-area').classList.remove('hidden');
        const statusEl = document.getElementById('process-status');

        try {
            let text = '';
            statusEl.textContent = '正在辨識圖片文字...';

            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        statusEl.textContent = `辨識中... ${(m.progress * 100).toFixed(0)}%`;
                    }
                }
            });

            const ret = await worker.recognize(file);
            text = ret.data.text;
            await worker.terminate();

            // 顯示到貼上面板
            document.getElementById('processing-area').classList.add('hidden');
            const pasteInput = document.getElementById('paste-input');
            if (pasteInput) {
                pasteInput.value = text;
            }
            // 切到手動貼上面板讓用戶修正
            importerModule.switchTab('paste');

            alert(
                '⚠️ OCR 辨識完成！\n\n' +
                '由於 OCR 對中文辨識效果有限，辨識結果已放入文字框。\n' +
                '建議您：\n' +
                '1. 直接刪除辨識結果\n' +
                '2. 用打字方式輸入正確的單字表\n' +
                '3. 或從課本/講義複製貼上\n\n' +
                '格式範例：\n' +
                '1. life 生活\n' +
                '2. apple 蘋果'
            );

        } catch (err) {
            console.error(err);
            alert('辨識失敗: ' + err.message + '\n\n建議改用「手動輸入」模式。');
            importerModule.reset();
        }
    },

    // ========== 顯示解析結果 ==========

    showParseResults: (results) => {
        const previewContainer = document.getElementById('questions-preview');
        const list = document.getElementById('questions-preview-list');

        if (!previewContainer || !list) return;

        previewContainer.classList.remove('hidden');
        list.innerHTML = '';

        // 統計欄
        const statsDiv = document.createElement('div');
        statsDiv.innerHTML = `
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
                <div class="ocr-stat-badge">📚 共 ${results.length} 個單字</div>
                <div class="ocr-stat-badge">✅ 已自動產生選項</div>
            </div>
        `;
        list.appendChild(statsDiv);

        results.forEach((q, i) => {
            const div = document.createElement('div');
            div.className = 'question-preview-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <span style="background:rgba(0,212,255,0.1); color:var(--neon-blue); padding:3px 10px; border-radius:6px; font-size:12px; font-weight:700;">${i + 1}</span>
                    ${q.category ? `<span style="background:rgba(255,138,0,0.1); color:var(--neon-orange); padding:3px 8px; border-radius:6px; font-size:10px;">${q.category}</span>` : ''}
                </div>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <div style="flex:1; min-width:120px;">
                        <label class="preview-label">英文</label>
                        <input type="text" class="preview-word-input" value="${q.word}" data-id="${q.id}">
                    </div>
                    <div style="flex:1; min-width:120px;">
                        <label class="preview-label">中文</label>
                        <input type="text" class="preview-chinese-input" value="${q.chinese}" data-id="${q.id}">
                    </div>
                    <button onclick="importerModule.removePreviewItem(this)" class="preview-delete-btn" title="移除">✕</button>
                </div>
            `;
            list.appendChild(div);
        });

        previewContainer.scrollIntoView({ behavior: 'smooth' });
    },

    // 移除預覽項目
    removePreviewItem: (btn) => {
        const item = btn.closest('.question-preview-item');
        if (item) item.remove();
    },

    // ========== 儲存匯入的單字 ==========

    saveQuestions: async () => {
        const unitInput = document.getElementById('import-unit-input');
        const unit = unitInput ? unitInput.value.trim() : '';

        // 收集所有預覽項目
        const wordInputs = document.querySelectorAll('.preview-word-input');
        const newWords = [];

        wordInputs.forEach(input => {
            const word = input.value.trim();
            const id = input.dataset.id;
            const chineseInput = document.querySelector(`.preview-chinese-input[data-id="${id}"]`);
            const chinese = chineseInput ? chineseInput.value.trim() : '';

            if (word && chinese) {
                newWords.push({
                    id: parseInt(id),
                    word: word,
                    chinese: chinese,
                    image: '📝',
                    unit: unit,
                    type: 'choice',
                    question: `'${word}' 的中文意思是什麼？`,
                    options: [chinese], // 會在練習時動態產生
                    correctAnswer: chinese,
                });
            }
        });

        if (newWords.length === 0) {
            alert('沒有有效的單字可匯入！請確認英文和中文都有填寫。');
            return;
        }

        // 自動產生選項
        newWords.forEach((item, idx) => {
            const others = newWords.filter((_, i) => i !== idx).map(r => r.chinese);
            const distractors = importerModule.shuffle(others).slice(0, 3);
            while (distractors.length < 3) {
                const defaults = ['蘋果', '書本', '老師', '快樂', '跑步', '電腦'];
                for (const d of defaults) {
                    if (!distractors.includes(d) && d !== item.chinese) {
                        distractors.push(d);
                        if (distractors.length >= 3) break;
                    }
                }
            }
            item.options = importerModule.shuffle([item.chinese, ...distractors.slice(0, 3)]);
        });

        // 加入題庫
        for (const q of newWords) {
            app.state.vocabulary.push(q);
            await storageModule.addVocabulary(q);
        }

        alert(`✅ 成功匯入 ${newWords.length} 個單字！`);
        app.navigate('vocab-list');
    }
};
