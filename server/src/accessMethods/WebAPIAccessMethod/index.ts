import {API} from "../../API";
import {Express} from "express";
import {InvalidTypeError, NotFoundError} from "./customErrors";
import {convertParamType} from "./convertParamType";
import {AccessDeniedError, ActionError} from "../../errorTypes";

import * as debugFactory from 'debug'
const debug = debugFactory('rpcapi:WebAPIAccessMethod');

export interface IWebAPIAccessMethodConfig {
    prefix?: string,
    outputActionErrors?: boolean
}

const defaultConfig = <IWebAPIAccessMethodConfig>{
    prefix: '/api',
    outputActionErrors: true
};

export class WebAPIAccessMethod {
    public readonly prefix: string;
    private readonly api: API;

    public outputActionErrors: boolean;

    constructor(api: API, config: IWebAPIAccessMethodConfig = defaultConfig) {
        config = Object.assign({}, defaultConfig, config);

        this.prefix = config.prefix;
        this.outputActionErrors = config.outputActionErrors;
        this.api = api;
    }

    bind(app: Express) {
        // we must ALWAYS use post (we dont know what kind of request it is)
        // get requests can easily be forged
        // technically, we dont use cookies and there is no user specific data outside of the URL
        // but the endpoint may collect user information (user agent, ip, custom cookies?)
        // (and its not right to just allow CSRF because we dont see the harm)
        app.post(`${this.prefix}/:endpoint(*)/:action`, (req, res) => {
            const endpointName = req.params.endpoint;
            const actionName = req.params.action;

            let authToken: string = null;
            if (req.body.accessKey) {
                authToken = req.body.accessKey;
            } else if (req.get('Authorization')) {
                const authHeader = req.get('Authorization');
                if (authHeader.startsWith('Bearer ')) {
                    authToken = authHeader.substring('Bearer '.length);
                }
            }

            //All responses are in json format
            res.setHeader('Content-Type', 'application/json');

            this.processRequest(endpointName, actionName, req.body, authToken)
                .then((result) => {
                    debug(`Request: ${endpointName}/${actionName} %o: %o`, req.body, result);
                    res.end(this.formatResult(null, result));
                }).catch((e) => {
                    if (e instanceof NotFoundError) {
                        debug(`Request: ${endpointName}/${actionName} %o: NotFound - ${e.message}`, req.body);
                        res
                            .status(404)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    if (e instanceof InvalidTypeError) {
                        debug(`Request: ${endpointName}/${actionName} %o: InvalidType - ${e.message}`, req.body);
                        res
                            .status(400)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    if (e instanceof AccessDeniedError) {
                        debug(`Request: ${endpointName}/${actionName} %o: AccessDenied - ${e.message}`, req.body);
                        res
                            .status(401)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    if (e instanceof ActionError) {
                        debug(`Request: ${endpointName}/${actionName} %o: ActionError - ${e.message}`, req.body);
                        res
                            .status(400)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    res
                        .status(500)
                        .end(this.formatResult('Internal server error'));

                    if (this.outputActionErrors) {
                        console.error(e);
                    }
                    debug(`Request: ${endpointName}/${actionName} %o: Unknown error - ${e.message}`, req.body);
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
                // if the user uses json encoding and passes literal values these wont be strings
                // convert to string the convert back, all http requests should be parsed as strings for consistency
                const strVal = strParams[paramName] === undefined ? undefined : strParams[paramName].toString();
                typedParams[paramName] = convertParamType(actionParamType, paramName, strVal);
            }
        }

        const epValue = await endpoint.callAction(actionName, typedParams);

        endpoint.callDisconnect().catch(console.error); //Run disconnect in background, can return before this completes

        return epValue;
    }
}