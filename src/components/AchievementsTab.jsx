import React from "react";
import { AchievementCard } from "./GameUI";
import { achievementsList } from "../constants/gameData";

export default function AchievementsTab({ gameState, t }) {
  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-4">
      {achievementsList.map((item, index) => (
        <AchievementCard
          key={item.key}
          number={index}
          icon={item.icon}
          title={t(`achievements.${item.key}`)}
          description={t(`achievements.${item.key}_desc`)}
          isLocked={!gameState.unlockedAchievements.includes(item.key)}
        />
      ))}
    </div>
  );
}
