import { treeNodeDeactivateGuard } from './documentation.guard';

describe('treeNodeDeactivateGuard', () => {
  it('returns true (always allows deactivation)', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const result = (treeNodeDeactivateGuard as any)(
      {},
      {} as never,
      {} as never,
      {} as never
    );
    expect(result).toBe(true);
    spy.mockRestore();
  });
});
