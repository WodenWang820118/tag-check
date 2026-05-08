import * as socketIo from 'socket.io-client';
import { WebSocketService } from './web-socket.service';

vi.mock('socket.io-client', () => ({
  io: vi.fn()
}));

describe('WebSocketService', () => {
  let socket: {
    on: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    socket = { on: vi.fn(), emit: vi.fn() };
    vi.mocked(socketIo.io).mockReturnValue(socket as never);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('connects on construction and registers events/connect/connect_error handlers', () => {
    const service = new WebSocketService();
    expect(service.getSocket()).toBe(socket);
    expect(socket.on).toHaveBeenCalledWith('events', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith(
      'connect_error',
      expect.any(Function)
    );
  });

  it('flips connectionStatus$ to true once the connect handler fires', () => {
    const service = new WebSocketService();
    expect(service.connectionStatus$()).toBe(false);
    const handler = socket.on.mock.calls.find(
      ([event]) => event === 'connect'
    )?.[1] as () => void;
    handler();
    expect(service.connectionStatus$()).toBe(true);
  });

  it('sendMessage emits on the events channel', () => {
    const service = new WebSocketService();
    service.sendMessage('hello');
    expect(socket.emit).toHaveBeenCalledWith('events', 'hello');
  });
});
