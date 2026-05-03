import React from 'react';

// url という変数（Props）を受け取れるようにします
const AdMax = ({ url = "/ad.html" }) => {
  return (
    <div style={{ margin: '30px auto', textAlign: 'center' }}>
      <iframe 
        src={url} // ← ここを url に変更します
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
