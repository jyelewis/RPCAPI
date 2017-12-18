/// <reference types="socket.io" />
import { API } from "../../API";
import { IEndpointConnection } from "./types";
import { EndpointConnectionIndex } from "./EndpointConnectionIndex";
export declare class WebSocketAccessMethod extends EndpointConnectionIndex {
    private readonly api;
    private io;
    constructor(api: API);
    bind(io: SocketIO.Server): void;
    handleNewConnection(socket: SocketIO.Socket): void;
    createNewSocketEndpoint(socketId: string, endpointName: string): IEndpointConnection;
    disconnectAllSocketEndpoints(socketId: string): void;
    disconnectEndpointConnection(socketId: string, endpointConnectionId: string): void;
    callEndpointAction(socketId: string, endpointConnectionId: string, actionName: string, params: any): Promise<any>;
}
