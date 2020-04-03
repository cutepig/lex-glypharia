import fs from "fs";
import { promisify } from "util";
import fetch from "node-fetch";
import cheerio from "cheerio";

const writeFile = promisify(fs.writeFile);

const glyphMapOutputFile = "src/glyphMap.json";
const glyphsWikipediaUrl = "https://en.wikipedia.org/wiki/List_of_Egyptian_hieroglyphs";

const glyphCategories = {
  A: "Man and his occupations",
  B: "Woman and her occupations",
  C: "Anthropomorphic deities",
  D: "Parts of the human body",
  E: "Mammals",
  F: "Parts of mammals",
  G: "Birds",
  H: "Parts of birds",
  I: "Amphibious animals, reptiles, etc.",
  K: "Fish and parts of fish",
  L: "Invertebrates and lesser animals",
  M: "Trees and plants",
  N: "Sky, earth, water",
  NL: "Nomes of Lower Egypt",
  NU: "Nomes of Upper Egypt",
  O: "Buildings, parts of buildings, etc.",
  P: "Ships and parts of ships",
  Q: "Domestics and funerary furniture",
  R: "Temple furniture and sacred emblems",
  S: "Crowns, dress, staves, etc.",
  T: "Warfare, hunting, and butchery",
  U: "Agriculture, crafts, and professions",
  V: "Rope, fiber, baskets, bags, etc.",
  W: "Vessels of stone and earthenware",
  X: "Loaves and cakes",
  Y: "Writings, games, music",
  Z: "Strokes, signs derived from Hieratic, geometrical figures",
  Aa: "Unclassified",
};

main().then(
  () => console.log("Great success!"),
  error => {
    console.error(error);
    process.exit(-1);
  },
);

async function main() {
  const glyphMap = await loadGlyphs();
  await writeFile(glyphMapOutputFile, JSON.stringify({ glyphCategories, glyphMap }, null, 2), {
    encoding: "utf-8",
  });
}

async function loadGlyphs() {
  const glyphMap = Object.entries(glyphCategories).reduce((o, [key]) => {
    o[key] = [];
    return o;
  }, {});

  const res = await fetch(glyphsWikipediaUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  $("table.wikitable tbody tr").each((_i, tr) => {
    const glyph = $("td:nth-child(1) span:last-child", tr)
      .text()
      .trim();
    const gardiner = $("td:nth-child(2)", tr)
      .text()
      .trim();
    const unicode = $("td:nth-child(3)", tr)
      .text()
      .trim();
    const description = $("td:nth-child(4)", tr)
      .text()
      .trim();
    const transliteration = $("td:nth-child(5)", tr)
      .text()
      .trim();
    const phonetic = $("td:nth-child(6)", tr)
      .text()
      .trim();
    const notes = $("td:nth-child(6)", tr)
      .text()
      .trim();

    const categoryMatch = /^[a-z]+/i.exec(gardiner);
    const category = categoryMatch && categoryMatch[0];

    const hexMatch = /[0-9a-f]+$/i.exec(unicode);
    const hex = hexMatch && parseInt(hexMatch[0], 16);

    if (category && hex) {
      glyphMap[category].push({
        glyph: glyph || String.fromCodePoint(hex),
        gardiner,
        unicode,
        hex,
        description,
        transliteration,
        phonetic,
        notes,
      });
    }
  });

  return glyphMap;
}
