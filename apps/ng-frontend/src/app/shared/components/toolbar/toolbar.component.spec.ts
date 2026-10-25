import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { MetadataSourceService } from '../../services/data-source/metadata-source.service';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
  it('clears the project search when the search box is closed', () => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations(), provideRouter([])]
    });
    const fixture = TestBed.createComponent(ToolbarComponent);
    fixture.componentRef.setInput('settings', undefined);
    fixture.componentRef.setInput('projects', undefined);
    const metadata = TestBed.inject(MetadataSourceService);
    const toolbar = fixture.componentInstance;

    toolbar.toggleSearch();
    const input = document.createElement('input');
    input.value = 'shop';
    input.addEventListener('keyup', (event) => toolbar.applyFilter(event));
    input.dispatchEvent(new KeyboardEvent('keyup'));
    expect(metadata.getFilterSignal()).toBe('shop');

    toolbar.closeSearch();

    expect(toolbar.isSearchVisible()).toBe(false);
    expect(metadata.getFilterSignal()).toBe('');
  });
});
