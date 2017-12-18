import { APIEndpointClient } from "./APIEndpointClient";
import { IBasicSocket } from "./IBasicSocket";
export declare class ConnectionTimeoutError extends Error {
    constructor(m?: string);
}
export declare class APIClient {
    private readonly socketAddr;
    protected socket: IBasicSocket;
    connectionTimeout: number;
    constructor(socketAddr: string);
    connect(): Promise<void>;
    waitForServerReady(): Promise<{}>;
    mockSocket(mockSocket: IBasicSocket): Promise<void>;
    connectToEndpoint(endpointName: string): Promise<APIEndpointClient>;
}
