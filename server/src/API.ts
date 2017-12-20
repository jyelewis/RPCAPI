import {APIEndpoint} from "./APIEndpoint";

//For built in server
import * as express from 'express'
import * as socketio from 'socket.io'
import * as http from 'http'
import {IWebAPIAccessMethodConfig, WebAPIAccessMethod} from "./accessMethods/WebAPIAccessMethod/index";
import {WebSocketAccessMethod} from "./accessMethods/WebSocketAccessMethod/index";
import {isValidEndpointName} from "./isValidEndpointName";

export interface IAPIListenConfig {
    webApi?: IWebAPIAccessMethodConfig,
    webSocket?: {}
}

export class API {
    private endpoints: { [key: string]: new () => APIEndpoint } = Object.create(null);
    public registerEndpoint(endpointName: string, endpointClass: new () => APIEndpoint) {
        endpointName = endpointName.toLowerCase();

        if (!isValidEndpointName(endpointName)) {
            throw new Error(`Endpoint name '${endpointName}' is not valid, endpoint names can only contain alphanumeric characters, '-', '_' and '.'`);
        }

        this.endpoints[endpointName] = endpointClass;
    }

    //Returns a new instance of the endpoint instance
    public getEndpoint(endpointName: string): APIEndpoint {
        endpointName = endpointName.toLowerCase();

        if (this.endpoints[endpointName]) {
            return new (this.endpoints[endpointName])();
        }

        return null;
    }

    //Magic function to setup express and socket.io server
    //Convenient for any apps that have no need to manage express and socket.io themselves
    public listen(port: number, options: IAPIListenConfig = {}): Promise<void> {
        return new Promise(resolve => {
            const app = express();
            const server = new http.Server(app);
            const io = socketio(server);

            //Setup access methods
            const webApi = new WebAPIAccessMethod(this, options.webApi);
            const socketApi = new WebSocketAccessMethod(this);

            webApi.bind(app);
            socketApi.bind(io);

            //server listen
            server.listen(port, () => resolve());
        });
    }
}