import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { Ga4UploadFacadeService } from './ga4-upload-facade.service';

/** The "Import GA4 events" tab; Ga4UploadFacadeService parses and saves. */
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
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './ga4-upload.component.html'
})
export class Ga4UploadComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(Ga4UploadFacadeService);

  readonly projectSlug = toSignal(
    this.route.params.pipe(map((params) => params['projectSlug'] ?? '')),
    {
      initialValue: this.route.snapshot?.params?.['projectSlug'] ?? ''
    }
  );
  readonly events = this.facade.events$;
  readonly parseError = this.facade.parseError$;
  readonly isSaving = this.facade.isSaving$;

  /** The JSON in the text box, typed, pasted or read from a file. */
  readonly text = this.facade.rawJson.asReadonly();

  constructor() {
    // The facade outlives the tab, so each opening starts empty.
    this.facade.setRawJson('');
  }

  onFileSelected(event: Event) {
    void this.facade.onFileSelected(event);
  }

  onTextChange(text: string) {
    this.facade.setRawJson(text);
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
    this.facade.setRawJson(sample);
  }

  async save(): Promise<void> {
    const slug = this.projectSlug();
    if (!slug) return;
    // The facade reloads the tests table once the tests are created.
    await firstValueFrom(this.facade.save(slug));
  }
}
