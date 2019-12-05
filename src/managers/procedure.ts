import { Reducer, Action } from "redux";
import { IndexedMap } from "../types";

export interface ProcedureApi<T = any> {
  (getState: () => T, addAction: (mutations: Action) => void): void;
}

export function createProcedureManager<S>() {
  const allProcedures: IndexedMap<Array<ProcedureApi<S>>> = {};

  const ensureProcedure = (actionType: string) => {
    if (!allProcedures[actionType]) {
      allProcedures[actionType] = [];
    }
    return allProcedures[actionType];
  };

  const addProcedure = (actionType: string, procedure: ProcedureApi) => {
    const curr = ensureProcedure(actionType);
    curr.push(procedure);
    return () => {
      const idx = curr.indexOf(procedure);
      curr.splice(idx, 1);
    };
  };

  const wrapProcedureReducer: (
    reducer?: Reducer<S, Action>,
  ) => Reducer<S, Action> = (reducer = s => s!) => {
    return (state, action) => {
      const actions = [action];
      let nextState: S = state!;
      const getCurrState = () => nextState;
      const addAction = (action: Action) => actions.push(action);
      while (actions.length) {
        const currAction = actions.shift();
        if (currAction) {
          nextState = reducer(nextState, currAction);
          const relatedProcedure = allProcedures[currAction.type];
          if (relatedProcedure) {
            relatedProcedure.forEach(procedure => {
              procedure(getCurrState, addAction);
            });
          }
        }
      }
      return nextState;
    };
  };

  return {
    addProcedure,
    wrapProcedureReducer,
  };
}
