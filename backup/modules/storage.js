// 儲存模組 - 支援離線模式（localStorage）+ 線上模式（Google Apps Script）
const storageModule = {
    apiUrl: '',
    // 是否為離線模式（API 無法連線時自動切換）
    offlineMode: false,

    init: () => {
        const savedUrl = localStorage.getItem('englishApp_apiUrl');
        const defaultUrl = 'https://script.google.com/macros/s/AKfycbypQY4P1_BaAHSLom7p99-hqRVakPLfmksXomRZdTzGZKGxe3h8DTeASzWb0e0zJ9U/exec';

        if (savedUrl) {
            storageModule.apiUrl = savedUrl;
        } else {
            storageModule.apiUrl = defaultUrl;
            localStorage.setItem('englishApp_apiUrl', defaultUrl);
        }
        console.log('儲存模組已初始化');
    },

    setApiUrl: (url) => {
        storageModule.apiUrl = url;
        storageModule.offlineMode = false; // 重置離線狀態
        localStorage.setItem('englishApp_apiUrl', url);
        alert('設定已儲存！請重新整理頁面以載入資料。');
        location.reload();
    },

    // API 請求包裝 - 失敗時靜默回退，不彈出錯誤
    _fetch: async (params, method = 'GET', body = null) => {
        // 已知離線模式，直接跳過
        if (storageModule.offlineMode || !storageModule.apiUrl) {
            return null;
        }

        try {
            let url = `${storageModule.apiUrl}?${new URLSearchParams(params)}`;
            let options = { method: method };

            if (method === 'POST') {
                options.body = JSON.stringify(body);
                url = storageModule.apiUrl;
            }

            // 加入超時控制（5 秒）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            options.signal = controller.signal;

            const res = await fetch(url, options);
            clearTimeout(timeoutId);

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        } catch (err) {
            // 靜默處理 - 自動切換離線模式，不彈出錯誤
            console.warn('API 連線失敗，使用離線模式:', err.message);
            storageModule.offlineMode = true;
            return null;
        }
    },

    // ========== 讀取資料 ==========

    getVocabulary: async () => {
        // 先嘗試從 localStorage 讀取
        const local = storageModule._getLocal('vocabulary');
        if (local && local.length > 0) return local;

        // 再嘗試 API
        const data = await storageModule._fetch({ action: 'getVocabulary' });
        if (data && data.length > 0) {
            storageModule._saveLocal('vocabulary', data);
            return data;
        }

        // 最終回退到 mockData
        return [...mockData.vocabulary];
    },

    getGrammar: async () => {
        const local = storageModule._getLocal('grammar');
        if (local && local.length > 0) return local;

        const data = await storageModule._fetch({ action: 'getGrammar' });
        if (data && data.length > 0) {
            storageModule._saveLocal('grammar', data);
            return data;
        }

        return [...mockData.grammar];
    },

    // ========== 新增 ==========

    addVocabulary: async (item) => {
        // 本地儲存
        const list = storageModule._getLocal('vocabulary') || [];
        list.push(item);
        storageModule._saveLocal('vocabulary', list);
        // 嘗試同步到 API（靜默）
        await storageModule._fetch({}, 'POST', { action: 'addVocabulary', item });
    },

    addGrammar: async (item) => {
        const list = storageModule._getLocal('grammar') || [];
        list.push(item);
        storageModule._saveLocal('grammar', list);
        await storageModule._fetch({}, 'POST', { action: 'addGrammar', item });
    },

    // ========== 刪除 ==========

    deleteVocabulary: async (id) => {
        let list = storageModule._getLocal('vocabulary') || [];
        list = list.filter(i => i.id !== id);
        storageModule._saveLocal('vocabulary', list);
        await storageModule._fetch({}, 'POST', { action: 'deleteVocabulary', id });
    },

    deleteGrammar: async (id) => {
        let list = storageModule._getLocal('grammar') || [];
        list = list.filter(i => i.id !== id);
        storageModule._saveLocal('grammar', list);
        await storageModule._fetch({}, 'POST', { action: 'deleteGrammar', id });
    },

    // ========== 更新 ==========

    updateVocabulary: async (item) => {
        const list = storageModule._getLocal('vocabulary') || [];
        const idx = list.findIndex(i => i.id === item.id);
        if (idx !== -1) list[idx] = item;
        storageModule._saveLocal('vocabulary', list);
        await storageModule._fetch({}, 'POST', { action: 'updateVocabulary', item });
    },

    updateGrammar: async (item) => {
        const list = storageModule._getLocal('grammar') || [];
        const idx = list.findIndex(i => i.id === item.id);
        if (idx !== -1) list[idx] = item;
        storageModule._saveLocal('grammar', list);
        await storageModule._fetch({}, 'POST', { action: 'updateGrammar', item });
    },

    // ========== localStorage 輔助方法 ==========

    _getLocal: (key) => {
        try {
            const data = localStorage.getItem(`englishApp_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('localStorage 讀取失敗:', e);
            return null;
        }
    },

    _saveLocal: (key, data) => {
        try {
            localStorage.setItem(`englishApp_${key}`, JSON.stringify(data));
        } catch (e) {
            console.error('localStorage 儲存失敗:', e);
        }
    }
};

window.storageModule = storageModule;
