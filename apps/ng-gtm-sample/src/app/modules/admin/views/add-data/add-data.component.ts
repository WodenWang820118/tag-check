import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleAlert,
  lucideCircleCheck,
  lucideDatabase,
  lucideInfo,
  lucideSave
} from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { DestinationImageSlot } from '../../../../shared/models/create-destination-draft.model';
import {
  AddDataFacadeService,
  DestinationFormModel
} from './add-data-facade.service';

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
    FormField,
    HlmAlertImports,
    HlmButton,
    HlmCard,
    HlmInput,
    HlmLabel,
    HlmNativeSelectImports,
    HlmSpinner,
    HlmTextarea,
    NgIcon
  ],
  providers: [
    AddDataFacadeService,
    provideIcons({
      lucideCircleAlert,
      lucideCircleCheck,
      lucideDatabase,
      lucideInfo,
      lucideSave
    })
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
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
  get destinationModel() {
    return this.facade.destinationModel;
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
  get countries(): { label: string; value: string }[] {
    return this.facade.countries();
  }

  control<K extends keyof DestinationFormModel>(name: K) {
    return this.facade.control(name);
  }

  hasError(name: keyof DestinationFormModel, error?: string): boolean {
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
