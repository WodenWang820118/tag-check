import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { Ga4UploadComponent } from './ga4-upload.component';

function render() {
  TestBed.configureTestingModule({
    providers: [
      provideNoopAnimations(),
      { provide: ReportService, useValue: {} },
      {
        provide: ActivatedRoute,
        useValue: { params: of({ projectSlug: 'shop' }) }
      }
    ]
  });
  const fixture = TestBed.createComponent(Ga4UploadComponent);
  fixture.detectChanges();
  // Let effects that run during the first check show their result.
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const textarea = () => {
    const found = element.querySelector('textarea');
    if (!found) {
      throw new Error('no textarea');
    }
    return found;
  };
  return { fixture, element, textarea };
}

describe('Ga4UploadComponent', () => {
  it('opens without an error before anything is typed', () => {
    const { element } = render();

    expect(element.textContent).not.toContain('Invalid JSON');
    expect(element.textContent).toContain('No events parsed yet.');
  });

  it('shows the uploaded file in the text box', async () => {
    const { fixture, textarea } = render();
    const json = '[{"event":"add_to_cart"}]';
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      value: [new File([json], 'events.json', { type: 'application/json' })]
    });
    input.addEventListener('change', (event) =>
      fixture.componentInstance.onFileSelected(event)
    );

    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(textarea().value).toBe(json);
    expect(fixture.nativeElement.textContent).toContain('add_to_cart');
  });
});
