type ChromeStorageArea = {
  get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
};

declare const chrome: {
  storage: {
    local: ChromeStorageArea;
  };
  tabs: {
    query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Array<{ id?: number; url?: string }>>;
    sendMessage<TResponse = unknown>(tabId: number, message: unknown): Promise<TResponse>;
  };
  runtime: {
    getURL(path: string): string;
    onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: unknown,
          sendResponse: (response?: unknown) => void,
        ) => boolean | void,
      ): void;
    };
  };
};
