/**
 * Utility function for defining the type of any given class
 */
export type ClassConstructor<T> = {
  new (...args: any[]): T;
};
