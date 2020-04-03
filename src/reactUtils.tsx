import { useState } from "react";
import { produce, Draft, Immutable } from "immer";

export function useProduce<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);

  function dispatch(fn: (state: Draft<T>, readOnlyState: Immutable<T>) => T | void) {
    let newState;
    setState(_state => {
      newState = produce(_state, draft => fn(draft, _state as Immutable<T>)) as T;
      return newState;
    });
    return (newState as any) as T;
  }

  function dispatchAsync(fn: (_dispatch: typeof dispatch) => void) {
    return fn(dispatch);
  }

  return [state, dispatch, dispatchAsync] as [T, typeof dispatch, typeof dispatchAsync];
}
