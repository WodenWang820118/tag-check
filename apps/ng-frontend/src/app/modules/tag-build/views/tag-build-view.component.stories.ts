import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { TagBuildViewComponent } from './tag-build-view.component';

import { AsyncPipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { SettingsService } from '../../../shared/services/api/settings/settings.service';
import { SpecService } from '../../../shared/services/api/spec/spec.service';
import { TAG_BUILD_ROUTES } from '../routes';

const meta: Meta<TagBuildViewComponent> = {
  component: TagBuildViewComponent,
  title: 'Modules/Tag-build/Views/TagBuildViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        AsyncPipe,
        () => import('@ui').then((m) => m.TagBuildPageComponent)
      ],
      providers: [SpecService, SettingsService]
    }),
    applicationConfig({
      providers: [provideHttpClient(), provideRouter(TAG_BUILD_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<TagBuildViewComponent>;

export const Default: Story = {
  args: {}
};
