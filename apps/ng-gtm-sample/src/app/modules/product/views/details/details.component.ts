import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { OrderService } from '../../../../shared/services/order/order.service';
import { Destination } from '../../../../shared/models/destination.model';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { getPublicDestinationBySlug } from '../../../../shared/services/destination/destination-catalog';

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
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly routeParamMap = toSignal(this.activatedRoute.paramMap);

  readonly destination$ = computed(() => {
    const slug = this.routeParamMap()?.get('slug');
    if (!slug) {
      return this.destinationService.destinationSource$();
    }

    return getPublicDestinationBySlug(slug) ?? null;
  });
  readonly numberOfPersonsControl = new FormControl(1);
  readonly personOptions = Array.from({ length: 6 }, (_, index) => ({
    label: `${index + 1} ${index + 1 === 1 ? 'person' : 'persons'}`,
    value: index + 1
  }));
  filteredPersons: { label: string; value: number }[] = [];

  constructor(
    private readonly orderService: OrderService,
    private readonly navigationService: NavigationService
  ) {
    effect(() => {
      const destination = this.destination$();
      if (!destination) {
        return;
      }

      this.destinationService.changeDestination(destination, {
        persist: false,
        trackViewItem: false
      });
    });
  }

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
