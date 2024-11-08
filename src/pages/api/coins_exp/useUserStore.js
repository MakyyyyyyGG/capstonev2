import { create } from "zustand";

const useUserStore = create((set) => ({
  coins: 0,
  exp: 0,
  setInitialValues: (initialCoins, initialExp) =>
    set(() => ({
      coins: initialCoins,
      exp: initialExp,
    })),
  updateCoinsExp: (newCoins, newExp) =>
    set(() => ({
      coins: newCoins,
      exp: newExp,
    })),
}));

export default useUserStore;
