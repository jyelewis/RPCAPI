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
    //Server stuff
    public server: http.Server = null;
    public customCreateEndpointInstance: (epClass: any) => APIEndpoint = null;

    private endpoints: { [key: string]: any } = Object.create(null);
    public registerEndpoint(endpointName: string, endpointClass: any) {
        endpointName = endpointName.toLowerCase();

        if (!isValidEndpointName(endpointName)) {
            throw new Error(`Endpoint name '${endpointName}' is not valid, endpoint names can only contain alphanumeric characters, '-', '_' and '.'`);
        }

        this.endpoints[endpointName] = endpointClass;
    }

    //Returns a new instance of the endpoint instance
    public getEndpoint(endpointName: string): APIEndpoint {
        endpointName = endpointName.toLowerCase();

        const endpointClass = this.endpoints[endpointName];
        if (endpointClass) {
            if (typeof this.customCreateEndpointInstance === 'function') {
                return this.customCreateEndpointInstance(endpointClass);
            }

            return new (endpointClass)();
        }

        return null;
    }

    //Magic function to setup express and socket.io server
    //Convenient for any apps that have no need to manage express and socket.io themselves
    public listen(port: number, options: IAPIListenConfig = {}): Promise<void> {
        return new Promise(resolve => {
            const app = express();
            this.server = new http.Server(app);
            const io = socketio(this.server);

            //Setup access methods
            const webApi = new WebAPIAccessMethod(this, options.webApi);
            const socketApi = new WebSocketAccessMethod(this);

            webApi.bind(app);
            socketApi.bind(io);

            //server listen
            this.server.listen(port, () => resolve());
        });
    }
}