const { ioMock } = vi.hoisted(() => ({
  ioMock: vi.fn()
}));

vi.mock('socket.io-client', () => ({
  io: ioMock
}));

describe('WebSocketService', () => {
  let socket: {
    on: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };

  async function createService() {
    const { WebSocketService } = await import('./web-socket.service');
    return new WebSocketService();
  }

  beforeEach(() => {
    vi.resetModules();
    socket = { on: vi.fn(), emit: vi.fn() };
    ioMock.mockReset();
    ioMock.mockReturnValue(socket as never);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('connects on construction and registers events/connect/connect_error handlers', async () => {
    const service = await createService();
    expect(service.getSocket()).toBe(socket);
    expect(socket.on).toHaveBeenCalledWith('events', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith(
      'connect_error',
      expect.any(Function)
    );
  });

  it('flips connectionStatus$ to true once the connect handler fires', async () => {
    const service = await createService();
    expect(service.connectionStatus$()).toBe(false);
    const handler = socket.on.mock.calls.find(
      ([event]) => event === 'connect'
    )?.[1] as () => void;
    handler();
    expect(service.connectionStatus$()).toBe(true);
  });

  it('sendMessage emits on the events channel', async () => {
    const service = await createService();
    service.sendMessage('hello');
    expect(socket.emit).toHaveBeenCalledWith('events', 'hello');
  });
});
