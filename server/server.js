const app = require('./app');
const appConfig = require('./config/app.config');

app.listen(appConfig.port, () => {
  console.log(`Sree Sivasakthi Dairy Farm server running at http://localhost:${appConfig.port}`);
  console.log(`  Home:      http://localhost:${appConfig.port}/index.html`);
  console.log(`  Register:  http://localhost:${appConfig.port}/register.html`);
  console.log(`  Login:     http://localhost:${appConfig.port}/login.html`);
  console.log(`  Admin:     http://localhost:${appConfig.port}/admin.html`);
});
