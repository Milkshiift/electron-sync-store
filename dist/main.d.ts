import { type Middleware } from "./types";
export declare class StoreHost<T> {
    private name;
    private middleware;
    private state;
    private initPromise;
    private writeLock;
    constructor(name: string, middleware?: Middleware<T>[]);
    private hydrate;
    get(): Readonly<T>;
    set(value: T): Promise<void>;
    private broadcast;
    private persist;
    private registerIpc;
    ready(): Promise<void>;
}
export declare function createHost<T>(name: string, ...middleware: Middleware<T>[]): StoreHost<T>;
