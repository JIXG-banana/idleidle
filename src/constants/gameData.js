export const SECRET_KEY = "AgsqyqyY(bu7*7^2…7[bu&x#a@es729100qiYe29Bw3";

export const achievementsList = [
  { key: "first-game", icon: "🐣", condition: (state) => state.games.gte(1), hidden: false },
  { key: "secret-ach", icon: "🕵️", condition: (state) => state.money.gte(1000000), hidden: true },
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
  {
    key: "streamer",
    cost: "10000",
    duration: 20,
    cooldown: 60,
    gamesBoost: 3.0,
    goldBoost: 3.0,
    billingBoost: 2.0,
    icon: "🎥",
  },
  {
    key: "direct",
    cost: "10000000",
    duration: 30,
    cooldown: 180,
    gamesBoost: 5.0,
    goldBoost: 5.0,
    billingBoost: 10.0,
    icon: "📢",
  },
  {
    key: "tgs",
    cost: "100000000000",
    duration: 40,
    cooldown: 300,
    gamesBoost: 10.0,
    goldBoost: 10.0,
    billingBoost: 20.0,
    icon: "🎪",
  },
];

