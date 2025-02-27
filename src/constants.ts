'use strict';
const ROOT_PROJECT_NAME = 'tag_check_projects';
const ROOT_DATABASE_NAME = 'data.sqlite3';
const DEFAULT_PORT = '7001';
const DEFAULT_WEB_SOCKET = '7002';
const URLs = [
  'http://localhost:7070/health',
  'http://localhost:6060/health',
  'http://localhost:7001/health'
];

export {
  ROOT_PROJECT_NAME,
  ROOT_DATABASE_NAME,
  URLs,
  DEFAULT_PORT,
  DEFAULT_WEB_SOCKET
};
