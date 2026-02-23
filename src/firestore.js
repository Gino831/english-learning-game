// Firestore CRUD 服務層
// 提供單字庫與文法題庫的即時同步功能
import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    writeBatch,
    serverTimestamp,
    increment,
    query,
    orderBy
} from 'firebase/firestore';

// ===== 集合參考 =====
const vocabularyRef = collection(db, 'vocabulary');
const grammarRef = collection(db, 'grammar');

// ===== 單字庫 CRUD =====

/**
 * 即時監聽單字集合變更
 * @param {Function} callback - 當資料變更時呼叫，參數為最新的單字陣列
 * @returns {Function} 取消監聽的函式
 */
export const subscribeVocabulary = (callback) => {
    const q = query(vocabularyRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,  // Firestore 文件 ID
            ...doc.data()
        }));
        callback(items);
    }, (error) => {
        console.error('監聽單字庫失敗:', error);
        // 發生錯誤時回傳空陣列
        callback([]);
    });
};

/**
 * 新增單字
 * @param {Object} item - 單字資料（不含 id）
 * @returns {Promise<string>} 新增文件的 ID
 */
export const addVocabularyItem = async (item) => {
    const docRef = await addDoc(vocabularyRef, {
        word: item.word || '',
        chinese: item.chinese || '',
        pronunciation: item.pronunciation || '',
        emoji: item.emoji || '📝',
        sentence: item.sentence || '',
        past: item.past || '',          // 過去式 (V2)
        participle: item.participle || '', // 過去分詞 (V3)
        label: item.label || '',
        correctCount: 0,   // 熟度：答對次數
        totalCount: 0,     // 熟度：作答次數
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

/**
 * 更新單字
 * @param {string} docId - Firestore 文件 ID
 * @param {Object} updates - 要更新的欄位
 */
export const updateVocabularyItem = async (docId, updates) => {
    const docRef = doc(db, 'vocabulary', docId);
    // 移除 id 和熟度欄位，避免意外覆蓋
    const { id, correctCount, totalCount, ...data } = updates;
    await updateDoc(docRef, data);
};

/**
 * 刪除單字
 * @param {string} docId - Firestore 文件 ID
 */
export const deleteVocabularyItem = async (docId) => {
    const docRef = doc(db, 'vocabulary', docId);
    await deleteDoc(docRef);
};

/**
 * 批次新增單字（匯入用）
 * @param {Array} items - 單字陣列
 * @returns {Promise<number>} 新增的數量
 */
export const batchAddVocabulary = async (items) => {
    const batch = writeBatch(db);
    items.forEach(item => {
        const newDocRef = doc(vocabularyRef);
        batch.set(newDocRef, {
            word: item.word || '',
            chinese: item.chinese || '',
            pronunciation: item.pronunciation || '',
            emoji: item.emoji || '📝',
            sentence: item.sentence || '',
            past: item.past || '',
            participle: item.participle || '',
            label: item.label || '',
            correctCount: 0,
            totalCount: 0,
            createdAt: serverTimestamp()
        });
    });
    await batch.commit();
    return items.length;
};

/**
 * 更新單字熟度（答題後呼叫）
 * 使用 Firestore increment 確保原子性操作
 * @param {string} docId - 單字文件 ID
 * @param {boolean} isCorrect - 是否答對
 */
export const updateVocabularyMastery = async (docId, isCorrect) => {
    const docRef = doc(db, 'vocabulary', docId);
    const updates = { totalCount: increment(1) };
    if (isCorrect) {
        updates.correctCount = increment(1);
    }
    await updateDoc(docRef, updates);
};

// ===== 文法題庫 CRUD =====

/**
 * 即時監聯文法集合變更
 * @param {Function} callback - 當資料變更時呼叫，參數為最新的文法題陣列
 * @returns {Function} 取消監聽的函式
 */
export const subscribeGrammar = (callback) => {
    const q = query(grammarRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(items);
    }, (error) => {
        console.error('監聽文法題庫失敗:', error);
        callback([]);
    });
};

/**
 * 新增文法題（支援多題型）
 * type: 'choice' | 'fill' | 'correction' | 'reorder'
 * @param {Object} item - 文法題資料
 * @returns {Promise<string>} 新增文件的 ID
 */
export const addGrammarItem = async (item) => {
    // 共用欄位
    const data = {
        type: item.type || 'choice',
        question: item.question || '',
        explanation: item.explanation || '',
        createdAt: serverTimestamp()
    };
    // 題型專屬欄位
    if (item.options) data.options = item.options;
    if (item.correct !== undefined) data.correct = item.correct;
    if (item.answer) data.answer = item.answer;
    if (item.hint) data.hint = item.hint;
    if (item.errorPart) data.errorPart = item.errorPart;
    if (item.words) data.words = item.words;
    const docRef = await addDoc(grammarRef, data);
    return docRef.id;
};

/**
 * 更新文法題
 * @param {string} docId - Firestore 文件 ID
 * @param {Object} updates - 要更新的欄位
 */
export const updateGrammarItem = async (docId, updates) => {
    const docRef = doc(db, 'grammar', docId);
    const { id, ...data } = updates;
    await updateDoc(docRef, data);
};

/**
 * 刪除文法題
 * @param {string} docId - Firestore 文件 ID
 */
export const deleteGrammarItem = async (docId) => {
    const docRef = doc(db, 'grammar', docId);
    await deleteDoc(docRef);
};

/**
 * 批次新增文法題（匯入用，支援多題型）
 * @param {Array} items - 文法題陣列
 * @returns {Promise<number>} 新增的數量
 */
export const batchAddGrammar = async (items) => {
    const batch = writeBatch(db);
    items.forEach(item => {
        const newDocRef = doc(grammarRef);
        const data = {
            type: item.type || 'choice',
            question: item.question || '',
            explanation: item.explanation || '',
            createdAt: serverTimestamp()
        };
        if (item.options) data.options = item.options;
        if (item.correct !== undefined) data.correct = item.correct;
        if (item.answer) data.answer = item.answer;
        if (item.hint) data.hint = item.hint;
        if (item.errorPart) data.errorPart = item.errorPart;
        if (item.words) data.words = item.words;
        batch.set(newDocRef, data);
    });
    await batch.commit();
    return items.length;
};

/**
 * 批次更新單字的標籤（批次修改用）
 * @param {Array<string>} docIds - 要更新的文件 ID 陣列
 * @param {string} label - 新的標籤值
 */
export const batchUpdateVocabularyLabel = async (docIds, label) => {
    const batch = writeBatch(db);
    docIds.forEach(docId => {
        const docRef = doc(db, 'vocabulary', docId);
        batch.update(docRef, { label });
    });
    await batch.commit();
};

