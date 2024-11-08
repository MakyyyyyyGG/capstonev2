import React from "react";
import useUserStore from "../api/coins_exp/useUserStore";
const Coins = () => {
  const coins = useUserStore((state) => state.coins);
  return (
    <div>
      <h1 className="text-sm">Coins: {coins}</h1>
    </div>
  );
};

export default Coins;
