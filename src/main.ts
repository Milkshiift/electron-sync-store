import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import { Channels, type Middleware, type StoreOptions, type DeepPartial } from "./types";
import { clone, deepMerge } from "./shared";

/**
 * The Main process host for the state store.
 * Manages the source of truth, persistence middleware, and broadcasting updates to renderers.
 */
export class StoreHost<T> {
    private state: T;
    private options: StoreOptions<T>;
    private middleware: Middleware<T>[];
    private initPromise: Promise<void>;

    constructor(options: StoreOptions<T>, middleware: Middleware<T>[] = []) {
        this.options = options;
        this.state = clone(options.defaults);
        this.middleware = middleware;

        this.initPromise = this.init();
        this.registerIpc();
    }

    /**
     * Hydrates state from middleware (e.g., file system), validates it, and broadcasts readiness.
     */
    private async init() {
        try {
            for (const mw of this.middleware) {
                if (mw.onHydrate) {
                    const loaded = await mw.onHydrate();
                    if (loaded) this.state = deepMerge(this.state, loaded);
                }
            }
            if (this.options.validate) {
                this.state = this.options.validate(this.state);
            }
        } catch (error) {
            console.error(`[StoreHost:${this.options.name}] Hydration failed, reverting to defaults.`, error);
            this.state = clone(this.options.defaults);
        }
    }

    /**
     * Returns a deep copy of the current state.
     */
    public get(): T {
        return clone(this.state);
    }

    /**
     * Updates the state with a partial object, runs validation, executes persistence middleware, and notifies renderers.
     */
    public async set(partial: DeepPartial<T> | T) {
        await this.initPromise;

        const newState = deepMerge(this.state, partial);
        await this.applyState(newState);
    }

    /**
     * Updates a specific top-level key by replacing it entirely.
     * Use this when you need to remove keys from an object by omitting them,
     * rather than merging.
     */
    public async setKey<K extends keyof T>(key: K, value: T[K]) {
        await this.initPromise;

        const newState = clone(this.state);
        newState[key] = value;
        await this.applyState(newState);
    }

    private async applyState(newState: T) {
        if (this.options.validate) {
            try {
                newState = this.options.validate(newState);
            } catch (err) {
                // Validation failed, abort update
                throw err;
            }
        }

        // Performance: Skip broadcast/persist if state effectively didn't change
        if (JSON.stringify(this.state) === JSON.stringify(newState)) return;

        this.state = newState;

        // Execute persistence hooks (non-blocking for UI, but awaited for data safety)
        await Promise.all(
            this.middleware.map(mw =>
                mw.onPersist ? Promise.resolve(mw.onPersist(this.state)).catch(e => console.error(e)) : undefined
            )
        );

        this.broadcast();
    }

    /**
     * Pushes the current state to all active browser windows.
     */
    private broadcast() {
        const channel = Channels.ON_CHANGE(this.options.name);
        for (const win of BrowserWindow.getAllWindows()) {
            if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
                win.webContents.send(channel, this.state);
            }
        }
    }

    /**
     * Registers IPC handlers. Removes existing handlers for the same store name to support hot-reloading.
     */
    private registerIpc() {
        const { name } = this.options;
        const bind = (channel: string, fn: (e: IpcMainInvokeEvent, ...args: any[]) => Promise<any>) => {
            ipcMain.removeHandler(channel);
            ipcMain.handle(channel, fn);
        };

        bind(Channels.GET(name), async () => {
            await this.initPromise;
            return this.get();
        });

        bind(Channels.SET(name), async (_, u: DeepPartial<T>) => {
            await this.set(u);
        });

        bind(Channels.SET_KEY(name), async (_, key: keyof T, val: any) => {
            await this.setKey(key, val);
        });

        bind(Channels.RESET(name), async () => {
            await this.applyState(clone(this.options.defaults));
        });
    }

    /**
     * Resolves when the store has finished its initial hydration cycle.
     */
    public async ready() {
        await this.initPromise;
    }
}

/**
 * Creates a new StoreHost instance in the Main process.
 */
export function createHost<T>(options: StoreOptions<T>, ...middleware: Middleware<T>[]) {
    return new StoreHost(options, middleware);
}