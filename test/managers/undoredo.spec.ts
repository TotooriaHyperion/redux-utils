import { createUndoredoManager } from "../../src";
import { createStore, combineReducers } from "redux";
import produce from "immer";

import * as chai from "chai";
const expect = chai.expect;

describe("undoredo", () => {
  it("should work", () => {
    interface State {
      h1: {
        a: number;
        b: number;
      };
    }

    const manager = createUndoredoManager();
    const store = createStore(
      combineReducers({
        h1: manager.link<State["h1"]>("h1", (s = { a: 1, b: 1 }, a) => {
          return produce(s, draft => {
            if (a.type === "a") {
              draft.a++;
            }
            if (a.type === "b") {
              draft.b++;
            }
          });
        }),
      }),
      {
        h1: {
          a: 1,
          b: 1,
        },
      },
    );
    manager.attachToStore(store);

    manager.clear();
    expect(store.getState()).to.deep.equal({
      h1: {
        a: 1,
        b: 1,
      },
    });
    manager.update(() => {
      store.dispatch({ type: "a" });
    });
    expect(store.getState(), "after mutation").to.deep.equal({
      h1: {
        a: 2,
        b: 1,
      },
    });
    manager.undo();
    expect(store.getState(), "after undo").to.deep.equal({
      h1: {
        a: 1,
        b: 1,
      },
    });
    manager.redo();
    expect(store.getState(), "after redo").to.deep.equal({
      h1: {
        a: 2,
        b: 1,
      },
    });

    manager.start();
    store.dispatch({ type: "b" });
    manager.commit();
    expect(store.getState(), "after commit").to.deep.equal({
      h1: {
        a: 2,
        b: 2,
      },
    });
    manager.undo();
    expect(store.getState(), "after undo").to.deep.equal({
      h1: {
        a: 2,
        b: 1,
      },
    });

    manager.start();
    store.dispatch({ type: "b" });
    expect(store.getState(), "after start").to.deep.equal({
      h1: {
        a: 2,
        b: 2,
      },
    });
    manager.rollback();
    expect(store.getState(), "after rollback").to.deep.equal({
      h1: {
        a: 2,
        b: 1,
      },
    });

    const { transactions, future, past, current } = manager.getHistoryState();
    const currKeys = Object.keys(transactions).sort();
    const usefulKeys = [...past, current, ...future].sort();
    const hasUnusedKeys = currKeys.some(key => !usefulKeys.includes(key));
    const hasNeededKeys = usefulKeys.every(key => currKeys.includes(key));
    expect(hasUnusedKeys).to.be.false;
    expect(hasNeededKeys).to.be.true;
    expect(currKeys).to.deep.equal(usefulKeys);
  });
});
