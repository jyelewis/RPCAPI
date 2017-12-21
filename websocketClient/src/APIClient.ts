import * as io from 'socket.io-client'
import {APIEndpointClient} from "./APIEndpointClient";
import {IBasicSocket} from "./IBasicSocket";
import {ConnectionTimeoutError} from "./errorTypes";

export class APIClient {
    private readonly socketAddr: string;
    protected socket: IBasicSocket;
    public timeout: number = 10 * 1000;

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
            }, this.timeout);
            this.socket.on('serverReady', () => {
                clearTimeout(serverReadyTimer);
                resolve();
            });
        });
    }

    //Used for unit tests
    async mockSocketConnect(mockSocket: IBasicSocket) {
        this.socket = mockSocket;
        await this.waitForServerReady();
    }

    public async connectToEndpoint(endpointName: string): Promise<APIEndpointClient> {
        if (!this.socket) {
            throw new Error('Cannot connect to endpoint before socket connection is established, have you forgotten to call connect() ?');
        }

        return new Promise<APIEndpointClient>((resolve, reject) => {
            let hasTimedOut = false;
            const timeoutTimer = setTimeout(() => {
                hasTimedOut = true;
                reject(new ConnectionTimeoutError(`connectToEndpoint('${endpointName}') timed out`));
            }, this.timeout);

            this.socket.emit('connectToEndpoint', endpointName, (errorMessage: string, endpointConnectionId: string) => {
                clearTimeout(timeoutTimer);

                if (hasTimedOut) {
                    //console.warn('connectToEndpoint resolved after timeout error was already thrown, maybe you have a slow endpoint?');
                    return;
                }

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