import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { defer, from, Observable, take } from 'rxjs';
import { Country, City } from 'country-state-city';
import { Destination } from '../../models/destination.model';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { firestore } from '../../../../app/firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class CountriesDataService {
  private readonly jsonUrl = 'assets/countries.json'; // Path to the JSON file
  private readonly uploadProgress = signal<number>(0);
  readonly uploadProgress$ = computed(() => this.uploadProgress());

  constructor(private readonly http: HttpClient) {}

  private batchUpload(destinations: Destination[]) {
    const chunkSize = 400; // Firestore allows up to 500 operations per batch, we use 400 to be safe
    const totalChunks = Math.ceil(destinations.length / chunkSize);
    let processedChunks = 0;

    for (let i = 0; i < destinations.length; i += chunkSize) {
      const chunk = destinations.slice(i, i + chunkSize);
      this.uploadChunk(chunk).pipe(take(1)).subscribe();
      processedChunks++;
      this.uploadProgress.set((processedChunks / totalChunks) * 100);
    }

    this.uploadProgress.set(100);
  }

  private uploadChunk(chunk: Destination[]) {
    const batch = writeBatch(firestore);

    for (const destination of chunk) {
      const docRef = doc(firestore, 'destinations', destination.id);
      batch.set(docRef, this.destinationToFirestoreObject(destination));
    }

    try {
      return defer(() => from(batch.commit()));
    } catch (error) {
      console.error('Error uploading chunk:', error);
      // Implement retry logic here if needed
      throw error;
    }
  }

  private destinationToFirestoreObject(destination: Destination): any {
    return {
      country: destination.country,
      city: destination.city,
      latitude: destination.latitude,
      longitude: destination.longitude,
      description: destination.description,
      id: destination.id,
      image1: destination.image1,
      image1AuthorInfo: destination.image1AuthorInfo,
      image2: destination.image2,
      image2AuthorInfo: destination.image2AuthorInfo,
      image3: destination.image3,
      image3AuthorInfo: destination.image3AuthorInfo,
      imageBig: destination.imageBig,
      imageBigAuthorInfo: destination.imageBigAuthorInfo,
      title: destination.title,
      smallTitle: destination.smallTitle,
      price: destination.price,
      video: destination.video,
    };
  }

  addDestinationToFirestore(destination: Destination) {
    return defer(() => {
      return from(
        setDoc(
          doc(firestore, 'destinations', destination.id),
          this.destinationToFirestoreObject(destination)
        )
      );
    });
  }

  getCountries(): Observable<any> {
    return this.http.get<any>(this.jsonUrl);
  }

  assembleAllDestinations() {
    // there are around 140,000 combinations of cities and countries
    const allDestinations: Destination[] = [];
    const countries = Country.getAllCountries();
    const cities = City.getAllCities();
    for (const city of cities) {
      for (const country of countries) {
        if (city.countryCode === country.isoCode) {
          if (
            city.latitude === '' ||
            city.latitude === null ||
            city.latitude === undefined
          )
            continue;
          else if (
            city.longitude === '' ||
            city.longitude === null ||
            city.longitude === undefined
          )
            continue;
          const destination: Destination = {
            country: country.name,
            city: city.name,
            latitude: parseFloat(city.latitude),
            longitude: parseFloat(city.longitude),
            description: '',
            id: uuidv4(),
            image1: '',
            image1AuthorInfo: '',
            image2: '',
            image2AuthorInfo: '',
            image3: '',
            image3AuthorInfo: '',
            imageBig: '',
            imageBigAuthorInfo: '',
            title: `${city.name},`,
            smallTitle: `${country.name}`,
            price: Math.floor(Math.random() * 1000) + 1000,
            video: '',
          };
          allDestinations.push(destination);
        }
      }
    }
    return allDestinations;
  }
}
