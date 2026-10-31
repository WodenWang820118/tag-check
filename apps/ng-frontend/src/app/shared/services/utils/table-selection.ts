export interface TableSelectionDataSource<T, S = unknown> {
  data: T[];
  filteredData?: T[] | null;
  sort?: S | null;
  sortData?: (data: T[], sort: S) => T[];
  paginator?: {
    pageIndex: number;
    pageSize: number;
  } | null;
}

/** Selection follows displayed order so select-all affects the page the user sees. */
export function getCurrentPageRows<T, S = unknown>(
  dataSource: TableSelectionDataSource<T, S>
): T[] {
  const working = dataSource.filteredData ?? dataSource.data;
  const sorted =
    dataSource.sort && dataSource.sortData
      ? dataSource.sortData(working, dataSource.sort)
      : working;
  const pageIndex = dataSource.paginator?.pageIndex ?? 0;
  const pageSize = dataSource.paginator?.pageSize ?? sorted.length;
  const start = pageIndex * pageSize;
  const end = Math.min(start + pageSize, sorted.length);
  return sorted.slice(start, end);
}

/** Retain off-page selections because select-all applies only to the current page. */
export function togglePageSelection<T>(
  selected: readonly T[],
  pageRows: readonly T[]
): T[] {
  const selectedSet = new Set(selected);
  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selectedSet.has(r));

  if (allPageSelected) {
    const pageSet = new Set(pageRows);
    return selected.filter((r) => !pageSet.has(r));
  }

  const set = new Set(selected);
  for (const r of pageRows) {
    set.add(r);
  }
  return Array.from(set.values());
}

/** Preserve row objects because these selections use object identity. */
export function toggleRowSelection<T>(selected: readonly T[], row: T): T[] {
  return selected.includes(row)
    ? selected.filter((r) => r !== row)
    : [...selected, row];
}
