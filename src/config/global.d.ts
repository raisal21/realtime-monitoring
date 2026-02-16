interface WebSocketStreamOptions {
  protocols?: string | string[];
  signal?: AbortSignal;
}

interface WebSocketStream {
  readonly url: string;
  readonly opened: Promise<{
    readable: ReadableStream<any>;
    writable: WritableStream<any>;
    extensions: string;
    protocol: string;
  }>;
  readonly closed: Promise<{ code: number; reason: string }>;
  close(options?: { code?: number; reason?: string }): void;
}

interface Window {
  WebSocketStream: {
    new (url: string, options?: WebSocketStreamOptions): WebSocketStream;
  };
}

declare var WebSocketStream: {
  new (url: string, options?: WebSocketStreamOptions): WebSocketStream;
};
