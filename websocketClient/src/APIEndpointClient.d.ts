import { IBasicSocket } from "./IBasicSocket";
import { eventHandler } from "./util/EventEmitter";
export declare class APIEndpointClient {
    private socket;
    readonly endpointConnectionId: string;
    private readonly eventEmitter;
    private emitEventHandler;
    constructor(socket: IBasicSocket, endpointConnectionId: string);
    protected registerSocketListeners(): void;
    protected unregisterSocketListeners(): void;
    handleReceivedEvent(eventName: string, args: any[]): void;
    callAction<T = any>(actionName: string, args?: any): Promise<T>;
    on(eventName: string, eventHandler: eventHandler): void;
    off(eventName: string, eventHandler: eventHandler): void;
    disconnect(): void;
}
