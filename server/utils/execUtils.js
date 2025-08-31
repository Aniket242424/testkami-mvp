const { exec } = require('child_process');
const { promisify } = require('util');

// Promisified version of exec
const execAsync = promisify(exec);

// Regular exec function
const execSync = require('child_process').execSync;

module.exports = {
  exec,
  execAsync,
  execSync
};
