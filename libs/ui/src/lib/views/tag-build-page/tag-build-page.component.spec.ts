import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EditorService, TagBuildMode } from '@data-access';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditorComponent } from '../../components/editor/editor.component';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { FunctionalCardFacade } from '../../components/functional-card/functional-card.facade.service';
import { TagBuildPageComponent } from './tag-build-page.component';

describe('TagBuildPageComponent', () => {
  afterEach(() => {
    const editor = TestBed.inject(EditorService);
    editor.editor$.inputJson().destroy();
    editor.editor$.outputJson().destroy();
  });

  it('passes the host project slug through the convert card', async () => {
    const convertCode = vi.fn();
    await TestBed.configureTestingModule({
      imports: [TagBuildPageComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: FunctionalCardFacade,
          useValue: {
            convertCode,
            isConvertDisabled$: signal(false),
            importReadiness: signal(null),
            importReadinessLabel: signal('Waiting for conversion'),
            mode: TagBuildMode.TagBuild
          }
        }
      ]
    })
      .overrideComponent(FunctionalCardComponent, {
        set: { imports: [], template: '' }
      })
      .overrideComponent(EditorComponent, { set: { template: '' } })
      .compileComponents();
    const fixture = TestBed.createComponent(TagBuildPageComponent);
    fixture.componentRef.setInput('specs', []);
    fixture.componentRef.setInput('projectSlug', 'demo-shop');
    fixture.detectChanges();
    const card = fixture.debugElement
      .query(By.directive(FunctionalCardComponent))
      .injector.get(FunctionalCardComponent);

    card.convertCode();

    expect(convertCode).toHaveBeenCalledWith(expect.any(Function), 'demo-shop');
  });
});
