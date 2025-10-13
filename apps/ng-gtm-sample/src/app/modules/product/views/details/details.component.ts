import { Component, inject, input } from '@angular/core';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { OrderService } from '../../../../shared/services/order/order.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Destination } from '../../../../shared/models/destination.model';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-details',
  imports: [ReactiveFormsModule, FormsModule, AutoCompleteModule, ButtonModule],
  templateUrl: './details.component.html'
})
export class DetailsComponent {
  public readonly windowSizeService = inject(WindowSizeService);
  public readonly destinationService = inject(DestinationService);
  title = input<string>('');
  smallTitle = input<string>('The most beautiful places on Earth.');
  image1 = input<string>('');
  image2 = input<string>('');
  image3 = input<string>('');
  description = input<string>('');

  destination$ = this.destinationService.destinationSource$;

  numberOfPersonsControl = new FormControl(1);
  personOptions = Array.from({ length: 6 }, (_, i) => ({
    label: `${i + 1} ${i + 1 === 1 ? 'person' : 'persons'}`,
    value: i + 1
  }));
  filteredPersons: { label: string; value: number }[] = [];

  constructor(
    private readonly orderService: OrderService,
    private readonly navigationService: NavigationService
  ) {}

  navigateToDestinations() {
    this.navigationService.navigateToDestinations();
  }

  addToCart(destination: Destination): void {
    const numOfPersons = this.numberOfPersonsControl.value;
    if (numOfPersons) this.orderService.addToCart(destination, numOfPersons);
  }

  filterPersons(event: { query: string }): void {
    const query = event.query?.toLowerCase() || '';
    this.filteredPersons = this.personOptions.filter((opt) =>
      opt.label.toLowerCase().startsWith(query)
    );
  }
}
