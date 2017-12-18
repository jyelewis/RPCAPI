import { IEndpointConnection } from "./types";
export declare class EndpointConnectionIndex {
    private endpointConnectionsById;
    private endpointConnectionsBySocketId;
    protected addEndpointConnection(newEndpointConnection: IEndpointConnection): void;
    protected getEndpointConnectionById(endpointConnectionId: string): IEndpointConnection;
    protected getEndpointConnectionsForSocketId(socketId: string): IEndpointConnection[];
    protected removeEndpointConnectionsForSocketId(socketId: string): void;
    protected removeEndpointConnectionById(endpointConnectionId: string): void;
    numberOfActiveConnections(): number;
}
