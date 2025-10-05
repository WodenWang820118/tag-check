import { Component, OnInit } from '@angular/core';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import { FirestoreDestinationPipelineService } from '../../../../shared/services/firestore-destination-pipeline/firestore-destination-pipeline.service';
import { take, tap } from 'rxjs';
import { Destination } from '../../../../shared/models/destination.model';

// TODO: should have a button to refresh the map and fetch the latest data from Firestore

@Component({
  selector: 'app-map',
  standalone: true,
  template: `<div id="chartdiv" style="height: 450px"></div>`,
  styles: [``]
})
export class MapComponent implements OnInit {
  destinations: Destination[] = [];
  constructor(
    private readonly firestoreDestinationPipelineService: FirestoreDestinationPipelineService
  ) {}

  ngOnInit(): void {
    this.firestoreDestinationPipelineService
      .getAllDestinationsData()
      .pipe(
        take(1),
        tap((data) => {
          if (data) {
            this.destinations = data;
            const geoJsonData = this.destinations.map((destination) =>
              this.transformDestinationToGeoJson(destination)
            );
            const geoJsonFeatureData: GeoJSON.GeoJSON = {
              type: 'FeatureCollection',
              features: geoJsonData
            };
            this.initializeMap(geoJsonFeatureData);
          }
        })
      )
      .subscribe();
  }

  transformDestinationToGeoJson(
    destination: Destination
  ): GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> {
    const country = destination.country;
    const name = destination.title;
    return {
      type: 'Feature',
      properties: {
        country: country,
        name: name
      },
      geometry: {
        type: 'Point',
        coordinates: [destination.longitude, destination.latitude]
      }
    };
  }

  initializeMap(geoJsonCollection: GeoJSON.GeoJSON) {
    let root = am5.Root.new('chartdiv');

    root.setThemes([am5themes_Animated.new(root), am5themes_Dark.new(root)]);

    let chart = root.container.children.push(
      am5map.MapChart.new(root, {
        projection: am5map.geoMercator()
      })
    );

    let zoomControl = chart.set(
      'zoomControl',
      am5map.ZoomControl.new(root, {
        x: am5.p0,
        centerX: am5.p0,
        y: am5.p0,
        centerY: am5.p0
      })
    );

    zoomControl.homeButton.set('visible', true);

    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow
      })
    );

    let pointSeries = chart.series.push(
      am5map.MapPointSeries.new(root, {
        geoJSON: geoJsonCollection
      })
    );

    pointSeries.bullets.push(function () {
      let circle = am5.Circle.new(root, {
        radius: 5,
        fill: am5.color(0xff0000),
        tooltipText: '{name}'
      });

      return am5.Bullet.new(root, {
        sprite: circle
      });
    });
  }
}
