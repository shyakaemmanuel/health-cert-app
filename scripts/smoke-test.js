const axios = require('axios');

async function main() {
  const backend = process.env.BACKEND_URL || process.argv[2] || 'http://localhost:5000';
  console.log('Smoke test target backend:', backend);

  try {
    const health = await axios.get(`${backend.replace(/\/$/, '')}/api/health`, { timeout: 5000 });
    console.log('Health:', health.data);
  } catch (err) {
    console.error('Health check failed:', err.message);
    process.exitCode = 2;
    return;
  }

  if (process.env.SMOKE_TEST_EMAIL && process.env.SMOKE_TEST_PASSWORD) {
    try {
      console.log('Running auth smoke test with env-provided credentials...');
      const login = await axios.post(
        `${backend.replace(/\/$/, '')}/api/auth/login`,
        {
          email: process.env.SMOKE_TEST_EMAIL,
          password: process.env.SMOKE_TEST_PASSWORD,
        },
        { timeout: 5000 }
      );
      console.log('Login OK, token length:', (login.data.token || '').length);
    } catch (err) {
      console.error('Auth smoke test failed:', err.response ? err.response.data : err.message);
      process.exitCode = 3;
      return;
    }
  } else {
    console.log('Skipping auth smoke test (no SMOKE_TEST_EMAIL/SMOKE_TEST_PASSWORD set).');
  }

  console.log('Smoke test completed successfully.');
}

main();
