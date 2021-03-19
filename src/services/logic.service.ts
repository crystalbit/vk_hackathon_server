import {Combination} from "../stores/combinations.store";

// same on frontend
export const StickerStates = {
  KNIFE: 0,
  PAPER: 1,
  STONE: 2,
};

export const SCORES: Record<number, Record<number, -1|0|1>> = {
  [StickerStates.KNIFE]: {
    [StickerStates.KNIFE]: 0,
    [StickerStates.PAPER]: 1,
    [StickerStates.STONE]: -1,
  },
  [StickerStates.PAPER]: {
    [StickerStates.KNIFE]: -1,
    [StickerStates.PAPER]: 0,
    [StickerStates.STONE]: 1,
  },
  [StickerStates.STONE]: {
    [StickerStates.KNIFE]: 1,
    [StickerStates.PAPER]: -1,
    [StickerStates.STONE]: 0,
  },
}

const stickerScore = (a: number, b: number): -1|0|1 => {
  return SCORES[a][b];
}

export const compareCombinations = (a: Combination, b: Combination): number => {
  let score = 0;
  // сравниваем три стикера
  for (let i = 0; i < 3; i++) {
    score += stickerScore(a[i], b[i]);
  }
  return score;
};
