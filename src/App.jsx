import React, { useState, useEffect } from 'react';
import { Volume2, Star, Trophy, BookOpen, Target, Zap, ArrowRight, RotateCcw, CheckCircle, XCircle, Plus, Edit, Trash2, Settings, Save, X, Camera, Upload, Loader, Sparkles, AlertCircle, ClipboardPaste, FileText, Key, Eye, EyeOff, Tag, Filter, CheckSquare, Square, RefreshCcw } from 'lucide-react';
import {
    subscribeVocabulary,
    subscribeGrammar,
    addVocabularyItem,
    updateVocabularyItem,
    deleteVocabularyItem,
    batchAddVocabulary,
    addGrammarItem,
    updateGrammarItem,
    deleteGrammarItem,
    batchAddGrammar,
    updateVocabularyMastery
} from './firestore';

const EnglishLearningGame = () => {
    const [gameMode, setGameMode] = useState('menu');
    const [score, setScore] = useState(0);
    const [stars, setStars] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [streak, setStreak] = useState(0);
    const [shuffledData, setShuffledData] = useState([]); // 隨機打亂後的題目順序
    const [selectedLabel, setSelectedLabel] = useState('all'); // 單字分類篩選
    const [showLabelPicker, setShowLabelPicker] = useState(false); // 開始測驗前的標籤選擇器
    const [selectedLabels, setSelectedLabels] = useState([]); // checkbox 勾選的標籤
    const [batchSelectedIds, setBatchSelectedIds] = useState([]); // 批次勾選的單字 ID
    const [batchLabel, setBatchLabel] = useState(''); // 批次修改的目標標籤

    const [vocabularyData, setVocabularyData] = useState([]);
    const [grammarData, setGrammarData] = useState([]);
    const [reorderWords, setReorderWords] = useState([]); // 重組句操作狀態
    const [showManagePanel, setShowManagePanel] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [managementMode, setManagementMode] = useState('vocabulary');

    const [showOCRPanel, setShowOCRPanel] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);
    const [processingStatus, setProcessingStatus] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [pasteText, setPasteText] = useState('');
    const [importLabel, setImportLabel] = useState(''); // 匯入時指定的標籤
    const [importTab, setImportTab] = useState('paste'); // 'paste', 'ai', 'grammar-ai', 'verb-ai', 'settings'
    const [apiKey, setApiKey] = useState(() => {
        try { return localStorage.getItem('gemini-api-key') || ''; } catch { return ''; }
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [apiModel, setApiModel] = useState(() => {
        try { return localStorage.getItem('gemini-api-model') || 'gemini-1.5-flash'; } catch { return 'gemini-1.5-flash'; }
    });
    const [availableModels, setAvailableModels] = useState([]); // 儲存 API 回傳的可用模型列表

    // 儲存模型選擇
    const saveApiModel = (model) => {
        setApiModel(model);
        try { localStorage.setItem('gemini-api-model', model); } catch (e) { console.error(e); }
    };

    const [vocabQuestionType, setVocabQuestionType] = useState('meaning'); // 'meaning', 'past', 'participle'
    const [vocabForm, setVocabForm] = useState({
        word: '', chinese: '', pronunciation: '', emoji: '', sentence: '', past: '', participle: '', label: ''
    });
    const [grammarForm, setGrammarForm] = useState({
        type: 'choice', question: '', options: ['', '', '', ''], correct: 0,
        answer: '', hint: '', errorPart: '', words: [], explanation: ''
    });

    // 使用打亂後的資料進行測驗
    const currentData = shuffledData.length > 0 ? shuffledData : (gameMode === 'vocabulary' ? vocabularyData : grammarData);
    const currentItem = gameMode === 'review' ? wrongAnswers[currentQuestion] : currentData[currentQuestion];

    // Firestore 即時監聽 — 自動同步所有裝置的資料
    useEffect(() => {
        const unsubVocab = subscribeVocabulary((items) => {
            setVocabularyData(items);
        });
        const unsubGrammar = subscribeGrammar((items) => {
            setGrammarData(items);
        });
        // 元件卸載時取消監聽
        return () => {
            unsubVocab();
            unsubGrammar();
        };
    }, []);

    // 回答後自動朗讀例句
    useEffect(() => {
        if (showFeedback && currentItem?.sentence &&
            (gameMode === 'vocabulary' || (gameMode === 'review' && currentItem?.mode === 'vocabulary'))) {
            const timer = setTimeout(() => {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(currentItem.sentence);
                utterance.lang = 'en-US';
                utterance.rate = 0.65; // 小學生聽得懂的速度
                utterance.pitch = 1.0;
                speechSynthesis.speak(utterance);
            }, 800); // 延遲讓反饋畫面先顯示
            return () => clearTimeout(timer);
        }
    }, [showFeedback]);

    // 儲存 Google API Key 到 localStorage
    const saveApiKey = () => {
        const key = apiKeyInput.trim();
        if (!key) { alert('請輸入 API Key！'); return; }
        try {
            localStorage.setItem('gemini-api-key', key);
            setApiKey(key);
            setApiKeyInput('');
            alert('✅ API Key 已儲存！');
        } catch (e) { alert('儲存失敗：' + e.message); }
    };

    // 清除 API Key
    const clearApiKey = () => {
        if (confirm('確定要清除 API Key 嗎？')) {
            localStorage.removeItem('gemini-api-key');
            setApiKey('');
        }
    };

    // 處理圖片上傳（壓縮後準備送 AI）
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('請上傳圖片檔案！'); return; }
        setErrorMessage('');
        setOcrResult(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // 壓縮圖片以減少 API 傳輸量
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const maxSize = 1600;
                if (w > maxSize || h > maxSize) {
                    if (w > h) { h = (h / w) * maxSize; w = maxSize; }
                    else { w = (w / h) * maxSize; h = maxSize; }
                }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                setUploadedImage(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // 使用 Google Gemini API 識別【單字】圖片（自動生成音標/emoji/例句）
    const processImageWithGemini = async () => {
        if (!apiKey) {
            alert('請先在「⚙️ API 設定」分頁設定 Google API Key！');
            setImportTab('settings');
            return;
        }
        if (!uploadedImage) { alert('請先上傳圖片！'); return; }

        setIsProcessing(true);
        setOcrResult(null);
        setErrorMessage('');
        setProcessingStatus(`正在上傳圖片至 AI (${apiModel})...`);

        try {
            const base64Data = uploadedImage.split(',')[1];
            setProcessingStatus('AI 正在分析單字表...');

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                                {
                                    text: `請擔任一位專業的英語教學助教，仔細分析這張圖片中的英文單字表。

這張圖片是「單字表」或「課本頁面」，包含英文單字與中文翻譯。
請忽略圖片上的手寫筆跡（如打勾、圈選、手寫文字），只辨識原始印刷內容。

請辨識所有英文單字，並為每個單字產生：
1. word: 英文單字（小寫）
2. chinese: 中文翻譯
3. pronunciation: KK 音標
4. emoji: 最能代表這個字「中文意思」的表情符號（🚨非常重要：必須根據中文語境選擇，例如 bear 若翻譯為「忍受/生育」，請不要產生 🐻 這樣的動物圖案）
5. sentence: 一個適合小學生的簡單例句

回傳純 JSON 格式（不要用 markdown code block）：
{"type":"vocabulary","items":[{"word":"apple","chinese":"蘋果","pronunciation":"/ˈæp.əl/","emoji":"🍎","sentence":"I eat an apple every day."}]}

注意：只回傳純 JSON，不要包含其他文字。` }
                            ]
                        }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || `HTTP ${response.status}`;
                throw new Error(`API 請求失敗：${errMsg}`);
            }

            setProcessingStatus('正在解析 AI 回應...');
            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts
                ?.filter(p => p.text)?.map(p => p.text)?.join('') || '';

            if (!textContent) throw new Error('AI 未回傳任何內容');

            let cleanText = textContent.trim()
                .replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '').trim();

            const result = JSON.parse(cleanText);
            if (!result.type || !result.items || result.items.length === 0) {
                throw new Error('AI 未能識別任何單字');
            }

            setOcrResult(result);
            setProcessingStatus(`識別完成！找到 ${result.items.length} 個單字`);

        } catch (error) {
            console.error('Gemini API 錯誤:', error);
            let errorMsg = '處理失敗，請重試';
            if (error.message.includes('API 請求失敗')) {
                errorMsg = error.message;
                if (error.message.includes('429') || error.message.includes('quota')) {
                    errorMsg += '\n\n💡 建議：目前模型配額已滿，請到「API 設定」切換至 gemini-1.5-pro 或 gemini-2.0-flash (這些通常有獨立配額)！';
                }
            }
            else if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key')) errorMsg = 'API Key 無效，請到「API 設定」檢查後重新設定';
            else if (error.message.includes('JSON')) errorMsg = 'AI 回應格式錯誤，請重新上傳圖片';
            else if (error.message.includes('未能識別') || error.message.includes('未回傳')) errorMsg = error.message;
            else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) errorMsg = '網路連線失敗，請檢查網路後重試';
            setErrorMessage(errorMsg);
            setProcessingStatus('');
        } finally {
            setIsProcessing(false);
        }
    };

    // 使用 Google Gemini API 識別【文法題】圖片（獨立 Prompt，不影響單字識別）
    const processGrammarWithGemini = async () => {
        if (!apiKey) {
            alert('請先在「⚙️ API 設定」分頁設定 Google API Key！');
            setImportTab('settings');
            return;
        }
        if (!uploadedImage) { alert('請先上傳圖片！'); return; }

        setIsProcessing(true);
        setOcrResult(null);
        setErrorMessage('');
        setProcessingStatus(`正在上傳圖片至 AI (${apiModel})...`);

        try {
            const base64Data = uploadedImage.split(',')[1];
            setProcessingStatus('AI 正在分析文法題目...');

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                                {
                                    text: `你是一位專業的英語文法教師。請仔細分析這張圖片中的英文文法題目。

重要規則：
- 請忽略圖片上的手寫筆跡（打勾、圈選、手寫文字），只辨識原始印刷題目。
- 由你自行分析正確答案，不要參考手寫答案。

請辨識每一題的題型，並回傳 JSON：
{"type":"grammar","items":[...]}

每一題請根據特徵判斷為以下其中一種題型：

1. 選擇題 (choice)：有 (A)(B)(C)(D) 選項
格式：{"type":"choice","question":"完整題目(挖空處用 ___ 表示)","options":["A選項","B選項","C選項","D選項"],"correct":正確選項索引(0-3),"explanation":"詳細解析"}

2. 填空題 (fill)：需要填入答案，無選項
格式：{"type":"fill","question":"題目(___ 表示空格)","answer":"正確答案","hint":"文法提示","explanation":"詳細解析"}

3. 改錯題 (correction)：句子有錯誤需修正
格式：{"type":"correction","question":"含錯誤的句子","answer":"修正後句子","errorPart":"錯誤部分","explanation":"詳細解析"}

4. 重組句 (reorder)：打散單字需排列
格式：{"type":"reorder","question":"請重組成正確句子","words":["打散","的","單字"],"answer":"正確句子","explanation":"詳細解析"}

explanation 欄位非常重要，請用繁體中文詳細解釋：
1. 這題考什麼文法觀念
2. 為什麼正確答案是對的
3. 其他選項為什麼錯

只回傳純 JSON，不要用 markdown code block。` }
                            ]
                        }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || `HTTP ${response.status}`;
                throw new Error(`API 請求失敗：${errMsg}`);
            }

            setProcessingStatus('正在解析 AI 回應...');
            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts
                ?.filter(p => p.text)?.map(p => p.text)?.join('') || '';

            if (!textContent) throw new Error('AI 未回傳任何內容');

            let cleanText = textContent.trim()
                .replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '').trim();

            const result = JSON.parse(cleanText);
            if (!result.type || !result.items || result.items.length === 0) {
                throw new Error('AI 未能識別任何文法題');
            }

            setOcrResult(result);
            setProcessingStatus(`識別完成！找到 ${result.items.length} 個文法題`);

        } catch (error) {
            console.error('Gemini API 錯誤:', error);
            let errorMsg = '處理失敗，請重試';
            if (error.message.includes('API 請求失敗')) {
                errorMsg = error.message;
                if (error.message.includes('429') || error.message.includes('quota')) {
                    errorMsg += '\n\n💡 建議：目前模型配額已滿，請到「API 設定」切換至 gemini-1.5-pro 或 gemini-2.0-flash (這些通常有獨立配額)！';
                }
            }
            else if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key')) errorMsg = 'API Key 無效，請到「API 設定」檢查後重新設定';
            else if (error.message.includes('JSON')) errorMsg = 'AI 回應格式錯誤，請重新上傳圖片';
            else if (error.message.includes('未能識別') || error.message.includes('未回傳')) errorMsg = error.message;
            else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) errorMsg = '網路連線失敗，請檢查網路後重試';
            setErrorMessage(errorMsg);
            setProcessingStatus('');
        } finally {
            setIsProcessing(false);
        }
    };

    // 使用 Google Gemini API 識別【動詞三態】圖片
    const processVerbWithGemini = async () => {
        if (!apiKey) {
            alert('請先在「⚙️ API 設定」分頁設定 Google API Key！');
            setImportTab('settings');
            return;
        }
        if (!uploadedImage) { alert('請先上傳圖片！'); return; }

        setIsProcessing(true);
        setOcrResult(null);
        setErrorMessage('');
        setProcessingStatus(`正在分析動詞三態表 (${apiModel})...`);

        try {
            const base64Data = uploadedImage.split(',')[1];
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                                {
                                    text: `你是一位專業的英語教師。請仔細分析這張圖片中的「動詞三態變化表」(Irregular Verb List)。

請辨識表格中的內容，並為每一行動詞產生以下資訊：
1. word: 原形 (Present Simple)
2. past: 過去式 (Past Simple)
3. participle: 過去分詞 (Past Participle)
4. chinese: 中文翻譯 (請轉為繁體中文)
5. pronunciation: 原形單字的 KK 音標
6. emoji: 最能代表這個動詞「中文意思」的表情符號（🚨非常重要：必須根據中文語境選擇，例如 bear 若翻譯為「忍受/生育」，請不要產生 🐻 這樣的動物圖案）
7. sentence: 使用該動詞原形的一個簡單英文例句

回傳純 JSON 格式（不要用 markdown code block）：
{"type":"vocabulary","isVerb":true,"items":[{"word":"go","past":"went","participle":"gone","chinese":"去","pronunciation":"/ɡoʊ/","emoji":"🚶","sentence":"I go to school every day."}]}

注意：
- 請辨識圖片中所有的動詞。
- 忽略手寫痕跡。
- 只回傳純 JSON。` }
                            ]
                        }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || `HTTP ${response.status}`;
                let errorDetails = `API 請求失敗：${errMsg}`;
                if (errMsg.includes('429') || errMsg.includes('quota')) {
                    errorDetails += '\n\n💡 建議：目前模型配額已滿，請到「API 設定」切換至 gemini-1.5-pro 或 gemini-2.0-flash！';
                }
                throw new Error(errorDetails);
            }

            setProcessingStatus('正在解析 AI 回應...');
            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts
                ?.filter(p => p.text)?.map(p => p.text)?.join('') || '';

            if (!textContent) throw new Error('AI 未回傳任何內容');

            let cleanText = textContent.trim()
                .replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '').trim();

            const result = JSON.parse(cleanText);
            if (!result.items || result.items.length === 0) {
                throw new Error('AI 未能識別任何動詞三態');
            }

            setOcrResult(result);
            setProcessingStatus(`識別完成！找到 ${result.items.length} 組動詞三態`);

        } catch (error) {
            console.error('Gemini API 錯誤:', error);
            setErrorMessage(error.message || '處理失敗，請重試');
            setProcessingStatus('');
        } finally {
            setIsProcessing(false);
        }
    };


    // 處理單字練習的題型切換 (動詞三態支援)
    useEffect(() => {
        const isVocab = gameMode === 'vocabulary' || (gameMode === 'review' && currentItem?.mode === 'vocabulary');
        if (isVocab && currentItem) {
            // 如果單字具備過去式資訊，則切換成三態測驗
            if (currentItem.past && currentItem.participle) {
                setVocabQuestionType('all_tenses');
            } else {
                setVocabQuestionType('meaning');
            }
        } else {
            setVocabQuestionType('meaning');
        }
    }, [gameMode, currentQuestion, currentItem]);

    // 解析單行文字，嘗試拆出英文單字和中文翻譯
    const parseWordLine = (line) => {
        // 移除編號（如 "1." "2)" "#3"）
        let cleaned = line.replace(/^[\d#]+[.)、\s]+/, '').trim();
        if (!cleaned) return null;

        // 常見分隔模式
        const patterns = [
            // 「英文 中文」空格分隔
            /^([a-zA-Z][a-zA-Z\s-]*[a-zA-Z])\s+([\u4e00-\u9fff].*)$/,
            // 「英文（中文）」括號格式
            /^([a-zA-Z][a-zA-Z\s-]*[a-zA-Z])\s*[（(]([\u4e00-\u9fff]+.*?)[）)]$/,
            // 「英文 - 中文」或「英文 : 中文」分隔符
            /^([a-zA-Z][a-zA-Z\s-]*[a-zA-Z])\s*[-:：=]\s*([\u4e00-\u9fff].*)$/,
            // 「中文 英文」反向格式
            /^([\u4e00-\u9fff]+[\u4e00-\u9fffA-Za-z()（）、/\s]*)\s+([a-zA-Z][a-zA-Z\s-]*[a-zA-Z])$/,
        ];

        for (const pattern of patterns) {
            const match = cleaned.match(pattern);
            if (match) {
                let word, chinese;
                // 判斷哪個是英文、哪個是中文
                if (/^[a-zA-Z]/.test(match[1])) {
                    word = match[1].trim().toLowerCase();
                    chinese = match[2].trim();
                } else {
                    chinese = match[1].trim();
                    word = match[2].trim().toLowerCase();
                }
                // 清理中文（移除尾部多餘符號）
                chinese = chinese.replace(/[\s,，;；]+$/, '').trim();
                if (word && chinese && word.length > 0) {
                    return { word, chinese };
                }
            }
        }
        return null;
    };

    // 智慧解析貼上的文字
    const smartParseText = () => {
        if (!pasteText.trim()) { alert('請先貼上單字表文字！'); return; }

        setIsProcessing(true);
        setErrorMessage('');
        setOcrResult(null);
        setProcessingStatus('正在解析文字...');

        try {
            const lines = pasteText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const items = [];

            for (const line of lines) {
                const parsed = parseWordLine(line);
                if (parsed) {
                    items.push({
                        word: parsed.word,
                        chinese: parsed.chinese,
                        pronunciation: '',
                        emoji: '📝',
                        sentence: ''
                    });
                }
            }

            if (items.length === 0) {
                setErrorMessage('無法解析任何單字。\n\n請確認格式，例如：\n• fire 火\n• 1. daylight 日光\n• modern - 現代的\n• elephant（大象）');
                setProcessingStatus('');
            } else {
                setOcrResult({ type: 'vocabulary', items });
                setProcessingStatus(`解析完成！找到 ${items.length} 個單字`);
            }
        } catch (error) {
            console.error('解析錯誤:', error);
            setErrorMessage('解析失敗，請檢查文字格式後重試');
            setProcessingStatus('');
        } finally {
            setIsProcessing(false);
        }
    };

    // 批次匯入 AI/貼上解析的結果到 Firestore
    const addAllOCRItems = async () => {
        if (!ocrResult || !ocrResult.items) return;
        try {
            if (ocrResult.type === 'vocabulary') {
                const newItems = ocrResult.items.map(item => ({
                    word: item.word || '', chinese: item.chinese || '',
                    pronunciation: item.pronunciation || '', emoji: item.emoji || '📝',
                    sentence: item.sentence || '',
                    past: item.past || '', participle: item.participle || '', // 加入三態
                    label: importLabel || ''
                }));
                const count = await batchAddVocabulary(newItems);
                alert(`✅ 成功新增 ${count} 個單字！`);
            } else if (ocrResult.type === 'grammar') {
                const newItems = ocrResult.items.map(item => ({
                    type: item.type || 'choice',
                    question: item.question || '',
                    options: item.options || ['', '', '', ''],
                    correct: item.correct ?? 0,
                    answer: item.answer || '',
                    hint: item.hint || '',
                    errorPart: item.errorPart || '',
                    words: item.words || [],
                    explanation: item.explanation || ''
                }));
                const count = await batchAddGrammar(newItems);
                alert(`✅ 成功新增 ${count} 個文法題！`);
            }
            setShowOCRPanel(false); setUploadedImage(null); setOcrResult(null); setImportLabel('');
        } catch (error) {
            console.error('匯入失敗:', error);
            alert('❌ 新增失敗，請重試');
        }
    };

    // 新增單字到 Firestore
    const addVocabulary = async () => {
        if (!vocabForm.word || !vocabForm.chinese) { alert('請至少填寫單字和中文！'); return; }
        try {
            await addVocabularyItem(vocabForm);
            setVocabForm({ word: '', chinese: '', pronunciation: '', emoji: '', sentence: '', past: '', participle: '', label: '' });
        } catch (error) {
            console.error('新增單字失敗:', error);
            alert('❌ 新增失敗');
        }
    };

    // 更新單字到 Firestore
    const updateVocabulary = async () => {
        try {
            await updateVocabularyItem(editingItem.id, vocabForm);
            setEditingItem(null);
            setVocabForm({ word: '', chinese: '', pronunciation: '', emoji: '', sentence: '', past: '', participle: '', label: '' });
        } catch (error) {
            console.error('更新單字失敗:', error);
            alert('❌ 更新失敗');
        }
    };

    // 刪除單字
    const deleteVocabulary = async (id) => {
        if (confirm('確定要刪除這個單字嗎？')) {
            try {
                await deleteVocabularyItem(id);
            } catch (error) {
                console.error('刪除單字失敗:', error);
                alert('❌ 刪除失敗');
            }
        }
    };

    // 新增文法題到 Firestore
    const addGrammar = async () => {
        if (!grammarForm.question) { alert('請填寫題目！'); return; }
        if (grammarForm.type === 'choice' && grammarForm.options.some(opt => !opt)) { alert('請填寫所有選擇題選項！'); return; }
        try {
            await addGrammarItem(grammarForm);
            setGrammarForm({
                type: 'choice', question: '', options: ['', '', '', ''], correct: 0,
                answer: '', hint: '', errorPart: '', words: [], explanation: ''
            });
        } catch (error) {
            console.error('新增文法題失敗:', error);
            alert('❌ 新增失敗');
        }
    };

    // 更新文法題到 Firestore
    const updateGrammar = async () => {
        try {
            await updateGrammarItem(editingItem.id, grammarForm);
            setEditingItem(null);
            setGrammarForm({
                type: 'choice', question: '', options: ['', '', '', ''], correct: 0,
                answer: '', hint: '', errorPart: '', words: [], explanation: ''
            });
        } catch (error) {
            console.error('更新文法題失敗:', error);
            alert('❌ 更新失敗');
        }
    };

    // 刪除文法題
    const deleteGrammar = async (id) => {
        if (confirm('確定要刪除這個文法題嗎？')) {
            try {
                await deleteGrammarItem(id);
            } catch (error) {
                console.error('刪除文法題失敗:', error);
                alert('❌ 刪除失敗');
            }
        }
    };

    const startEdit = (item, type) => {
        setEditingItem(item);
        if (type === 'vocabulary') {
            setVocabForm({
                word: item.word,
                chinese: item.chinese,
                pronunciation: item.pronunciation || '',
                emoji: item.emoji || '',
                sentence: item.sentence || '',
                past: item.past || '',
                participle: item.participle || '',
                label: item.label || ''
            });
        } else {
            setGrammarForm({
                type: item.type || 'choice',
                question: item.question,
                options: item.options || ['', '', '', ''],
                correct: item.correct || 0,
                answer: item.answer || '',
                hint: item.hint || '',
                errorPart: item.errorPart || '',
                words: item.words || [],
                explanation: item.explanation || ''
            });
        }
    };

    // 計算單字熟度星星數（0~5）
    const getMasteryStars = (item) => {
        const total = item.totalCount || 0;
        const correct = item.correctCount || 0;
        if (total === 0) return 0; // 未學習
        const rate = correct / total;
        if (rate >= 0.8 && total >= 3) return 5; // 已精通
        if (rate >= 0.6 && total >= 2) return 4; // 熟練
        if (rate >= 0.4) return 3; // 普通
        if (correct > 0) return 2; // 需加強
        return 1; // 全錯
    };

    // 熟度星星顯示元件
    const MasteryStars = ({ item }) => {
        const stars = getMasteryStars(item);
        const total = item.totalCount || 0;
        const correct = item.correctCount || 0;
        const labels = ['未學習', '初學', '需加強', '普通', '熟練', '已精通'];
        return (
            <div className="flex items-center gap-1" title={`${correct}/${total} 正確 — ${labels[stars]}`}>
                {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className={`text-sm ${i <= stars ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {i <= stars ? '★' : '☆'}
                    </span>
                ))}
                <span className="text-xs text-gray-400 ml-1">{total > 0 ? `${correct}/${total}` : ''}</span>
            </div>
        );
    };

    // Fisher-Yates 隨機打亂演算法
    const shuffleArray = (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const playSound = (text, lang = 'en-US') => {
        speechSynthesis.cancel(); // 停止當前播放
        const textToPlay = Array.isArray(text) ? text.join(', ') : text;
        const utterance = new SpeechSynthesisUtterance(textToPlay);
        utterance.lang = lang;
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    };

    // 例句慢速朗讀（適合小學生聆聽）
    const playSentence = (text) => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.65; // 更慢的速度，小學生聽得懂
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
    };

    const handleAnswer = (answer) => {
        let correct = false;
        const isVocabMode = gameMode === 'vocabulary' || (gameMode === 'review' && currentItem.mode === 'vocabulary');
        const grammarType = currentItem?.type || 'choice';

        if (isVocabMode) {
            // 單字模式：根據題型比對原形、過去式或過去分詞
            if (vocabQuestionType === 'all_tenses') {
                const parts = answer.toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
                correct = parts.length === 3 &&
                    parts[0] === currentItem.word.toLowerCase() &&
                    parts[1] === currentItem.past.toLowerCase() &&
                    parts[2] === currentItem.participle.toLowerCase();
            } else {
                const target = vocabQuestionType === 'past' ? currentItem.past :
                    vocabQuestionType === 'participle' ? currentItem.participle :
                        currentItem.word;
                correct = answer.toLowerCase().trim() === (target || '').toLowerCase().trim();
            }
        } else {
            // 文法模式：根據題型使用不同判斷邏輯
            switch (grammarType) {
                case 'choice':
                case 'multiple': // 相容舊資料
                    correct = answer === currentItem.correct;
                    break;
                case 'fill':
                    correct = answer.toLowerCase().trim() === (currentItem.answer || '').toLowerCase().trim();
                    break;
                case 'correction':
                    // 比對修正後的句子（忽略大小寫和前後空格）
                    correct = answer.toLowerCase().trim().replace(/[.!?]+$/, '') ===
                        (currentItem.answer || '').toLowerCase().trim().replace(/[.!?]+$/, '');
                    break;
                case 'reorder':
                    correct = answer.toLowerCase().trim().replace(/[.!?]+$/, '') ===
                        (currentItem.answer || '').toLowerCase().trim().replace(/[.!?]+$/, '');
                    break;
                default:
                    correct = answer === currentItem.correct;
            }
        }
        setIsCorrect(correct);
        setShowFeedback(true);
        if (correct) {
            setScore(score + 100);
            setStreak(streak + 1);
            if (streak + 1 >= 3) setStars(stars + 1);
        } else {
            setStreak(0);
            if (!wrongAnswers.find(item => (item.mode === 'vocabulary' ? item.word === currentItem.word : item.question === currentItem.question))) {
                setWrongAnswers([...wrongAnswers, { ...currentItem, mode: gameMode === 'review' ? currentItem.mode : gameMode }]);
            }
        }

        // 更新單字熟度（僅限單字模式）
        if (isVocabMode && currentItem?.id) {
            updateVocabularyMastery(currentItem.id, correct).catch(err => {
                console.error('更新熟度失敗:', err);
            });
        }

        // 跳下一題的共用函式
        const goNext = () => {
            setShowFeedback(false);
            setUserAnswer('');
            setReorderWords([]); // 清除重組句狀態
            const dataLength = gameMode === 'review' ? wrongAnswers.length : currentData.length;
            if (currentQuestion < dataLength - 1) setCurrentQuestion(currentQuestion + 1);
            else { setGameMode('menu'); setCurrentQuestion(0); setShuffledData([]); }
        };

        // 判斷是否有例句會朗讀（單字模式且有例句）
        const hasSentence = currentItem?.sentence &&
            (gameMode === 'vocabulary' || (gameMode === 'review' && currentItem?.mode === 'vocabulary'));

        if (hasSentence) {
            // 等語音播完後再延遲 1 秒跳題
            const checkSpeech = () => {
                if (!speechSynthesis.speaking) {
                    setTimeout(goNext, 1000);
                } else {
                    setTimeout(checkSpeech, 300); // 每 300ms 檢查一次
                }
            };
            // 至少等 2 秒（讓例句有時間開始播放）
            setTimeout(checkSpeech, 2000);
        } else {
            // 無例句時（例如文法題）：若答對維持 2.5 秒跳題，答錯則延長時間以便閱讀詳解（文法題 15 秒，單字題 4 秒）
            let delayTime = 2500;
            if (!correct) {
                delayTime = isVocabMode ? 4000 : 15000;
            }
            setTimeout(goNext, delayTime);
        }
    };

    const resetGame = () => { setCurrentQuestion(0); setUserAnswer(''); setShowFeedback(false); };

    // 取得所有不重複的標籤清單
    const allLabels = [...new Set(vocabularyData.map(v => v.label).filter(Boolean))];

    // 開始遊戲時打亂題目順序（支援按標籤篩選）
    const startGame = (mode, labels = []) => {
        let data = mode === 'vocabulary' ? vocabularyData : grammarData;
        // 如果是單字模式且選擇了特定標籤，先篩選
        if (mode === 'vocabulary' && labels.length > 0) {
            data = data.filter(item => labels.includes(item.label));
        }
        if (data.length === 0) {
            alert(mode === 'vocabulary' ? '此分類下沒有單字！' : '請先在題庫管理中新增文法題！');
            return;
        }
        setShuffledData(shuffleArray(data)); // 隨機打亂
        setGameMode(mode);
        setShowLabelPicker(false);
        setSelectedLabels([]);
        resetGame();
    };

    // 切換 checkbox 勾選狀態
    const toggleLabel = (label) => {
        setSelectedLabels(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    // 預先計算星空背景，避免每次 render 重新產生（必須放在 JSX return 的最外層）
    const backgroundStars = React.useMemo(() => [...Array(50)].map((_, i) => (
        <div key={i} className="absolute bg-white rounded-full animate-twinkle"
            style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
                animationDuration: Math.random() * 2 + 2 + 's'
            }} />
    )), []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
            {/* 星空背景 */}
            <div className="absolute inset-0">
                {backgroundStars}
            </div>

            {/* 頂部資訊欄 */}
            <div className="relative z-10 p-2 md:p-6">
                <div className="flex flex-row justify-between items-center max-w-6xl mx-auto gap-2 md:gap-4">
                    <div className="flex gap-2 md:gap-6">
                        <div className="bg-yellow-400 text-gray-900 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-lg flex items-center gap-1 md:gap-2">
                            <Trophy className="w-4 h-4 md:w-6 md:h-6" /> {score}
                        </div>
                        <div className="bg-pink-500 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-lg flex items-center gap-1 md:gap-2">
                            <Star className="w-4 h-4 md:w-6 md:h-6 fill-white" /> {stars}
                        </div>
                    </div>
                    <div className="flex gap-2 md:gap-4">
                        <div className="bg-orange-500 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-lg flex items-center gap-1 md:gap-2">
                            <Zap className="w-4 h-4 md:w-6 md:h-6 fill-white" />
                            <span className="hidden md:inline">連擊 </span>{streak}
                        </div>
                        {gameMode === 'menu' && (
                            <button onClick={() => setShowManagePanel(!showManagePanel)}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-1 md:gap-2">
                                <Settings className="w-4 h-4 md:w-6 md:h-6" />
                                <span className="hidden md:inline">管理</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 標籤選擇器彈窗 - 測驗前用 checkbox 勾選分類 */}
            {showLabelPicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                                <Tag className="w-8 h-8 text-cyan-500" /> 選擇測驗範圍
                            </h2>
                            <button onClick={() => { setShowLabelPicker(false); setSelectedLabels([]); }}
                                className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {/* 全選 / 取消全選 */}
                            <button onClick={() => setSelectedLabels(selectedLabels.length === allLabels.length ? [] : [...allLabels])}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-4 rounded-2xl font-bold text-base transition-all flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedLabels.length === allLabels.length ? 'bg-cyan-500 border-cyan-500' : 'border-gray-400'}`}>
                                    {selectedLabels.length === allLabels.length && <CheckCircle className="w-4 h-4 text-white" />}
                                </div>
                                📚 全選 ({vocabularyData.length} 個)
                            </button>
                            {/* 各分類 checkbox */}
                            {allLabels.map(label => {
                                const count = vocabularyData.filter(v => v.label === label).length;
                                const isChecked = selectedLabels.includes(label);
                                return (
                                    <button key={label} onClick={() => toggleLabel(label)}
                                        className={`w-full p-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 ${isChecked
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'bg-white border-white' : 'border-gray-400'}`}>
                                            {isChecked && <CheckCircle className="w-4 h-4 text-purple-600" />}
                                        </div>
                                        <span className="flex-1 text-left">🏷️ {label}</span>
                                        <span className={`text-sm font-bold ${isChecked ? 'text-purple-200' : 'text-gray-400'}`}>{count} 個</span>
                                    </button>
                                );
                            })}
                        </div>
                        {/* 開始測驗按鈕 */}
                        <button onClick={() => {
                            if (selectedLabels.length === 0) startGame('vocabulary', []);
                            else startGame('vocabulary', selectedLabels);
                        }}
                            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white p-5 rounded-2xl font-black text-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            🚀 開始測驗（{selectedLabels.length === 0 ? vocabularyData.length : vocabularyData.filter(v => selectedLabels.includes(v.label)).length} 題）
                        </button>
                    </div>
                </div>
            )}

            {/* 智慧匯入面板 */}
            {showOCRPanel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-4xl font-black text-gray-800 flex items-center gap-3">
                                <Sparkles className="w-10 h-10 text-purple-500" /> 智慧匯入 (v1.5)
                            </h2>
                            <button onClick={() => { setShowOCRPanel(false); setUploadedImage(null); setOcrResult(null); setErrorMessage(''); setProcessingStatus(''); setPasteText(''); }}
                                className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-xl font-black shadow-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>


                        {/* 分頁標籤 */}
                        <div className="flex gap-2 mb-6">
                            <button onClick={() => { setImportTab('paste'); setOcrResult(null); setErrorMessage(''); setProcessingStatus(''); }}
                                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1 ${importTab === 'paste' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                <ClipboardPaste className="w-4 h-4" /> 貼上文字
                            </button>
                            <button onClick={() => { setImportTab('ai'); setOcrResult(null); setErrorMessage(''); setProcessingStatus(''); }}
                                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1 ${importTab === 'ai' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                📝 單字AI
                                {apiKey && <span className="ml-1 w-2 h-2 bg-green-400 rounded-full inline-block"></span>}
                            </button>
                            <button onClick={() => { setImportTab('grammar-ai'); setOcrResult(null); setErrorMessage(''); setProcessingStatus(''); }}
                                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1 ${importTab === 'grammar-ai' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                📋 文法AI
                                {apiKey && <span className="ml-1 w-2 h-2 bg-green-400 rounded-full inline-block"></span>}
                            </button>
                            <button onClick={() => { setImportTab('verb-ai'); setOcrResult(null); setErrorMessage(''); setProcessingStatus(''); }}
                                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1 ${importTab === 'verb-ai' ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                <RefreshCcw className="w-4 h-4" /> 動詞AI
                                {apiKey && <span className="ml-1 w-2 h-2 bg-green-400 rounded-full inline-block"></span>}
                            </button>
                            <button onClick={() => { setImportTab('settings'); setOcrResult(null); setErrorMessage(''); setProcessingStatus(''); }}
                                className={`py-3 px-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1 ${importTab === 'settings' ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                <Key className="w-4 h-4" />
                                {!apiKey && <span className="ml-1 w-2 h-2 bg-red-400 rounded-full inline-block"></span>}
                            </button>
                        </div>

                        {/* 貼上文字區 */}
                        {importTab === 'paste' && !ocrResult && (
                            <div className="space-y-4">
                                {uploadedImage && (
                                    <div className="bg-gray-100 rounded-2xl p-3">
                                        <p className="text-sm font-bold text-gray-500 mb-2 text-center">📷 參考圖片</p>
                                        <img src={uploadedImage} alt="參考圖片" className="max-h-40 mx-auto rounded-xl shadow" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-gray-700 font-black text-lg mb-2">📋 貼上單字表文字</label>
                                    <textarea
                                        value={pasteText}
                                        onChange={(e) => setPasteText(e.target.value)}
                                        placeholder={"將課本上的單字表文字貼在這裡...\n\n支援格式：\n1. fire 火\n2. daylight 日光\nmodern 現代的\napple - 蘋果\nelephant（大象）"}
                                        rows={10}
                                        className="w-full px-4 py-3 border-4 border-purple-300 rounded-2xl focus:border-purple-500 focus:outline-none text-lg font-bold resize-none"
                                    />
                                </div>
                                <button onClick={smartParseText} disabled={!pasteText.trim() || isProcessing}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                                    {isProcessing ? <Loader className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                    {isProcessing ? '解析中...' : '🔍 開始解析'}
                                </button>
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                                    <div className="text-sm font-black text-blue-800 mb-1">💡 提示：此模式不需要 API Key，但不會自動生成音標和例句。</div>
                                </div>
                            </div>
                        )}

                        {/* AI 圖片識別區 */}
                        {importTab === 'ai' && !ocrResult && (
                            <div className="space-y-4">
                                {!apiKey && (
                                    <div className="bg-amber-50 border-4 border-amber-300 rounded-2xl p-5 text-center">
                                        <Key className="w-10 h-10 mx-auto mb-2 text-amber-600" />
                                        <div className="text-lg font-black text-amber-800 mb-2">需要設定 Google API Key</div>
                                        <p className="text-sm text-amber-700 font-bold mb-3">AI 圖片識別需要 Google Gemini API Key 才能使用</p>
                                        <button onClick={() => setImportTab('settings')}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-black shadow-lg transform hover:scale-105 transition-all">
                                            前往設定 API Key
                                        </button>
                                    </div>
                                )}
                                {apiKey && (
                                    <>
                                        {!uploadedImage ? (
                                            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-4 border-blue-300 rounded-2xl p-8 text-center">
                                                <Camera className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                                                <h3 className="text-xl font-black text-gray-800 mb-2">上傳單字表圖片</h3>
                                                <p className="text-base text-gray-600 font-bold mb-4">AI 將自動識別單字，並生成音標、表情符號和例句</p>
                                                <label className="inline-block">
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-2xl font-black text-lg shadow-lg cursor-pointer transform hover:scale-105 transition-all flex items-center gap-2 mx-auto w-fit">
                                                        <Upload className="w-5 h-5" /> 選擇圖片
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-gray-100 rounded-2xl p-4">
                                                    <img src={uploadedImage} alt="上傳的圖片" className="max-h-64 mx-auto rounded-xl shadow-lg" />
                                                </div>
                                                {isProcessing && (
                                                    <div className="bg-blue-100 border-4 border-blue-300 rounded-2xl p-6 text-center">
                                                        <Loader className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-spin" />
                                                        <div className="text-xl font-black text-gray-800">{processingStatus}</div>
                                                    </div>
                                                )}
                                                {!isProcessing && !errorMessage && (
                                                    <div className="flex gap-3">
                                                        <button onClick={processImageWithGemini}
                                                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
                                                            <Sparkles className="w-5 h-5" /> 開始 AI 識別
                                                        </button>
                                                        <button onClick={() => setUploadedImage(null)}
                                                            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-3 rounded-xl font-bold">
                                                            重選
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* 文法 AI 識別區 — 獨立分頁 */}
                        {importTab === 'grammar-ai' && !ocrResult && (
                            <div className="space-y-4">
                                {!apiKey && (
                                    <div className="bg-amber-50 border-4 border-amber-300 rounded-2xl p-5 text-center">
                                        <Key className="w-10 h-10 mx-auto mb-2 text-amber-600" />
                                        <div className="text-lg font-black text-amber-800 mb-2">需要設定 Google API Key</div>
                                        <button onClick={() => setImportTab('settings')}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-black shadow-lg transform hover:scale-105 transition-all">
                                            前往設定 API Key
                                        </button>
                                    </div>
                                )}
                                {apiKey && (
                                    <>
                                        {!uploadedImage ? (
                                            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-4 border-green-300 rounded-2xl p-8 text-center">
                                                <Camera className="w-16 h-16 mx-auto mb-4 text-green-600" />
                                                <h3 className="text-xl font-black text-gray-800 mb-2">上傳文法考卷圖片</h3>
                                                <p className="text-base text-gray-600 font-bold mb-4">AI 將自動辨識題型（選擇、填空、改錯、重組句）並分析答案</p>
                                                <label className="inline-block">
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-lg shadow-lg cursor-pointer transform hover:scale-105 transition-all flex items-center gap-2 mx-auto w-fit">
                                                        <Upload className="w-5 h-5" /> 選擇圖片
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-gray-100 rounded-2xl p-4">
                                                    <img src={uploadedImage} alt="上傳的圖片" className="max-h-64 mx-auto rounded-xl shadow-lg" />
                                                </div>
                                                {isProcessing && (
                                                    <div className="bg-green-100 border-4 border-green-300 rounded-2xl p-6 text-center">
                                                        <Loader className="w-12 h-12 mx-auto mb-3 text-green-600 animate-spin" />
                                                        <div className="text-xl font-black text-gray-800">{processingStatus}</div>
                                                    </div>
                                                )}
                                                {!isProcessing && !errorMessage && (
                                                    <div className="flex gap-3">
                                                        <button onClick={processGrammarWithGemini}
                                                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
                                                            <Sparkles className="w-5 h-5" /> 開始文法 AI 辨識
                                                        </button>
                                                        <button onClick={() => setUploadedImage(null)}
                                                            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-3 rounded-xl font-bold">
                                                            重選
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* 動詞 AI 識別區 */}
                        {importTab === 'verb-ai' && !ocrResult && (
                            <div className="space-y-4">
                                {!apiKey && (
                                    <div className="bg-amber-50 border-4 border-amber-300 rounded-2xl p-5 text-center">
                                        <Key className="w-10 h-10 mx-auto mb-2 text-amber-600" />
                                        <div className="text-lg font-black text-amber-800 mb-2">需要設定 Google API Key</div>
                                        <button onClick={() => setImportTab('settings')}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-black shadow-lg transform hover:scale-105 transition-all">
                                            前往設定 API Key
                                        </button>
                                    </div>
                                )}
                                {apiKey && (
                                    <>
                                        {!uploadedImage ? (
                                            <div className="bg-gradient-to-r from-orange-100 to-red-100 border-4 border-orange-300 rounded-2xl p-8 text-center">
                                                <Camera className="w-16 h-16 mx-auto mb-4 text-orange-600" />
                                                <h3 className="text-xl font-black text-gray-800 mb-2">上傳不規則動詞表圖片</h3>
                                                <p className="text-base text-gray-600 font-bold mb-4">AI 將自動辨識動詞三態 (原形 / 過去式 / 過去分詞) 並生成音標、中文與例句</p>
                                                <label className="inline-block">
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl font-black text-lg shadow-lg cursor-pointer transform hover:scale-105 transition-all flex items-center gap-2 mx-auto w-fit">
                                                        <Upload className="w-5 h-5" /> 選擇圖片
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-gray-100 rounded-2xl p-4">
                                                    <img src={uploadedImage} alt="上傳的圖片" className="max-h-64 mx-auto rounded-xl shadow-lg" />
                                                </div>
                                                {isProcessing && (
                                                    <div className="bg-orange-100 border-4 border-orange-300 rounded-2xl p-6 text-center">
                                                        <Loader className="w-12 h-12 mx-auto mb-3 text-orange-600 animate-spin" />
                                                        <div className="text-xl font-black text-gray-800">{processingStatus}</div>
                                                    </div>
                                                )}
                                                {!isProcessing && !errorMessage && (
                                                    <div className="flex gap-3">
                                                        <button onClick={processVerbWithGemini}
                                                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
                                                            <RefreshCcw className="w-5 h-5" /> 開始 AI 識別動詞
                                                        </button>
                                                        <button onClick={() => setUploadedImage(null)}
                                                            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-3 rounded-xl font-bold">
                                                            重選
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* API 設定區 */}
                        {importTab === 'settings' && !ocrResult && (
                            <div className="space-y-5">
                                <div className="bg-gray-50 border-4 border-gray-200 rounded-2xl p-6">
                                    <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                        <Key className="w-6 h-6 text-gray-600" /> Google Gemini API Key
                                    </h3>
                                    {apiKey ? (
                                        <div className="space-y-3">
                                            <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="text-base font-black text-green-800">✅ API Key 已設定</div>
                                                    <div className="text-sm text-green-700 font-bold mt-1">
                                                        {showApiKey ? apiKey : `${apiKey.substring(0, 8)}${'•'.repeat(20)}${apiKey.slice(-4)}`}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowApiKey(!showApiKey)}
                                                        className="bg-green-200 hover:bg-green-300 p-2 rounded-lg transition-all">
                                                        {showApiKey ? <EyeOff className="w-4 h-4 text-green-800" /> : <Eye className="w-4 h-4 text-green-800" />}
                                                    </button>
                                                    <button onClick={clearApiKey}
                                                        className="bg-red-200 hover:bg-red-300 p-2 rounded-lg transition-all">
                                                        <Trash2 className="w-4 h-4 text-red-700" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input type={showApiKey ? 'text' : 'password'}
                                                    value={apiKeyInput}
                                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                                    placeholder="貼上你的 Google API Key..."
                                                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base font-bold"
                                                />
                                                <button onClick={() => setShowApiKey(!showApiKey)}
                                                    className="bg-gray-200 hover:bg-gray-300 p-3 rounded-xl transition-all">
                                                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <button onClick={saveApiKey} disabled={!apiKeyInput.trim()}
                                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
                                                <Save className="w-5 h-5" /> 儲存 API Key
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 border-4 border-gray-200 rounded-2xl p-6">
                                    <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                        <Zap className="w-6 h-6 text-gray-600" /> 選擇 AI 模型
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600 font-bold">若遇到 API 限制或錯誤，請嘗試切換模型：</p>
                                        <div className="flex gap-2">
                                            <select
                                                value={apiModel}
                                                onChange={(e) => saveApiModel(e.target.value)}
                                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg font-bold bg-white"
                                            >
                                                {availableModels.length > 0 ? (
                                                    availableModels.map(m => {
                                                        const label = m.includes('pro') ? '[Pro 獨立配額/最強辨識]' :
                                                            m.includes('lite') ? '[Lite 獨立配額/最省流量]' :
                                                                m.includes('2.0') || m.includes('3.0') ? '[新版獨立配額]' :
                                                                    '[標準 Flash 配額]';
                                                        return (
                                                            <option key={m} value={m}>
                                                                {label} {m}
                                                            </option>
                                                        );
                                                    })
                                                ) : (
                                                    <>
                                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (推薦)</option>
                                                        <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Preview)</option>
                                                    </>
                                                )}
                                            </select>
                                            <button onClick={async () => {
                                                if (!apiKey) { alert('請先設定 API Key'); return; }
                                                try {
                                                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                                                    const data = await res.json();
                                                    if (data.models) {
                                                        // 放寬過濾：只過濾舊版 1.0
                                                        const names = data.models.map(m => m.name.replace('models/', ''))
                                                            .filter(n => n.includes('gemini') && !n.includes('gemini-1.0-pro') && !n.includes('gemini-1.0-flash'));

                                                        // 排序權重：鼓勵切換「桶子」
                                                        // 1. Pro 系列 (最強辨識且通常與 Flash 額度獨立) => 分數 1200
                                                        // 2. 2.0 Flash 系列 (最新、通常有獨立配額) => 分數 1100
                                                        // 3. 1.5 Flash (最常用、最容易滿) => 分數 1000
                                                        // 4. Lite 系列 (更輕量配額) => 分數 800
                                                        // 5. 其他版本 => 分數 100
                                                        names.sort((a, b) => {
                                                            const getScore = (name) => {
                                                                if (name.includes('pro')) return 1200;
                                                                if (name.includes('2.0-flash')) return 1100;
                                                                if (name.includes('gemini-1.5-flash')) return 1000;
                                                                if (name.includes('lite')) return 800;
                                                                if (name.includes('gemini-3')) return 0;
                                                                return 100;
                                                            };
                                                            return getScore(b) - getScore(a);
                                                        });

                                                        if (names.length > 0) {
                                                            setAvailableModels(names);
                                                            saveApiModel(names[0]);
                                                            alert(`✅ 已更新模型列表！\n系統預設為您選擇：\n${names[0]}\n\n⚠️ 如果遇到「Quota Exceeded」錯誤，請在下拉選單中切換其他模型 (例如嘗試 flash-latest 或 pro)！`);
                                                        } else {
                                                            alert('API Key 有效，但找不到符合的 Gemini 模型。');
                                                        }
                                                    } else {
                                                        alert('查無可用模型，可能是 API Key 問題或權限不足。');
                                                    }
                                                } catch (e) {
                                                    alert('查詢失敗：' + e.message);
                                                }
                                            }}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold whitespace-nowrap">
                                                🔍 檢查可用模型
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                                    <div className="text-base font-black text-blue-800 mb-2">📌 如何取得 Google API Key?</div>
                                    <ol className="text-sm text-blue-700 space-y-1 font-bold list-decimal list-inside">
                                        <li>前往 Google AI Studio (aistudio.google.com)</li>
                                        <li>登入 Google 帳號</li>
                                        <li>點擊「Get API Key」</li>
                                        <li>建立新的 API Key 並複製</li>
                                        <li>貼上到上方輸入框</li>
                                    </ol>
                                    <div className="mt-3 text-xs text-blue-600 font-bold">🔒 API Key 僅儲存在你的瀏覽器中，不會傳送到任何伺服器。</div>
                                </div>
                            </div>
                        )}


                        {/* 錯誤訊息 */}
                        {errorMessage && !isProcessing && !ocrResult && (
                            <div className="bg-red-100 border-4 border-red-300 rounded-2xl p-6 mt-4">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                                <div className="text-xl font-black text-red-800 mb-2">解析失敗</div>
                                <div className="text-base text-red-700 font-bold whitespace-pre-line mb-4">{errorMessage}</div>
                                <button onClick={() => { setErrorMessage(''); setOcrResult(null); }}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all">重新輸入</button>
                            </div>
                        )}

                        {/* 解析結果 */}
                        {ocrResult && !isProcessing && !errorMessage && (
                            <div className="space-y-4">
                                <div className={`${ocrResult.type === 'grammar' ? 'bg-emerald-100 border-emerald-400' : 'bg-green-100 border-green-400'} border-4 rounded-2xl p-5`}>
                                    <div className="text-2xl font-black text-green-800 flex items-center gap-2">
                                        <CheckCircle className="w-8 h-8" /> 解析成功！找到 {ocrResult.items?.length || 0} 個{ocrResult.type === 'grammar' ? '文法題' : '單字'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4 max-h-72 overflow-y-auto">
                                    <div className="space-y-2">
                                        {ocrResult.type === 'grammar' ? (
                                            /* 文法題結果卡片 */
                                            ocrResult.items.map((item, index) => (
                                                <div key={index} className="bg-white rounded-2xl p-4 border-2 border-gray-200 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(item.type === 'choice' || item.type === 'multiple') ? 'bg-blue-100 text-blue-700' :
                                                            item.type === 'fill' ? 'bg-green-100 text-green-700' :
                                                                item.type === 'correction' ? 'bg-red-100 text-red-700' :
                                                                    item.type === 'reorder' ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {(item.type === 'choice' || item.type === 'multiple') ? '選擇題' :
                                                                item.type === 'fill' ? '填空題' :
                                                                    item.type === 'correction' ? '改錯題' :
                                                                        item.type === 'reorder' ? '重組句' : '選擇題'}
                                                        </span>
                                                    </div>
                                                    <div className="text-base font-bold text-gray-800 mb-2">{item.question}</div>
                                                    {item.options && (
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {item.options.map((opt, i) => (
                                                                <span key={i} className={`px-2 py-1 rounded-lg text-sm font-bold ${i === item.correct ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    ({String.fromCharCode(65 + i)}) {opt}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {item.answer && <div className="text-sm text-green-700 font-bold">✅ 答案：{item.answer}</div>}
                                                    {item.words && <div className="text-sm text-purple-700 font-bold">🔀 單字：{item.words.join(' / ')}</div>}
                                                </div>
                                            ))
                                        ) : (
                                            /* 單字結果卡片 */
                                            ocrResult.items.map((item, index) => (
                                                <div key={index} className="bg-white rounded-2xl p-4 border-2 border-gray-200 flex items-start gap-4 hover:shadow-md transition-all">
                                                    <div className="text-4xl">{item.emoji || '📝'}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline flex-wrap gap-2 mb-1">
                                                            <span className="text-xl font-black text-gray-900">{item.word}</span>
                                                            {(item.past || item.participle) && (
                                                                <span className="bg-orange-100 text-orange-700 text-xs font-black px-2 py-0.5 rounded-full uppercase">三態動詞</span>
                                                            )}
                                                            {item.pronunciation && (
                                                                <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                                                                    {item.pronunciation}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.past && (
                                                            <div className="flex gap-2 mb-2">
                                                                <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-1 text-center">
                                                                    <div className="text-[10px] font-black text-orange-600 uppercase">V1</div>
                                                                    <div className="text-sm font-bold text-gray-800">{item.word}</div>
                                                                </div>
                                                                <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-1 text-center">
                                                                    <div className="text-[10px] font-black text-orange-600 uppercase">V2</div>
                                                                    <div className="text-sm font-bold text-gray-800">{item.past}</div>
                                                                </div>
                                                                <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-1 text-center">
                                                                    <div className="text-[10px] font-black text-orange-600 uppercase">V3</div>
                                                                    <div className="text-sm font-bold text-gray-800">{item.participle}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="text-lg text-gray-700 font-bold mb-2">{item.chinese}</div>
                                                        {item.sentence && (
                                                            <div className="text-sm text-gray-500 italic mt-2 border-t-2 border-gray-100 pt-2 flex items-start gap-2">
                                                                <span className="not-italic">🗣️</span> {item.sentence}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                {/* 標籤輸入 */}
                                {ocrResult.type === 'vocabulary' && (
                                    <div className="bg-cyan-50 border-2 border-cyan-200 rounded-2xl p-4 flex items-center gap-3">
                                        <Tag className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                                        <span className="text-base font-bold text-gray-700 whitespace-nowrap">🏷️ 分類標籤：</span>
                                        <input type="text" value={importLabel} onChange={(e) => setImportLabel(e.target.value)} placeholder="例如: 第一課、Unit 1"
                                            className="flex-1 px-3 py-2 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:outline-none text-base font-bold" />
                                        {allLabels.length > 0 && (
                                            <select onChange={(e) => { if (e.target.value) setImportLabel(e.target.value); }} defaultValue=""
                                                className="px-3 py-2 border-2 border-cyan-300 rounded-xl text-sm font-bold bg-white">
                                                <option value="" disabled>已有標籤</option>
                                                {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={addAllOCRItems}
                                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-6 h-6" /> 全部加入題庫
                                    </button>
                                    <button onClick={() => {
                                        setManagementMode(ocrResult.type === 'grammar' ? 'grammar' : 'vocabulary');
                                        setShowOCRPanel(false);
                                        setShowManagePanel(true);
                                    }}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-4 rounded-2xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
                                        <Edit className="w-6 h-6" /> 編輯後加入
                                    </button>
                                </div>
                                <button onClick={() => { setOcrResult(null); setProcessingStatus(''); }}
                                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold">重新解析</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 題庫管理面板 */}
            {showManagePanel && gameMode === 'menu' && (
                <div className="relative z-20 max-w-6xl mx-auto px-6 mb-8">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-4xl font-black text-gray-800">📝 題庫管理中心</h2>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowOCRPanel(true); setPasteText(''); setOcrResult(null); setErrorMessage(''); setImportTab('paste'); }}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-black shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" /> 智慧匯入
                                </button>
                                <button onClick={() => setShowManagePanel(false)} className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-xl font-black shadow-lg">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-4 mb-6">
                            <button onClick={() => { setManagementMode('vocabulary'); setEditingItem(null); setVocabForm({ word: '', chinese: '', pronunciation: '', emoji: '', sentence: '' }); }}
                                className={`flex-1 py-4 rounded-xl font-black text-xl transition-all ${managementMode === 'vocabulary' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                📚 單字庫 ({vocabularyData.length})
                            </button>
                            <button onClick={() => { setManagementMode('grammar'); setEditingItem(null); setGrammarForm({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' }); }}
                                className={`flex-1 py-4 rounded-xl font-black text-xl transition-all ${managementMode === 'grammar' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                🎯 文法庫 ({grammarData.length})
                            </button>
                        </div>

                        {managementMode === 'vocabulary' && (
                            <div className="space-y-6">
                                <div className="bg-cyan-50 rounded-2xl p-6 border-4 border-cyan-200">
                                    <h3 className="text-2xl font-black text-gray-800 mb-4">{editingItem ? '✏️ 編輯單字' : '➕ 新增單字'}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-gray-700 font-bold mb-2">英文單字 *</label>
                                            <input type="text" value={vocabForm.word} onChange={(e) => setVocabForm({ ...vocabForm, word: e.target.value })} placeholder="例如: apple"
                                                className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:outline-none text-lg font-bold" /></div>
                                        <div><label className="block text-gray-700 font-bold mb-2">中文意思 *</label>
                                            <input type="text" value={vocabForm.chinese} onChange={(e) => setVocabForm({ ...vocabForm, chinese: e.target.value })} placeholder="例如: 蘋果"
                                                className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:outline-none text-lg font-bold" /></div>
                                        <div><label className="block text-gray-700 font-bold mb-2">發音（音標）</label>
                                            <input type="text" value={vocabForm.pronunciation} onChange={(e) => setVocabForm({ ...vocabForm, pronunciation: e.target.value })} placeholder="例如: /ˈæp.əl/"
                                                className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:outline-none text-lg font-bold" /></div>
                                        <div><label className="block text-gray-700 font-bold mb-2">表情符號</label>
                                            <input type="text" value={vocabForm.emoji} onChange={(e) => setVocabForm({ ...vocabForm, emoji: e.target.value })} placeholder="🍎"
                                                className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:outline-none text-4xl text-center" /></div>
                                        <div className="grid grid-cols-2 gap-4 col-span-2">
                                            <div><label className="block text-gray-700 font-bold mb-2">過去式 (V2 / Past Simple)</label>
                                                <input type="text" value={vocabForm.past} onChange={(e) => setVocabForm({ ...vocabForm, past: e.target.value })} placeholder="例如: went"
                                                    className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:border-orange-500 focus:outline-none text-lg font-bold" /></div>
                                            <div><label className="block text-gray-700 font-bold mb-2">過去分詞 (V3 / Past Participle)</label>
                                                <input type="text" value={vocabForm.participle} onChange={(e) => setVocabForm({ ...vocabForm, participle: e.target.value })} placeholder="例如: gone"
                                                    className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:border-orange-500 focus:outline-none text-lg font-bold" /></div>
                                        </div>
                                        <div className="col-span-2"><label className="block text-gray-700 font-bold mb-2">例句</label>
                                            <input type="text" value={vocabForm.sentence} onChange={(e) => setVocabForm({ ...vocabForm, sentence: e.target.value })} placeholder="例如: I eat an apple every day."
                                                className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:outline-none text-lg font-bold" /></div>
                                        <div className="col-span-2"><label className="block text-gray-700 font-bold mb-2">📌 分類標籤</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={vocabForm.label} onChange={(e) => setVocabForm({ ...vocabForm, label: e.target.value })} placeholder="例如: 第一課、Unit 1"
                                                    className="flex-1 px-4 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:outline-none text-lg font-bold" />
                                                {allLabels.length > 0 && (
                                                    <select onChange={(e) => { if (e.target.value) setVocabForm({ ...vocabForm, label: e.target.value }); }}
                                                        className="px-3 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:outline-none text-base font-bold bg-white" defaultValue="">
                                                        <option value="" disabled>已有標籤</option>
                                                        {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-4">
                                        {editingItem ? (<>
                                            <button onClick={updateVocabulary} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"><Save className="w-6 h-6" /> 儲存修改</button>
                                            <button onClick={() => { setEditingItem(null); setVocabForm({ word: '', chinese: '', pronunciation: '', emoji: '', sentence: '', label: '' }); }} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-4 rounded-xl font-black text-xl shadow-lg">取消</button>
                                        </>) : (
                                            <button onClick={addVocabulary} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"><Plus className="w-6 h-6" /> 新增單字</button>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border-4 border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-black text-gray-800">📋 單字列表 ({vocabularyData.length} 個)</h3>
                                        <div className="flex items-center gap-3">
                                            {allLabels.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Filter className="w-4 h-4 text-gray-500" />
                                                    <select value={selectedLabel} onChange={(e) => setSelectedLabel(e.target.value)}
                                                        className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none text-sm font-bold bg-white">
                                                        <option value="all">全部</option>
                                                        {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 批次操作列 */}
                                    <div className="flex items-center gap-3 mb-3 bg-gray-100 rounded-xl p-3">
                                        <button onClick={() => {
                                            const visibleIds = vocabularyData.filter(item => selectedLabel === 'all' || item.label === selectedLabel).map(item => item.id);
                                            if (batchSelectedIds.length === visibleIds.length) setBatchSelectedIds([]);
                                            else setBatchSelectedIds(visibleIds);
                                        }} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-cyan-600 transition-colors">
                                            {batchSelectedIds.length > 0 && batchSelectedIds.length === vocabularyData.filter(item => selectedLabel === 'all' || item.label === selectedLabel).length
                                                ? <CheckSquare className="w-5 h-5 text-cyan-600" />
                                                : <Square className="w-5 h-5" />}
                                            {batchSelectedIds.length > 0 ? `已選 ${batchSelectedIds.length} 個` : '全選'}
                                        </button>
                                        {batchSelectedIds.length > 0 && (
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-sm font-bold text-gray-500">改為:</span>
                                                <input type="text" value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} placeholder="輸入新標籤..."
                                                    className="flex-1 px-3 py-2 border-2 border-cyan-300 rounded-lg focus:border-cyan-500 focus:outline-none text-sm font-bold" />
                                                {allLabels.length > 0 && (
                                                    <select onChange={(e) => { if (e.target.value) setBatchLabel(e.target.value); }} defaultValue=""
                                                        className="px-2 py-2 border-2 border-cyan-300 rounded-lg text-sm font-bold bg-white">
                                                        <option value="" disabled>已有</option>
                                                        {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                )}
                                                <button onClick={async () => {
                                                    if (batchSelectedIds.length === 0) return;
                                                    try {
                                                        const { batchUpdateVocabularyLabel } = await import('./firestore');
                                                        await batchUpdateVocabularyLabel(batchSelectedIds, batchLabel);
                                                        alert(`✅ 已將 ${batchSelectedIds.length} 個單字的標籤改為「${batchLabel || '(無標籤)'}」`);
                                                        setBatchSelectedIds([]);
                                                        setBatchLabel('');
                                                    } catch (error) {
                                                        console.error('批次修改標籤失敗:', error);
                                                        alert('❌ 修改失敗，請重試');
                                                    }
                                                }} disabled={batchSelectedIds.length === 0}
                                                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap flex items-center gap-1">
                                                    <Tag className="w-4 h-4" /> 套用
                                                </button>
                                                <button onClick={async () => {
                                                    if (!confirm(`確定要刪除這 ${batchSelectedIds.length} 個單字嗎？`)) return;
                                                    try {
                                                        for (const id of batchSelectedIds) {
                                                            await deleteVocabularyItem(id);
                                                        }
                                                        setBatchSelectedIds([]);
                                                    } catch (error) {
                                                        console.error('批次刪除失敗:', error);
                                                        alert('❌ 刪除失敗，請重試');
                                                    }
                                                }} disabled={batchSelectedIds.length === 0}
                                                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {vocabularyData.filter(item => selectedLabel === 'all' || item.label === selectedLabel).map(item => (
                                            <div key={item.id} className={`rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer ${batchSelectedIds.includes(item.id) ? 'bg-cyan-50 border-2 border-cyan-300' : 'bg-gray-50 border-2 border-transparent'}`}
                                                onClick={() => {
                                                    setBatchSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                                                }}>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0">
                                                        {batchSelectedIds.includes(item.id)
                                                            ? <CheckSquare className="w-6 h-6 text-cyan-600" />
                                                            : <Square className="w-6 h-6 text-gray-400" />}
                                                    </div>
                                                    <div className="text-4xl">{item.emoji || '📝'}</div>
                                                    <div>
                                                        <div className="text-xl font-black text-gray-800">{item.word}</div>
                                                        <div className="text-lg text-gray-600 font-bold">{item.chinese}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {item.label && <span className="inline-block px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full">{item.label}</span>}
                                                            <MasteryStars item={item} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => startEdit(item, 'vocabulary')} className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-bold transition-all"><Edit className="w-5 h-5" /></button>
                                                    <button onClick={() => deleteVocabulary(item.id)} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-all"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {managementMode === 'grammar' && (
                            <div className="space-y-6">
                                <div className="bg-green-50 rounded-2xl p-6 border-4 border-green-200">
                                    <h3 className="text-2xl font-black text-gray-800 mb-4">{editingItem ? '✏️ 編輯文法題' : '➕ 新增文法題'}</h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-gray-700 font-bold mb-2">題型 *</label>
                                                <select value={grammarForm.type} onChange={(e) => setGrammarForm({ ...grammarForm, type: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold">
                                                    <option value="choice">選擇題 (Choice)</option>
                                                    <option value="fill">填空題 (Fill)</option>
                                                    <option value="correction">改錯題 (Correction)</option>
                                                    <option value="reorder">重組句 (Reorder)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-bold mb-2">題目 *</label>
                                            <input type="text" value={grammarForm.question} onChange={(e) => setGrammarForm({ ...grammarForm, question: e.target.value })} placeholder="例如: She ___ to school every day."
                                                className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" />
                                        </div>

                                        {grammarForm.type === 'choice' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[0, 1, 2, 3].map(index => (
                                                        <div key={index}><label className="block text-gray-700 font-bold mb-2">選項 {index + 1} *</label>
                                                            <input type="text" value={grammarForm.options[index]} onChange={(e) => { const o = [...grammarForm.options]; o[index] = e.target.value; setGrammarForm({ ...grammarForm, options: o }); }}
                                                                className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                                    ))}
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 font-bold mb-2">正確答案 *</label>
                                                    <select value={grammarForm.correct} onChange={(e) => setGrammarForm({ ...grammarForm, correct: parseInt(e.target.value) })}
                                                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold">
                                                        <option value={0}>選項 1</option><option value={1}>選項 2</option><option value={2}>選項 3</option><option value={3}>選項 4</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        {grammarForm.type === 'fill' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="block text-gray-700 font-bold mb-2">正確答案 *</label>
                                                    <input type="text" value={grammarForm.answer} onChange={(e) => setGrammarForm({ ...grammarForm, answer: e.target.value })} placeholder="例如: goes"
                                                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                                <div><label className="block text-gray-700 font-bold mb-2">提示 (選填)</label>
                                                    <input type="text" value={grammarForm.hint} onChange={(e) => setGrammarForm({ ...grammarForm, hint: e.target.value })} placeholder="例如: goes / go"
                                                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                            </div>
                                        )}

                                        {grammarForm.type === 'correction' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="block text-gray-700 font-bold mb-2">錯誤部分 *</label>
                                                    <input type="text" value={grammarForm.errorPart} onChange={(e) => setGrammarForm({ ...grammarForm, errorPart: e.target.value })} placeholder="例如: go"
                                                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                                <div><label className="block text-gray-700 font-bold mb-2">正確句子 *</label>
                                                    <input type="text" value={grammarForm.answer} onChange={(e) => setGrammarForm({ ...grammarForm, answer: e.target.value })} placeholder="例如: She goes to school."
                                                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                            </div>
                                        )}

                                        {grammarForm.type === 'reorder' && (
                                            <div className="space-y-4">
                                                <div><label className="block text-gray-700 font-bold mb-2">打散的單字 (用斜線分隔) *</label>
                                                    <input type="text" value={grammarForm.words.join('/')} onChange={(e) => setGrammarForm({ ...grammarForm, words: e.target.value.split('/') })} placeholder="例如: goes/to/school/She"
                                                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                                <div><label className="block text-gray-700 font-bold mb-2">正確句子 *</label>
                                                    <input type="text" value={grammarForm.answer} onChange={(e) => setGrammarForm({ ...grammarForm, answer: e.target.value })} placeholder="例如: She goes to school."
                                                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                            </div>
                                        )}

                                        <div><label className="block text-gray-700 font-bold mb-2">解析建議 *</label>
                                            <textarea value={grammarForm.explanation} onChange={(e) => setGrammarForm({ ...grammarForm, explanation: e.target.value })} rows={3}
                                                className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                    </div>
                                    <div className="flex gap-4 mt-4">
                                        {editingItem ? (<>
                                            <button onClick={updateGrammar} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"><Save className="w-6 h-6" /> 儲存修改</button>
                                            <button onClick={() => { setEditingItem(null); setGrammarForm({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' }); }} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-4 rounded-xl font-black text-xl shadow-lg">取消</button>
                                        </>) : (
                                            <button onClick={addGrammar} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"><Plus className="w-6 h-6" /> 新增文法題</button>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border-4 border-gray-200">
                                    <h3 className="text-2xl font-black text-gray-800 mb-4">📋 文法題列表 ({grammarData.length} 題)</h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {grammarData.map(item => (
                                            <div key={item.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1"><div className="text-lg font-black text-gray-800 mb-2">{item.question}</div><div className="text-sm text-gray-600 font-bold">正確答案: {item.options[item.correct]}</div></div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => startEdit(item, 'grammar')} className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-bold transition-all"><Edit className="w-5 h-5" /></button>
                                                        <button onClick={() => deleteGrammar(item.id)} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-all"><Trash2 className="w-5 h-5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* 遊戲主介面 */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 pb-12">
                {gameMode === 'menu' && !showManagePanel && (
                    <div className="text-center">
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-2 md:mb-4 tracking-tight drop-shadow-lg animate-bounce-slow">🚀 英語太空站</h1>
                        <p className="text-lg md:text-2xl text-pink-300 mb-8 md:mb-12 font-bold">選擇你的任務！</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            {/* 單字卡 */}
                            <div className="relative">
                                <button onClick={() => { if (allLabels.length > 0) { setSelectedLabels([]); setShowLabelPicker(true); } else startGame('vocabulary'); }}
                                    className="group w-full bg-gradient-to-br from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 p-6 md:p-8 rounded-3xl shadow-2xl transform hover:scale-105 hover:-rotate-1 transition-all duration-300">
                                    <div className="text-6xl md:text-7xl mb-2 md:mb-4 group-hover:animate-bounce">📚</div>
                                    <div className="text-white text-2xl md:text-3xl font-black mb-1 md:mb-2">單字卡</div>
                                    <div className="text-blue-100 text-base md:text-lg font-bold">學習新單字</div>
                                    <div className="text-blue-200 text-xs md:text-sm font-bold mt-1 md:mt-2">({vocabularyData.length} 個)</div>
                                    {allLabels.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3 justify-center">{allLabels.map(l => <span key={l} className="px-2.5 py-1 bg-blue-800 bg-opacity-40 rounded-lg text-xs font-bold text-blue-100 border border-blue-400 border-opacity-30">{l}</span>)}</div>}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setManagementMode('vocabulary'); setShowManagePanel(true); }}
                                    className="absolute top-3 right-3 text-white text-xl opacity-60 hover:opacity-100 transition-all hover:scale-125 drop-shadow-lg" title="管理單字庫">
                                    ⚙️
                                </button>
                            </div>

                            {/* 文法射擊 */}
                            <div className="relative">
                                <button onClick={() => startGame('grammar')}
                                    className="group w-full bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-300 hover:to-emerald-500 p-6 md:p-8 rounded-3xl shadow-2xl transform hover:scale-105 hover:rotate-1 transition-all duration-300">
                                    <div className="text-6xl md:text-7xl mb-2 md:mb-4 group-hover:animate-bounce">🎯</div>
                                    <div className="text-white text-2xl md:text-3xl font-black mb-1 md:mb-2">文法射擊</div>
                                    <div className="text-green-100 text-base md:text-lg font-bold">挑戰文法題</div>
                                    <div className="text-green-200 text-xs md:text-sm font-bold mt-1 md:mt-2">({grammarData.length} 題)</div>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setManagementMode('grammar'); setShowManagePanel(true); }}
                                    className="absolute top-3 right-3 text-white text-xl opacity-60 hover:opacity-100 transition-all hover:scale-125 drop-shadow-lg" title="管理文法庫">
                                    ⚙️
                                </button>
                            </div>
                        </div>

                        {/* 第二排：匯入 + 錯題 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
                            {/* 智慧匯入 */}
                            <button onClick={() => { setShowOCRPanel(true); setPasteText(''); setOcrResult(null); setErrorMessage(''); setImportTab('paste'); }}
                                className="group bg-gradient-to-br from-purple-400 to-pink-600 hover:from-purple-300 hover:to-pink-500 p-6 md:p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                                <div className="text-6xl md:text-7xl mb-2 md:mb-4 group-hover:animate-bounce">✨</div>
                                <div className="text-white text-2xl md:text-3xl font-black mb-1 md:mb-2">智慧匯入</div>
                                <div className="text-purple-100 text-base md:text-lg font-bold">貼上文字或 AI 圖片辨識</div>
                            </button>

                            {/* 錯題複習 */}
                            <button onClick={() => { setGameMode('review'); setCurrentQuestion(0); }} disabled={wrongAnswers.length === 0}
                                className={`group p-6 md:p-8 rounded-3xl shadow-2xl transform transition-all duration-300 ${wrongAnswers.length === 0 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gradient-to-br from-orange-400 to-red-600 hover:from-orange-300 hover:to-red-500 hover:scale-105'}`}>
                                <div className="text-6xl md:text-7xl mb-2 md:mb-4 group-hover:animate-bounce">📖</div>
                                <div className="text-white text-2xl md:text-3xl font-black mb-1 md:mb-2">錯題複習</div>
                                <div className="text-orange-100 text-base md:text-lg font-bold">{wrongAnswers.length} 題待複習</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* 單字練習 */}
                {gameMode === 'vocabulary' && currentItem && !showFeedback && (
                    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-12 transform hover:scale-[1.02] transition-transform">
                        <div className="text-center mb-6 md:mb-8">
                            <div className="text-7xl md:text-9xl mb-4 md:mb-6 animate-bounce-slow">{currentItem.emoji || '📝'}</div>
                            <div className="text-3xl md:text-5xl font-black text-gray-800 mb-2">
                                {vocabQuestionType === 'all_tenses' ? <><span className="text-orange-600">"{currentItem.chinese}"</span> 的動詞三態</> :
                                    vocabQuestionType === 'past' ? <><span className="text-orange-600">"{currentItem.word}"</span> 的過去式 (V2 / Past Simple)</> :
                                        vocabQuestionType === 'participle' ? <><span className="text-orange-600">"{currentItem.word}"</span> 的過去分詞 (V3 / Past Participle)</> :
                                            currentItem.chinese}
                            </div>
                            <div className="text-lg md:text-xl text-gray-500 font-bold mb-4">
                                {vocabQuestionType === 'meaning' ? (currentItem.pronunciation || '') :
                                    vocabQuestionType === 'all_tenses' ? '請依序輸入: 原形 過去式 過去分詞 (可用空白隔開)' : '請輸入正確的動詞變化'}
                            </div>
                            <button onClick={() => playSound((currentItem.past && currentItem.participle) ? [currentItem.word, currentItem.past, currentItem.participle] : currentItem.word)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-lg md:text-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> 聽{currentItem.past && currentItem.participle ? '三態' : '單字'}發音
                            </button>
                        </div>
                        <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                            placeholder={vocabQuestionType === 'meaning' ? "輸入英文單字..." : vocabQuestionType === 'all_tenses' ? "例: go went gone" : "輸入動詞變化..."}
                            className={`w-full px-4 py-4 md:px-8 md:py-6 text-xl md:text-3xl font-bold border-4 ${vocabQuestionType === 'meaning' ? 'border-purple-300 focus:border-purple-500' : 'border-orange-300 focus:border-orange-500'} rounded-2xl focus:outline-none text-center mb-4 md:mb-6`} autoFocus />
                        <button onClick={() => userAnswer && handleAnswer(userAnswer)} disabled={!userAnswer}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-4 md:px-8 md:py-6 rounded-2xl font-black text-xl md:text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                            <Target className="w-6 h-6 md:w-8 md:h-8" /> 發射答案！
                        </button>
                        <div className="text-center mt-4 md:mt-6 text-gray-600 font-bold text-base md:text-lg">題目 {currentQuestion + 1} / {currentData.length}</div>
                    </div>
                )}

                {/* 文法練習 — 支援多題型 */}
                {gameMode === 'grammar' && currentItem && !showFeedback && (
                    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-12">
                        {/* 題型標籤 */}
                        <div className="flex justify-center mb-4">
                            <span className={`px-4 py-1 rounded-full text-sm font-bold ${(currentItem.type === 'choice' || currentItem.type === 'multiple') ? 'bg-blue-100 text-blue-700' :
                                currentItem.type === 'fill' ? 'bg-green-100 text-green-700' :
                                    currentItem.type === 'correction' ? 'bg-red-100 text-red-700' :
                                        currentItem.type === 'reorder' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-700'
                                }`}>
                                {(currentItem.type === 'choice' || currentItem.type === 'multiple') ? '📋 選擇題' :
                                    currentItem.type === 'fill' ? '✏️ 填空題' :
                                        currentItem.type === 'correction' ? '🔍 改錯題' :
                                            currentItem.type === 'reorder' ? '🔀 重組句' : '📋 選擇題'}
                            </span>
                        </div>

                        {/* 選擇題 */}
                        {(currentItem.type === 'choice' || currentItem.type === 'multiple' || !currentItem.type) && (<>
                            <div className="text-center mb-6 md:mb-8">
                                <div className="text-3xl md:text-5xl font-black text-gray-800 mb-6 md:mb-8 leading-tight">{currentItem.question}</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {(currentItem.options || []).map((option, index) => (
                                    <button key={index} onClick={() => handleAnswer(index)}
                                        className="group bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white px-6 py-6 md:px-8 md:py-8 rounded-2xl font-black text-xl md:text-3xl shadow-lg transform hover:scale-105 hover:-rotate-1 transition-all relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        <div className="relative z-10">{option}</div>
                                    </button>
                                ))}
                            </div>
                        </>)}

                        {/* 填空題 */}
                        {currentItem.type === 'fill' && (<>
                            <div className="text-center mb-6 md:mb-8">
                                <div className="text-2xl md:text-4xl font-black text-gray-800 mb-4 leading-tight">{currentItem.question}</div>
                                {currentItem.hint && (
                                    <div className="text-base md:text-lg text-blue-600 font-bold bg-blue-50 inline-block px-4 py-2 rounded-xl">
                                        💡 提示：{currentItem.hint}
                                    </div>
                                )}
                            </div>
                            <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                                placeholder="輸入答案..."
                                className="w-full px-4 py-4 md:px-8 md:py-6 text-xl md:text-3xl font-bold border-4 border-green-300 rounded-2xl focus:outline-none focus:border-green-500 text-center mb-4 md:mb-6" autoFocus />
                            <button onClick={() => userAnswer && handleAnswer(userAnswer)} disabled={!userAnswer}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-4 md:px-8 md:py-6 rounded-2xl font-black text-xl md:text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                                <Target className="w-6 h-6 md:w-8 md:h-8" /> 送出答案！
                            </button>
                        </>)}

                        {/* 改錯題 */}
                        {currentItem.type === 'correction' && (<>
                            <div className="text-center mb-6 md:mb-8">
                                <div className="text-base md:text-lg font-bold text-red-600 mb-2 md:mb-3">🔍 請找出句子中的錯誤並修正：</div>
                                <div className="text-2xl md:text-4xl font-black text-gray-800 leading-tight bg-red-50 p-4 md:p-6 rounded-2xl border-4 border-red-200">
                                    {currentItem.question}
                                </div>
                                {currentItem.errorPart && (
                                    <div className="mt-3 text-sm md:text-base text-red-500 font-bold">
                                        ⚠️ 錯誤部分：<span className="underline decoration-wavy decoration-red-500">{currentItem.errorPart}</span>
                                    </div>
                                )}
                            </div>
                            <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                                placeholder="輸入修正後的完整句子..."
                                className="w-full px-4 py-4 md:px-8 md:py-6 text-xl md:text-2xl font-bold border-4 border-red-300 rounded-2xl focus:outline-none focus:border-red-500 text-center mb-4 md:mb-6" autoFocus />
                            <button onClick={() => userAnswer && handleAnswer(userAnswer)} disabled={!userAnswer}
                                className="w-full bg-gradient-to-r from-red-500 to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-4 md:px-8 md:py-6 rounded-2xl font-black text-xl md:text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                                <Target className="w-6 h-6 md:w-8 md:h-8" /> 送出修正！
                            </button>
                        </>)}

                        {/* 重組句 */}
                        {currentItem.type === 'reorder' && (<>
                            <div className="text-center mb-4 md:mb-6">
                                <div className="text-base md:text-lg font-bold text-purple-600 mb-2 md:mb-4">🔀 請將單字排列成正確的句子：</div>
                            </div>
                            {/* 已選的單字 */}
                            <div className="min-h-[60px] md:min-h-[80px] bg-purple-50 rounded-2xl p-3 md:p-4 mb-4 md:mb-6 border-4 border-purple-200 flex flex-wrap gap-2 md:gap-3 items-center">
                                {reorderWords.length === 0 && <span className="text-gray-400 font-bold text-lg md:text-xl">👆 點擊下方單字排列...</span>}
                                {reorderWords.map((word, index) => (
                                    <button key={index} onClick={() => setReorderWords(reorderWords.filter((_, i) => i !== index))}
                                        className="bg-purple-500 text-white px-4 py-2 md:px-5 md:py-3 rounded-xl font-black text-lg md:text-xl shadow-md hover:bg-purple-600 transform hover:scale-105 transition-all">
                                        {word}
                                    </button>
                                ))}
                            </div>
                            {/* 可選的單字 */}
                            <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-4 md:mb-6">
                                {(currentItem.words || []).filter(w => {
                                    const remaining = [...(currentItem.words || [])];
                                    reorderWords.forEach(selected => {
                                        const idx = remaining.indexOf(selected);
                                        if (idx !== -1) remaining.splice(idx, 1);
                                    });
                                    return remaining.includes(w);
                                }).map((word, index) => (
                                    <button key={index} onClick={() => setReorderWords([...reorderWords, word])}
                                        className="bg-white border-4 border-purple-300 text-purple-700 px-4 py-2 md:px-5 md:py-3 rounded-xl font-black text-lg md:text-xl shadow hover:bg-purple-100 transform hover:scale-105 transition-all">
                                        {word}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => reorderWords.length > 0 && handleAnswer(reorderWords.join(' '))}
                                disabled={reorderWords.length === 0}
                                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-4 md:px-8 md:py-6 rounded-2xl font-black text-xl md:text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                                <Target className="w-6 h-6 md:w-8 md:h-8" /> 送出句子！
                            </button>
                        </>)}

                        <div className="text-center mt-6 md:mt-8 text-gray-600 font-bold text-base md:text-xl">題目 {currentQuestion + 1} / {grammarData.length}</div>
                    </div>
                )}

                {/* 錯題複習 */}
                {gameMode === 'review' && currentItem && !showFeedback && (
                    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-12">
                        <div className="bg-orange-100 border-4 border-orange-400 rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
                            <div className="text-orange-800 text-xl md:text-2xl font-black text-center flex items-center justify-center gap-2 md:gap-3"><RotateCcw className="w-6 h-6 md:w-8 md:h-8" /> 錯題複習模式</div>
                        </div>
                        {currentItem.mode === 'vocabulary' ? (<>
                            <div className="text-center mb-6 md:mb-8">
                                <div className="text-7xl md:text-9xl mb-4 md:mb-6 animate-bounce-slow">{currentItem.emoji || '📝'}</div>
                                <div className="text-4xl md:text-6xl font-black text-gray-800 mb-3 md:mb-4">
                                    {vocabQuestionType === 'all_tenses' ? <><span className="text-orange-600">"{currentItem.chinese}"</span> 的動詞三態</> : currentItem.chinese}
                                </div>
                                {vocabQuestionType === 'all_tenses' && (
                                    <div className="text-lg md:text-xl text-gray-500 font-bold mb-3 md:mb-4">
                                        請依序輸入: 原形 過去式 過去分詞 (可用空白隔開)
                                    </div>
                                )}
                                <button onClick={() => playSound((currentItem.past && currentItem.participle) ? [currentItem.word, currentItem.past, currentItem.participle] : currentItem.word)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-lg md:text-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 md:gap-3 mx-auto">
                                    <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> 聽{(currentItem.past && currentItem.participle) ? '三態' : ''}發音
                                </button>
                            </div>
                            <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                                placeholder={vocabQuestionType === 'all_tenses' ? "例: go went gone" : "輸入英文單字..."} className="w-full px-4 py-4 md:px-8 md:py-6 text-xl md:text-3xl font-bold border-4 border-orange-300 rounded-2xl focus:outline-none focus:border-orange-500 text-center mb-4 md:mb-6" autoFocus />
                            <button onClick={() => userAnswer && handleAnswer(userAnswer)} disabled={!userAnswer}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-4 md:px-8 md:py-6 rounded-2xl font-black text-xl md:text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3">
                                <Target className="w-6 h-6 md:w-8 md:h-8" /> 發射答案！
                            </button>
                        </>) : (<>
                            {/* 文法錯題複習 — 多題型 */}
                            <div className="text-center mb-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${(currentItem.type === 'choice' || currentItem.type === 'multiple') ? 'bg-blue-100 text-blue-700' :
                                    currentItem.type === 'fill' ? 'bg-green-100 text-green-700' :
                                        currentItem.type === 'correction' ? 'bg-red-100 text-red-700' :
                                            currentItem.type === 'reorder' ? 'bg-purple-100 text-purple-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {(currentItem.type === 'choice' || currentItem.type === 'multiple') ? '📋 選擇題' :
                                        currentItem.type === 'fill' ? '✏️ 填空題' :
                                            currentItem.type === 'correction' ? '🔍 改錯題' :
                                                currentItem.type === 'reorder' ? '🔀 重組句' : '📋 選擇題'}
                                </span>
                            </div>

                            {/* 選擇題 */}
                            {(currentItem.type === 'choice' || currentItem.type === 'multiple' || !currentItem.type) && (<>
                                <div className="text-center mb-8"><div className="text-5xl font-black text-gray-800 mb-8 leading-tight">{currentItem.question}</div></div>
                                <div className="grid grid-cols-2 gap-6">
                                    {(currentItem.options || []).map((option, index) => (
                                        <button key={index} onClick={() => handleAnswer(index)}
                                            className="group bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white px-8 py-8 rounded-2xl font-black text-3xl shadow-lg transform hover:scale-105 hover:-rotate-1 transition-all">{option}</button>
                                    ))}
                                </div>
                            </>)}

                            {/* 填空題 */}
                            {currentItem.type === 'fill' && (<>
                                <div className="text-center mb-8">
                                    <div className="text-4xl font-black text-gray-800 mb-4 leading-tight">{currentItem.question}</div>
                                    {currentItem.hint && <div className="text-lg text-orange-600 font-bold bg-orange-50 inline-block px-4 py-2 rounded-xl">💡 提示：{currentItem.hint}</div>}
                                </div>
                                <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                                    placeholder="輸入答案..." className="w-full px-8 py-6 text-3xl font-bold border-4 border-orange-300 rounded-2xl focus:outline-none focus:border-orange-500 text-center mb-6" autoFocus />
                                <button onClick={() => userAnswer && handleAnswer(userAnswer)} disabled={!userAnswer}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-6 rounded-2xl font-black text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                                    <Target className="w-8 h-8" /> 送出答案！
                                </button>
                            </>)}

                            {/* 改錯題 */}
                            {currentItem.type === 'correction' && (<>
                                <div className="text-center mb-8">
                                    <div className="text-lg font-bold text-red-600 mb-3">🔍 請修正句子中的錯誤：</div>
                                    <div className="text-4xl font-black text-gray-800 bg-red-50 p-6 rounded-2xl border-4 border-red-200">{currentItem.question}</div>
                                    {currentItem.errorPart && <div className="mt-3 text-base text-red-500 font-bold">⚠️ 錯誤部分：<span className="underline decoration-wavy decoration-red-500">{currentItem.errorPart}</span></div>}
                                </div>
                                <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                                    placeholder="輸入修正後句子..." className="w-full px-8 py-6 text-2xl font-bold border-4 border-orange-300 rounded-2xl focus:outline-none focus:border-orange-500 text-center mb-6" autoFocus />
                                <button onClick={() => userAnswer && handleAnswer(userAnswer)} disabled={!userAnswer}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-6 rounded-2xl font-black text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                                    <Target className="w-8 h-8" /> 送出修正！
                                </button>
                            </>)}

                            {/* 重組句 */}
                            {currentItem.type === 'reorder' && (<>
                                <div className="text-center mb-4 md:mb-6"><div className="text-base md:text-lg font-bold text-purple-600 mb-2 md:mb-4">🔀 請排列成正確句子：</div></div>
                                <div className="min-h-[60px] md:min-h-[80px] bg-orange-50 rounded-2xl p-3 md:p-4 mb-4 md:mb-6 border-4 border-orange-200 flex flex-wrap gap-2 md:gap-3 items-center">
                                    {reorderWords.length === 0 && <span className="text-gray-400 font-bold text-lg md:text-xl">👆 點擊排列...</span>}
                                    {reorderWords.map((word, index) => (
                                        <button key={index} onClick={() => setReorderWords(reorderWords.filter((_, i) => i !== index))}
                                            className="bg-orange-500 text-white px-4 py-2 md:px-5 md:py-3 rounded-xl font-black text-lg md:text-xl shadow-md hover:bg-orange-600 transition-all">{word}</button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-4 md:mb-6">
                                    {(currentItem.words || []).filter(w => {
                                        const remaining = [...(currentItem.words || [])];
                                        reorderWords.forEach(s => { const idx = remaining.indexOf(s); if (idx !== -1) remaining.splice(idx, 1); });
                                        return remaining.includes(w);
                                    }).map((word, index) => (
                                        <button key={index} onClick={() => setReorderWords([...reorderWords, word])}
                                            className="bg-white border-4 border-orange-300 text-orange-700 px-4 py-2 md:px-5 md:py-3 rounded-xl font-black text-lg md:text-xl shadow hover:bg-orange-100 transition-all">{word}</button>
                                    ))}
                                </div>
                                <button onClick={() => reorderWords.length > 0 && handleAnswer(reorderWords.join(' '))} disabled={reorderWords.length === 0}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-4 md:px-8 md:py-6 rounded-2xl font-black text-xl md:text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3">
                                    <Target className="w-6 h-6 md:w-8 md:h-8" /> 送出句子！
                                </button>
                            </>)}
                        </>)}
                        <div className="text-center mt-4 md:mt-6 text-gray-600 font-bold text-base md:text-lg">錯題 {currentQuestion + 1} / {wrongAnswers.length}</div>
                    </div>
                )}

                {/* 回饋畫面 */}
                {showFeedback && (
                    <div className={`bg-white rounded-3xl shadow-2xl p-6 md:p-12 transform scale-105 transition-transform ${isCorrect ? 'animate-bounce-slow' : 'animate-shake'}`}>
                        <div className="text-center">
                            {isCorrect ? (<>
                                <div className="text-7xl md:text-9xl mb-4 md:mb-6">🎉</div>
                                <div className="text-4xl md:text-6xl font-black text-green-600 mb-3 md:mb-4 flex items-center justify-center gap-2 md:gap-4"><CheckCircle className="w-12 h-12 md:w-16 md:h-16" /> 答對了！</div>
                                <div className="text-xl md:text-3xl text-gray-700 font-bold mb-4 md:mb-6">+100 分</div>
                                {(gameMode === 'vocabulary' || (currentItem && currentItem.mode === 'vocabulary')) && currentItem.sentence && (
                                    <div className="bg-green-50 rounded-2xl p-4 md:p-6 mb-4 md:mb-6 border-2 border-green-200">
                                        <div className="text-xl md:text-2xl font-black text-green-800 mb-2 md:mb-3">🗣️ 例句學習：</div>
                                        <div className="text-lg md:text-xl text-gray-700 font-bold italic mb-3">"{currentItem.sentence}"</div>
                                        <button onClick={() => playSentence(currentItem.sentence)}
                                            className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-sm md:text-base shadow transform hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                                            <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> 🔊 再聽一次
                                        </button>
                                    </div>
                                )}
                                {streak >= 3 && (
                                    <div className="bg-yellow-100 border-4 border-yellow-400 rounded-2xl p-4 md:p-6">
                                        <div className="text-2xl md:text-4xl font-black text-yellow-600 flex items-center justify-center gap-2 md:gap-3"><Star className="w-8 h-8 md:w-10 md:h-10 fill-yellow-500" /> 連擊獎勵！獲得 1 顆星星！</div>
                                    </div>
                                )}
                            </>) : (<>
                                <div className="text-7xl md:text-9xl mb-4 md:mb-6">😢</div>
                                <div className="text-4xl md:text-6xl font-black text-red-600 mb-3 md:mb-4 flex items-center justify-center gap-2 md:gap-4"><XCircle className="w-12 h-12 md:w-16 md:h-16" /> 再試試看！</div>
                                {(gameMode === 'vocabulary' || currentItem.mode === 'vocabulary') ? (
                                    <div className="bg-blue-50 rounded-2xl p-4 md:p-8 mb-4 md:mb-6">
                                        <div className="text-xl md:text-3xl font-black text-gray-800 mb-2 md:mb-3">正確答案：</div>
                                        <div className="text-3xl md:text-5xl font-black text-blue-600 mb-3 md:mb-4">
                                            {vocabQuestionType === 'all_tenses' ? `${currentItem.word}, ${currentItem.past}, ${currentItem.participle}` :
                                                vocabQuestionType === 'past' ? currentItem.past :
                                                    vocabQuestionType === 'participle' ? currentItem.participle :
                                                        currentItem.word}
                                        </div>

                                        {/* 動詞三態對照表 */}
                                        {currentItem.past && (
                                            <div className="flex flex-col gap-2 md:gap-4 mt-4 md:mt-6 bg-white border-4 border-blue-100 rounded-2xl p-3 md:p-4">
                                                <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                                                    <div className={`flex-1 p-2 md:p-3 rounded-xl border-2 ${vocabQuestionType === 'meaning' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                                                        <div className="text-[10px] md:text-xs font-black text-gray-400 mb-1">V1 (原形 / Present Simple)</div>
                                                        <div className="text-base md:text-xl font-black text-gray-800">{currentItem.word}</div>
                                                    </div>
                                                    <div className={`flex-1 p-2 md:p-3 rounded-xl border-2 ${vocabQuestionType === 'past' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                                                        <div className="text-[10px] md:text-xs font-black text-gray-400 mb-1">V2 (過去式 / Past Simple)</div>
                                                        <div className="text-base md:text-xl font-black text-gray-800">{currentItem.past}</div>
                                                    </div>
                                                    <div className={`flex-1 p-2 md:p-3 rounded-xl border-2 ${vocabQuestionType === 'participle' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                                                        <div className="text-[10px] md:text-xs font-black text-gray-400 mb-1">V3 (過去分詞 / Past Participle)</div>
                                                        <div className="text-base md:text-xl font-black text-gray-800">{currentItem.participle}</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => playSound([currentItem.word, currentItem.past, currentItem.participle])}
                                                    className="bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow transform hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto w-full md:w-1/2 mt-2 md:mt-0">
                                                    <Volume2 className="w-4 h-4" /> 🔊 聽三態發音
                                                </button>
                                            </div>
                                        )}

                                        {currentItem.sentence && (
                                            <div className="mt-4 pt-4 border-t-2 border-blue-200">
                                                <div className="text-lg md:text-xl font-black text-gray-700 mb-2">🗣️ 例句：</div>
                                                <div className="text-base md:text-lg text-gray-600 font-bold italic mb-3">"{currentItem.sentence}"</div>
                                                <button onClick={() => playSentence(currentItem.sentence)}
                                                    className="bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow transform hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                                                    <Volume2 className="w-4 h-4" /> 🔊 再聽一次
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (<>
                                    <div className="bg-blue-50 rounded-2xl p-4 md:p-8 mb-4 md:mb-6">
                                        <div className="text-xl md:text-3xl font-black text-gray-800 mb-2 md:mb-3">正確答案：</div>
                                        <div className="text-2xl md:text-4xl font-black text-blue-600">
                                            {(currentItem.type === 'choice' || currentItem.type === 'multiple' || !currentItem.type)
                                                ? (currentItem.options || [])[currentItem.correct]
                                                : currentItem.answer || ''}
                                        </div>
                                    </div>
                                    {currentItem.explanation && (
                                        <div className="bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-4 md:p-6">
                                            <div className="text-xl md:text-2xl font-black text-yellow-800 mb-2 md:mb-3">💡 詳細解析：</div>
                                            <div className="text-base md:text-xl text-gray-700 font-bold leading-relaxed whitespace-pre-line text-left">{currentItem.explanation}</div>
                                        </div>
                                    )}
                                </>)}
                                <div className="mt-4 md:mt-6 text-lg md:text-xl text-orange-600 font-black">已加入錯題本 📖</div>
                            </>)}
                        </div>
                    </div>
                )}

                {gameMode !== 'menu' && !showFeedback && (
                    <div className="text-center mt-8">
                        <button onClick={() => { setGameMode('menu'); resetGame(); }}
                            className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg transform hover:scale-105 transition-all">返回主選單</button>
                    </div>
                )}
            </div>

        </div >
    );
};

export default EnglishLearningGame;
