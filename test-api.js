const http = require('http');

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m'
};

async function testEndpoint(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`\n${colors.cyan}========== Testing Health Endpoint ==========${colors.reset}\n`);
  try {
    const health = await testEndpoint('GET', '/health');
    console.log(`${colors.green}✓ Health endpoint working${colors.reset}`);
    console.log(JSON.stringify(health.data, null, 2));
  } catch (error) {
    console.log(`${colors.red}✗ Health endpoint failed: ${error.message}${colors.reset}`);
  }


  console.log(`\n${colors.cyan}========== Testing Leaderboard Endpoint ==========${colors.reset}\n`);
  try {
    const leaderboard = await testEndpoint('GET', '/top/10?offset=0&timeRange=all');
    console.log(`${colors.green}✓ Leaderboard endpoint working${colors.reset}`);
    console.log('Full response:', JSON.stringify(leaderboard.data, null, 2));
  } catch (error) {
    console.log(`${colors.red}✗ Leaderboard endpoint failed: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.cyan}========== Testing Score Submission ==========${colors.reset}\n`);
  try {
    const body = {
      playerId: `test-player-${Date.now()}`,
      playerName: 'Test Player',
      score: 1000
    };
    const score = await testEndpoint('POST', '/score', body);
    console.log(`${colors.green}✓ Score submission working${colors.reset}`);
    console.log('Full response:', JSON.stringify(score.data, null, 2));
  } catch (error) {
    console.log(`${colors.red}✗ Score submission failed: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.cyan}========== Testing Player Rank ==========${colors.reset}\n`);
  try {
    const rank = await testEndpoint('GET', '/around/player-001?timeRange=all');
    console.log(`${colors.green}✓ Player rank endpoint working${colors.reset}`);
    console.log('Full response:', JSON.stringify(rank.data, null, 2));
  } catch (error) {
    console.log(`${colors.red}✗ Player rank failed: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.cyan}========== Summary ==========${colors.reset}\n`);
  console.log(`${colors.green}API testing complete!${colors.reset}\n`);
}

runTests().catch(console.error);
