import { describe, it, expect } from 'vitest';
import type { GTMConfiguration } from '@utils';
import { buildExampleEventSpec } from './helpers';

const config = (): GTMConfiguration =>
  ({
    containerVersion: {
      tag: [
        {
          name: 'Tag A',
          firingTriggerId: ['t1', 't2'],
          parameter: [
            { key: 'eventName', type: 'TEMPLATE', value: 'page_view' }
          ]
        },
        {
          name: 'Tag B',
          firingTriggerId: ['t3'],
          parameter: [
            { key: 'eventName', type: 'TEMPLATE', value: 'view_item' }
          ]
        }
      ],
      trigger: [
        { triggerId: 't1', name: 'trig1' },
        { triggerId: 't2', name: 'trig2' },
        { triggerId: 't3', name: 'trig3' },
        { triggerId: 99 as never, name: 'numeric-id' }
      ]
    }
  }) as never;

describe('buildExampleEventSpec', () => {
  it('returns the matching tag and only its firing triggers', () => {
    const spec = buildExampleEventSpec(config(), 'page_view');
    expect(spec.tag.name).toBe('Tag A');
    expect(spec.trigger.map((t) => t.triggerId)).toEqual(['t1', 't2']);
  });

  it('throws when no tag matches the requested event name', () => {
    expect(() => buildExampleEventSpec(config(), 'purchase')).toThrow(
      /Tag with eventName "purchase" not found/
    );
  });

  it('returns an empty trigger array when the matched tag has no firingTriggerId', () => {
    const cfg: GTMConfiguration = {
      containerVersion: {
        tag: [
          {
            name: 'No Triggers',
            parameter: [{ key: 'eventName', type: 'TEMPLATE', value: 'lonely' }]
          }
        ],
        trigger: [{ triggerId: 't1', name: 'trig1' }]
      }
    } as never;
    const spec = buildExampleEventSpec(cfg, 'lonely');
    expect(spec.trigger).toEqual([]);
  });

  it('skips triggers whose triggerId is not a string', () => {
    const cfg: GTMConfiguration = {
      containerVersion: {
        tag: [
          {
            name: 'mixed',
            firingTriggerId: ['t1', '99'],
            parameter: [{ key: 'eventName', type: 'TEMPLATE', value: 'mixed' }]
          }
        ],
        trigger: [
          { triggerId: 't1', name: 'string-id' },
          { triggerId: 99 as never, name: 'numeric-id' }
        ]
      }
    } as never;
    const spec = buildExampleEventSpec(cfg, 'mixed');
    expect(spec.trigger.map((t) => t.name)).toEqual(['string-id']);
  });
});
