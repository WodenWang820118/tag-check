import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute } from '@angular/router';
import { Ga4UploadFacadeService } from './ga4-upload-facade.service';
import { take, tap } from 'rxjs';

@Component({
  selector: 'app-ga4-upload',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatChipsModule
  ],
  templateUrl: './ga4-upload.component.html'
})
export class Ga4UploadComponent implements OnInit {
  projectSlug = signal<string>('');
  events = this.facade.events$;
  parseError = this.facade.parseError$;
  isSaving = this.facade.isSaving$;

  // local textarea binding
  textValue = signal<string>('');
  textValue$ = computed(() => this.textValue());

  constructor(
    private readonly route: ActivatedRoute,
    private readonly facade: Ga4UploadFacadeService
  ) {
    effect(() => {
      const v = this.textValue$();
      this.facade.setRawJson(v);
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const projectSlug = params['projectSlug'];
      if (projectSlug) this.projectSlug.set(projectSlug);
    });
  }

  onFileSelected(event: Event) {
    this.facade.onFileSelected(event);
  }

  setSample() {
    const sample = `[
  {
    "event": "add_payment_info",
    "ecommerce": {
      "currency": "USD",
      "value": 30.03,
      "coupon": "SUMMER_FUN",
      "payment_type": "Credit Card",
      "items": [
        {
          "item_id": "SKU_12345",
          "item_name": "Stan and Friends Tee",
          "affiliation": "Google Merchandise Store",
          "coupon": "SUMMER_FUN",
          "discount": 2.22,
          "index": 0,
          "item_brand": "Google",
          "item_category": "Apparel",
          "item_category2": "Adult",
          "item_category3": "Shirts",
          "item_category4": "Crew",
          "item_category5": "Short sleeve",
          "item_list_id": "related_products",
          "item_list_name": "Related Products",
          "item_variant": "green",
          "location_id": "ChIJIQBpAG2ahYAR_6128GcTUEo",
          "price": 10.01,
          "quantity": 3
        }
      ]
    }
  }
]`;
    this.textValue.set(sample);
  }

  save() {
    const slug = this.projectSlug();
    if (!slug) return;
    this.facade
      .save(slug)
      .pipe(
        take(1),
        tap(() => {
          // Handle successful save
          // TODO: refresh the view

          console.log('GA4 events saved successfully');
        })
      )
      .subscribe();
  }
}
