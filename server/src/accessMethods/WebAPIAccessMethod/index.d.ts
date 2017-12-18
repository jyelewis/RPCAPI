/// <reference types="express" />
import { API } from "../../API";
import { Express } from "express";
export interface IWebAPIAccessMethodConfig {
    prefix?: string;
}
export declare class WebAPIAccessMethod {
    readonly prefix: string;
    private readonly api;
    outputActionErrors: boolean;
    constructor(api: API, config?: IWebAPIAccessMethodConfig);
    bind(app: Express): void;
    formatResult(error?: string, result?: any): string;
    processRequest(endpointName: string, actionName: string, strParams: any): Promise<any>;
}
