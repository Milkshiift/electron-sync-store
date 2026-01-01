import { type Middleware, type StoreOptions, type DeepPartial } from "./types";
/**
 * The Main process host for the state store.
 * Manages the source of truth, persistence middleware, and broadcasting updates to renderers.
 */
export declare class StoreHost<T> {
    private state;
    private options;
    private middleware;
    private initPromise;
    constructor(options: StoreOptions<T>, middleware?: Middleware<T>[]);
    /**
     * Hydrates state from middleware (e.g., file system), validates it, and broadcasts readiness.
     */
    private init;
    /**
     * Returns a deep copy of the current state.
     */
    get(): T;
    /**
     * Updates the state with a partial object, runs validation, executes persistence middleware, and notifies renderers.
     */
    set(partial: DeepPartial<T> | T): Promise<void>;
    /**
     * Pushes the current state to all active browser windows.
     */
    private broadcast;
    /**
     * Registers IPC handlers. Removes existing handlers for the same store name to support hot-reloading.
     */
    private registerIpc;
    /**
     * Resolves when the store has finished its initial hydration cycle.
     */
    ready(): Promise<void>;
}
/**
 * Creates a new StoreHost instance in the Main process.
 */
export declare function createHost<T>(options: StoreOptions<T>, ...middleware: Middleware<T>[]): StoreHost<T>;
