import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { OrderService } from '../../../../shared/services/order/order.service';
import { Destination } from '../../../../shared/models/destination.model';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-details',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    MessageModule,
    CurrencyPipe
  ],
  templateUrl: './details.component.html'
})
export class DetailsComponent {
  public readonly windowSizeService = inject(WindowSizeService);
  public readonly destinationService = inject(DestinationService);

  readonly destination$ = this.destinationService.destinationSource$;
  readonly numberOfPersonsControl = new FormControl(1);
  readonly personOptions = Array.from({ length: 6 }, (_, index) => ({
    label: `${index + 1} ${index + 1 === 1 ? 'person' : 'persons'}`,
    value: index + 1
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
    if (numOfPersons) {
      this.orderService.addToCart(destination, numOfPersons);
    }
  }

  filterPersons(event: { query: string }): void {
    const query = event.query?.toLowerCase() || '';
    this.filteredPersons = this.personOptions.filter((option) =>
      option.label.toLowerCase().startsWith(query)
    );
  }

  getImageSrc(image: string | undefined) {
    return image || 'assets/images/placeholder.png';
  }
}
