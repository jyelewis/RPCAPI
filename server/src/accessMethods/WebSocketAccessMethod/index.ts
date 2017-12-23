
import {API} from "../../API";
import {InvalidTypeError, NotFoundError} from "./customErrors";
import {IEndpointConnection} from "./types";
import {EndpointConnectionIndex} from "./EndpointConnectionIndex";
import {validateParamType} from "./validateParamType";
import {createGuid} from "../../util/guid";
import {AccessDeniedError} from "../../errorTypes";

export class WebSocketAccessMethod extends EndpointConnectionIndex {
    public outputActionErrors: boolean = true;
    private readonly api: API;
    private io: SocketIO.Server;

    constructor(api: API) {
        super();
        this.api = api;
    }

    bind(io: SocketIO.Server) {
        if (this.io) {
            throw new Error('bind() has already been called');
        }

        this.io = io;

        this.io.on('connection', socket => this.handleNewConnection(socket));
    }

    handleNewConnection(socket: SocketIO.Socket) {
        socket.on('connectToEndpoint',
            (endpointName: string, accessKey: string, cb: (error: string, epcid: string) => void) => {
                this.createNewSocketEndpoint(socket.id, endpointName, accessKey).then(endpointConnection => {

                    if (endpointConnection === null) {
                        cb(`Unable to create endpoint connection, '${endpointName}' does not exist`, null);
                        return;
                    }

                    endpointConnection.endpoint.registerEmitHandler((eventName: string, args: any[]) => {
                        //Called when the endpoint calls .emit()
                        socket.emit(`emitEvent.${endpointConnection.endpointConnectionId}`, eventName, args);
                    });

                    cb(null, endpointConnection.endpointConnectionId);

                }).catch(e => {
                    if (e instanceof AccessDeniedError) {
                        cb(`Access denied: ${e.message}`, null);
                        return;
                    }

                    console.error(e);
                    cb(`Unable to create endpoint connection, '${endpointName}' threw an error while setting up`, null);
                });
            }
        );

        socket.on('callEndpointFunction',
            (endpointConnectionId: string, actionName: string, params: any, cb: (error: string, res: any) => void) => {
                this.callEndpointAction(socket.id, endpointConnectionId, actionName, params)
                    .then((retVal: any) => cb(null, retVal))
                    .catch((e: Error) => {
                        if (e instanceof NotFoundError) {
                            cb(e.message, null);
                        } else if (e instanceof InvalidTypeError) {
                            cb(e.message, null);
                        } else if (e instanceof AccessDeniedError) {
                            cb(`Access denied: ${e.message}`, null);
                        } else {
                            if (this.outputActionErrors) {
                                console.error(e);
                            }
                            cb('Internal server error', null);
                        }
                    });
            }
        );

        socket.on('disconnect', () => {
            this.disconnectAllSocketEndpoints(socket.id);
        });

        socket.on('disconnectEndpointConnection', (endpointConnectionId: string) => {
            this.disconnectEndpointConnection(socket.id, endpointConnectionId);
        });

        //Tell the client we are ready to receive messages
        socket.emit('serverReady');
    }

    async createNewSocketEndpoint(socketId: string, endpointName: string, accessKey?: string): Promise<IEndpointConnection> {
        const endpoint = this.api.getEndpoint(endpointName);
        if (endpoint === null) {
            return null;
        }

        const newEndpointConnection = <IEndpointConnection>{
            endpointConnectionId: createGuid(),
            socketId,
            endpoint
        };

        this.addEndpointConnection(newEndpointConnection);

        endpoint.accessKey = accessKey;

        await newEndpointConnection.endpoint.callConnect();

        return newEndpointConnection;
    }

    disconnectAllSocketEndpoints(socketId: string) {
        const endpointConnections = this.getEndpointConnectionsForSocketId(socketId);

        endpointConnections.forEach(epc =>
            epc.endpoint.callDisconnect().catch(console.error)
        );

        //We can now GC these socket endpoint connections
        this.removeEndpointConnectionsForSocketId(socketId);
    }

    disconnectEndpointConnection(socketId: string, endpointConnectionId: string) {
        const endpointConnection = this.getEndpointConnectionById(endpointConnectionId);
        if (!endpointConnection) {
            throw new Error('Cannot disconnect endpoint, endpoint not found');
        }
        if (endpointConnection.socketId !== socketId) {
            throw new Error('Cannot disconnect endpoint, it doesnt belong to this socket');
        }

        endpointConnection.endpoint.callDisconnect().catch(console.error);

        //We can now GC this endpoint connection
        this.removeEndpointConnectionById(endpointConnectionId);
    }

    async callEndpointAction(socketId: string, endpointConnectionId: string, actionName: string, params: any = {}): Promise<any> {
        const endpointConnection = this.getEndpointConnectionById(endpointConnectionId);
        if (endpointConnection === undefined) {
            throw new NotFoundError(`endpointConnection '${endpointConnectionId}' does not exist, has it been closed?`);
        }

        if (endpointConnection.socketId !== socketId) {
            throw new NotFoundError(`endpointConnection '${endpointConnectionId}' does not belong to this socket`);
        }

        if (!endpointConnection.endpoint.actionExists(actionName)) {
            throw new NotFoundError(`action '${actionName}' does not exist`);
        }

        //filter out params and check types
        const actionParams = endpointConnection.endpoint.actionParams(actionName);
        const validatedParams = Object.create(null);

        for (const paramName in actionParams) {
            if (actionParams.hasOwnProperty(paramName)) {
                const actionParamType = actionParams[paramName];
                const paramValue = params[paramName];

                //Will throw if there is an issue
                validateParamType(actionParamType, paramName, paramValue);
                validatedParams[paramName] = paramValue;
            }
        }

        return await endpointConnection.endpoint.callAction(actionName, validatedParams);
    }
}