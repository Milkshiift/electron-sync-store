import { type Middleware } from "./types";
export interface SetOptions {
    /**
     * Whether to trigger the onPersist middleware.
     * If false, the state is updated in memory and broadcast to renderers,
     * but not saved via middleware.
     * @default true
     */
    persist?: boolean;
}
export declare class StoreHost<T> {
    private name;
    private middleware;
    private state;
    private initPromise;
    private writeLock;
    constructor(name: string, middleware?: Middleware<T>[]);
    private hydrate;
    get(): Readonly<T>;
    set(value: T, options?: SetOptions): Promise<void>;
    private broadcast;
    private persist;
    private registerIpc;
    ready(): Promise<void>;
}
export declare function createHost<T>(name: string, ...middleware: Middleware<T>[]): StoreHost<T>;
