async function task1() {
  console.log('task1 start');
  // This await only blocks task1's execution
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('task1 end');
}

async function task2() {
  console.log('task2 start');
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('task2 end');
}

// Run both tasks
task1();
task2();

console.log('main end');