import {
  getCurrentPageRows,
  togglePageSelection,
  toggleRowSelection
} from './table-selection';

interface TestRow {
  id: number;
  label?: string;
}

describe('table-selection helpers', () => {
  describe('getCurrentPageRows', () => {
    it('applies filtering followed by sorting followed by pagination', () => {
      const rows: TestRow[] = [
        { id: 1, label: 'cherry' },
        { id: 2, label: 'apple' },
        { id: 3, label: 'banana' },
        { id: 4, label: 'avocado' }
      ];
      const filtered: TestRow[] = [rows[1], rows[2], rows[3]];
      const sort = { active: 'label', direction: 'asc' };
      const sortData = (data: TestRow[]) =>
        [...data].sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
      const paginator = { pageIndex: 1, pageSize: 2 };

      const result = getCurrentPageRows({
        data: rows,
        filteredData: filtered,
        sort,
        sortData,
        paginator
      });

      expect(result).toEqual([rows[2]]);
    });

    it('falls back to data when filteredData is missing', () => {
      const rows: TestRow[] = [{ id: 1 }, { id: 2 }];
      const result = getCurrentPageRows({ data: rows });
      expect(result).toEqual(rows);
    });

    it('uses default pagination when paginator is missing or null', () => {
      const rows: TestRow[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(getCurrentPageRows({ data: rows })).toEqual(rows);
      expect(getCurrentPageRows({ data: rows, paginator: null })).toEqual(rows);
    });

    it('returns an empty array when data is empty', () => {
      const result = getCurrentPageRows({
        data: [],
        paginator: { pageIndex: 0, pageSize: 10 }
      });
      expect(result).toEqual([]);
    });

    it('returns an empty array when pageIndex is out of range', () => {
      const rows: TestRow[] = [{ id: 1 }, { id: 2 }];
      const result = getCurrentPageRows({
        data: rows,
        paginator: { pageIndex: 4, pageSize: 5 }
      });
      expect(result).toEqual([]);
    });

    it('preserves data order when sort or sortData is missing', () => {
      const rows: TestRow[] = [{ id: 3 }, { id: 1 }];
      const result = getCurrentPageRows({
        data: rows,
        sort: { active: 'id' },
        sortData: undefined
      });
      expect(result).toEqual(rows);
    });
  });

  describe('togglePageSelection', () => {
    it('selects all rows on the page when none are selected', () => {
      const r1: TestRow = { id: 1 };
      const r2: TestRow = { id: 2 };
      expect(togglePageSelection([], [r1, r2])).toEqual([r1, r2]);
    });

    it('handles partial page selection with another page selected', () => {
      const offPage: TestRow = { id: 0 };
      const r1: TestRow = { id: 1 };
      const r2: TestRow = { id: 2 };
      const selected = [offPage, r1];
      const pageRows = [r1, r2];

      expect(togglePageSelection(selected, pageRows)).toEqual([
        offPage,
        r1,
        r2
      ]);
    });

    it('deselects the page while retaining off-page selections', () => {
      const offPage: TestRow = { id: 0 };
      const r1: TestRow = { id: 1 };
      const r2: TestRow = { id: 2 };
      const selected = [offPage, r1, r2];
      const pageRows = [r1, r2];

      expect(togglePageSelection(selected, pageRows)).toEqual([offPage]);
    });

    it('preserves equal-valued but distinct row objects by identity', () => {
      const r1A: TestRow = { id: 1 };
      const r1B: TestRow = { id: 1 };

      expect(togglePageSelection([r1A], [r1B])).toEqual([r1A, r1B]);
      expect(togglePageSelection([r1A, r1B], [r1B])).toEqual([r1A]);
    });

    it('returns existing selection unchanged when pageRows is empty', () => {
      const r1: TestRow = { id: 1 };
      expect(togglePageSelection([r1], [])).toEqual([r1]);
      expect(togglePageSelection([], [])).toEqual([]);
    });
  });

  describe('toggleRowSelection', () => {
    it('adds an unselected row', () => {
      const r1: TestRow = { id: 1 };
      const r2: TestRow = { id: 2 };
      expect(toggleRowSelection([r1], r2)).toEqual([r1, r2]);
    });

    it('removes an already selected row', () => {
      const r1: TestRow = { id: 1 };
      const r2: TestRow = { id: 2 };
      expect(toggleRowSelection([r1, r2], r1)).toEqual([r2]);
    });

    it('preserves equal-valued but distinct row objects by identity', () => {
      const r1A: TestRow = { id: 1 };
      const r1B: TestRow = { id: 1 };

      expect(toggleRowSelection([r1A], r1B)).toEqual([r1A, r1B]);
      expect(toggleRowSelection([r1A, r1B], r1A)).toEqual([r1B]);
    });
  });
});
