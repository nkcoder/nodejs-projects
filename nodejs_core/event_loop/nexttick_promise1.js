console.log('This is the start of the script.');

Promise.resolve().then(() => {
  console.log('This is promise.resolve 1.');
});

process.nextTick(() => {
  console.log('This is process.nextTick 1.');
});

console.log('This is the end of the script.');