
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('Promise rejected from timeout.');
  }, 0);

  resolve('Promise resolved.');

  setTimeout(() => {
    resolve('Promise resolved from timeout.');
  }, 0);

  console.log('End of Promise');
});

promise.then(data => console.log(data)).catch(error => console.log(error));

// Key Takeaways
// 	•	A promise can only be resolved or rejected once.
// 	•	Once resolved, any further calls to resolve() or reject() are ignored.
// 	•	Asynchronous operations (setTimeout) are queued and executed later, but they can’t override a promise’s state once it’s settled.