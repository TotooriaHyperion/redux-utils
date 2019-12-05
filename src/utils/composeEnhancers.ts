import { StoreEnhancer } from "redux";

export const composeEnhancers = (
  ...args: StoreEnhancer[]
): StoreEnhancer => createStore =>
  args.reduce((acc, cur) => cur(acc), createStore);
