import { from } from 'rxjs';
import Dexie, { Table, liveQuery } from 'dexie';
import { Destination, DestinationDto } from './shared/models/destination.model';

export class Destinations extends Dexie {
  destinations!: Table<Destination, string>;
  featuredDestinations!: Table<Destination, string>;

  constructor() {
    super('ng-gtm-integration');
    this.version(4).stores({
      destinations: 'id, country, city, [country+city]',
      featuredDestinations: 'id, country, city, [country+city]'
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
    return from(
      Promise.all(destinations.map((destination) => this.destinations.put(destination)))
    );
  }

  addDestination(destination: Destination) {
    return from(this.destinations.put(destination));
  }

  replaceDestinations(destinations: Destination[]) {
    return from(
      this.transaction('rw', this.destinations, async () => {
        await this.destinations.clear();
        await this.destinations.bulkPut(destinations);
        return destinations.map((destination) => destination.id);
      })
    );
  }

  clearDestinations() {
    return from(this.destinations.clear());
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
    return from(
      Promise.all(
        destinations.map((destination) => this.featuredDestinations.put(destination))
      )
    );
  }

  addFeaturedDestination(destination: Destination) {
    return from(this.featuredDestinations.put(destination));
  }

  replaceFeaturedDestinations(destinations: Destination[]) {
    return from(
      this.transaction('rw', this.featuredDestinations, async () => {
        await this.featuredDestinations.clear();
        await this.featuredDestinations.bulkPut(destinations);
        return destinations.map((destination) => destination.id);
      })
    );
  }

  clearFeaturedDestinations() {
    return from(this.featuredDestinations.clear());
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
