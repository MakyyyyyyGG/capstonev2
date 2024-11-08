import React from "react";
import { Progress } from "@nextui-org/react";

const Exp = ({ exp }) => {
  // Calculate level and progress with increasing exp requirements
  const calculateLevel = (totalExp) => {
    let level = 0;
    let remainingExp = totalExp;
    let currentLevelRequirement = 100; // Starting exp requirement

    while (remainingExp >= currentLevelRequirement) {
      remainingExp -= currentLevelRequirement;
      level++;
      currentLevelRequirement = Math.floor(100 * Math.pow(1.5, level)); // Increase by 50% each level
    }

    return {
      level,
      currentExp: remainingExp,
      nextLevelExp: currentLevelRequirement,
    };
  };

  const { level, currentExp, nextLevelExp } = calculateLevel(exp);
  const progressPercent = (currentExp / nextLevelExp) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Level {level}</span>
        <span className="text-sm text-gray-500">
          {currentExp}/{nextLevelExp} EXP
        </span>
      </div>
      <Progress
        size="sm"
        radius="sm"
        classNames={{
          base: "w-full",
          track: "bg-gray-200",
          indicator: "bg-gradient-to-r from-blue-500 to-purple-500",
        }}
        value={progressPercent}
        aria-label="Experience progress"
      />
    </div>
  );
};

export default Exp;
