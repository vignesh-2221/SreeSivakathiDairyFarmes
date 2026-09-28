const path = require('path');
const express = require('express');
const session = require('express-session');
const appConfig = require('./config/app.config');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const ordersRoutes = require('./routes/orders.routes');

const app = express();

app.disable('x-powered-by');
app.use(express.json());

app.use(
  session({
    name: 'ssd.sid',
    secret: appConfig.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: appConfig.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use('/api', authRoutes);
app.use('/api', ordersRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback error handler — keeps stack traces out of API responses.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' });
});

module.exports = app;
