import React from 'react';

const AdMax = () => {
  return (
    <div style={{ margin: '30px auto', textAlign: 'center' }}>
      <iframe 
        src="/ad.html" 
        // ⚠️ 忍者AdMaxで設定した広告のサイズに合わせて数値を変更してください
        width="300"  
        height="250" 
        style={{ border: 'none' }} 
        scrolling="no"
        title="Advertisement"
      />
    </div>
  );
};

export default AdMax;
