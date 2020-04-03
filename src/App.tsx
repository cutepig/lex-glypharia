import styles from "./App.module.css";

import React from "react";
import { GlyphDoodle } from "./GlyphDoodle";

const App: React.FC = () => {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Lex Glypharia</h1>
      </header>

      <main>
        <GlyphDoodle />
      </main>
    </div>
  );
};

export default App;
