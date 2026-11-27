import { describe, expect, it, vi } from 'vitest';
import {
  findGtmImportConflicts,
  matchImportedEvent
} from './gtm-import-matching';

describe('gtm-import-matching', () => {
  describe('matchImportedEvent', () => {
    it('prefers same-event match after earlier same-name/different-event', () => {
      const earlierConflict = {
        testName: 'checkout',
        eventName: 'begin_checkout',
        id: 1
      };
      const exactMatch = {
        testName: 'checkout',
        eventName: 'purchase',
        id: 2
      };
      const existing = [earlierConflict, exactMatch];
      const input = { testName: 'checkout', eventName: 'purchase' };

      const match = matchImportedEvent(existing, input);

      expect(match).toEqual({ kind: 'same', event: exactMatch });
      if (match.kind === 'same') {
        expect(match.event).toBe(exactMatch);
      }
    });

    it('matches the first same-name conflict when no exact match exists', () => {
      const firstConflict = {
        testName: 'checkout',
        eventName: 'begin_checkout',
        id: 1
      };
      const secondConflict = {
        testName: 'checkout',
        eventName: 'add_payment_info',
        id: 2
      };
      const existing = [firstConflict, secondConflict];
      const input = { testName: 'checkout', eventName: 'purchase' };

      const match = matchImportedEvent(existing, input);

      expect(match).toEqual({ kind: 'conflict', event: firstConflict });
      if (match.kind === 'conflict') {
        expect(match.event).toBe(firstConflict);
      }
    });

    it('returns new when the tag name does not exist', () => {
      const existing = [
        { testName: 'cart', eventName: 'add_to_cart', id: 1 },
        { testName: 'checkout', eventName: 'purchase', id: 2 }
      ];
      const input = { testName: 'login', eventName: 'login' };

      const match = matchImportedEvent(existing, input);

      expect(match).toEqual({ kind: 'new' });
    });

    it('retains matched object identity and leaves input arrays unchanged', () => {
      const item1 = Object.freeze({
        testName: 'tag-1',
        eventName: 'event-1',
        extra: 'custom-data'
      });
      const item2 = Object.freeze({
        testName: 'tag-2',
        eventName: 'event-2',
        extra: 'other-data'
      });
      const existing = Object.freeze([item1, item2]);
      const sameInput = Object.freeze({
        testName: 'tag-1',
        eventName: 'event-1'
      });
      const conflictInput = Object.freeze({
        testName: 'tag-2',
        eventName: 'event-different'
      });

      const sameMatch = matchImportedEvent(existing, sameInput);
      expect(sameMatch.kind).toBe('same');
      if (sameMatch.kind === 'same') {
        expect(sameMatch.event).toBe(item1);
      }

      const conflictMatch = matchImportedEvent(existing, conflictInput);
      expect(conflictMatch.kind).toBe('conflict');
      if (conflictMatch.kind === 'conflict') {
        expect(conflictMatch.event).toBe(item2);
      }

      expect(existing).toHaveLength(2);
      expect(existing[0]).toBe(item1);
      expect(existing[1]).toBe(item2);
    });
  });

  describe('findGtmImportConflicts', () => {
    it('preserves first-seen input order and ignores duplicate conflicts', () => {
      const existing = [
        { testName: 'TagZ', eventName: 'old_z' },
        { testName: 'TagA', eventName: 'old_a' }
      ];
      const inputs = [
        { testName: 'TagZ', eventName: 'new_z1' },
        { testName: 'TagA', eventName: 'new_a' },
        { testName: 'TagZ', eventName: 'new_z2' }
      ];

      const conflicts = findGtmImportConflicts(existing, inputs, () => false);

      expect(conflicts).toEqual([
        {
          tagName: 'TagZ',
          existingEventName: 'old_z',
          newEventName: 'new_z1',
          specEdited: false
        },
        {
          tagName: 'TagA',
          existingEventName: 'old_a',
          newEventName: 'new_a',
          specEdited: false
        }
      ]);
    });

    it('calls the isSpecEdited predicate only for retained conflicts', () => {
      const existingSame = { testName: 'SameTag', eventName: 'page_view' };
      const existingConflictA = {
        testName: 'ConflictTagA',
        eventName: 'view_item'
      };
      const existingConflictB = {
        testName: 'ConflictTagB',
        eventName: 'add_to_cart'
      };
      const existing = [existingSame, existingConflictA, existingConflictB];

      const inputs = [
        { testName: 'SameTag', eventName: 'page_view' },
        { testName: 'BrandNewTag', eventName: 'login' },
        { testName: 'ConflictTagA', eventName: 'view_item_list' },
        { testName: 'ConflictTagA', eventName: 'select_item' },
        { testName: 'ConflictTagB', eventName: 'remove_from_cart' }
      ];

      const isSpecEdited = vi.fn((event: { testName: string }) => {
        return event.testName === 'ConflictTagA';
      });

      const conflicts = findGtmImportConflicts(existing, inputs, isSpecEdited);

      expect(isSpecEdited).toHaveBeenCalledTimes(2);
      expect(isSpecEdited).toHaveBeenNthCalledWith(1, existingConflictA);
      expect(isSpecEdited).toHaveBeenNthCalledWith(2, existingConflictB);

      expect(conflicts).toEqual([
        {
          tagName: 'ConflictTagA',
          existingEventName: 'view_item',
          newEventName: 'view_item_list',
          specEdited: true
        },
        {
          tagName: 'ConflictTagB',
          existingEventName: 'add_to_cart',
          newEventName: 'remove_from_cart',
          specEdited: false
        }
      ]);
    });

    it('leaves input arrays unchanged', () => {
      const existing = Object.freeze([
        Object.freeze({ testName: 'Tag1', eventName: 'old_evt' })
      ]);
      const inputs = Object.freeze([
        Object.freeze({ testName: 'Tag1', eventName: 'new_evt' })
      ]);

      const conflicts = findGtmImportConflicts(existing, inputs, () => false);

      expect(conflicts).toHaveLength(1);
      expect(existing).toHaveLength(1);
      expect(inputs).toHaveLength(1);
    });
  });
});
