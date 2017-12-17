import {APIClient} from "../APIClient";
import {delay} from "../util/delay";
import {IMockAPIEndpointClientMockings, MockAPIEndpointClient} from "./MockAPIEndpointClient";

export interface IMockAPIClientMockings {
    endpoints: {
        [endpointName: string]: IMockAPIEndpointClientMockings
    }
}

export class MockAPIClient extends APIClient {
    private mockings: IMockAPIClientMockings;

    constructor(mockings: IMockAPIClientMockings) {
        super('');

        this.mockings = mockings;
    }

    async connect() {
        if (this.socket) {
            throw new Error('Already connected to server');
        }

        this.socket = {fakeSocket: true} as any;

        await this.waitForServerReady();
    }

    async waitForServerReady() {
        return delay(20);
    }

    public async connectToEndpoint(endpointName: string): Promise<MockAPIEndpointClient> {
        if (!this.socket) {
            throw new Error('Cannot connect to endpoint before socket connection is established');
        }

        await delay(10); //Simulate network delay

        if (!(endpointName in this.mockings.endpoints)) {
            throw new Error(`Unable to create endpoint connection, '${endpointName}' does not exist`);
        }

        return new MockAPIEndpointClient(this.mockings.endpoints[endpointName]);
    }
}