export interface Middleware<T> {
    onHydrate?: () => T | Promise<T | null | undefined>;
    onPersist?: (state: Readonly<T>) => void | Promise<void>;
}
export type Listener<T> = (state: Readonly<T>) => void;
export type Unsubscribe = () => void;
/** @internal */
export declare const Channels: {
    GET: (name: string) => string;
    SET: (name: string) => string;
    ON_CHANGE: (name: string) => string;
};
