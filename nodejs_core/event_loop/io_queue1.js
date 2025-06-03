import { readFile } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

readFile(__filename, () => {
  console.log("this is readFile 1");
});

process.nextTick(() => console.log("this is process.nextTick 1"));
Promise.resolve().then(() => console.log("this is Promise.resolve 1"));
