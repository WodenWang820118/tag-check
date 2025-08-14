import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { InitProjectViewComponent } from './init-project-view.component';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ENTRY_ROUTES } from '../../routes';
import { ProjectImportComponent } from '../../../../shared/components/project-import/project-import.component';
import { InitProjectFormComponent } from '../../components/init-project-form/init-project-form.component';
import { FormBuilder } from '@angular/forms';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';

const meta: Meta<InitProjectViewComponent> = {
  component: InitProjectViewComponent,
  title: 'Modules/Entry/Views/InitProjectViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [InitProjectFormComponent, ProjectImportComponent],
      providers: [FormBuilder, ConfigurationService]
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(ENTRY_ROUTES)
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<InitProjectViewComponent>;

export const Default: Story = {
  args: {}
};
