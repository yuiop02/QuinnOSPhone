const suites = [
  require('./quinnCorrectionState.test.js'),
  require('./quinnAppState.test.js'),
  require('./quinnSessionArc.test.js'),
  require('./quinnThreadContinuity.test.js'),
  require('./quinnSpeechText.test.js'),
];

let failures = 0;
let total = 0;

for (const suite of suites) {
  for (const testCase of suite.cases) {
    total += 1;

    try {
      testCase.run();
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${testCase.name}`);
      console.error(error && error.stack ? error.stack : error);
    }
  }
}

if (failures > 0) {
  console.error(`${failures} of ${total} Quinn tests failed.`);
  process.exit(1);
}

console.log(`All ${total} Quinn tests passed.`);
