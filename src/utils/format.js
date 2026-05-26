import Decimal from "break_infinity.js";

const EN_SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
  "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"
];
const JP_SUFFIXES = [
  "", "万", "億", "兆", "京", "垓", "𥝱", "穣", "溝", "澗", "正", "載", "極", "恒河沙", "阿僧祇", "那由他", "不可思議", "無量大数",
  "頻波羅", "矜羯羅", "阿伽羅", "最勝", "摩婆羅", "阿婆羅", "多婆羅", "界分", "普摩", "禰摩", "阿婆鈐", "弥伽婆", "毘羅伽", "毘伽婆",
  "僧羯邏摩", "毘薩羅", "毘贍婆", "毘盛伽", "毘素陀", "毘婆訶", "毘薄底", "毘佉多", "毘誓歩", "毘檐歩", "毘騰伽", "毘婆羅", "毘檐婆",
  "毘折羅", "離訶婆", "毘遮羅", "阿提婆", "呬魯伽", "毘羅歩", "訶理婆", "訶迷魯", "訶摩魯", "鉢婆摩", "摩魯陀", "鉢羅摩", "摩陀羅",
  "醯魯婆", "醯魯摩", "醯魯伽", "鉢羅茂陀", "摩那婆", "摩度羅", "醯摩婆", "摩魯婆", "摩卑羅", "摩檐婆", "醯魯慈", "毘迦摩", "騰伽羅",
  "摩羅伽", "娑羅離", "昌伽羅", "摩遮羅", "阿摩羅", "婆摩羅", "毘摩羅", "普羅摩陀", "摩底羅", "阿婆羅", "婆摩", "摩羅", "鉢羅摩陀"
];
const ZH_SUFFIXES = [
  "", "万", "亿", "兆", "京", "垓", "𥝱", "穣", "沟", "涧", "正", "载", "极", "恒河沙", "阿僧祇", "那由他", "不可思議", "無量大数",
  "频波罗", "矜羯罗", "阿伽罗", "最胜", "摩婆罗", "阿婆罗", "多婆罗", "界分", "普摩", "祢摩", "阿婆钤", "弥伽婆", "毗罗伽", "毗伽婆",
  "僧羯逻摩", "毗萨罗", "毗赡婆", "毗盛伽", "毗素陀", "毗婆诃", "毗薄底", "毗佉多", "毗誓步", "毗檐步", "毗腾伽", "毗婆罗", "毗檐婆",
  "毗折罗", "离诃婆", "毗遮罗", "阿提婆", "呬鲁伽", "毗罗步", "诃理婆", "诃迷鲁", "诃摩鲁", "钵婆摩", "摩鲁陀", "钵罗摩", "摩陀罗",
  "醯鲁婆", "醯鲁摩", "醯鲁伽", "钵罗茂陀", "摩那婆", "摩度罗", "醯摩婆", "摩鲁婆", "摩卑罗", "摩檐婆", "醯鲁慈", "毗迦摩", "腾伽罗",
  "摩罗伽", "娑罗离", "昌伽罗", "摩遮罗", "阿摩罗", "婆摩罗", "毗摩罗", "普罗摩陀", "摩底罗", "阿婆罗", "婆摩", "摩罗", "钵罗摩陀"
];

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

export const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
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
