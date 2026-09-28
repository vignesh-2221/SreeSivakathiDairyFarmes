require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 4000,
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-secret-change-me-before-going-live',
  nodeEnv: process.env.NODE_ENV || 'development',
};
