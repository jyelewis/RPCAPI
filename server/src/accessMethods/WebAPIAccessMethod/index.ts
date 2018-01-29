
import {API} from "../../API";
import {Express} from "express";
import {InvalidTypeError, NotFoundError} from "./customErrors";
import {convertParamType} from "./convertParamType";
import {AccessDeniedError, ActionError} from "../../errorTypes";

import * as debugFactory from 'debug'
const debug = debugFactory('rpcapi:WebAPIAccessMethod');

export interface IWebAPIAccessMethodConfig {
    prefix?: string
}

const defaultConfig = <IWebAPIAccessMethodConfig>{
    prefix: '/api'
};

export class WebAPIAccessMethod {
    public readonly prefix: string;
    private readonly api: API;

    public outputActionErrors: boolean = true;

    constructor(api: API, config: IWebAPIAccessMethodConfig = defaultConfig) {
        this.prefix = config.prefix || defaultConfig.prefix;
        this.api = api;
    }

    bind(app: Express) {
        app.get(`${this.prefix}/:endpoint(*)/:action`, (req, res) => {
            const endpointName = req.params.endpoint;
            const actionName = req.params.action;

            let authToken: string = null;
            if (req.query.accessKey) {
                authToken = req.query.accessKey
            } else if (req.get('Authorization')) {
                const authHeader = req.get('Authorization');
                if (authHeader.startsWith('Bearer ')) {
                    authToken = authHeader.substring('Bearer '.length);
                }
            }

            //All responses are in json format
            res.setHeader('Content-Type', 'application/json');

            this.processRequest(endpointName, actionName, req.query, authToken)
                .then((result) => {
                    debug(`Request: ${endpointName}/${actionName} %o: %o`, req.query, result);
                    res.end(this.formatResult(null, result));
                }).catch((e) => {
                    if (e instanceof NotFoundError) {
                        debug(`Request: ${endpointName}/${actionName} %o: NotFound - ${e.message}`, req.query);
                        res
                            .status(404)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    if (e instanceof InvalidTypeError) {
                        debug(`Request: ${endpointName}/${actionName} %o: InvalidType - ${e.message}`, req.query);
                        res
                            .status(400)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    if (e instanceof AccessDeniedError) {
                        debug(`Request: ${endpointName}/${actionName} %o: AccessDenied - ${e.message}`, req.query);
                        res
                            .status(401)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    if (e instanceof ActionError) {
                        debug(`Request: ${endpointName}/${actionName} %o: ActionError - ${e.message}`, req.query);
                        res
                            .status(500)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    res
                        .status(500)
                        .end(this.formatResult('Internal server error'));

                    if (this.outputActionErrors) {
                        console.error(e);
                    }
                    debug(`Request: ${endpointName}/${actionName} %o: Unknown error - ${e.message}`, req.query);
                });
        });
    }

    formatResult(error: string = null, result: any = null): string {
        return JSON.stringify({
            error,
            result
        });
    }

    async processRequest(endpointName: string, actionName: string, strParams: any, accessKey: string = null): Promise<any> {
        const endpoint = this.api.getEndpoint(endpointName);
        if (!endpoint) {
            throw new NotFoundError(`Endpoint '${endpointName}' does not exist`);
        }

        if (!endpoint.actionExists(actionName)) {
            throw new NotFoundError(`Action '${actionName}' does not exist`);
        }

        endpoint.accessKey = accessKey;

        await endpoint.callConnect();

        //convert values into correct type
        const actionParams = endpoint.actionParams(actionName);
        let typedParams: any = {};

        for (let paramName in actionParams) {
            if (actionParams.hasOwnProperty(paramName)) {
                const actionParamType = actionParams[paramName];
                typedParams[paramName] = convertParamType(actionParamType, paramName, strParams[paramName]);
            }
        }

        const epValue = await endpoint.callAction(actionName, typedParams);

        endpoint.callDisconnect().catch(console.error); //Run disconnect in background, can return before this completes

        return epValue;
    }
}