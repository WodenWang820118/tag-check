'use strict';
function getEnvironment() {
  return process.env.NODE_ENV || 'prod';
}

module.exports = { getEnvironment };
