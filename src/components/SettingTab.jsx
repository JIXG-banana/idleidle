import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import { ActionButton } from "./Buttons";
import { SECRET_KEY } from "../constants/gameData";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

export default function SettingTab({ gameState, setGameState, i18n, t, onSave, onActivateDevMode }) {
  const [promoCode, setPromoCode] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // メール/パスワード認証用の入力状態
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false); // 登録かログインかの切り替え Flag

  // 1. ログイン状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Googleログイン処理
  const handleGoogleLogin = async () => {
    console.log("auth:", auth, "provider:", googleProvider);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("Googleログインに失敗しました");
    }
  };

  // 3. メール/パスワード ログイン・新規登録処理
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("メールアドレスとパスワードを入力してください");

    try {
      if (isRegisterMode) {
        // 新規アカウント作成
        await createUserWithEmailAndPassword(auth, email, password);
        alert("アカウントを作成してログインしました！");
      } else {
        // 既存アカウントでログイン
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("認証エラー:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("このメールアドレスは既に登録されています");
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        alert("メールアドレスまたはパスワードが違います");
      } else if (error.code === 'auth/weak-password') {
        alert("パスワードは6文字以上で設定してください");
      } else {
        alert("認証エラーが発生しました");
      }
    }
  };

  // 4. クラウドセーブ（Firestoreへ書き込み）
  const handleCloudSave = async () => {
    if (!user) return alert("ログインが必要です");
    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        gameState: {
          ...gameState,
          lastTimestamp: Date.now(),
        },
        updatedAt: Date.now()
      }, { merge: true });

      alert("クラウドにセーブしました！");
    } catch (error) {
      console.error("クラウドセーブエラー:", error);
      alert("クラウドセーブに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 5. クラウドロード（Firestoreから読み込み）
  const handleCloudLoad = async () => {
    if (!user) return alert("ログインが必要です");
    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists() && docSnap.data().gameState) {
        setGameState(docSnap.data().gameState);
        alert("クラウドからデータをロードしました！");
      } else {
        alert("クラウドにセーブデータが見つかりませんでした");
      }
    } catch (error) {
      console.error("クラウドロードエラー:", error);
      alert("クラウドロードに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    if (promoCode === "qwerty123456789") {
      onActivateDevMode();
      setPromoCode("");
      alert("DEV MODE ACTIVATED");
    } else {
      alert(t("messages.invalid_promo") || "Invalid Promo Code");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 言語設定 */}
      <div className="flex items-center gap-3 p-3 rounded">
        <label
          htmlFor="language-select"
          className="font-bold whitespace-nowrap"
        >
          {t("settings.language_label")}
        </label>
        <select
          id="language-select"
          value={i18n.language}
          onChange={(e) => {
            const newLang = e.target.value;
            i18n.changeLanguage(newLang);
            setGameState((prev) => ({
              ...prev,
              language: newLang,
              usedLanguages: prev.usedLanguages.includes(newLang)
                ? prev.usedLanguages
                : [...prev.usedLanguages, newLang],
            }));
          }}
          className="flex-1 p-2 border border-gray-400 rounded bg-white text-black font-bold"
        >
          <option value="ja">日本語</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="zh-CN">简体中文</option>
          <option value="sw">Kiswahili</option>
          <option value="emoji">絵文字 (Emoji)</option>
        </select>
      </div>

      {/* プロモコード */}
      <div className="p-3 bg-gray-100 rounded-xl flex flex-col gap-2 border border-gray-200 shadow-inner">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("settings.promo_label") || "Promo Code"}</label>
        <form onSubmit={handlePromoSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder={t("settings.promo_placeholder") || "Enter code..."}
            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <button type="submit" className="bg-gray-800 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-black transition-colors">OK</button>
        </form>
      </div>

      {/* チェックボックス設定 */}
      <div className="flex flex-col gap-2 p-3 rounded">
        <label className="font-bold flex items-center cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={gameState.useScientific}
            onChange={(e) =>
              setGameState((prev) => ({
                ...prev,
                useScientific: e.target.checked,
              }))
            }
            className="w-5 h-5"
          />
          <span>{t("settings.use_scientific")}</span>
        </label>
        <label className="font-bold flex items-center cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={gameState.bgmEnabled}
            onChange={(e) =>
              setGameState((prev) => ({
                ...prev,
                bgmEnabled: e.target.checked,
              }))
            }
            className="w-5 h-5"
          />
          <span>{t("settings.bgm_label")}</span>
        </label>
      </div>

      {/* --- クラウド同期（Firebase）エリア --- */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col gap-3">
        <h3 className="font-bold text-blue-900 text-sm">クラウド同期</h3>
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">ログイン中:</span>
              <span className="font-bold truncate max-w-[150px]">{user.displayName || user.email}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCloudSave}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-xs transition-colors"
              >
                {loading ? "送信中..." : "クラウド保存"}
              </button>
              <button
                onClick={handleCloudLoad}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg text-xs transition-colors"
              >
                {loading ? "取得中..." : "クラウド復元"}
              </button>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="text-xs text-red-600 hover:underline self-end mt-1"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Google ログイン */}
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-2 border border-gray-300 rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              Googleでログイン
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-2 text-gray-400 text-[10px]">または</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* メール/パスワード フォーム */}
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-2">
              <input 
                type="email" 
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-1.5 border border-gray-300 rounded text-xs"
              />
              <input 
                type="password" 
                placeholder="パスワード (6文字以上)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-1.5 border border-gray-300 rounded text-xs"
              />
              <button
                type="submit"
                className="bg-gray-800 hover:bg-black text-white font-bold py-1.5 rounded text-xs transition-colors"
              >
                {isRegisterMode ? "新規登録" : "メールでログイン"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-[11px] text-gray-600 hover:underline text-center"
            >
              {isRegisterMode ? "ログインはこちら" : "新規アカウント作成はこちら"}
            </button>
          </div>
        )}
      </div>

      {/* ローカル保存・ローカル操作ボタン群 */}
      <ActionButton
        onClick={onSave}
        colorClass="bg-green-700 hover:bg-green-800"
        shadowClass="shadow-[0_4px_0_0_theme(colors.green.900)]"
      >
        {t("actions.save")}
      </ActionButton>
      <ActionButton
        onClick={() => {
          navigator.clipboard
            .writeText(
              CryptoJS.AES.encrypt(
                JSON.stringify({
                  ...gameState,
                  lastTimestamp: Date.now(),
                }),
                SECRET_KEY,
              ).toString(),
            )
            .then(() => alert(t("messages.export_success")))
            .catch(() => alert(t("messages.copy_fail")));
        }}
        colorClass="bg-blue-600 hover:bg-blue-700"
        shadowClass="shadow-[0_4px_0_0_theme(colors.blue.800)]"
      >
        {t("actions.export")}
      </ActionButton>
      <ActionButton
        onClick={() => {
          const importText = prompt(t("messages.import_prompt"));
          if (importText) {
            try {
              const decrypted = CryptoJS.AES.decrypt(
                importText,
                SECRET_KEY,
              ).toString(CryptoJS.enc.Utf8);
              if (!decrypted) throw new Error();
              localStorage.setItem("save", importText);
              window.location.reload();
            } catch {
              alert(t("messages.import_fail"));
            }
          }
        }}
        colorClass="bg-yellow-600 hover:bg-yellow-700"
        shadowClass="shadow-[0_4px_0_0_theme(colors.yellow.800)]"
      >
        {t("actions.import")}
      </ActionButton>
      <ActionButton
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        colorClass="bg-red-800 hover:bg-red-900"
        shadowClass="shadow-[0_4px_0_0_theme(colors.red.950)]"
      >
        {t("actions.clear_save")}
      </ActionButton>
    </div>
  );
}
