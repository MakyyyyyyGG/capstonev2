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
    set((state) => ({
      coins: newCoins !== null ? newCoins : state.coins,
      exp: newExp !== null ? newExp : state.exp,
    })),
}));

export default useUserStore;
