const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host:'127.0.0.1', port:3306, user:'root', password:'', database:'luvkush_natural' });
  const [rows] = await conn.query("SELECT id, email, first_name, role, status FROM users WHERE role = 'customer' LIMIT 5");
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
})().catch(e => console.error('DB ERROR:', e.message));
