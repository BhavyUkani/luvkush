const path = require('path');

const serverDistPath = path.join(__dirname, '../dist/luvkush-natural/server/server.mjs');

module.exports = import(serverDistPath).then(module => {
  // Call the exported app() function to get the Express app instance
  return module.app();
});
