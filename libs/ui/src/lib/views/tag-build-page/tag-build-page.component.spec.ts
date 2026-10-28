import { signal } from '@angular/core';
import {
  DeferBlockState,
  TestBed,
  type ComponentFixture
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EditorService, TagBuildMode, TagBuildModeService } from '@data-access';
import type { GTMConfiguration } from '@utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectContainerImport } from '../../components/conversion-success-dialog/conversion-success-dialog.component';
import { EditorComponent } from '../../components/editor/editor.component';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { FunctionalCardFacade } from '../../components/functional-card/functional-card.facade.service';
import { TagExtractComponent } from '../../components/tag-extract/tag-extract.component';
import { TagBuildPageComponent } from './tag-build-page.component';

describe('TagBuildPageComponent', () => {
  afterEach(() => {
    TestBed.inject(TagBuildModeService).setMode(TagBuildMode.TagBuild);
    const editor = TestBed.inject(EditorService);
    editor.editor$.inputJson().destroy();
    editor.editor$.outputJson().destroy();
  });

  it('passes the host project slug through the convert card', async () => {
    const { fixture, convertCode } = await setupPage();
    fixture.componentRef.setInput('projectSlug', 'demo-shop');
    fixture.detectChanges();
    const card = fixture.debugElement
      .query(By.directive(FunctionalCardComponent))
      .injector.get(FunctionalCardComponent);

    card.convertCode();

    expect(convertCode).toHaveBeenCalledWith(
      expect.any(Function),
      'demo-shop',
      null
    );
  });

  it('passes the project import hook through the convert card', async () => {
    const hook: ProjectContainerImport = {
      label: 'Import into this project',
      run: () => Promise.resolve(true)
    };
    const { fixture, convertCode } = await setupPage();
    fixture.componentRef.setInput('projectSlug', 'demo-shop');
    fixture.componentRef.setInput('projectImport', hook);
    fixture.detectChanges();
    const card = fixture.debugElement
      .query(By.directive(FunctionalCardComponent))
      .injector.get(FunctionalCardComponent);

    card.convertCode();

    expect(convertCode).toHaveBeenCalledWith(
      expect.any(Function),
      'demo-shop',
      hook
    );
  });

  it('passes the project container to Tag Extract', async () => {
    const container = JSON.parse(
      JSON.stringify({
        exportFormatVersion: 2,
        exportTime: '2026-10-28 12:00:00',
        containerVersion: { tag: [], trigger: [], variable: [] }
      })
    ) as GTMConfiguration;
    const { fixture } = await setupPage();
    TestBed.inject(TagBuildModeService).setMode(TagBuildMode.TagExtract);
    fixture.componentRef.setInput('projectContainer', container);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    if (!fixture.debugElement.query(By.directive(TagExtractComponent))) {
      const blocks = await fixture.getDeferBlocks();
      for (const block of blocks) {
        await block.render(DeferBlockState.Complete);
      }
      fixture.detectChanges();
    }
    const extract = fixture.debugElement.query(
      By.directive(TagExtractComponent)
    );
    if (!extract) {
      throw new Error('Tag Extract did not render');
    }

    expect(
      extract.injector.get(TagExtractComponent).projectContainer()
    ).toEqual(container);
  });
});

async function setupPage(): Promise<{
  fixture: ComponentFixture<TagBuildPageComponent>;
  convertCode: ReturnType<typeof vi.fn>;
}> {
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
  return { fixture, convertCode };
}
