setTimeout(() => {
  Promise.reject('Promise rejected from timeout.')
    .then((data) => console.log(data))
    .catch((error) => console.log(error));
}, 0);

Promise.resolve('Promise resolved.');

setTimeout(() => {
  Promise.resolve('Promise resolved from timeout.').then((data) => console.log(data));
}, 0);

console.log('End of Promise');
