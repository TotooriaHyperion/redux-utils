import { StoreEnhancer } from "redux";

export const asapSchedulerEnhancer: StoreEnhancer = createStore => {
  return (reducer, initialState) => {
    const store = createStore(reducer, initialState);
    const subscribe = store.subscribe;
    store.subscribe = (listener: () => void) => {
      let scheduled = false;
      return subscribe(() => {
        if (scheduled) {
          return;
        }
        scheduled = true;
        Promise.resolve().then(() => {
          scheduled = false;
          listener();
        });
      });
    };
    return store;
  };
};
