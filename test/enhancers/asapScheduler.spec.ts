import { createStore } from "redux";
import { asapSchedulerEnhancer } from "../../src";
import { sleep } from "../testUtils";

import * as chai from "chai";
const expect = chai.expect;

describe("asapSchedulerEnhancer", () => {
  it("should group sync notify", async () => {
    const store = createStore(
      (
        s = {
          a: 1,
        },
        a,
      ) => {
        if (a.type === "") {
          return { ...s, a: s.a + 1 };
        }
        return s;
      },
      {
        a: 1,
      },
      asapSchedulerEnhancer,
    );
    let count = 0;

    let checkValue: () => any = () => undefined;

    store.subscribe(() => {
      count += 1;
      checkValue();
    });

    store.dispatch({ type: "" });
    store.dispatch({ type: "" });
    store.dispatch({ type: "" });
    checkValue = () => expect(store.getState().a).to.eq(4);
    expect(count).to.eq(0);
    await Promise.resolve();
    expect(count).to.eq(1);

    await sleep(10);
    store.dispatch({ type: "" });
    store.dispatch({ type: "" });
    store.dispatch({ type: "" });
    checkValue = () => expect(store.getState().a).to.eq(7);
    expect(count).to.eq(1);
    await Promise.resolve();
    expect(count).to.eq(2);
  });
});
