export function createMeasurementIdCustomJSVariable(data: {
  [x: string]: any;
}) {
  const stagingMeasurementId = data['stagingMeasurementId'];
  const stagingUrl = data['stagingUrl'];
  const productionMeasurementId = data['productionMeasurementId'];
  const productionUrl = data['productionUrl'];

  const measurementIdCustomJS = `function() {\n  
        var MEASUREMENT_ID_STAGING = '${stagingMeasurementId}'\n  
        var MEASUREMENT_ID_PROD = '${productionMeasurementId}'\n\n  
        var originUrl = window.origin\n\n  
        if(originUrl === '${stagingUrl}') return MEASUREMENT_ID_STAGING\n  
        if(originUrl === '${productionUrl}') return MEASUREMENT_ID_PROD\n\n  
        throw new Error('Invalid environment provided')\n
      }\n`;
  return measurementIdCustomJS;
}
