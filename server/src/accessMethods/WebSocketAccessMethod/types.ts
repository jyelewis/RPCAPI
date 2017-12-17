
import {APIEndpoint} from "../../APIEndpoint";

export interface IEndpointConnection {
    endpointConnectionId: string,
    socketId: string,
    endpoint: APIEndpoint
}