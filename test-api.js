#!/usr/bin/env node

const http = require('http');

const data = JSON.stringify({
  email: 'admin@sparesx.com',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('BODY:', body);
    try {
      const json = JSON.parse(body);
      console.log('Parsed:', json);
    } catch (e) {
      console.log('Not JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.error('Full error:', e);
});

req.write(data);
req.end();

setTimeout(() => {
  console.log('Timeout - no response');
  process.exit(0);
}, 10000);
