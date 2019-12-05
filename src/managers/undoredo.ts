import { Reducer, AnyAction, Store, Action } from "redux";
import * as shortid from "shortid";
import { IndexedMap } from "../types";

export const UNDO = `@BILI_UNDOABLE/UNDO`;
export const REDO = `@BILI_UNDOABLE/REDO`;
export const START = `@BILI_UNDOABLE/START`;
export const COMMIT = `@BILI_UNDOABLE/COMMIT`;
export const ROLLBACK = `@BILI_UNDOABLE/ROLLBACK`;
export const CLEAR = `@BILI_UNDOABLE/CLEAR`;

export interface UndoRedoAction {
  type: string;
  payload?: string;
}

export interface HistoryState {
  transactions: IndexedMap<IndexedMap<any>>;
  future: string[];
  past: string[];
  current: string;
  isInTransaction: boolean;
}

export function createUndoredoManager() {
  const update = (updater: () => void) => {
    start();
    try {
      updater();
      commit();
    } catch (err) {
      rollback();
    }
  };
  const start = () => {
    if (isInTransaction) {
      return;
    }
    modified = {};
    store.dispatch({
      type: START,
    });
    future = [];
    past.push(current);
    current = shortid.generate();
    purify();
    isInTransaction = true;
  };
  const commit = () => {
    if (!isInTransaction) {
      console.warn("不能在未开始一个transaction的时候进行commit");
      return;
    }
    const snapshots: IndexedMap = {};
    Object.keys(modified).forEach(key => {
      snapshots[key] = modified[key];
    });
    future.forEach(toRemove => delete transactions[toRemove]);
    future = [];

    transactions[current] = snapshots;
    isInTransaction = false;
    modified = {};
    store.dispatch({
      type: COMMIT,
    });
  };
  const rollback = () => {
    const transactionId = past[past.length - 1];
    if (transactionId) {
      current = past.pop()!;
      isInTransaction = false;
    } else {
      isInTransaction = false;
    }
    modified = {};
    store.dispatch({
      type: ROLLBACK,
      payload: transactionId,
    });
  };

  const purify = () => {
    // when start, remove keys that no longer linked to [future, past, current].
    const currKeys = Object.keys(transactions);
    const usefulKeys = [current, ...future, ...past];
    const abandonedKeys = currKeys.filter(v => usefulKeys.indexOf(v) <= 0);
    // console.log("------------------------------------");
    // console.log("current", [current]);
    // console.log("future", future);
    // console.log("past", past);
    // console.log("currKeys", currKeys);
    // console.log("usefulKeys", usefulKeys);
    // console.log("abandonedKeys", abandonedKeys);
    // console.log("------------------------------------");
    abandonedKeys.forEach(key => {
      delete transactions[key];
    });
  };

  let store: Store;
  let future: string[] = [];
  let past: string[] = [];
  let current = "__start__";
  let isInTransaction = false;
  let transactions: IndexedMap<IndexedMap> = {};

  let modified: IndexedMap = {};

  const attachToStore = (s: Store) => {
    store = s;
  };

  const link = <T>(key: string, reducer: Reducer<T, Action>) => {
    return (state: any, action: AnyAction) => {
      if (
        action.type === UNDO ||
        action.type === REDO ||
        action.type === ROLLBACK
      ) {
        const record = transactions[action.payload];
        if (!record) {
          console.warn(`${action.type} failed as history not exist`);
          return state;
        }
        const curr = record[key];
        if (!curr) {
          return state;
        }
        return curr;
      }
      if (action.type === START) {
        modified[key] = state;
        return state;
      }
      const nextState = reducer(state, action);
      if (nextState !== state) {
        modified[key] = nextState;
      }
      return nextState;
    };
  };

  const undo = () => {
    const transactionId = past[past.length - 1];
    // console.log("undo", transactionId);
    if (transactionId) {
      store.dispatch({
        type: UNDO,
        payload: transactionId,
      });
      future.unshift(current);
      past.pop();
      current = transactionId;
    }
  };

  const redo = () => {
    const transactionId = future[0];
    // console.log("undo", transactionId);
    if (transactionId) {
      store.dispatch({
        type: REDO,
        payload: transactionId,
      });
      future.shift();
      past.push(current);
      current = transactionId;
    }
  };

  const clear = () => {
    current = "__start__";
    future = [];
    past = [];
    store.dispatch({
      type: CLEAR,
    });
    transactions = {
      __start__: modified,
    };
  };

  const restore = (state: HistoryState) => {
    transactions = state.transactions;
    isInTransaction = state.isInTransaction;
    future = state.future;
    past = state.past;
    current = state.current;
  };

  return {
    attachToStore,
    link,
    start,
    commit,
    rollback,
    update,
    undo,
    redo,
    clear,
    restore,
    getHistoryState: (): HistoryState => {
      return {
        transactions,
        isInTransaction,
        future,
        past,
        current,
      };
    },
  };
}
