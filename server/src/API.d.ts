import { APIEndpoint } from "./APIEndpoint";
export declare class API {
    private endpoints;
    registerEndpoint(endpointName: string, endpointClass: new () => APIEndpoint): void;
    getEndpoint(endpointName: string): APIEndpoint;
}
