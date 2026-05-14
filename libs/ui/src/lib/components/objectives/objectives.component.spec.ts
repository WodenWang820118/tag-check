import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ObjectivesComponent } from './objectives.component';

describe('ObjectivesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectivesComponent]
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(ObjectivesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('builds a mermaid diagram definition containing all key nodes', () => {
    const fixture = TestBed.createComponent(ObjectivesComponent);
    const diagram = fixture.componentInstance.tagCheckDiagram;
    expect(diagram).toContain('flowchart TD');
    expect(diagram).toContain('TagBuild');
    expect(diagram).toContain('TagCheck');
    expect(diagram).toContain('GTM');
  });

  it('exposes a non-empty aria label for the diagram', () => {
    const fixture = TestBed.createComponent(ObjectivesComponent);
    expect(
      fixture.componentInstance.tagCheckDiagramLabel.length
    ).toBeGreaterThan(0);
  });
});
