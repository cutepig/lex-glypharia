import "./GlyphKeyboard.css";

import React from "react";
import { produce } from "immer";
import { glyphCategories, glyphMap } from "./glyphMap.json";
import { useProduce } from "./reactUtils";

interface IGlyphKeyboard {
  shareUrl?: string;
  onGlyph: (c: string) => any;
  child?: never;
}

type GlyphCategory = keyof typeof glyphCategories;
type Glyph = typeof glyphMap["A"][0];

interface IGlyphKeyboardState {
  isHidden: boolean;
  mode: "keyboard" | "search";
  currentPage: GlyphCategory;
  searchResults: Glyph[];
}

type ActionFor<T> = (...args: any) => (state: T) => T | void;
type ActionParameters<F> = F extends (...args: infer A) => any ? A : never;

function actionFor<T>() {
  // F extends (...args: infer A) => (state: T) => T | void>
  return function<F extends ActionFor<T>>(fn: F) {
    return (...args: ActionParameters<F>) => (state: T) => {
      return produce(state, fn(...(args as any)));
    };
  };
}

const keyboardAction = actionFor<IGlyphKeyboardState>();
const setCurrentPage = keyboardAction((page: GlyphCategory) => state => {
  state.currentPage = page;
});

export const GlyphKeyboard: React.FC<IGlyphKeyboard> = ({ shareUrl, onGlyph }) => {
  const [state, dispatch] = useProduce<IGlyphKeyboardState>({
    isHidden: true,
    mode: "keyboard",
    currentPage: "A",
    searchResults: [],
  });

  return (
    <div className="GlyphKeyboard">
      <ul className="GlyphKeyboard-controls">
        <li>
          <button
            className={state.mode === "keyboard" ? "active" : ""}
            onClick={() => {
              dispatch(draft => {
                if (state.isHidden) {
                  draft.isHidden = !state.isHidden;
                } else if (state.mode === "search") {
                  draft.mode = "keyboard";
                } else {
                  draft.isHidden = true;
                }
              });
            }}
          >
            ⌨
          </button>
        </li>
        {!state.isHidden && (
          <>
            <li>
              <button
                className={state.mode === "search" ? "active" : ""}
                onClick={() => {
                  dispatch(draft => {
                    draft.mode = "search";
                  });
                }}
              >
                🔍
              </button>
            </li>
            <li>
              <input
                type="search"
                onKeyDown={ev => {
                  console.log("input[type=search]#onKeyDown", ev.keyCode);
                  if (ev.keyCode === 13) {
                    dispatch(draft => {
                      if (state.isHidden) {
                        draft.isHidden = false;
                      }
                      draft.mode = "search";
                    });
                  }
                }}
                onChange={ev => {
                  console.log("input[type=search]#onChange", ev.currentTarget.value);
                  // TODO: Debounce this
                  if (ev.currentTarget.value.length < 2) {
                    return;
                  }

                  const entries: Glyph[] = [];
                  const value = ev.currentTarget.value.toLowerCase();

                  for (const glyphs of Object.values(glyphMap)) {
                    for (const glyph of glyphs) {
                      if (
                        glyph.description.toLowerCase().includes(value) ||
                        glyph.transliteration.includes(value) ||
                        glyph.phonetic.includes(value) ||
                        glyph.notes.includes(value)
                      ) {
                        entries.push(glyph);
                      }
                    }
                  }

                  console.log("entries", entries);

                  dispatch(state => {
                    state.searchResults = entries;
                  });
                }}
              />
            </li>
          </>
        )}
        {shareUrl && (
          <li>
            <a href={shareUrl} target="_blank" rel="noreferrer noopener">
              <button>💾</button>
            </a>
          </li>
        )}
      </ul>

      {!state.isHidden && state.mode === "keyboard" && (
        <div className="GlyphKeyboard-keyboard">
          <ul className="GlyphKeyboard-pages">
            {Object.entries(glyphCategories).map(([key, label]) => (
              <li key={key}>
                <button
                  className={state.currentPage === key ? "active" : ""}
                  title={label}
                  onClick={() => dispatch(setCurrentPage(key as GlyphCategory))}
                >
                  {key}
                </button>
              </li>
            ))}
          </ul>

          <ul className="GlyphKeyboard-glyphs">
            {glyphMap[state.currentPage].map(({ glyph, gardiner, hex, description }) => (
              <li key={gardiner}>
                <button
                  title={`${gardiner} ${description}`}
                  onClick={() => onGlyph(glyph || String.fromCodePoint(hex))}
                >
                  {glyph || String.fromCodePoint(hex)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!state.isHidden && state.mode === "search" && (
        <div className="GlyphKeyboard-search">
          <ul className="GlyphKeyboard-results">
            {state.searchResults.map(({ glyph, gardiner, hex, description }) => (
              <li key={gardiner}>
                <button
                  title={`${gardiner} ${description}`}
                  onClick={() => onGlyph(glyph || String.fromCodePoint(hex))}
                >
                  {glyph || String.fromCodePoint(hex)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
