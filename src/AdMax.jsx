import React from 'react';

// width と height を外から受け取れるように変更
const AdMax = ({ url = "./ad.html", width = "300", height = "250" }) => {
  return (
    <div style={{ margin: '30px auto', textAlign: 'center' }}>
      <iframe 
        src={url}
        width={width}  
        height={height} 
        style={{ border: 'none' }} 
        scrolling="no"
        title="Advertisement"
      />
    </div>
  );
};

export default AdMax;
