export default {
  displayName: 'data-access',
  preset: '../../jest.preset.mjs',
  coverageDirectory: '../../coverage/libs/data-access',
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  transform: {
    '^.+\\.[tj]s$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'mts']
};
