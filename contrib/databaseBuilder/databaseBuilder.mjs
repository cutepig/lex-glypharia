import fs from "fs";
import { promisify } from "util";
import parse from "csv-parse";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const dictionaryOutputFile = "src/dictionary.json";

function* drop(count, iter) {
  console.log("drop", iter);
  let value = iter.next();
  for (let i = 0; i < count && !value.done; i++) {
    value = iter.next();
  }

  for (const value of iter) {
    yield value;
  }
}

main(process.argv.slice(2)).then(
  () => console.log("Great success"),
  error => {
    console.error(error);
    process.exit(1);
  },
);

// Use this to hack your way into the right glyph:
//   http://medu.ipetisut.com/index.php?og=buttocks&ml=0&mucn=O90
// Or this:
//   https://commons.wikimedia.org/wiki/Category:Hieroglyphs_G10_-_G99
// Change the last parameter `mucn` and you should see
// the glyph on the page on the right side.
// Then use our tool to find the right one. It may be a variant
// in the same category or it could be reassigned from unclassified.

const hackMap = {
  Y1V: "Y1",
  X6: "X6A",
  // This might be questionable
  // B12 (woman sitting with sistrum) -> B9 (woman standing with sistrum)
  // Although other sources claim that:
  // B12 (woman on knees spreading hands) and B9 (woman sitting holding something)
  B12: "B9",
  // O6 (building) with T1 (mace), like O8 but without X1
  O90: "O8",
  // In this O6 is horizontally inverted
  O90A: "O8",
  // This is an G17 (owl) with overlaid D40 (forearm holding a stick)
  // Let's make it G20 for now
  G87: "G20",
};

/**
 * @param {string} name
 * @param {Record<string, any>} glyphMap
 */
function findGlyph(name, glyphMap) {
  const m = /^[A-Z]+[a-z]*/.exec(name);
  const category = m && m[0];
  if (!category || !(category in glyphMap)) {
    // console.warn(`\nNo category "${category}"`);
    // console.log([category, name, m], "\n");
    return null;
  }
  const entry = glyphMap[category].find(g => g.gardiner === name);
  if (!entry) {
    // console.warn(`\nNo glyph "${name}"`);
    // console.log([category, name], "\n");
  }
  return entry && entry.glyph;
}

async function main(csvFiles) {
  /**
   * @typedef {Object} IDictionaryNode
   * @property {IDictionaryEntry[]} entries
   * @property {Record<string, IDictionaryNode>} next
   */
  /** @var {Record<string, IDictionaryNode>} dictionary */
  const dictionary = {};

  const { glyphMap } = JSON.parse(await readFile("src/glyphMap.json", { encoding: "utf-8" }));

  for (const csvFile of csvFiles) {
    // const csv = await readFile(csvFile, { encoding: "utf-8" });
    const parser = parse({
      columns: [
        "unknown1",
        "unknown2",
        "illustration",
        "glyphs",
        "transliteration",
        "translation",
        "notes",
      ],
      ltrim: true,
      from_line: 2,
      skip_empty_lines: true,
    });

    const csvStream = fs.createReadStream(csvFile, { encoding: "utf-8" });
    csvStream.pipe(parser);

    for await (const record of parser) {
      // glyphs -> array/string
      // Store entry in to the dictionary by building up nodes
      // glyph by glyph.
      // console.log("\n", record, "\n");

      const names = record.glyphs
        // Remove extra whitespace
        .replace(/\s+/g, "")
        // Each symbol is separated by line
        .split("-")
        // Recategorize J with Aa
        .map(name => name.replace(/^J/g, "Aa"));

      const glyphs = names
        // Convert to glyph by looking it up from glyphMap
        .map(name => {
          const glyph =
            // Find direct match
            findGlyph(name, glyphMap) ||
            // Check for some hard-coded aliases
            findGlyph(hackMap[name], glyphMap) ||
            // Try to strip A from the end
            findGlyph(name.replace(/[A-Za-z]+$/, ""), glyphMap);
          // In addition we can try adding `A` to the end

          return glyph;
        });

      if (glyphs.some(g => !g)) {
        console.log(`Skipping "${record.glyphs}"`);
        continue;
      }

      // Insert to dictionary
      let next = dictionary;
      let node;
      for (const c of glyphs) {
        next[c] = next[c] || { entries: [], next: {} };
        node = next[c];
        next = node.next;
      }

      // Eliminate doubles
      const glyphString = glyphs.join("");
      if (
        !node.entries.find(
          n =>
            n.translation !== record.translation &&
            n.transliteration !== record.transliteration &&
            n.glyphs !== glyphString,
        )
      ) {
        node.entries.push({
          translation: record.translation,
          transliteration: record.transliteration,
          glyphs: glyphString,
        });
      }
    }
  }

  await writeFile(dictionaryOutputFile, JSON.stringify(dictionary, null, 2), { encoding: "utf-8" });
}
