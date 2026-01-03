import { ipcRenderer, type IpcRendererEvent } from "electron";
import { Channels, type Listener, type Unsubscribe } from "./types";

export class StoreClient<T> {
    private state: T | undefined;
    private listeners = new Set<Listener<T>>();
    private readyPromise: Promise<T>;
    private channelChange: string;

    private handleParamsChange = (_: IpcRendererEvent, data: T) => {
        this.state = data;
        this.notify();
    };

    constructor(private name: string) {
        this.channelChange = Channels.ON_CHANGE(name);
        ipcRenderer.on(this.channelChange, this.handleParamsChange);

        this.readyPromise = ipcRenderer.invoke(Channels.GET(name)).then((data: T) => {
            if (this.state === undefined) {
                this.state = data;
                this.notify();
            }
            return this.state!;
        });
    }

    public ready(): Promise<T> {
        return this.readyPromise;
    }

    public get(): Readonly<T> {
        if (this.state === undefined) throw new Error(`Store "${this.name}" not hydrated`);
        return this.state;
    }

    public async set(value: T): Promise<void> {
        this.state = value;
        this.notify();

        try {
            await ipcRenderer.invoke(Channels.SET(this.name), value);
        } catch (e) {
            console.error(`Store "${this.name}" sync failed`, e);
            // Revert/Resync on error
            this.state = await ipcRenderer.invoke(Channels.GET(this.name));
            this.notify();
        }
    }

    public subscribe(cb: Listener<T>): Unsubscribe {
        this.listeners.add(cb);
        if (this.state !== undefined) cb(this.state);
        return () => this.listeners.delete(cb);
    }

    private notify(): void {
        if (this.state === undefined) return;
        for (const cb of this.listeners) cb(this.state);
    }

    public dispose(): void {
        ipcRenderer.removeListener(this.channelChange, this.handleParamsChange);
        this.listeners.clear();
    }
}

export function createClient<T>(name: string): StoreClient<T> {
    return new StoreClient(name);
}