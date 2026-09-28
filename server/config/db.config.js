const path = require('path');
require('dotenv').config();

/**
 * Single switch point between the local database and a future cloud one.
 * server/db/connection.js is the only other file that reads this — every
 * route and repository function calls connection.js, never a driver
 * directly, so flipping DB_MODE to "cloud" and filling in the cloud
 * branch in connection.js is the entire migration.
 */
module.exports = {
  mode: process.env.DB_MODE || 'local', // 'local' | 'cloud'

  local: {
    filePath: process.env.LOCAL_DB_PATH || path.join(__dirname, '..', '..', 'data', 'dairy.db'),
  },

  cloud: {
    // Not implemented yet. When you're ready to move off this computer,
    // set DB_MODE=cloud, fill this in (or add whatever fields your
    // provider needs), and implement the cloud branch in
    // server/db/connection.js.
    connectionString: process.env.CLOUD_DATABASE_URL || null,
  },
};
