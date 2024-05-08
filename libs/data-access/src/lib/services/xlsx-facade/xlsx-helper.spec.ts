import {
  filterGtmSpecsFromData,
  convertSpecStringToObject,
} from './xlsx-helper';

describe('Helper Functions', () => {
  describe('filterGtmSpecsFromData', () => {
    it.each([
      [
        [
          { randomKey: '{"test": "value"}' },
          { randomKey: 'window.dataLayer.push({action: testAction})' },
          { randomKey: 'invalid_data' },
        ],
        [{ randomKey: 'window.dataLayer.push({action: testAction})' }],
      ],
      [[{ randomKey: 'invalid_data' }, { randomKey: 'also_invalid' }], []],
    ])(
      'should filter data based on provided input',
      (input, expectedOutput) => {
        expect(filterGtmSpecsFromData(input)).toEqual(expectedOutput);
      }
    );
  });

  describe('convertSpecStringToObject', () => {
    it.each([
      [
        { randomKey: "window.dataLayer.push({'event': 'testEvent'})" },
        { event: 'testEvent' },
      ],
      [{ randomKey: 'invalid_string' }, null],
      // missing key quotes
      [
        { randomKey: "window.dataLayer.push({event': 'testEvent'})" },
        { event: 'testEvent' },
      ],
      [
        { randomKey: "window.dataLayer.push({'event: 'testEvent'})" },
        { event: 'testEvent' },
      ],
      [
        { randomKey: "window.dataLayer.push({event: 'testEvent'})" },
        { event: 'testEvent' },
      ],
      // missing value quotes
      [
        { randomKey: "window.dataLayer.push({'event': testEvent'})" },
        { event: 'testEvent' },
      ],
      [
        { randomKey: "window.dataLayer.push({'event': testEvent})" },
        { event: 'testEvent' },
      ],
      [
        { randomKey: "window.dataLayer.push({'event': 'testEvent})" },
        { event: 'testEvent' },
      ],
      // missing either key or value quotes
      [
        { randomKey: "window.dataLayer.push({event': testEvent'})" },
        { event: 'testEvent' },
      ],
      [
        { randomKey: "window.dataLayer.push({'event: 'testEvent})" },
        { event: 'testEvent' },
      ],
      [
        { randomKey: "window.dataLayer.push({'event: testEvent'})" },
        { event: 'testEvent' },
      ],
      [
        { randomKey: "window.dataLayer.push({event': 'testEvent})" },
        { event: 'testEvent' },
      ],
      // missing both key and value quotes
      [
        { randomKey: 'window.dataLayer.push({event: testEvent})' },
        { event: 'testEvent' },
      ],
      // Nested Objects
      [
        {
          randomKey: "window.dataLayer.push({'nested': {'innerKey': 'value'}})",
        },
        { nested: { innerKey: 'value' } },
      ],
      // Nested Arrays
      [
        {
          randomKey:
            "window.dataLayer.push({'array': [1, 'two', { 'key': 'value' }]})",
        },
        { array: [1, 'two', { key: 'value' }] },
      ],

      // Whitespace Variations
      [
        { randomKey: "window.dataLayer.push( { 'event' : 'testEvent' } )" },
        { event: 'testEvent' },
      ],

      // Mixed Quotation
      [
        { randomKey: 'window.dataLayer.push({"event": \'testEvent\'})' },
        { event: 'testEvent' },
      ],

      // Keys with Special Characters
      [
        { randomKey: 'window.dataLayer.push({"special-key": "value"})' },
        { 'special-key': 'value' },
      ],
      [
        { randomKey: 'window.dataLayer.push({"key with spaces": "value"})' },
        { 'key with spaces': 'value' },
      ],
    ])('should convert spec string to object', (input, expectedOutput) => {
      expect(convertSpecStringToObject(input)).toEqual(expectedOutput);
    });
  });
});
