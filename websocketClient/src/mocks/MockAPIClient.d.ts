import { APIClient } from "../APIClient";
import { IMockAPIEndpointClientMockings, MockAPIEndpointClient } from "./MockAPIEndpointClient";
export interface IMockAPIClientMockings {
    endpoints: {
        [endpointName: string]: IMockAPIEndpointClientMockings;
    };
}
export declare class MockAPIClient extends APIClient {
    private mockings;
    constructor(mockings: IMockAPIClientMockings);
    connect(): Promise<void>;
    waitForServerReady(): Promise<{}>;
    connectToEndpoint(endpointName: string): Promise<MockAPIEndpointClient>;
}
