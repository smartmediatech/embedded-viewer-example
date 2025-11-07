// Bridge types for smt-base-bridge

export interface Bridge {
  addRequestHandler: (
    name: string,
    callback: (request: {
      id: string;
      name: string;
      meta: Record<string, string> | undefined;
      payload: Record<string, any>;
    }) => Promise<Record<string, any>>
  ) => void;
  removeRequestHandler: (name: string) => void;
  sendRequest: (name: string, payload: Record<string, any>) => Promise<Record<string, any>>;
}

declare global {
  interface Window {
    SMTBaseBridge?: {
      ParentBridge: new (
        iframe: HTMLIFrameElement,
        config: { origin: string; meta?: Record<string, unknown> }
      ) => Bridge;
      ChildBridge: new (config: {
        origin: string;
        meta?: Record<string, unknown>;
      }) => Bridge;
    };
  }
}
