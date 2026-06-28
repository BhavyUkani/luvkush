const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'luvkush_natural' });
  const [cols] = await conn.query("DESCRIBE users");
  console.log('COLUMNS:', cols.map(c => c.Field).join(', '));
  const [rows] = await conn.query("SELECT id, email, role, first_name, last_name FROM users WHERE role IN ('admin','super_admin') ORDER BY id");
  console.log('ADMINS:', JSON.stringify(rows, null, 2));
  const [custs] = await conn.query("SELECT id, email, role, first_name FROM users WHERE role = 'customer' ORDER BY id LIMIT 3");
  console.log('CUSTOMERS:', JSON.stringify(custs, null, 2));
  await conn.end();
})().catch(e => console.error('DB ERROR:', e.message));
