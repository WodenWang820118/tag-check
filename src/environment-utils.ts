function getEnvironment() {
  return process.env.NODE_ENV || 'prod';
}

export { getEnvironment };
