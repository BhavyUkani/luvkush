const path = require('path');

// Dynamic import of the compiled server.mjs from Angular SSR output
const serverDistPath = path.join(process.cwd(), 'dist/luvkush-natural/server/server.mjs');

module.exports = import(serverDistPath).then(module => {
  // Call the exported app() function to get the Express app instance
  return module.app();
});
