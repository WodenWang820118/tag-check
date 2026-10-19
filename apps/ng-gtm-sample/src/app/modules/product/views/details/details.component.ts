import { CurrencyPipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCircleAlert,
  lucideMapPin,
  lucideShoppingCart
} from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
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
    HlmAlertImports,
    HlmButton,
    HlmLabel,
    HlmNativeSelectImports,
    NgIcon,
    CurrencyPipe
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideCircleAlert,
      lucideMapPin,
      lucideShoppingCart
    })
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
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
  /** A native select reports its value as a string. */
  readonly numberOfPersonsControl = new FormControl<number | string>(1);
  readonly personOptions = Array.from({ length: 6 }, (_, index) => ({
    label: `${index + 1} ${index + 1 === 1 ? 'person' : 'persons'}`,
    value: index + 1
  }));

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
    const numOfPersons = Number(this.numberOfPersonsControl.value);
    if (numOfPersons > 0) {
      this.orderService.addToCart(destination, numOfPersons);
    }
  }

  getImageSrc(image: string | undefined) {
    return image || 'assets/images/placeholder.png';
  }
}
