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

        this.registerIpc();
        this.initPromise = this.init();
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
        this.broadcast();
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
        await this.initPromise; // Ensure we don't write before initial hydration completes

        const newState = deepMerge(this.state, partial);

        if (this.options.validate) {
            this.state = this.options.validate(newState); // Validation may throw, preventing the set
        } else {
            this.state = newState as T;
        }

        // execute persistence hooks in parallel
        await Promise.all(
            this.middleware.map(mw => mw.onPersist ? mw.onPersist(this.state) : Promise.resolve())
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

        ipcMain.removeHandler(Channels.GET(name));
        ipcMain.removeHandler(Channels.SET(name));
        ipcMain.removeHandler(Channels.RESET(name));

        ipcMain.handle(Channels.GET(name), async () => {
            await this.initPromise;
            return this.get();
        });

        ipcMain.handle(Channels.SET(name), async (_: IpcMainInvokeEvent, u: DeepPartial<T>) => {
            await this.set(u);
        });

        ipcMain.handle(Channels.RESET(name), async () => {
            await this.set(this.options.defaults);
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