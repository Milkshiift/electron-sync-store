export interface StoreOptions<T> {
    /** Unique name for the store (used for IPC channels). */
    name: string;
    /** The initial default state. */
    defaults: T;
    /**
     * If true, the renderer updates the UI immediately before syncing with Main.
     * If the sync fails, the state automatically rolls back.
     * @default false
     */
    optimistic?: boolean;
    /** Optional validator. Returns sanitized state or throws error to cancel update. */
    validate?: (data: unknown) => T;
}

export interface Middleware<T> {
    /** Run on initialization. Return object to merge into initial state. */
    onHydrate?: () => T | Promise<T | null | undefined>;
    /** Run after every state change. Use for saving to disk/DB. */
    onPersist?: (state: T) => void | Promise<void>;
}

export type Listener<T> = (state: T) => void;
export type Unsubscribe = () => void;

/** Recursive partial type helper */
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Internal IPC Channel definitions.
 * @internal
 */
export const Channels = {
    GET: (name: string) => `store:${name}:get`,
    SET: (name: string) => `store:${name}:set`,
    RESET: (name: string) => `store:${name}:reset`,
    ON_CHANGE: (name: string) => `store:${name}:changed`,
};