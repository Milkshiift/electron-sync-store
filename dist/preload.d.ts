import { type Listener, type StoreOptions, type Unsubscribe, type DeepPartial } from "./types";
/**
 * The Renderer process client.
 * synchronizes state with the Main process and handles optimistic updates.
 */
export declare class StoreClient<T> {
    private state;
    private listeners;
    private options;
    private readyPromise;
    constructor(options: StoreOptions<T>);
    /**
     * Returns a promise that resolves with the state when the initial synchronization is complete.
     */
    ready(): Promise<T>;
    get(): T;
    getKey<K extends keyof T>(key: K): T[K];
    /**
     * Updates the state.
     * If `optimistic` is enabled in options, the local state updates immediately.
     * If the IPC call fails, the state rolls back to the previous version.
     */
    set(update: DeepPartial<T> | T): Promise<void>;
    setKey<K extends keyof T>(key: K, value: T[K]): Promise<void>;
    reset(): Promise<void>;
    /**
     * Subscribes to state changes.
     * @returns An unsubscribe function.
     */
    subscribe(cb: Listener<T>): Unsubscribe;
    private notify;
}
/**
 * Creates a new StoreClient instance in the Renderer process.
 */
export declare function createClient<T>(options: StoreOptions<T>): StoreClient<T>;
