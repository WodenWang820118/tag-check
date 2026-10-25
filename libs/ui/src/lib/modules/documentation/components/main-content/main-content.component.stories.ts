import {
  applicationConfig,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { MainContentComponent } from './main-content.component';
import { expect, within } from 'storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { DOCS_ROUTES } from '../../routes';
import { of } from 'rxjs';

const mockActivatedRoute = {
  data: of({
    data: {
      fileName: 'assets/markdown/en/test.md',
      content: '# Test Content\n## Section 1\nContent here'
    }
  })
};

const meta: Meta<MainContentComponent> = {
  component: MainContentComponent,
  title: 'Modules/Help-center/Components/MainContentComponent',
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideRouter(DOCS_ROUTES),
        provideMarkdown(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<MainContentComponent>;

export const Layout: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      await canvas.findByRole('heading', { name: 'Test Content' })
    ).toBeTruthy();
    expect(canvas.getByText('On This Page')).toBeTruthy();
  }
};
