import { MiradorLiveStream } from '../MiradorLiveStream';
import type { MiradorQuery } from '../../types';

describe('MiradorLiveStream', () => {
  it('emits frames when messages arrive', (done) => {
    const messages: any[] = [];
    class StubWebSocket {
      public static listeners: Record<string, ((ev: any) => void)[]> = {};
      public readyState = 1;
      constructor(public url: string) {
        StubWebSocket.listeners[url] = [];
        setTimeout(() => this.dispatch('open'), 0);
      }
      addEventListener(type: string, listener: (ev: any) => void) {
        StubWebSocket.listeners[this.url].push((event: any) => {
          if (event.type === type) {
            listener(event);
          }
        });
      }
      send(payload: string) {
        messages.push({ type: 'send', payload, url: this.url });
        const event = {
          type: 'message',
          data: JSON.stringify({ timestamp: '2025-01-01T00:00:00Z', message: 'hello' }),
        };
        this.dispatch('message', event);
      }
      close() {
        const event = { type: 'close', code: 1000 };
        this.dispatch('close', event);
      }
      dispatch(type: string, payload?: any) {
        const event = { type, ...(payload ?? {}) };
        for (const listener of StubWebSocket.listeners[this.url]) {
          listener(event);
        }
      }
    }

    const liveStream = new MiradorLiveStream({
      baseUrl: 'https://example.com',
      WebSocketImpl: StubWebSocket as unknown as typeof WebSocket,
    });

    const query = { refId: 'A', queryType: 'logs', query: 'service:"payments"' } as MiradorQuery;

    const subscription = liveStream.stream(query).subscribe({
      next: (frame) => {
        expect(messages[0].payload).toContain('service');
        expect(frame.data[0].length).toBe(1);
        subscription.unsubscribe();
        done();
      },
      error: done.fail,
    });
  });
});
