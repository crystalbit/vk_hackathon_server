export type Combination = [number, number, number];

const UserToCombination = new Map<number, Combination>();

export const setCombination = (user: number, combination: Combination) => {
  UserToCombination.set(user, combination);
};

export const clearCombination = (user: number) => {
  UserToCombination.delete(user);
};

export const getCombination = (user: number): Combination => {
  return UserToCombination.get(user);
};
