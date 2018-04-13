import {IBasicSocket} from "./IBasicSocket";
import {EventEmitter, eventHandler} from "./util/EventEmitter";
import {ConnectionTimeoutError} from "./errorTypes";

export class APIEndpointClient {
    public readonly endpointConnectionId: string;
    public timeout: number = 10 * 1000;
    public isDisconnected = false;

    private socket: IBasicSocket;
    private readonly eventEmitter: EventEmitter;
    private readonly emitEventHandler: (eventName: string, args: any) => void;

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
        if (this.isDisconnected) {
            throw new Error('Cannot callAction() on disconnected endpoint');
        }

        return new Promise<any>((resolve, reject) => {
            let hasTimedOut = false;
            const timeoutTimer = setTimeout(() => {
                hasTimedOut = true;
                reject(new ConnectionTimeoutError(`callAction('${actionName}', ${JSON.stringify(args)}) timed out`));
            }, this.timeout);

            this.socket.emit('callEndpointFunction', this.endpointConnectionId, actionName, args, (errorMessage: string, retVal: any) => {
                clearTimeout(timeoutTimer);

                if (hasTimedOut) {
                    //console.warn('callAction resolved after timeout error was already thrown, maybe you have a slow action?');
                    return;
                }

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
        this.isDisconnected = true;
    }
}