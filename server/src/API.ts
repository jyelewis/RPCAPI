import {APIEndpoint} from "./APIEndpoint";

//For built in server
import * as express from 'express'
import * as helmet from 'helmet'
import * as cors from 'cors';
import * as socketio from 'socket.io'
import * as http from 'http'
import {IWebAPIAccessMethodConfig, WebAPIAccessMethod} from "./accessMethods/WebAPIAccessMethod";
import {WebSocketAccessMethod} from "./accessMethods/WebSocketAccessMethod";
import {isValidEndpointName} from "./isValidEndpointName";
import bodyParser = require('body-parser');
import {Response} from 'express-serve-static-core';
import {NextFunction, Request} from "express";

export interface IAPIListenConfig {
    webApi?: IWebAPIAccessMethodConfig,
    webSocket?: {}
}

export class API {
    //Server stuff
    public server: http.Server = null;
    public customCreateEndpointInstance: (epClass: any) => APIEndpoint = null;

    public handleError: (error: Error) => void = (error: Error) => {
        console.error(error);
    };

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

    public registerErrorHandler(errorHandler: (err: Error) => void) {
        this.handleError = errorHandler;
    }

    //Magic function to setup express and socket.io server
    //Convenient for any apps that have no need to manage express and socket.io themselves
    public listen(port: number, options: IAPIListenConfig = {}): Promise<void> {
        return new Promise(resolve => {
            const app = express();
            app.use(helmet());
            app.use(cors());
            app.use(bodyParser.json());                // to support JSON-encoded bodies
            app.use(bodyParser.urlencoded({    // to support URL-encoded bodies
                extended: true
            }));

            app.use((err: Error, req: Request, res: Response, next: NextFunction) => { // catchall error handler
                res.status(500);
                res.end('{"error":"Internal server error","result":null}');

                this.handleError(err);
            });

            app.get('/hc', (req: Request, res: Response) => {
                res.status(200);
                res.end('OK')
            });

            this.server = new http.Server(app);
            const io = socketio(this.server);

            // pass express "app" & socket io into each endpoint to allow custom configuration
            for (const endpointName in this.endpoints) {
                const endpointCls = this.endpoints[endpointName];
                if (typeof (endpointCls as any).configureServer === "function") {
                    (endpointCls as any).configureServer(app, io, this.server);
                }
            }

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