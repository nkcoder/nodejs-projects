setImmediate(() => console.log("this is setImmediate 1"));
setImmediate(() => {
  console.log("this is setImmediate 2");
  Promise.resolve().then(() => console.log("this is Promise.resolve 1"));
  process.nextTick(() => console.log("this is process.nextTick 1"));
});
setImmediate(() => console.log("this is setImmediate 3"));

Promise.resolve().then(() => console.log("promise 1"));
process.nextTick(() => console.log("nextTick 1"));
Promise.resolve().then(() => console.log("promise 2"));
process.nextTick(() => console.log("nextTick 2"));
