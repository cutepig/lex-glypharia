import React, { useState } from "react";
import { produce } from "immer";
import { createActions } from "./storeUtils";

interface IGlyphDictionaryEntry {}

interface IGlyphDictionary {
  [key: string]: Array<IGlyphDictionaryEntry>;
}

const glyphDictionaryNs = "glyphDictionary";

// TODO: Type the state automatically
const glyphDictionaryReducers = {
  add(state: IGlyphDictionary, key: string, value: IGlyphDictionaryEntry) {
    state[key] = state[key] || [];
    state[key].push(value);
    // TODO: Reindex
  },
  removeKey(state: IGlyphDictionary, key: string) {
    if (typeof state[key] !== "undefined") {
      delete state[key];
      // TODO: Reindex
    }
  },
  removeEntry(state: IGlyphDictionary, key: string, index: number) {
    if (typeof state[key] !== "undefined") {
      state[key].splice(index, 1);
      // TODO: Reindex
    }
  }
};

const glyphDictionaryActions = createActions<IGlyphDictionary>({
  add(state: IGlyphDictionary, key: string, value: IGlyphDictionaryEntry) {
    state[key] = state[key] || [];
    state[key].push(value);
    // TODO: Reindex
  },
  removeKey(state: IGlyphDictionary, key: string) {
    if (typeof state[key] !== "undefined") {
      delete state[key];
      // TODO: Reindex
    }
  },
  removeEntry(state: IGlyphDictionary, key: string, index: number) {
    if (typeof state[key] !== "undefined") {
      state[key].splice(index, 1);
      // TODO: Reindex
    }
  }
});

interface ISelection {
  start: number;
  end: number;
  value: string;
  normalized: string;
}

interface IGlyphInputAreaState {
  value: string;
  currentSelection: ISelection;
}

// Can't I just `useState` to accomplish this?

interface IStateProvider<T> {
  initialState: T;
}

type IDispatch<T> = (fn: (state: T) => void) => void;

interface IStateContext<T> {
  // TODO: Readonly?
  state: T;
  dispatch: IDispatch<T>;
}

interface IStateState<T> {
  children: (state: T) => React.ReactNode;
}
interface IStateDispatch<T> {
  children: (dispatch: IDispatch<T>) => React.ReactNode;
}

function createStateProvider<T>() {
  const Context = React.createContext<IStateContext<T>>(null as any);

  const Provider: React.FunctionComponent<IStateProvider<T>> = ({
    initialState,
    children
  }) => {
    // Simple
    const [state, setState] = useState(initialState);
    const dispatch: IDispatch<T> = reducer =>
      setState(state => produce(state, reducer));

    return (
      <Context.Provider value={{ state, dispatch }}>
        {children}
      </Context.Provider>
    );
  };

  const Consumer = Context.Consumer;
  // TODO: mapStateToProps?
  const State: React.FunctionComponent<IStateState<T>> = ({ children }) => (
    <Consumer>{({ state }) => children(state)}</Consumer>
  );
  // TODO: mapDispatchToProps?
  const Dispatch: React.FunctionComponent<IStateDispatch<T>> = ({
    children
  }) => <Consumer>{({ dispatch }) => children(dispatch)}</Consumer>;

  return { Provider, Consumer, State, Dispatch };
}
