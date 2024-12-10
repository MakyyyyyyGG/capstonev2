import React from "react";
import useUserStore from "../api/coins_exp/useUserStore";
import CoinIcon from "./CoinIcon";
const Coins = () => {
  const coins = useUserStore((state) => state.coins);
  return (
    <div className="flex items-center gap-2">
      <CoinIcon className="h-5 w-5 text-yellow-500 max-sm:w-4" />
      <span className="font-medium">{coins}</span>
    </div>
  );
};

export default Coins;
