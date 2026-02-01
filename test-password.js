const bcrypt = require('bcryptjs');

async function testPassword() {
  const hash = '$2b$10$.1sx4zCYrJ9HMO5MFIZLc.9xKPg.Y6KL3/UReI9ZZ74pGVsCy3M.i';
  const password = 'admin123';
  
  const match = await bcrypt.compare(password, hash);
  console.log('Password match:', match);
}

testPassword();
