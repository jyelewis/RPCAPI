
import {IEndpointConnection} from "./types";

export class EndpointConnectionIndex {
    private endpointConnectionsById: { [endpointConnectionId: string]: IEndpointConnection } = Object.create(null);
    private endpointConnectionsBySocketId: { [socketId: string]: IEndpointConnection[] } = Object.create(null);

    protected addEndpointConnection(newEndpointConnection: IEndpointConnection) {
        this.endpointConnectionsById[newEndpointConnection.endpointConnectionId] = newEndpointConnection;
        if (!this.endpointConnectionsBySocketId[newEndpointConnection.socketId]) {
            this.endpointConnectionsBySocketId[newEndpointConnection.socketId] = [];
        }
        this.endpointConnectionsBySocketId[newEndpointConnection.socketId].push(newEndpointConnection);
    }

    protected getEndpointConnectionById(endpointConnectionId: string): IEndpointConnection {
        return this.endpointConnectionsById[endpointConnectionId];
    }

    protected getEndpointConnectionsForSocketId(socketId: string): IEndpointConnection[] {
        return this.endpointConnectionsBySocketId[socketId] || [];
    }

    protected removeEndpointConnectionsForSocketId(socketId: string) {
        const connections = this.getEndpointConnectionsForSocketId(socketId);
        delete this.endpointConnectionsBySocketId[socketId];
        connections.forEach(conn => {
            delete this.endpointConnectionsById[conn.endpointConnectionId];
        });
    }

    protected removeEndpointConnectionById(endpointConnectionId: string) {
        const existingConnection = this.getEndpointConnectionById(endpointConnectionId);
        delete this.endpointConnectionsById[endpointConnectionId];

        //Remove from socketID indexed array
        this.endpointConnectionsBySocketId[existingConnection.socketId] =
            this.endpointConnectionsBySocketId[existingConnection.socketId].filter(x => x.endpointConnectionId !== endpointConnectionId);
    }

    public numberOfActiveConnections(): number {
        return Object.keys(this.endpointConnectionsById).length;
    }
}