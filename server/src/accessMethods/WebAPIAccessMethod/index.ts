
import {API} from "../../API";
import {Express} from "express";
import {InvalidTypeError, NotFoundError} from "./customErrors";
import {convertParamType} from "./convertParamType";
import {AccessDeniedError} from "../../errorTypes";

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

            this.processRequest(endpointName, actionName, req.query)
                .then((result) => {
                    res.end(this.formatResult(null, result));
                }).catch((e) => {
                    if (e instanceof NotFoundError) {
                        res
                            .status(404)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    if (e instanceof InvalidTypeError) {
                        res
                            .status(400)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    if (e instanceof AccessDeniedError) {
                        res
                            .status(403)
                            .end(this.formatResult(e.message));
                        return;
                    }

                    res
                        .status(500)
                        .end(this.formatResult('Internal server error'));

                    if (this.outputActionErrors) {
                        console.error(e);
                    }
                });
        });
    }

    formatResult(error: string = null, result: any = null): string {
        return JSON.stringify({
            error,
            result
        });
    }

    async processRequest(endpointName: string, actionName: string, strParams: any): Promise<any> {
        const endpoint = this.api.getEndpoint(endpointName);
        if (!endpoint) {
            throw new NotFoundError(`Endpoint '${endpointName}' does not exist`);
        }

        if (!endpoint.actionExists(actionName)) {
            throw new NotFoundError(`Action '${actionName}' does not exist`);
        }

        endpoint.accessKey = strParams.accessKey;

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