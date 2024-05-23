export const Stages = {
  BETA: "Beta",
  PROD: "Prod",
} as const;

export type Stage = (typeof Stages)[keyof typeof Stages];
