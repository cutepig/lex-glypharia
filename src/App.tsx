import React from "react";
import "./App.css";
import { GlyphDoodle } from "./GlyphDoodle";

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Lex Glypharia</h1>
      </header>

      <main className="app-main">
        <GlyphDoodle />
      </main>
    </div>
  );
};

export default App;
