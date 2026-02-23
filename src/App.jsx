import React, { useState, useEffect } from 'react';
import { Volume2, Star, Trophy, BookOpen, Target, Zap, ArrowRight, RotateCcw, CheckCircle, XCircle, Plus, Edit, Trash2, Settings, Save, X, Camera, Upload, Loader, Sparkles, AlertCircle, ClipboardPaste, FileText, Key, Eye, EyeOff, Tag, Filter, CheckSquare, Square } from 'lucide-react';
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
    const [importTab, setImportTab] = useState('paste'); // 'paste', 'ai', 'settings'
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

    const [vocabForm, setVocabForm] = useState({
        word: '', chinese: '', pronunciation: '', emoji: '', sentence: '', label: ''
    });
    const [grammarForm, setGrammarForm] = useState({
        question: '', options: ['', '', '', ''], correct: 0, explanation: ''
    });

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

    // 使用 Google Gemini API 識別圖片內容（自動生成音標/emoji/例句）
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
            setProcessingStatus('AI 正在分析圖片內容...');

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
                                    text: `請擔任一位專業的英語教學助教，仔細分析這張圖片中的英文學習內容。

這張圖片可能是：
1. 「文法練習卷」（包含題號、題目填空、(A)(B)(C)(D)選項）
2. 「單字表」（英文單字配中文翻譯）

請根據圖片視覺特徵判斷類型：
- 如果看到 "1.", "2." 等題號，且有 "(A)", "(B)" 等選項，這絕對是「文法題目」。
- 請忽略圖片上的手寫筆跡（如打勾、圈選、手寫文字），只辨識原始印刷題目。
- 如果題目是文法題，請提供詳細的解析教學。

回傳規則：
如果是單字表，回傳 JSON：
{"type":"vocabulary","items":[{"word":"英文單字(小寫)","chinese":"中文","pronunciation":"KK音標","emoji":"表情符號","sentence":"例句"}]}

如果是文法題目，回傳 JSON：
{"type":"grammar","items":[{"question":"題目(挖空處用 ___ 表示)","options":["選項A","選項B","選項C","選項D"],"correct":正確選項索引(0-3),"explanation":"請用繁體中文詳細解析：1. 該題考什麼文法重點 2. 為什麼該選項正確 3. 解釋其他選項為何錯誤"}]}

注意：
- 只回傳純 JSON，不要用 markdown code block
- Grammar 的 explanation 欄位非常重要，請寫得像家教老師一樣詳細
- 忽略手寫的答案，由你自行分析正確答案` }
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

            // 清理 JSON（移除可能的 markdown 標記）
            let cleanText = textContent.trim()
                .replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '').trim();

            const result = JSON.parse(cleanText);
            if (!result.type || !result.items || result.items.length === 0) {
                throw new Error('AI 未能識別任何內容');
            }

            setOcrResult(result);
            setProcessingStatus(`識別完成！找到 ${result.items.length} 個${result.type === 'vocabulary' ? '單字' : '文法題'}`);

        } catch (error) {
            console.error('Gemini API 錯誤:', error);
            let errorMsg = '處理失敗，請重試';
            if (error.message.includes('API 請求失敗')) errorMsg = error.message;
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
                    sentence: item.sentence || '', label: importLabel || ''
                }));
                const count = await batchAddVocabulary(newItems);
                alert(`✅ 成功新增 ${count} 個單字！`);
            } else if (ocrResult.type === 'grammar') {
                const newItems = ocrResult.items.map(item => ({
                    question: item.question || '', options: item.options || ['', '', '', ''],
                    correct: item.correct || 0, explanation: item.explanation || '',
                    type: 'multiple'
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
            setVocabForm({ word: '', chinese: '', pronunciation: '', emoji: '', sentence: '', label: '' });
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
            setVocabForm({ word: '', chinese: '', pronunciation: '', emoji: '', sentence: '', label: '' });
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
        if (!grammarForm.question || grammarForm.options.some(opt => !opt)) { alert('請填寫所有欄位！'); return; }
        try {
            await addGrammarItem({ ...grammarForm, type: 'multiple' });
            setGrammarForm({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' });
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
            setGrammarForm({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' });
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
            setVocabForm({ word: item.word, chinese: item.chinese, pronunciation: item.pronunciation || '', emoji: item.emoji || '', sentence: item.sentence || '', label: item.label || '' });
        } else {
            setGrammarForm({ question: item.question, options: item.options, correct: item.correct, explanation: item.explanation || '' });
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

    // 使用打亂後的資料進行測驗
    const currentData = shuffledData.length > 0 ? shuffledData : (gameMode === 'vocabulary' ? vocabularyData : grammarData);
    const currentItem = gameMode === 'review' ? wrongAnswers[currentQuestion] : currentData[currentQuestion];

    const playSound = (text, lang = 'en-US') => {
        speechSynthesis.cancel(); // 停止當前播放
        const utterance = new SpeechSynthesisUtterance(text);
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
        if (gameMode === 'vocabulary' || (gameMode === 'review' && currentItem.mode === 'vocabulary')) {
            correct = answer.toLowerCase() === currentItem.word.toLowerCase();
        } else {
            correct = answer === currentItem.correct;
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
        const isVocabMode = gameMode === 'vocabulary' || (gameMode === 'review' && currentItem?.mode === 'vocabulary');
        if (isVocabMode && currentItem?.id) {
            updateVocabularyMastery(currentItem.id, correct).catch(err => {
                console.error('更新熟度失敗:', err);
            });
        }

        // 跳下一題的共用函式
        const goNext = () => {
            setShowFeedback(false);
            setUserAnswer('');
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
            // 無例句時維持原本 2500ms
            setTimeout(goNext, 2500);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
            {/* 星空背景 */}
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <div key={i} className="absolute bg-white rounded-full animate-twinkle"
                        style={{ width: Math.random() * 3 + 1 + 'px', height: Math.random() * 3 + 1 + 'px', top: Math.random() * 100 + '%', left: Math.random() * 100 + '%', animationDelay: Math.random() * 3 + 's', animationDuration: Math.random() * 2 + 2 + 's' }} />
                ))}
            </div>

            {/* 頂部資訊欄 */}
            <div className="relative z-10 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto gap-3 sm:gap-0">
                    <div className="flex gap-3 sm:gap-6 w-full sm:w-auto justify-center">
                        <div className="bg-yellow-400 text-gray-900 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform flex items-center gap-2">
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" /> {score}
                        </div>
                        <div className="bg-pink-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform flex items-center gap-2">
                            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-white" /> {stars}
                        </div>
                    </div>
                    <div className="flex gap-3 sm:gap-4 w-full sm:w-auto justify-center">
                        <div className="bg-orange-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl shadow-lg flex items-center gap-2">
                            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                            <span className="hidden sm:inline">連擊 </span>{streak}
                        </div>
                        {gameMode === 'menu' && (
                            <button onClick={() => setShowManagePanel(!showManagePanel)}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span className="hidden sm:inline">題庫管理</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 標籤選擇器彈窗 - 測驗前用 checkbox 勾選分類 */}
            {showLabelPicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
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
                            <button onClick={() => setImportTab('paste')}
                                className={`flex-1 py-3 rounded-xl font-black text-base transition-all flex items-center justify-center gap-1 ${importTab === 'paste' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                <ClipboardPaste className="w-4 h-4" /> 貼上文字
                            </button>
                            <button onClick={() => setImportTab('ai')}
                                className={`flex-1 py-3 rounded-xl font-black text-base transition-all flex items-center justify-center gap-1 ${importTab === 'ai' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                <Camera className="w-4 h-4" /> AI 圖片識別
                                {apiKey && <span className="ml-1 w-2 h-2 bg-green-400 rounded-full inline-block"></span>}
                            </button>
                            <button onClick={() => setImportTab('settings')}
                                className={`py-3 px-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-1 ${importTab === 'settings' ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                <Key className="w-4 h-4" /> API 設定
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
                                                <h3 className="text-xl font-black text-gray-800 mb-2">上傳單字表或課本圖片</h3>
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
                                                    availableModels.map(model => (
                                                        <option key={model} value={model}>{model}</option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (推薦)</option>
                                                        <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                                                        <option value="gemini-1.5-flash-001">Gemini 1.5 Flash (v001)</option>
                                                        <option value="gemini-1.5-flash-002">Gemini 1.5 Flash (v002)</option>
                                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                        <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
                                                        <option value="gemini-1.5-pro-001">Gemini 1.5 Pro (v001)</option>
                                                        <option value="gemini-1.5-pro-002">Gemini 1.5 Pro (v002)</option>
                                                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Preview)</option>
                                                        {!['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-1.5-flash-002', 'gemini-1.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-pro-001', 'gemini-1.5-pro-002', 'gemini-2.0-flash-exp'].includes(apiModel) && (
                                                            <option value={apiModel}>{apiModel} (目前設定)</option>
                                                        )}
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

                                                        // 排序權重：重點是「有額度」
                                                        // 1. 1.5 Flash (最穩定/免費) => 分數 1000
                                                        // 2. Flash Latest (通常指向最新穩定版) => 分數 900
                                                        // 3. 其他 Flash => 分數 500
                                                        // 4. 2.0 Flash (使用者回報無額度) => 分數 400 (降級)
                                                        // 5. Pro 系列 (額度較少) => 分數 100
                                                        // 6. Gemini 3 (通常無額度) => 分數 -100
                                                        names.sort((a, b) => {
                                                            const getScore = (name) => {
                                                                if (name.includes('gemini-1.5-flash')) return 1000;
                                                                if (name.includes('flash-latest')) return 900;      // 優先嘗試 Latest
                                                                if (name.includes('gemini-2.0-flash')) return 400;  // 降級 2.0
                                                                if (name.includes('flash')) return 500;             // 其他 Flash
                                                                if (name.includes('pro')) return 100;
                                                                if (name.includes('gemini-3')) return -100;
                                                                return 0;
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
                                <div className="bg-green-100 border-4 border-green-400 rounded-2xl p-5">
                                    <div className="text-2xl font-black text-green-800 flex items-center gap-2">
                                        <CheckCircle className="w-8 h-8" /> 解析成功！找到 {ocrResult.items?.length || 0} 個單字
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4 max-h-72 overflow-y-auto">
                                    <div className="space-y-2">

                                        {ocrResult.items.map((item, index) => (
                                            <div key={index} className="bg-white rounded-2xl p-4 border-2 border-gray-200 flex items-start gap-4 hover:shadow-md transition-all">
                                                <div className="text-4xl">{item.emoji || '📝'}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline flex-wrap gap-2 mb-1">
                                                        <span className="text-xl font-black text-gray-900">{item.word}</span>
                                                        {item.pronunciation && (
                                                            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                                                                {item.pronunciation}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-lg text-gray-700 font-bold mb-2">{item.chinese}</div>
                                                    {item.sentence && (
                                                        <div className="text-sm text-gray-500 italic mt-2 border-t-2 border-gray-100 pt-2 flex items-start gap-2">
                                                            <span className="not-italic">🗣️</span> {item.sentence}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
                                    <button onClick={() => { setShowOCRPanel(false); setShowManagePanel(true); }}
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
                                                    const updated = vocabularyData.map(item =>
                                                        batchSelectedIds.includes(item.id) ? { ...item, label: batchLabel } : item
                                                    );
                                                    await saveVocabulary(updated);
                                                    setBatchSelectedIds([]);
                                                    setBatchLabel('');
                                                    alert(`✅ 已將 ${batchSelectedIds.length} 個單字的標籤改為「${batchLabel || '(無標籤)'}」`);
                                                }} disabled={batchSelectedIds.length === 0}
                                                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap flex items-center gap-1">
                                                    <Tag className="w-4 h-4" /> 套用
                                                </button>
                                                <button onClick={async () => {
                                                    if (!confirm(`確定要刪除這 ${batchSelectedIds.length} 個單字嗎？`)) return;
                                                    const updated = vocabularyData.filter(item => !batchSelectedIds.includes(item.id));
                                                    await saveVocabulary(updated);
                                                    setBatchSelectedIds([]);
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
                                        <div><label className="block text-gray-700 font-bold mb-2">題目 *</label>
                                            <input type="text" value={grammarForm.question} onChange={(e) => setGrammarForm({ ...grammarForm, question: e.target.value })} placeholder="例如: She ___ to school every day."
                                                className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[0, 1, 2, 3].map(index => (
                                                <div key={index}><label className="block text-gray-700 font-bold mb-2">選項 {index + 1} *</label>
                                                    <input type="text" value={grammarForm.options[index]} onChange={(e) => { const o = [...grammarForm.options]; o[index] = e.target.value; setGrammarForm({ ...grammarForm, options: o }); }}
                                                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold" /></div>
                                            ))}
                                        </div>
                                        <div><label className="block text-gray-700 font-bold mb-2">正確答案 *</label>
                                            <select value={grammarForm.correct} onChange={(e) => setGrammarForm({ ...grammarForm, correct: parseInt(e.target.value) })}
                                                className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg font-bold">
                                                <option value={0}>選項 1</option><option value={1}>選項 2</option><option value={2}>選項 3</option><option value={3}>選項 4</option>
                                            </select></div>
                                        <div><label className="block text-gray-700 font-bold mb-2">解釋 *</label>
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
            )}

            {/* 遊戲主介面 */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 pb-12">
                {gameMode === 'menu' && !showManagePanel && (
                    <div className="text-center">
                        <h1 className="text-7xl font-black text-white mb-4 tracking-tight drop-shadow-lg animate-bounce-slow">🚀 英語太空站</h1>
                        <p className="text-2xl text-pink-300 mb-12 font-bold">選擇你的任務！</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 單字卡 */}
                            <div className="relative">
                                <button onClick={() => { if (allLabels.length > 0) { setSelectedLabels([]); setShowLabelPicker(true); } else startGame('vocabulary'); }}
                                    className="group w-full bg-gradient-to-br from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 p-8 rounded-3xl shadow-2xl transform hover:scale-105 hover:-rotate-1 transition-all duration-300">
                                    <div className="text-7xl mb-4 group-hover:animate-bounce">📚</div>
                                    <div className="text-white text-3xl font-black mb-2">單字卡</div>
                                    <div className="text-blue-100 text-lg font-bold">學習新單字</div>
                                    <div className="text-blue-200 text-sm font-bold mt-2">({vocabularyData.length} 個)</div>
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
                                    className="group w-full bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-300 hover:to-emerald-500 p-8 rounded-3xl shadow-2xl transform hover:scale-105 hover:rotate-1 transition-all duration-300">
                                    <div className="text-7xl mb-4 group-hover:animate-bounce">🎯</div>
                                    <div className="text-white text-3xl font-black mb-2">文法射擊</div>
                                    <div className="text-green-100 text-lg font-bold">挑戰文法題</div>
                                    <div className="text-green-200 text-sm font-bold mt-2">({grammarData.length} 題)</div>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setManagementMode('grammar'); setShowManagePanel(true); }}
                                    className="absolute top-3 right-3 text-white text-xl opacity-60 hover:opacity-100 transition-all hover:scale-125 drop-shadow-lg" title="管理文法庫">
                                    ⚙️
                                </button>
                            </div>
                        </div>

                        {/* 第二排：匯入 + 錯題 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* 智慧匯入 */}
                            <button onClick={() => { setShowOCRPanel(true); setPasteText(''); setOcrResult(null); setErrorMessage(''); setImportTab('paste'); }}
                                className="group bg-gradient-to-br from-purple-400 to-pink-600 hover:from-purple-300 hover:to-pink-500 p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                                <div className="text-7xl mb-4 group-hover:animate-bounce">✨</div>
                                <div className="text-white text-3xl font-black mb-2">智慧匯入</div>
                                <div className="text-purple-100 text-lg font-bold">貼上文字或 AI 圖片辨識</div>
                            </button>

                            {/* 錯題複習 */}
                            <button onClick={() => { setGameMode('review'); setCurrentQuestion(0); }} disabled={wrongAnswers.length === 0}
                                className={`group p-8 rounded-3xl shadow-2xl transform transition-all duration-300 ${wrongAnswers.length === 0 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gradient-to-br from-orange-400 to-red-600 hover:from-orange-300 hover:to-red-500 hover:scale-105'}`}>
                                <div className="text-7xl mb-4 group-hover:animate-bounce">📖</div>
                                <div className="text-white text-3xl font-black mb-2">錯題複習</div>
                                <div className="text-orange-100 text-lg font-bold">{wrongAnswers.length} 題待複習</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* 單字練習 */}
                {gameMode === 'vocabulary' && currentItem && !showFeedback && (
                    <div className="bg-white rounded-3xl shadow-2xl p-12 transform hover:scale-[1.02] transition-transform">
                        <div className="text-center mb-8">
                            <div className="text-9xl mb-6 animate-bounce-slow">{currentItem.emoji || '📝'}</div>
                            <div className="text-6xl font-black text-gray-800 mb-4">{currentItem.chinese}</div>
                            {currentItem.pronunciation && <div className="text-2xl text-gray-500 mb-4">{currentItem.pronunciation}</div>}
                            <button onClick={() => playSound(currentItem.word)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                <Volume2 className="w-6 h-6" /> 聽發音
                            </button>
                        </div>
                        <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                            placeholder="輸入英文單字..." className="w-full px-8 py-6 text-3xl font-bold border-4 border-purple-300 rounded-2xl focus:outline-none focus:border-purple-500 text-center mb-6" autoFocus />
                        <button onClick={() => userAnswer && handleAnswer(userAnswer)} disabled={!userAnswer}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-6 rounded-2xl font-black text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                            <Target className="w-8 h-8" /> 發射答案！
                        </button>
                        <div className="text-center mt-6 text-gray-600 font-bold text-lg">題目 {currentQuestion + 1} / {currentData.length}</div>
                    </div>
                )}

                {/* 文法練習 */}
                {gameMode === 'grammar' && currentItem && !showFeedback && (
                    <div className="bg-white rounded-3xl shadow-2xl p-12">
                        <div className="text-center mb-8">
                            <div className="text-5xl font-black text-gray-800 mb-8 leading-tight">{currentItem.question}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            {currentItem.options.map((option, index) => (
                                <button key={index} onClick={() => handleAnswer(index)}
                                    className="group bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white px-8 py-8 rounded-2xl font-black text-3xl shadow-lg transform hover:scale-105 hover:-rotate-1 transition-all relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                    <div className="relative z-10">{option}</div>
                                </button>
                            ))}
                        </div>
                        <div className="text-center mt-8 text-gray-600 font-bold text-xl">題目 {currentQuestion + 1} / {grammarData.length}</div>
                    </div>
                )}

                {/* 錯題複習 */}
                {gameMode === 'review' && currentItem && !showFeedback && (
                    <div className="bg-white rounded-3xl shadow-2xl p-12">
                        <div className="bg-orange-100 border-4 border-orange-400 rounded-2xl p-6 mb-8">
                            <div className="text-orange-800 text-2xl font-black text-center flex items-center justify-center gap-3"><RotateCcw className="w-8 h-8" /> 錯題複習模式</div>
                        </div>
                        {currentItem.mode === 'vocabulary' ? (<>
                            <div className="text-center mb-8">
                                <div className="text-9xl mb-6 animate-bounce-slow">{currentItem.emoji || '📝'}</div>
                                <div className="text-6xl font-black text-gray-800 mb-4">{currentItem.chinese}</div>
                                <button onClick={() => playSound(currentItem.word)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                    <Volume2 className="w-6 h-6" /> 聽發音
                                </button>
                            </div>
                            <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                                placeholder="輸入英文單字..." className="w-full px-8 py-6 text-3xl font-bold border-4 border-orange-300 rounded-2xl focus:outline-none focus:border-orange-500 text-center mb-6" autoFocus />
                            <button onClick={() => userAnswer && handleAnswer(userAnswer)} disabled={!userAnswer}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-6 rounded-2xl font-black text-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                                <Target className="w-8 h-8" /> 發射答案！
                            </button>
                        </>) : (<>
                            <div className="text-center mb-8"><div className="text-5xl font-black text-gray-800 mb-8 leading-tight">{currentItem.question}</div></div>
                            <div className="grid grid-cols-2 gap-6">
                                {currentItem.options.map((option, index) => (
                                    <button key={index} onClick={() => handleAnswer(index)}
                                        className="group bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white px-8 py-8 rounded-2xl font-black text-3xl shadow-lg transform hover:scale-105 hover:-rotate-1 transition-all">{option}</button>
                                ))}
                            </div>
                        </>)}
                        <div className="text-center mt-6 text-gray-600 font-bold text-lg">錯題 {currentQuestion + 1} / {wrongAnswers.length}</div>
                    </div>
                )}

                {/* 回饋畫面 */}
                {showFeedback && (
                    <div className={`bg-white rounded-3xl shadow-2xl p-12 transform scale-105 transition-transform ${isCorrect ? 'animate-bounce-slow' : 'animate-shake'}`}>
                        <div className="text-center">
                            {isCorrect ? (<>
                                <div className="text-9xl mb-6">🎉</div>
                                <div className="text-6xl font-black text-green-600 mb-4 flex items-center justify-center gap-4"><CheckCircle className="w-16 h-16" /> 答對了！</div>
                                <div className="text-3xl text-gray-700 font-bold mb-6">+100 分</div>
                                {(gameMode === 'vocabulary' || (currentItem && currentItem.mode === 'vocabulary')) && currentItem.sentence && (
                                    <div className="bg-green-50 rounded-2xl p-6 mb-6 border-2 border-green-200">
                                        <div className="text-2xl font-black text-green-800 mb-3">🗣️ 例句學習：</div>
                                        <div className="text-xl text-gray-700 font-bold italic mb-3">"{currentItem.sentence}"</div>
                                        <button onClick={() => playSentence(currentItem.sentence)}
                                            className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-base shadow transform hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                                            <Volume2 className="w-5 h-5" /> 🔊 再聽一次
                                        </button>
                                    </div>
                                )}
                                {streak >= 3 && (
                                    <div className="bg-yellow-100 border-4 border-yellow-400 rounded-2xl p-6">
                                        <div className="text-4xl font-black text-yellow-600 flex items-center justify-center gap-3"><Star className="w-10 h-10 fill-yellow-500" /> 連擊獎勵！獲得 1 顆星星！</div>
                                    </div>
                                )}
                            </>) : (<>
                                <div className="text-9xl mb-6">😢</div>
                                <div className="text-6xl font-black text-red-600 mb-4 flex items-center justify-center gap-4"><XCircle className="w-16 h-16" /> 再試試看！</div>
                                {(gameMode === 'vocabulary' || currentItem.mode === 'vocabulary') ? (
                                    <div className="bg-blue-50 rounded-2xl p-8 mb-6">
                                        <div className="text-3xl font-black text-gray-800 mb-3">正確答案：</div>
                                        <div className="text-5xl font-black text-blue-600 mb-4">{currentItem.word}</div>
                                        {currentItem.sentence && (
                                            <div className="mt-4 pt-4 border-t-2 border-blue-200">
                                                <div className="text-xl font-black text-gray-700 mb-2">🗣️ 例句：</div>
                                                <div className="text-lg text-gray-600 font-bold italic mb-3">"{currentItem.sentence}"</div>
                                                <button onClick={() => playSentence(currentItem.sentence)}
                                                    className="bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow transform hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                                                    <Volume2 className="w-4 h-4" /> 🔊 再聽一次
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (<>
                                    <div className="bg-blue-50 rounded-2xl p-8 mb-6">
                                        <div className="text-3xl font-black text-gray-800 mb-3">正確答案：</div>
                                        <div className="text-5xl font-black text-blue-600">{currentItem.options[currentItem.correct]}</div>
                                    </div>
                                    {currentItem.explanation && (
                                        <div className="bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-6">
                                            <div className="text-2xl font-black text-yellow-800 mb-3">💡 解釋：</div>
                                            <div className="text-xl text-gray-700 font-bold leading-relaxed">{currentItem.explanation}</div>
                                        </div>
                                    )}
                                </>)}
                                <div className="mt-6 text-xl text-orange-600 font-black">已加入錯題本 📖</div>
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

            <style jsx>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .animate-twinkle { animation: twinkle 3s infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }
        .animate-shake { animation: shake 0.5s; }
      `}</style>
        </div>
    );
};

export default EnglishLearningGame;
