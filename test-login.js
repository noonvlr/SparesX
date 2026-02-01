const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = '$2b$10$hF9NXOaeZdGmI0F6ihdiAO9N5HJO9g1WgGjfN6.zdeWaySrg2914C';

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log('Password matches:', result);
  }
});
