import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(import.meta.url);

fs.readFile(__dirname, () => {
  console.log("this is readFile 1");
});

process.nextTick(() => console.log("this is process.nextTick 1"));
Promise.resolve().then(() => console.log("this is Promise.resolve 1"));
setTimeout(() => console.log("this is setTimeout 1"), 0);

for (let i = 0; i < 2000000000; i++) {
  if (i === 1999999999) {
    console.log("for loop 1 finished");
  }
}
