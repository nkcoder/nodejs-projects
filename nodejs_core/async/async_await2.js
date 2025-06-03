async function task1() {
  console.log('task1 start');
  // await new Promise((resolve) => {
  //   console.log('in task1 promise');
  //   resolve('task1 promise resolved');
  // });
  await Promise.resolve(() => console.log('in task1 promise'));
  console.log('task1 end');
}

async function task2() {
  console.log('task2 start');
  // await new Promise((resolve) => {
  //   console.log('in task2 promise');
  //   resolve('task2 promise resolved');
  // });
  await Promise.resolve(() => console.log('in task2 promise'));
  console.log('task2 end');
}

// Run both tasks
task1();
task2();

console.log('main end');
