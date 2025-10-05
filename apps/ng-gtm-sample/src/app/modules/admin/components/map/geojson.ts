import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';

export const geojson: GeoJSON.GeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'New York City',
      },
      geometry: {
        type: 'Point',
        coordinates: [-73.778137, 40.641312],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'London',
      },
      geometry: {
        type: 'Point',
        coordinates: [-0.454296, 51.47002],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Beijing',
      },
      geometry: {
        type: 'Point',
        coordinates: [116.597504, 40.072498],
      },
    },
  ],
};
