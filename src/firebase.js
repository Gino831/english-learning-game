// Firebase 初始化設定
// 此設定檔包含 Firebase 專案的公開連線資訊
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 專案設定（公開資訊，安全性由 Firestore Rules 控制）
const firebaseConfig = {
    apiKey: "AIzaSyB_aHrLozuEz7o4z7K5p9UJzBz1iFqojOU",
    authDomain: "english-learning-game-97be2.firebaseapp.com",
    projectId: "english-learning-game-97be2",
    storageBucket: "english-learning-game-97be2.firebasestorage.app",
    messagingSenderId: "256242972896",
    appId: "1:256242972896:web:0fa5d687e68b3b5f513885"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firestore 資料庫
export const db = getFirestore(app);
export default app;
