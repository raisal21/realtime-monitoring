interface WebSocketStreamOptions {
  protocols?: string | string[];
  signal?: AbortSignal;
}

interface WebSocketStream {
  readonly url: string;
  readonly opened: Promise<{
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<string | Uint8Array>;
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

declare const WebSocketStream: {
  new (url: string, options?: WebSocketStreamOptions): WebSocketStream;
};

interface ImportMetaEnv {
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_WS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
