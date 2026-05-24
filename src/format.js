import Decimal from "break_infinity.js";

export const formatNumber = (
  val,
  useScientific = false,
  lang = "en",
  decimals = 0,
) => {
  const dec = new Decimal(val);
  const isJpOrZh = lang === "ja" || lang === "zh-CN";
  const threshold = isJpOrZh ? 10000 : 1000;

  if (dec.abs().lt(threshold)) {
    const num = dec.toNumber();
    return decimals === 0 ? Math.floor(num).toString() : num.toFixed(decimals);
  }
  if (useScientific) return dec.toExponential(2).replace("+", "");

  if (isJpOrZh) {
    const units =
      lang === "ja"
        ? ["", "万", "億", "兆", "京", "垓", "𥝱"]
        : ["", "万", "亿", "兆", "京", "垓", "𥝱"];
    const exp = dec.exponent;
    const unitIdx = Math.floor(exp / 4);
    if (unitIdx < units.length) {
      const displayVal = dec.div(Decimal.pow(10000, unitIdx)).toNumber();
      return displayVal.toFixed(2) + units[unitIdx];
    }
  } else {
    const units = [
      "",
      "K",
      "M",
      "B",
      "T",
      "Qa",
      "Qi",
      "Sx",
      "Sp",
      "Oc",
      "No",
      "Dc",
    ];
    const exp = dec.exponent;
    const unitIdx = Math.floor(exp / 3);
    if (unitIdx < units.length) {
      const displayVal = dec.div(Decimal.pow(1000, unitIdx)).toNumber();
      return displayVal.toFixed(2) + units[unitIdx];
    }
  }
  return dec.toExponential(2).replace("+", "");
};
