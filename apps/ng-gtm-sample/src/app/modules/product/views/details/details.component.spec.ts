import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublicDestinationBySlug } from '../../../../shared/services/destination/destination-catalog';
import { DestinationService } from '../../../../shared/services/destination/destination.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { OrderService } from '../../../../shared/services/order/order.service';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { DetailsComponent } from './details.component';

@Component({
  selector: 'app-details-test-host',
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
class DetailsTestHostComponent {}

describe('DetailsComponent', () => {
  let fixture: ComponentFixture<DetailsTestHostComponent>;
  let router: Router;

  const destinationSignal = signal(null);
  const destinationServiceMock = {
    destinationSource$: destinationSignal,
    changeDestination: vi.fn()
  };
  const navigationServiceMock = {
    navigateToDestinations: vi.fn()
  };
  const orderServiceMock = {
    addToCart: vi.fn()
  };
  const windowSizeServiceMock = {
    width$: signal(1280)
  };

  beforeEach(async () => {
    destinationSignal.set(null);
    destinationServiceMock.changeDestination.mockReset();
    navigationServiceMock.navigateToDestinations.mockReset();
    orderServiceMock.addToCart.mockReset();

    await TestBed.configureTestingModule({
      imports: [DetailsTestHostComponent],
      providers: [
        provideRouter([
          {
            path: 'product/details/:slug',
            component: DetailsComponent
          }
        ]),
        {
          provide: DestinationService,
          useValue: destinationServiceMock
        },
        {
          provide: NavigationService,
          useValue: navigationServiceMock
        },
        {
          provide: OrderService,
          useValue: orderServiceMock
        },
        {
          provide: WindowSizeService,
          useValue: windowSizeServiceMock
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(DetailsTestHostComponent);
    fixture.detectChanges();
  });

  it('renders the destination resolved from the slug route parameter', async () => {
    const destination = getPublicDestinationBySlug('san-francisco');

    expect(destination).not.toBeNull();

    await router.navigateByUrl('/product/details/san-francisco');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent as string;

    expect(textContent).toContain(destination!.title);
    expect(textContent).toContain(destination!.description);
    expect(destinationServiceMock.changeDestination).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: destination!.slug,
        title: destination!.title
      }),
      { persist: false, trackViewItem: false }
    );
  });
});
