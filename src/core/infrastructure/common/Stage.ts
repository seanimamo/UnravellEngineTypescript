export const Stage = {
  BETA: "Beta",
  PROD: "Prod",
} as const;

export type Stage = (typeof Stage)[keyof typeof Stage];
