import React from "react";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Lex Glypharia</h1>
      </header>

      <main>
        <form
          className="Form"
          onChange={ev => console.log("form#onChange", ev)}
          onSubmit={ev => (
            ev.preventDefault(), console.log("form#onSubmit", ev)
          )}
        >
          <label>
            <span>Input:</span>
            <input type="text" name="input" />
          </label>
        </form>
      </main>
    </div>
  );
};

export default App;
