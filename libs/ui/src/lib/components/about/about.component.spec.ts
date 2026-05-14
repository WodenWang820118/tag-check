import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('builds a mermaid diagram definition containing the key nodes', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    const diagram = fixture.componentInstance.tagBuildDiagram;
    expect(diagram).toContain('flowchart TD');
    expect(diagram).toContain('TagBuild');
    expect(diagram).toContain('GTM');
  });

  it('exposes a non-empty aria label for the diagram', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    expect(
      fixture.componentInstance.tagBuildDiagramLabel.length
    ).toBeGreaterThan(0);
  });

  it('exposes example payloads with the expected shape', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    const cmp = fixture.componentInstance;
    expect(cmp.exampleInput.event).toBe('begin_checkout');
    expect(Array.isArray(cmp.exampleArrayInput)).toBe(true);
    expect(cmp.exampleArrayInput).toHaveLength(2);
  });
});
