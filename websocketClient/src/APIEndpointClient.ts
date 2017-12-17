
import {IBasicSocket} from "./IBasicSocket";
import {EventEmitter, eventHandler} from "./util/EventEmitter";

export class APIEndpointClient {
    private socket: IBasicSocket;
    public readonly endpointConnectionId: string;
    private readonly eventEmitter: EventEmitter;
    private emitEventHandler: (eventName: string, args: any) => void;

    constructor(socket: IBasicSocket, endpointConnectionId: string) {
        this.socket = socket;
        this.endpointConnectionId = endpointConnectionId;
        this.eventEmitter = new EventEmitter();

        this.emitEventHandler = (eventName: string, args: any) => {
            this.handleReceivedEvent(eventName, args);
        };
        this.registerSocketListeners();
    }

    protected registerSocketListeners() {
        this.socket.on(`emitEvent.${this.endpointConnectionId}`, this.emitEventHandler);
    }

    protected unregisterSocketListeners() {
        this.socket.off(`emitEvent.${this.endpointConnectionId}`, this.emitEventHandler);
    }

    //public for unit testing
    handleReceivedEvent(eventName: string, args: any[]) {
        this.eventEmitter.emit(eventName, ...args);
    }

    async callAction<T = any>(actionName: string, args: any = {}): Promise<T> {
        return new Promise<any>((resolve, reject) => {
            this.socket.emit('callEndpointFunction', this.endpointConnectionId, actionName, args, (errorMessage: string, retVal: any) => {
                if (errorMessage) {
                    reject(new Error(errorMessage));
                    return;
                }
                resolve(retVal);
            });
        });
    }

    on(eventName: string, eventHandler: eventHandler) {
        return this.eventEmitter.on(eventName, eventHandler);
    }

    off(eventName: string, eventHandler: eventHandler) {
        return this.eventEmitter.off(eventName, eventHandler);
    }

    disconnect() {
        this.unregisterSocketListeners();
        this.socket.emit('disconnectEndpointConnection', this.endpointConnectionId);
    }
}