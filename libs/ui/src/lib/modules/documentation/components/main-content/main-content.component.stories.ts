import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { MainContentComponent } from './main-content.component';
import { expect, within } from 'storybook/test';
import { AsyncPipe, ViewportScroller } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MarkdownModule, MarkdownService } from 'ngx-markdown';
import { TreeNodeService } from '../../services/tree-node/tree-node.service';
import { DOCS_ROUTES } from '../../routes';
import { importProvidersFrom, signal } from '@angular/core';
import { of } from 'rxjs';

const mockActivatedRoute = {
  params: of({ name: 'test' })
};

const mockMarkdownService = {
  getSource: (fileName: string) =>
    of('# Test Content\n## Section 1\nContent here')
};

const mockViewportScroller = {
  scrollToAnchor: () => {
    /* no-op for storybook */
  }
};

const meta: Meta<MainContentComponent> = {
  component: MainContentComponent,
  title: 'Modules/Help-center/Components/MainContentComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [AsyncPipe, MarkdownModule, MatButtonModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MarkdownService, useValue: mockMarkdownService },
        { provide: ViewportScroller, useValue: mockViewportScroller },
        { provide: TreeNodeService }
      ]
    }),
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideRouter(DOCS_ROUTES),
        importProvidersFrom(MarkdownModule.forRoot())
      ]
    })
  ],
  args: {
    currentNodeId: signal(1),
    fileName: signal('assets/test.md'),
    toc: signal([
      { id: 'test-content', text: 'Test Content' },
      { id: 'section-1', text: 'Section 1' }
    ])
  },
  argTypes: {
    currentNodeId: { control: 'number' },
    fileName: { control: 'text' },
    toc: { control: 'object' }
  }
};
export default meta;
type Story = StoryObj<MainContentComponent>;

export const Layout: Story = {
  args: {
    currentNodeId: signal(1),
    fileName: signal('assets/test.md'),
    toc: signal([
      { id: 'test-content', text: 'Test Content' },
      { id: 'section-1', text: 'Section 1' }
    ])
  },
  argTypes: {
    currentNodeId: { control: 'number' },
    fileName: { control: 'text' },
    toc: { control: 'object' }
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nextBtn = canvas.getByText(/Next/);
    // Initial state
    expect(canvas.getByText(/Test Content/)).toBeTruthy();
    expect(nextBtn).toBeTruthy();
    expect(canvas.queryByText(/Previous/)).toBeFalsy();

    // Click Next
    nextBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay for update
    expect(nextBtn).toBeTruthy();
    expect(canvas.getByText(/Previous/)).toBeTruthy();
  }
};
