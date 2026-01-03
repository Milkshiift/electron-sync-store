import { type Listener, type Unsubscribe } from "./types";
export declare class StoreClient<T> {
    private name;
    private state;
    private listeners;
    private readyPromise;
    private channelChange;
    private handleParamsChange;
    constructor(name: string);
    ready(): Promise<T>;
    get(): Readonly<T>;
    set(value: T): Promise<void>;
    subscribe(cb: Listener<T>): Unsubscribe;
    private notify;
    dispose(): void;
}
export declare function createClient<T>(name: string): StoreClient<T>;
