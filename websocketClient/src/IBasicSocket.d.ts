export interface IBasicSocket {
    on: (eventName: string, cb: (...args: any[]) => void) => void;
    off: (eventName: string, cb: (...args: any[]) => void) => void;
    emit: (eventName: string, ...args: any[]) => void;
}
