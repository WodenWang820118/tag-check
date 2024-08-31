const { spawn } = require('child_process');
const path = require('path');

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

(async () => {
  try {
    // Run npm install in the specified directory
    await runCommand(
      'npm install --prefer-offline --no-audit --progress=false --omit=dev && \
       npm install sqlite3 --prefer-offline --no-audit --progress=false --omit=dev',
      {
        cwd: path.join(__dirname, 'dist/apps/nest-backend'),
        stdio: 'inherit',
      }
    );

    console.log('npm install completed successfully');
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
})();
