import React, { useEffect, useRef } from 'react';

const AdMax = () => {
  // 広告を入れるための箱（div）を参照
  const adRef = useRef(null);

  useEffect(() => {
    // すでにスクリプトが挿入されている場合（Reactの2回実行防止）は処理を止める
    if (!adRef.current || adRef.current.children.length > 0) return;

    // scriptタグを生成してURLをセット
    const script = document.createElement('script');
    
    // 🚨 ここを自分の xxxx のURLに書き換えてください！
    script.src = "https://adm.shinobi.jp/s/ee035d1a4d6979e3db24ad8c00eea169"; 
    
    script.async = true;

    // divタグの中にscriptを注入して実行させる
    adRef.current.appendChild(script);

    // コンポーネントが破棄される時のお掃除
    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    // ここが広告の「枠」になります。誤クリック防止のために上下に余白（margin）を入れています。
    <div 
      ref={adRef} 
      style={{ 
        margin: '30px auto', // 上下に30pxの余白を取り、中央寄せ
        minHeight: '50px',   // 広告が読み込まれる前の「ガクッ」としたズレを防止
        display: 'flex',
        justifyContent: 'center'
      }} 
    />
  );
};

export default AdMax;
