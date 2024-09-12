const { runCommand } = require('./main-process/command-utils.cjs');
const { join } = require('path');

(async () => {
  try {
    // Run npm install in the specified directory
    await runCommand(
      'npm install --prefer-offline --no-audit --progress=false --omit=dev && \
       npm install --prefer-offline sqlite3 --no-audit --progress=false --omit=dev',
      {
        cwd: join(__dirname, 'dist/apps/nest-backend'),
        stdio: 'inherit',
      }
    );

    console.log('npm install completed successfully');
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
})();
