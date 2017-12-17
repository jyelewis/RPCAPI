
import {APIEndpoint} from "./APIEndpoint";

export class API {
    private endpoints: { [key: string]: new () => APIEndpoint } = Object.create(null);
    public registerEndpoint(endpointName: string, endpointClass: new () => APIEndpoint) {
        this.endpoints[endpointName] = endpointClass;
    }

    //Returns a new instance of the endpoint instance
    public getEndpoint(endpointName: string): APIEndpoint {
        if (this.endpoints[endpointName]) {
            return new (this.endpoints[endpointName])();
        }

        return null;
    }

}