export declare type eventHandler = (...args: any[]) => void;
export declare class EventEmitter {
    private listeners;
    constructor();
    on(eventName: string, handler: eventHandler): void;
    off(eventName: string, handler: eventHandler): void;
    emit(eventName: string, ...args: any[]): void;
    numListeners(eventName: string): number;
}
