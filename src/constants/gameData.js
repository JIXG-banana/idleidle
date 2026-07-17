export const SECRET_KEY = "AgsqyqyY(bu7*7^2…7[bu&x#a@es729100qiYe29Bw3";

export const DIMENSIONS = [
  { tier: 1, nameKey: "developer", baseCost: 15, scale: 1.15, icon: "👨‍💻" },
  { tier: 2, nameKey: "company", baseCost: 1500, scale: 2.0, icon: "🏢" },
  { tier: 3, nameKey: "conglomerate", baseCost: 75000, scale: 4.5, icon: "🏙️" },
  { tier: 4, nameKey: "government", baseCost: 2500000, scale: 15.0, icon: "🏛️" },
  { tier: 5, nameKey: "un", baseCost: 100000000, scale: 50.0, icon: "🇺🇳" },
  { tier: 6, nameKey: "alien", baseCost: 100000000000, scale: 250.0, icon: "👽" },
];

export const EXPANSION_LINE = {
  baseCost: 60,
  scale: 1.45,
  icon: "📈",
};

export const AUTOMATORS = [
  { key: "tier1", cost: 40000000, nameKey: "auto_tier1" },
  { key: "tier2", cost: 15000000000, nameKey: "auto_tier2" },
  { key: "tier3", cost: 20000000000000, nameKey: "auto_tier3" },
  { key: "tier4", cost: 80000000000000000, nameKey: "auto_tier4" },
  { key: "tier5", cost: 400000000000000000000, nameKey: "auto_tier5" },
  { key: "tier6", cost: 2000000000000000000000000, nameKey: "auto_tier6" },
  { key: "expansion", cost: 1e23, nameKey: "auto_expansion" },
  { key: "autoEvolve", cost: 5, nameKey: "auto_evolve", currency: "CP" },
  { key: "autoRevolution", cost: 10, nameKey: "auto_revolution", currency: "CP" },
];

export const CP_SHOP = [
  { id: "ssd", cost: 1, nameKey: "ssd_upgrade", icon: "📦" },
  { id: "fiber", cost: 1, nameKey: "fiber_upgrade", icon: "⚡" },
  { id: "macro", cost: 2, nameKey: "macro_upgrade", icon: "🤖" },
  { id: "aliens", cost: 3, nameKey: "aliens_unlock", icon: "👽" },
  { id: "satellite", cost: 5, nameKey: "satellite_upgrade", icon: "📡" },
];

export const achievementsList = [
  { key: "first-game", icon: "🐣", condition: (state) => state.totalGames.gte(1), hidden: false },
  { key: "capacity-reached", icon: "🎆", condition: (state) => state.money.gte("1e60"), hidden: false },
  { key: "revolution-idle", icon: "🧘", condition: (state) => state.revolutionReadyTime >= 3600, hidden: true },
];

export const promotionsList = [
  {
    key: "sns",
    cost: "100",
    duration: 15,
    cooldown: 30,
    gamesBoost: 2.0,
    goldBoost: 1.0,
    billingBoost: 1.0,
    icon: "📱",
  },
];
