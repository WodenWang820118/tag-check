import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirestoreDestinationPipelineService } from '../../../../shared/services/firestore-destination-pipeline/firestore-destination-pipeline.service';
import { Destination } from '../../../../shared/models/destination.model';
import { MapComponent } from './map.component';

describe('MapComponent', () => {
  const mockDestinations: Destination[] = [
    {
      id: 'dest-1',
      title: 'Tokyo Lights',
      country: 'Japan',
      city: 'Tokyo',
      latitude: 35.68,
      longitude: 139.76,
      description: 'A city break.',
      price: 1299,
      imageBig: '',
      imageBigAuthorInfo: '',
      image1: '',
      image1AuthorInfo: '',
      image2: '',
      image2AuthorInfo: '',
      image3: '',
      image3AuthorInfo: '',
      smallTitle: 'Japan',
      video: ''
    }
  ];

  const pipelineServiceMock = {
    getAllDestinationsData: vi.fn(() => of(mockDestinations))
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    pipelineServiceMock.getAllDestinationsData.mockClear();
    pipelineServiceMock.getAllDestinationsData.mockReturnValue(
      of(mockDestinations)
    );

    TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        {
          provide: FirestoreDestinationPipelineService,
          useValue: pipelineServiceMock
        }
      ]
    });
  });

  it('transforms destinations to GeoJSON correctly', () => {
    const fixture = TestBed.createComponent(MapComponent);
    const component = fixture.componentInstance;

    const feature = component.transformDestinationToGeoJson(
      mockDestinations[0]
    );

    expect(feature).toEqual({
      type: 'Feature',
      properties: {
        country: 'Japan',
        name: 'Tokyo Lights'
      },
      geometry: {
        type: 'Point',
        coordinates: [139.76, 35.68]
      }
    });
  });

  it('fetches all destinations asynchronously via firstValueFrom in ngAfterViewInit', async () => {
    const fixture = TestBed.createComponent(MapComponent);
    const component = fixture.componentInstance;
    vi.spyOn(component, 'initializeMap').mockImplementation(vi.fn());

    await component.ngAfterViewInit();

    expect(pipelineServiceMock.getAllDestinationsData).toHaveBeenCalledTimes(1);
    expect(component.destinations).toEqual(mockDestinations);
    expect(component.initializeMap).toHaveBeenCalledWith({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            country: 'Japan',
            name: 'Tokyo Lights'
          },
          geometry: {
            type: 'Point',
            coordinates: [139.76, 35.68]
          }
        }
      ]
    });
  });
});
