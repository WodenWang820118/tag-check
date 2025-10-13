import { forkJoin, from } from 'rxjs';
import Dexie, { Table, liveQuery } from 'dexie';
import { Destination, DestinationDto } from './shared/models/destination.model';

export class Destinations extends Dexie {
  destinations!: Table<Destination, string>;
  featuredDestinations!: Table<Destination, string>;

  constructor() {
    super('ng-gtm-integration');
    this.version(3).stores({
      destinations: '++id, [country+city]',
      featuredDestinations: '++id, [country+city]',
    });

    this.destinations.mapToClass(DestinationDto);
    this.featuredDestinations.mapToClass(DestinationDto);
  }

  getDestinations() {
    return liveQuery(() => {
      console.log('Getting destinations from IndexedDB');
      return this.destinations.toArray();
    });
  }

  addDestinations(destinations: Destination[]) {
    const addOperations = destinations.map((destination) => {
      return from(this.destinations.add(destination));
    });

    return forkJoin(addOperations);
  }

  addDestination(destination: Destination) {
    return from(this.destinations.add(destination));
  }

  getDestinationsByCountryAndCity(country: string, city: string) {
    return liveQuery(() => {
      return this.destinations
        .where('[country+city]')
        .equals([country, city])
        .toArray();
    });
  }

  getFeaturedDestinations() {
    return liveQuery(() => {
      console.log('Getting destinations from IndexedDB');
      return this.featuredDestinations.toArray();
    });
  }

  addFeaturedDestinations(destinations: Destination[]) {
    const addOperations = destinations.map((destination) => {
      return from(this.featuredDestinations.add(destination));
    });

    return forkJoin(addOperations);
  }

  addFeaturedDestination(destination: Destination) {
    return from(this.featuredDestinations.add(destination));
  }

  getFeaturedDestinationsByCountryAndCity(country: string, city: string) {
    return liveQuery(() => {
      return this.featuredDestinations
        .where('[country+city]')
        .equals([country, city])
        .toArray();
    });
  }
}

export const db = new Destinations();
console.log('db schema created: ', db.destinations);
