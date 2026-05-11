import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  viewChild
} from '@angular/core';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import { FirestoreDestinationPipelineService } from '../../../../shared/services/firestore-destination-pipeline/firestore-destination-pipeline.service';
import { take, tap } from 'rxjs';
import { Destination } from '../../../../shared/models/destination.model';

// Enhancement: Add a refresh button to re-fetch latest data from Firestore

@Component({
  selector: 'app-map',
  standalone: true,
  template: `
    <div class="space-y-4">
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="sample-copy text-sm">
          Each marker represents a destination document currently available to
          the public storefront and the admin search flow.
        </p>
        <span
          class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          {{ destinations.length }} markers
        </span>
      </div>

      <div
        #chartHost
        class="h-[28rem] w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950"
      ></div>
    </div>
  `
})
export class MapComponent implements AfterViewInit, OnDestroy {
  destinations: Destination[] = [];
  private readonly chartHost =
    viewChild<ElementRef<HTMLDivElement>>('chartHost');
  private root: am5.Root | null = null;

  constructor(
    private readonly firestoreDestinationPipelineService: FirestoreDestinationPipelineService
  ) {}

  ngAfterViewInit(): void {
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
    const chartHost = this.chartHost()?.nativeElement;
    if (!chartHost) {
      return;
    }

    this.root?.dispose();
    const root = am5.Root.new(chartHost);
    this.root = root;
    root.setThemes([am5themes_Animated.new(root), am5themes_Dark.new(root)]);

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        projection: am5map.geoMercator()
      })
    );

    const zoomControl = chart.set(
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

    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0x0f172a),
      stroke: am5.color(0x334155)
    });

    const pointSeries = chart.series.push(
      am5map.MapPointSeries.new(root, {
        geoJSON: geoJsonCollection
      })
    );

    pointSeries.bullets.push(function () {
      const circle = am5.Circle.new(root, {
        radius: 6,
        fill: am5.color(0x60a5fa),
        stroke: am5.color(0xffffff),
        strokeWidth: 2,
        tooltipText: '{name}'
      });

      return am5.Bullet.new(root, {
        sprite: circle
      });
    });
  }

  ngOnDestroy(): void {
    this.root?.dispose();
  }
}
