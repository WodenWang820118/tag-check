import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { DestinationImageSlot } from '../../../../shared/models/create-destination-draft.model';
import { AddDataFacadeService } from './add-data-facade.service';

interface MediaFieldConfig {
  key: DestinationImageSlot;
  label: string;
  hint: string;
  authorControl:
    | 'imageBigAuthorInfo'
    | 'image1AuthorInfo'
    | 'image2AuthorInfo'
    | 'image3AuthorInfo';
}

@Component({
  selector: 'app-add-data',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    MessageModule
  ],
  providers: [AddDataFacadeService],
  templateUrl: './add-data.component.html'
})
export class AddDataComponent {
  private readonly facade = inject(AddDataFacadeService);

  /** View-only config: labels and hints for the four destination image slots. */
  readonly mediaFields: MediaFieldConfig[] = [
    {
      key: 'imageBig',
      label: 'Hero image',
      hint: 'Used on the featured hero and destination header.',
      authorControl: 'imageBigAuthorInfo'
    },
    {
      key: 'image1',
      label: 'Gallery image 1',
      hint: 'Primary supporting image on the product detail page.',
      authorControl: 'image1AuthorInfo'
    },
    {
      key: 'image2',
      label: 'Gallery image 2',
      hint: 'Secondary supporting image for the destination detail gallery.',
      authorControl: 'image2AuthorInfo'
    },
    {
      key: 'image3',
      label: 'Gallery image 3',
      hint: 'Third supporting image for richer storytelling on the detail page.',
      authorControl: 'image3AuthorInfo'
    }
  ];

  // ── Public API proxied from facade (keeps template and spec bindings stable) ──

  get destinationForm() {
    return this.facade.destinationForm;
  }
  get uploadState() {
    return this.facade.uploadState;
  }
  get uploadMessage() {
    return this.facade.uploadMessage;
  }
  get selectedFiles() {
    return this.facade.selectedFiles;
  }
  get countries() {
    return this.facade.countries;
  }

  control(name: keyof typeof this.facade.destinationForm.controls) {
    return this.facade.control(name);
  }

  hasError(
    name: keyof typeof this.facade.destinationForm.controls,
    error?: string
  ): boolean {
    return this.facade.hasError(name, error);
  }

  onFileSelected(slot: DestinationImageSlot, event: Event) {
    this.facade.onFileSelected(slot, event);
  }

  selectedFileName(slot: DestinationImageSlot) {
    return this.facade.selectedFileName(slot);
  }

  hasMissingFiles() {
    return this.facade.hasMissingFiles();
  }

  addDestination() {
    this.facade.addDestination();
  }
}
