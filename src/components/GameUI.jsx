import React, { memo, useState } from "react";
import AdMax from "../AdMax";

export const AchievementCard = memo(({ number, title, icon, isLocked, description }) => {
  const [showOverlay, setShowOverlay] = useState(false);

  const baseStyles =
    "group w-32 h-32 relative rounded-xl border-2 flex flex-col justify-center items-center font-bold shadow-sm transition-all duration-200 cursor-pointer select-none";
  const stateStyles = isLocked
    ? "bg-gray-100 border-gray-300 text-gray-400 grayscale"
    : "bg-white border-gray-200 text-gray-800 hover:border-yellow-400 hover:shadow-md";

  return (
    <div
      className={`${baseStyles} ${stateStyles}`}
      onClick={() => setShowOverlay(!showOverlay)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <span className="absolute top-2 left-2 text-[10px] font-mono opacity-50">
        {String(number).padStart(3, "0")}
      </span>
      <span className="text-3xl mb-1">{isLocked ? "🔒" : icon}</span>
      <span className="text-[11px] px-2 text-center leading-tight">
        {isLocked ? "???" : title}
      </span>

      <div
        className={`absolute inset-0 bg-white/95 rounded-xl transition-opacity flex flex-col items-center justify-center p-2 text-center shadow-inner border border-blue-200 z-10 pointer-events-none ${
          showOverlay ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <span className="text-[10px] text-blue-600 mb-1 font-black uppercase tracking-tighter">
          Requirement
        </span>
        <span className="text-[11px] text-gray-800 leading-tight">
          {description}
        </span>
      </div>
    </div>
  );
});

export const StaticAdsAndForm = memo(() => (
  <>
    <div className="mt-4">
      <div className="block md:hidden flex flex-col items-center leading-[0]">
        <AdMax url="/ad-mobile.html" width="320" height="50" />
        <AdMax url="/ad-mobile2.html" width="320" height="50" />
      </div>
      <div className="hidden md:flex justify-center">
        <AdMax url="/ad.html" width="300" height="250" />
      </div>
    </div>
    {/*
    <div className="w-full mt-4 rounded-md overflow-hidden bg-gray-50">
      <iframe
        title="Google Form"
        src="https://docs.google.com/forms/d/e/1FAIpQLSeRzoCLdOouLOmvHB8CneGfsPhwGZueCeXQBubKn2pZqohobQ/viewform?embedded=true"
        width="100%"
        height="868"
      >
        読み込んでいます…
      </iframe>
    </div>
    */}
  </>
));

export const SideAds = memo(() => (
  <div className="hidden md:flex justify-center">
    <AdMax url="/ad-side.html" width="160" height="600" />
  </div>
));