import "./GlyphDoodle.css";

import React, { useEffect } from "react";
import { GlyphKeyboard } from "./GlyphKeyboard";
import { Subject } from "rxjs";
import { IGlyphTextArea, GlyphTextArea } from "./GlyphTextArea";
import { useProduce } from "./reactUtils";
import dictionaryJSON from "./dictionary.json";

interface IDictionaryEntry {
  transliteration: string;
  translation: string;
  type: any;
  glyphs: string;
}

interface IDictionaryNode {
  [key: string]: {
    entries: IDictionaryEntry[];
    next: IDictionaryNode;
  };
}

const dictionary = (dictionaryJSON as any) as IDictionaryNode;

function lookup(text: string) {
  let entries: IDictionaryEntry[] = [];
  const buffer = Array.from(text);

  // TODO: Invert the traversal and collect in reverse
  // order (longest first)
  // TODO: Not only that, but collect longer words as well and put them after the first set, following the shortest matches
  let node = dictionary;
  for (const c of buffer) {
    let n = node[c];
    node = n && n.next;
    if (n) {
      entries = entries.concat(n.entries);
    }
    if (!node) {
      break;
    }
  }

  return entries;
}

interface IGlyphDoodleState {
  doodle: string;
  text: string;
  matches: IDictionaryEntry[];
}

const historyLength = 25;

function attempt<T>(defaultValue: T, fn: () => T) {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
}

function storeState(state: IGlyphDoodleState) {
  const { text, doodle } = state;
  localStorage.setItem("doodle/text", text);
  localStorage.setItem("doodle/doodle", doodle);
  const history = attempt([], () => JSON.parse(localStorage.getItem("doodle/history") || "")) || [];
  history.unshift({ text, doodle });
  if (history.length > historyLength) {
    history.pop();
  }
  localStorage.setItem("doodle/history", JSON.stringify(history));
}

function restoreState(state: IGlyphDoodleState) {
  const url = new URL(window.location.toString());
  if (url.searchParams.has("doodle")) {
    state.doodle = Buffer.from(url.searchParams.get("doodle") || "", "base64").toString("utf-8");
    state.text = Buffer.from(url.searchParams.get("text") || "", "base64").toString("utf-8");
  } else {
    state.doodle = localStorage.getItem("doodle/doodle") || "";
    state.text = localStorage.getItem("doodle/text") || "";
  }
}

export const GlyphDoodle: React.FC = () => {
  // NOTE: This is not mobile friendly at all!
  // TODO: Hide the popup keyboard on textarea somehow!

  // TODO: Share button
  // TODO: Restore state from URL (through share)
  // TODO: Restore state from localStorage
  // TODO: Restore state of glyph textarea somehow!
  // TODO: Store snapshots to localStore automatically and/or manually
  // TODO: Browse/Restore snapshots
  // TODO: Refactor event functions, this is getting out of hand

  // TODO: Stop layout jumping! Improve UX! Make textareas bigger by default!
  // Do we need multiple panes? 2 on top, keyboard and results on bottom?

  // [Glyph area] [Doodle area ]
  // [ Keyboard ] [Translations]

  /*
    TODO: Build a lookup table mechanism for the content in
    GlyphTextArea, so that each character will have a lookup
    array of matches of itself and subsequent strings.

    A lookup function will accept the string and optional offset
    parameter which allows us to optimize access to string, by
    utilizing the offset in a loop instead of using `.split()`
    when going through each character in the string
  */

  const glyphStream = new Subject<string>();
  const [state, dispatch] = useProduce<IGlyphDoodleState>({ doodle: "", text: "", matches: [] });

  const shareUrl = `/?doodle=${encodeURIComponent(
    Buffer.from(state.doodle, "utf-8").toString("base64"),
  )}&text=${encodeURIComponent(Buffer.from(state.text, "utf-8").toString("base64"))}`;

  const onGlyphsChange: IGlyphTextArea["onChange"] = (value, meta) => {
    dispatch(state => {
      // NOTE: We may want to store this as buffer
      // if we want to cache these, so that we can
      // index each actual character
      state.text = value;
      storeState(state);
    });
  };

  // Select event
  const onGlyphsSelect: IGlyphTextArea["onSelect"] = (start, end) => {
    if (start === end) {
      return;
    }

    // TODO: Skip all non-glyph characters
    const text = state.text.substring(start, end).replace(/\s+/g, "");
    const entries = lookup(text);

    dispatch(state => {
      state.matches = entries.reverse();
    });
  };

  const onNotesChange = (ev: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const value = ev.currentTarget.value;
    dispatch(state => {
      state.doodle = value;
      storeState(state);
    });
  };

  useEffect(() => {
    dispatch(restoreState);
  }, []);

  return (
    <div className="GlyphDoodle">
      <div className="GlyphDoodle-top">
        <div className="GlyphDoodle-glyphs">
          <GlyphTextArea
            glyphStream={glyphStream}
            value={state.text}
            onChange={onGlyphsChange}
            onSelect={onGlyphsSelect}
          />
        </div>

        <div className="GlyphDoodle-notes">
          <textarea value={state.doodle} onChange={onNotesChange} />
        </div>
      </div>

      <div className="GlyphDoodle-bottom">
        <div className="GlyphDoodle-keyboard">
          <GlyphKeyboard shareUrl={shareUrl} onGlyph={c => glyphStream.next(c)} />
        </div>

        <div className="GlyphDoodle-matches">
          <ul>
            {state.matches.map((entry, i) => (
              <li key={i}>
                <b>{entry.glyphs}</b> <i>{entry.transliteration}</i>
                {" - "}
                {entry.translation}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
