import { Sort } from '@angular/material/sort';
import { describe, expect, it } from 'vitest';
import { SortableColumn, TableSortService } from './table-sort.service';

type ReportRow = {
  completedAt: string;
  name: string;
  runState: {
    score: number;
  };
};

describe('TableSortService', () => {
  const service = new TableSortService();

  it('returns the original array when sorting is inactive', () => {
    const rows: ReportRow[] = [
      { completedAt: '2026-01-02', name: 'Bravo', runState: { score: 2 } }
    ];

    const result = service.sortData({ active: '', direction: '' }, rows, []);

    expect(result).toBe(rows);
  });

  it('sorts rows with a typed accessor', () => {
    const rows: ReportRow[] = [
      { completedAt: '2026-01-02', name: 'Bravo', runState: { score: 2 } },
      { completedAt: '2026-01-01', name: 'Alpha', runState: { score: 3 } },
      { completedAt: '2026-01-03', name: 'Charlie', runState: { score: 1 } }
    ];
    const columns: SortableColumn<ReportRow>[] = [
      {
        name: 'status',
        type: 'number',
        accessor: (row) => row.runState.score
      }
    ];

    const result = service.sortData(
      { active: 'status', direction: 'desc' } as Sort,
      rows,
      columns
    );

    expect(result.map((row) => row.name)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie'
    ]);
  });

  it('sorts string columns in ascending order', () => {
    const rows: ReportRow[] = [
      { completedAt: '2026-01-02', name: 'Bravo', runState: { score: 2 } },
      { completedAt: '2026-01-01', name: 'Alpha', runState: { score: 3 } }
    ];
    const columns: SortableColumn<ReportRow>[] = [
      {
        name: 'name',
        type: 'string',
        accessor: (row) => row.name
      }
    ];

    const result = service.sortData(
      { active: 'name', direction: 'asc' } as Sort,
      rows,
      columns
    );

    expect(result.map((row) => row.name)).toEqual(['Alpha', 'Bravo']);
  });

  it('sorts date columns in ascending order', () => {
    const rows: ReportRow[] = [
      { completedAt: '2026-01-02', name: 'Bravo', runState: { score: 2 } },
      { completedAt: '2026-01-01', name: 'Alpha', runState: { score: 3 } }
    ];
    const columns: SortableColumn<ReportRow>[] = [
      {
        name: 'completedAt',
        type: 'date',
        accessor: (row) => row.completedAt
      }
    ];

    const result = service.sortData(
      { active: 'completedAt', direction: 'asc' } as Sort,
      rows,
      columns
    );

    expect(result.map((row) => row.name)).toEqual(['Alpha', 'Bravo']);
  });

  it('handles nullish values without throwing during string sorting', () => {
    const rows = [{ label: undefined }, { label: 'Bravo' }, { label: null }];
    const columns: SortableColumn<(typeof rows)[number]>[] = [
      {
        name: 'label',
        type: 'string',
        accessor: (row) => row.label
      }
    ];

    const result = service.sortData(
      { active: 'label', direction: 'asc' } as Sort,
      rows,
      columns
    );

    expect(result).toHaveLength(3);
    expect(result[2]?.label).toBe('Bravo');
  });
});
