import { ipcRenderer, type IpcRendererEvent } from "electron";
import { Channels, type Listener, type StoreOptions, type Unsubscribe, type DeepPartial } from "./types";
import { clone, deepMerge } from "./shared";

/**
 * The Renderer process client.
 * synchronizes state with the Main process and handles optimistic updates.
 */
export class StoreClient<T> {
    private state: T;
    private listeners = new Set<Listener<T>>();
    private options: StoreOptions<T>;
    private readyPromise: Promise<T>;

    constructor(options: StoreOptions<T>) {
        this.options = options;
        this.state = clone(options.defaults);

        // Listen for server-side changes
        ipcRenderer.on(Channels.ON_CHANGE(options.name), (_: IpcRendererEvent, data: T) => {
            this.state = data;
            this.notify();
        });

        // Request initial state immediately
        this.readyPromise = ipcRenderer.invoke(Channels.GET(options.name))
            .then((data) => {
                this.state = data;
                this.notify();
                return data;
            })
            .catch((err) => {
                console.error(`[StoreClient] Init failed`, err);
                return this.state;
            });
    }

    /**
     * Returns a promise that resolves with the state when the initial synchronization is complete.
     */
    public async ready(): Promise<T> {
        return this.readyPromise;
    }

    public get(): T {
        return clone(this.state);
    }

    public getKey<K extends keyof T>(key: K): T[K] {
        return clone(this.state[key]);
    }

    /**
     * Updates the state.
     * If `optimistic` is enabled in options, the local state updates immediately.
     * If the IPC call fails, the state rolls back to the previous version.
     */
    public async set(update: DeepPartial<T> | T): Promise<void> {
        if (!this.options.optimistic) {
            // Standard Mode: Round-trip to Main before updating UI
            await ipcRenderer.invoke(Channels.SET(this.options.name), update);
            return;
        }

        // Optimistic Mode
        const previousState = this.state;
        const optimisticState = deepMerge(clone(previousState), update);

        this.state = optimisticState;
        this.notify();

        try {
            await ipcRenderer.invoke(Channels.SET(this.options.name), update);
        } catch (err) {
            console.error(`[StoreClient] Sync failed, rolling back.`, err);

            // Rollback only if state matches our optimistic expectation
            // (Prevents overwriting updates that came from elsewhere in the meantime)
            if (this.state === optimisticState) {
                this.state = previousState;
                this.notify();
            }
            throw err;
        }
    }

    public async setKey<K extends keyof T>(key: K, value: T[K]): Promise<void> {
        const update = { [key]: value } as unknown as DeepPartial<T>;
        await this.set(update);
    }

    public async reset(): Promise<void> {
        await ipcRenderer.invoke(Channels.RESET(this.options.name));
    }

    /**
     * Subscribes to state changes.
     * @returns An unsubscribe function.
     */
    public subscribe(cb: Listener<T>): Unsubscribe {
        this.listeners.add(cb);
        // Immediate callback with current state
        cb(clone(this.state));
        return () => { this.listeners.delete(cb); };
    }

    private notify() {
        const s = clone(this.state);
        for (const cb of this.listeners) cb(s);
    }
}

/**
 * Creates a new StoreClient instance in the Renderer process.
 */
export function createClient<T>(options: StoreOptions<T>) {
    return new StoreClient(options);
}