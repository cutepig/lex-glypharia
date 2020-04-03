import React, { useRef, useEffect, useState } from "react";
import { Observable } from "rxjs";

export interface IGlyphTextArea {
  glyphStream: Observable<string>;
  value?: string;
  onChange: (text: string, metadata: { text: string; start: number; end: number }) => any;
  onSelect?: (start: number, end: number) => any;
}

interface IGlyphTextAreaState {
  // NOTE: Only state we store is the restorable selection
  // state of the textarea, which we will grab when the
  // textarea is unfocused so that we can insert characters
  // to the right place when the textarea isn't focused
  selectionStart: number;
  selectionEnd: number;
}

export const GlyphTextArea: React.FC<IGlyphTextArea> = ({
  glyphStream,
  value,
  onChange,
  onSelect,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [state, dispatch] = useState<IGlyphTextAreaState>({
    selectionStart: 0,
    selectionEnd: 0,
  });

  useEffect(() => {
    const subscription = glyphStream.subscribe((c) => {
      const textArea = textAreaRef.current;
      if (!textArea) {
        console.warn("textArea is null");
        return;
      }

      if (document.activeElement !== textArea) {
        textArea.focus();
        textArea.selectionStart = state.selectionStart;
        textArea.selectionEnd = state.selectionEnd;
      }

      const { selectionStart, selectionEnd, value } = textArea;

      const newSelectionStart = selectionStart + c.length;
      const newValue = value.slice(0, selectionStart) + c + value.slice(selectionEnd);

      textArea.value = newValue;
      textArea.selectionStart = newSelectionStart;
      textArea.selectionEnd = newSelectionStart;

      dispatch((state) => ({
        ...state,
        selectionStart: newSelectionStart,
        selectionEnd: newSelectionStart,
      }));

      // TODO: Also send metadata such as the coordinates
      // so something like a lookup mechanism can optimize
      // it's table update.
      // We could send
      //  - the insert position
      //  - the length of replaced span (or offset)
      onChange(newValue, { start: selectionStart, end: selectionEnd, text: c });
    });

    return () => subscription.unsubscribe();
  }, [glyphStream, onChange, state]);

  return (
    <textarea
      className="GlyphTextArea"
      value={value}
      // Blur event
      onBlur={() => {
        console.log("GlyphTextArea#onBlur");
        // Store text area state
        const textArea = textAreaRef.current;
        if (!textArea) {
          console.warn("textArea is null");
          return;
        }
        dispatch((state) => ({
          ...state,
          selectionStart: textArea.selectionStart,
          selectionEnd: textArea.selectionEnd,
        }));
      }}
      // Select event
      onSelect={(ev) => {
        const textArea = ev.currentTarget;

        dispatch((state) => ({
          ...state,
          selectionStart: textArea.selectionStart,
          selectionEnd: textArea.selectionEnd,
        }));

        onSelect && onSelect(textArea.selectionStart, textArea.selectionEnd);
      }}
      ref={textAreaRef}
      // Change event
      onChange={(ev) =>
        onChange(ev.target.value, {
          start: 0,
          end: ev.target.selectionEnd,
          text: "", // TODO: FIXME
        })
      }
    />
  );
};
