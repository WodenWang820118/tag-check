const { spawn } = require('child_process');

// Helper function to run a command and return a promise
const runCommand = (command, options) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { ...options, shell: true });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} failed with code ${code}`));
      } else {
        resolve();
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
};

module.exports = {
  runCommand,
};
