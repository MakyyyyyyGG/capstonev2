import React from "react";
import { Progress } from "@nextui-org/react";
import { Star } from "lucide-react";

const Exp = ({ exp }) => {
  // Calculate level and progress with increasing exp requirements
  const calculateLevel = (totalExp) => {
    let level = 0;
    let remainingExp = totalExp;
    let currentLevelRequirement = 100; // Starting exp requirement

    while (remainingExp >= currentLevelRequirement) {
      remainingExp -= currentLevelRequirement;
      level++;
      currentLevelRequirement = Math.floor(100 * Math.pow(1.05, level)); // Increase by 50% each level
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
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Star className="5-4 w-5 text-purple-500" size={100} />
        <div className="text-md font-medium">Level {level}</div>
      </div>
      <div className="flex w-48 flex-col gap-1 max-sm:w-28">
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
        {/* <div className="flex justify-between text-xs text-[#6B7280]">
          <span>{currentExp} EXP</span>
          <span>{nextLevelExp} EXP</span>
        </div> */}
      </div>
    </div>
  );
};

export default Exp;
