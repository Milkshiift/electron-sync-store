export interface Middleware<T> {
    onHydrate?: () => T | Promise<T | null | undefined>;
    onPersist?: (state: Readonly<T>) => void | Promise<void>;
}

export type Listener<T> = (state: Readonly<T>) => void;
export type Unsubscribe = () => void;

/** @internal */
export const Channels = {
    GET: (name: string) => `store:${name}:get`,
    SET: (name: string) => `store:${name}:set`,
    ON_CHANGE: (name: string) => `store:${name}:changed`,
};