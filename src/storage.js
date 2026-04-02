// localStorage 儲存層 - 提供 window.storage API
// 所有資料以 JSON 格式存入 localStorage

const STORAGE_PREFIX = 'english_game_';

window.storage = {
    // 讀取資料
    get: async (key) => {
        try {
            const value = localStorage.getItem(STORAGE_PREFIX + key);
            if (value !== null) {
                return { value: JSON.parse(value) };
            }
            return null;
        } catch (err) {
            console.warn('讀取 localStorage 失敗:', err);
            return null;
        }
    },

    // 寫入資料
    set: async (key, value) => {
        try {
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.warn('寫入 localStorage 失敗:', err);
            return false;
        }
    },

    // 刪除資料
    remove: async (key) => {
        try {
            localStorage.removeItem(STORAGE_PREFIX + key);
            return true;
        } catch (err) {
            console.warn('刪除 localStorage 失敗:', err);
            return false;
        }
    }
};
