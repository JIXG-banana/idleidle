import Decimal from "break_infinity.js";

const EN_SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
  "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"
];
const JP_SUFFIXES = ["", "万", "億", "兆", "京", "垓", "𥝱", "穣", "溝", "澗", "正", "載", "極"];
const ZH_SUFFIXES = ["", "万", "亿", "兆", "京", "垓", "𥝱", "穣", "沟", "涧", "正", "载", "极"];

export const formatNumber = (val, useScientific, language, decimals = 0) => {
  const d = new Decimal(val);

  if (useScientific && d.gte(1e6)) {
    return d.toExponential(2);
  }

  if (language === "ja") {
    return formatWithSuffix(d, 10000, JP_SUFFIXES, language, decimals);
  } else if (language === "zh-CN" || language === "zh") {
    return formatWithSuffix(d, 10000, ZH_SUFFIXES, language, decimals);
  } else {
    return formatWithSuffix(d, 1000, EN_SUFFIXES, language, decimals);
  }
};

function formatWithSuffix(decimal, base, suffixes, language, decimals) {
  if (decimal.lt(base)) {
    try {
      return decimal.toNumber().toLocaleString(language, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      return decimal.toFixed(decimals);
    }
  }

  const baseLog = Math.log10(base);
  const exponent = Math.floor(decimal.log10() / baseLog);
  const suffixIndex = Math.min(exponent, suffixes.length - 1);
  const suffix = suffixes[suffixIndex];

  const value = decimal.div(Decimal.pow(base, suffixIndex));
  
  // For suffixed numbers, use at least 2 decimals for better precision in idle games
  const displayDecimals = suffixIndex > 0 ? Math.max(decimals, 2) : decimals;

  try {
    return (
      value.toNumber().toLocaleString(language, {
        minimumFractionDigits: displayDecimals,
        maximumFractionDigits: displayDecimals,
      }) + suffix
    );
  } catch {
    return value.toFixed(displayDecimals) + suffix;
  }
}
