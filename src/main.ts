import { BrowserWindow, ipcMain } from "electron";
import { Channels, type Middleware } from "./types";

export class StoreHost<T> {
    private state: T | undefined;
    private initPromise: Promise<void>;
    private writeLock: Promise<void> = Promise.resolve();

    constructor(
        private name: string,
        private middleware: Middleware<T>[] = []
    ) {
        this.initPromise = this.hydrate();
        this.registerIpc();
    }

    private async hydrate(): Promise<void> {
        for (const mw of this.middleware) {
            if (mw.onHydrate) {
                try {
                    const data = await mw.onHydrate();
                    if (data != null) {
                        this.state = data;
                        break;
                    }
                } catch (e) {
                    console.error(`[StoreHost] Hydration failed for ${this.name}:`, e);
                }
            }
        }
    }

    public get(): Readonly<T> {
        if (this.state === undefined) throw new Error(`Store "${this.name}" not hydrated`);
        return this.state;
    }

    public async set(value: T): Promise<void> {
        await this.initPromise;
        this.state = structuredClone(value);

        this.broadcast();
        this.persist();
    }

    private broadcast(): void {
        const channel = Channels.ON_CHANGE(this.name);
        for (const win of BrowserWindow.getAllWindows()) {
            if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
                win.webContents.send(channel, this.state);
            }
        }
    }

    private persist(): void {
        this.writeLock = this.writeLock.then(async () => {
            if (!this.state) return;
            await Promise.all(
                this.middleware.map(mw => mw.onPersist?.(this.state!))
            );
        }).catch(err => console.error(`[StoreHost] Persist error in ${this.name}:`, err));
    }

    private registerIpc(): void {
        const getChan = Channels.GET(this.name);
        const setChan = Channels.SET(this.name);

        ipcMain.removeHandler(getChan);
        ipcMain.handle(getChan, async () => {
            await this.initPromise;
            return this.state;
        });

        ipcMain.removeHandler(setChan);
        ipcMain.handle(setChan, async (_, value: T) => {
            await this.set(value);
        });
    }

    public ready(): Promise<void> {
        return this.initPromise;
    }
}

export function createHost<T>(name: string, ...middleware: Middleware<T>[]): StoreHost<T> {
    return new StoreHost(name, middleware);
}