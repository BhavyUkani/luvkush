const jwt = require('jsonwebtoken');
const secret = 'luvkush-jwt-secret-2026-change-in-prod';

const adminToken = jwt.sign(
  { userId: 1, email: 'admin@luvkushnatural.com', role: 'super_admin' },
  secret,
  { expiresIn: '8h' }
);

const custToken = jwt.sign(
  { userId: 3, email: 'customer@test.com', role: 'customer' },
  secret,
  { expiresIn: '8h' }
);

const adminUser = JSON.stringify({ id: 1, email: 'admin@luvkushnatural.com', first_name: 'Admin', last_name: 'User', role: 'super_admin' });
const custUser = JSON.stringify({ id: 3, email: 'customer@test.com', first_name: 'Test', last_name: 'Customer', role: 'customer' });

console.log(JSON.stringify({ adminToken, custToken, adminUser, custUser }));
