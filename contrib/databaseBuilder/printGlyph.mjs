for (const arg of process.argv.slice(2)) {
  console.log(String.fromCodePoint(parseInt(arg, 16)));
}
