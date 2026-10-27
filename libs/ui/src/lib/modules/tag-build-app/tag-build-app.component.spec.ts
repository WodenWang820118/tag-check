import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed
} from '@angular/core/testing';
import { TagBuildMode, TagBuildModeService } from '@data-access';
import { TagBuildAppComponent } from './tag-build-app.component';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TagBuildPageComponent } from '../../views/tag-build-page/tag-build-page.component';

describe('TagBuildAppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagBuildAppComponent],
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .overrideComponent(TagBuildPageComponent, {
        set: { imports: [], template: '' }
      })
      .compileComponents();
  });

  it('starts with an empty example input list', () => {
    const fixture = TestBed.createComponent(TagBuildAppComponent);
    expect(fixture.componentInstance.exampleInputJson).toEqual([]);
  });

  it('hides the developer article on Tag Extract and shows it again on Tag Build', async () => {
    const fixture = TestBed.createComponent(TagBuildAppComponent);
    const mode = TestBed.inject(TagBuildModeService);
    fixture.detectChanges();
    const blocks = await fixture.getDeferBlocks();
    const articleBlock = blocks.at(-1);
    if (!articleBlock) {
      throw new Error('Expected the deferred Tag Build article');
    }
    await articleBlock.render(DeferBlockState.Complete);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('lib-article')).not.toBeNull();

    mode.setMode(TagBuildMode.TagExtract);
    fixture.detectChanges();

    expect(element.querySelector('lib-article')).toBeNull();

    mode.setMode(TagBuildMode.TagBuild);
    fixture.detectChanges();
    const restoredBlocks = await fixture.getDeferBlocks();
    const restoredArticle = restoredBlocks.at(-1);
    if (!restoredArticle) {
      throw new Error('Expected the Tag Build article after switching back');
    }
    await restoredArticle.render(DeferBlockState.Complete);
    expect(element.querySelector('lib-article')).not.toBeNull();
  });
});
