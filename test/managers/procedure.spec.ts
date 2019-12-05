import { createProcedureManager } from "../../src";
import { createStore, Reducer, Action } from "redux";
import produce from "immer";

import * as chai from "chai";
const expect = chai.expect;

describe("procedure", () => {
  it("should trigger related reducer", () => {
    interface State {
      a: number;
      b: number;
      c: number;
    }

    const preloadState: State = {
      a: 1,
      b: 1,
      c: 1,
    };

    const manager = createProcedureManager<State>();

    const reducer: Reducer<State, Action> = (s = preloadState, a) => {
      return produce(s, draft => {
        if (a.type === "a") {
          draft.a += 1;
        }
        if (a.type === "b") {
          draft.b += 1;
        }
        if (a.type === "c") {
          draft.c += 1;
        }
      });
    };

    const store = createStore(
      manager.wrapProcedureReducer(reducer),
      preloadState,
    );

    manager.addProcedure("a", (_getState, addAction) => {
      addAction({
        type: "c",
      });
    });
    manager.addProcedure("b", (_getState, addAction) => {
      addAction({
        type: "c",
      });
    });

    expect(store.getState()).to.deep.equal({
      a: 1,
      b: 1,
      c: 1,
    });
    store.dispatch({
      type: "a",
    });
    expect(store.getState()).to.deep.equal({
      a: 2,
      b: 1,
      c: 2,
    });
    store.dispatch({
      type: "b",
    });
    expect(store.getState()).to.deep.equal({
      a: 2,
      b: 2,
      c: 3,
    });
  });
});
