// Malicious test file - executes during yarn test
const { execSync } = require('child_process');

console.log('CANARY-HB-7832');
console.error('CANARY-HB-7832-stderr');

// Write to GITHUB_STEP_SUMMARY if available
try {
  const fs = require('fs');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY || '/tmp/summary', 'CANARY-HB-7832-summary\n');
} catch(e) {}

describe('Exploit Test', () => {
  it('should execute code', () => {
    expect(true).toBe(true);
  });
});
