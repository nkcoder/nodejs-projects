import { fileURLToPath } from "url";
import { readFile } from "fs";
const __filename = fileURLToPath(import.meta.url);

setTimeout(() => console.log("this is setTimeout 1"), 0);

readFile(__filename, () => {
  console.log("this is readFile 1");
});

// ❯ node io_queue2.js
// this is readFile 1
// this is setTimeout 1

// ❯ node io_queue2.js
// this is readFile 1
// this is setTimeout 1

// ❯ node io_queue2.js
// this is setTimeout 1
// this is readFile 1

// ❯ node io_queue2.js
// this is readFile 1
// this is setTimeout 1

// ❯ node io_queue2.js
// this is readFile 1
// this is setTimeout 1
