declare global {
  interface WindowEventMap {
    'open-post-composer': CustomEvent<void>;
  }
}

export {};
