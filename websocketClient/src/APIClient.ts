import * as io from 'socket.io-client'
import {APIEndpointClient} from "./APIEndpointClient";
import {IBasicSocket} from "./IBasicSocket";

export class ConnectionTimeoutError extends Error {
    constructor(m?: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ConnectionTimeoutError.prototype);
    }
}

export class APIClient {
    private readonly socketAddr: string;
    protected socket: IBasicSocket;
    public connectionTimeout: number = 5000;

    constructor(socketAddr: string) {
        this.socketAddr = socketAddr;
    }

    async connect() {
        if (this.socket) {
            throw new Error('Already connected to server');
        }

        this.socket = io(this.socketAddr);

        await this.waitForServerReady();
    }

    async waitForServerReady() {
        return new Promise((resolve, reject) => {
            const serverReadyTimer = setTimeout(() => {
                reject(new ConnectionTimeoutError('Timed out waiting for serverReady'));
            }, this.connectionTimeout);
            this.socket.on('serverReady', () => {
                clearTimeout(serverReadyTimer);
                resolve();
            });
        });
    }

    //Used for unit tests
    async mockSocket(mockSocket: IBasicSocket) {
        this.socket = mockSocket;
        await this.waitForServerReady();
    }

    public async connectToEndpoint(endpointName: string): Promise<APIEndpointClient> {
        if (!this.socket) {
            throw new Error('Cannot connect to endpoint before socket connection is established');
        }

        return new Promise<APIEndpointClient>((resolve, reject) => {
            this.socket.emit('connectToEndpoint', endpointName, (errorMessage: string, endpointConnectionId: string) => {
                if (errorMessage) {
                    reject(new Error(errorMessage));
                    return;
                }
                const newAPIEndpointClient = new APIEndpointClient(this.socket, endpointConnectionId);

                resolve(newAPIEndpointClient);
            });
        });
    }

}