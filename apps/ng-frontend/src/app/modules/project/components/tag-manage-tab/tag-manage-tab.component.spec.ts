import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it } from 'vitest';
import { TagSpec, VariableConfig } from '@utils';
import { TagManageTabComponent } from './tag-manage-tab.component';

const row = (parameter: string, value: string) => ({
  type: 'MAP',
  map: [
    { type: 'TEMPLATE', key: 'parameter', value: parameter },
    { type: 'TEMPLATE', key: 'parameterValue', value }
  ]
});

/** A GA4 event tag as GET /specs/:projectSlug/:eventId returns it. */
const tagSpec = {
  event: 'add_to_cart',
  eventName: 'add_to_cart',
  dataLayerSpec: { event: 'add_to_cart' },
  rawGtmTag: {
    tag: {
      name: 'GA4 event - add_to_cart',
      type: 'gaawe',
      parameter: [
        { type: 'TEMPLATE', key: 'eventName', value: 'add_to_cart' },
        {
          type: 'TEMPLATE',
          key: 'measurementIdOverride',
          value: '{{CONST - Measurement ID}}'
        },
        {
          type: 'TEMPLATE',
          key: 'eventSettingsVariable',
          value: '{{GA4 - Event Settings}}'
        },
        {
          type: 'LIST',
          key: 'eventSettingsTable',
          list: [row('value', '{{DLV - ecommerce.value}}')]
        }
      ]
    },
    trigger: [{ name: 'CE - add_to_cart' }]
  }
} as unknown as TagSpec;

const variables = [
  {
    name: 'CONST - Measurement ID',
    type: 'c',
    parameter: [{ type: 'TEMPLATE', key: 'value', value: 'G-8HKQR5ZBSK' }]
  },
  {
    name: 'DLV - ecommerce.value',
    type: 'v',
    parameter: [
      { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
      { type: 'TEMPLATE', key: 'name', value: 'ecommerce.value' }
    ]
  },
  {
    name: 'GA4 - Event Settings',
    type: 'gtes',
    parameter: [
      {
        type: 'LIST',
        key: 'eventSettingsTable',
        list: [row('currency', 'USD')]
      }
    ]
  }
] as unknown as VariableConfig[];

function render(withVariables: readonly VariableConfig[]) {
  TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
  const fixture = TestBed.createComponent(TagManageTabComponent);
  fixture.componentRef.setInput('tagSpec', tagSpec);
  fixture.componentRef.setInput('variables', withVariables);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const text = (selector: string) =>
    element.querySelector(selector)?.textContent?.trim();
  return { component: fixture.componentInstance, element, text };
}

describe('TagManageTabComponent', () => {
  it('shows the Measurement ID a Constant holds and the reference it came from', () => {
    const { element, text } = render(variables);

    expect(text('[data-testid="tag-measurement-id"]')).toBe('G-8HKQR5ZBSK');
    expect(element.textContent).toContain('From {{CONST - Measurement ID}}');
  });

  it('lists the Event Settings parameters and the data layer key a value reads', () => {
    const { component, text } = render(variables);

    expect(
      component.eventParameters$().map(({ parameter }) => parameter)
    ).toEqual(['value', 'currency']);
    expect(text('[data-testid="tag-parameter-source-value"]')).toBe(
      'Data layer: ecommerce.value'
    );
  });

  it('shows the references until the container variables load', () => {
    const { component, element, text } = render([]);

    expect(text('[data-testid="tag-measurement-id"]')).toBe(
      '{{CONST - Measurement ID}}'
    );
    expect(element.textContent).not.toContain('From ');
    expect(component.eventParameters$()).toEqual([
      { parameter: 'value', value: '{{DLV - ecommerce.value}}', resolved: null }
    ]);
  });
});
