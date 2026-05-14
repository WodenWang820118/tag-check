import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal
} from '@angular/core';

let mermaidInitialized = false;

type RenderStatus = 'loading' | 'done' | 'error';

@Component({
  selector: 'lib-mermaid-diagram',
  standalone: true,
  template: `
    @if (status() === 'loading') {
      <div class="mermaid-skeleton" aria-hidden="true"></div>
    }
    @if (status() === 'error') {
      <div class="mermaid-error">
        <span role="alert" i18n="@@mermaid.error.message"
          >Failed to load diagram.</span
        >
        <button type="button" class="mermaid-error__retry" (click)="retry()">
          <span i18n="@@mermaid.error.retry">Retry</span>
        </button>
      </div>
    }
    <div class="mermaid-container"></div>
  `,
  styleUrls: ['./mermaid-diagram.component.scss']
})
export class MermaidDiagramComponent {
  readonly diagramDef = input.required<string>();
  readonly ariaLabel = input('');

  protected readonly status = signal<RenderStatus>('loading');

  private readonly el = inject(ElementRef);
  private readonly isBrowser = signal(false);
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
    });

    afterNextRender(() => {
      this.isBrowser.set(true);
    });

    effect(() => {
      const def = this.diagramDef();
      if (this.isBrowser() && def) {
        void this.renderDiagram(def);
      }
    });
  }

  protected retry(): void {
    const def = this.diagramDef();
    if (def) {
      void this.renderDiagram(def);
    }
  }

  private async renderDiagram(def: string): Promise<void> {
    this.status.set('loading');
    try {
      const { default: mermaid } = await import('mermaid');
      if (!mermaidInitialized) {
        mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
        mermaidInitialized = true;
      }
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      const { svg } = await mermaid.render(id, def);
      if (this.destroyed) return;
      const container = (this.el.nativeElement as HTMLElement).querySelector(
        '.mermaid-container'
      );
      if (container) {
        container.innerHTML = svg;
        const svgEl = container.querySelector('svg');
        if (svgEl) {
          svgEl.setAttribute('role', 'img');
          svgEl.setAttribute('focusable', 'false');
          svgEl.setAttribute('tabindex', '-1');
          const label = this.ariaLabel();
          if (label) {
            svgEl.setAttribute('aria-label', label);
          }
        }
        this.status.set('done');
      }
    } catch {
      if (this.destroyed) return;
      this.status.set('error');
      // After @if re-renders the error state, restore keyboard focus to the Retry button
      // (the previously focused button is destroyed by Angular's @if teardown)
      setTimeout(() => {
        const btn = (
          this.el.nativeElement as HTMLElement
        ).querySelector<HTMLButtonElement>('.mermaid-error__retry');
        btn?.focus();
      });
    }
  }
}
