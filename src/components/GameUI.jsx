import React, { memo } from "react";
import AdMax from "../AdMax";

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