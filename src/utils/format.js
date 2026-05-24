import Decimal from "break_infinity.js";

export const formatNumber = (val, useScientific, language, decimals = 0) => {
  const d = new Decimal(val);
  if (useScientific && d.gte(1e6)) {
    return d.toExponential(2);
  }

  // ロケールに基づいたカンマ区切りなどのフォーマット
  try {
    return d
      .toNumber()
      .toLocaleString(language, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
  } catch {
    return d.toFixed(decimals);
  }
};
