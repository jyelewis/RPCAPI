import {APIEndpointClient} from "../APIEndpointClient";
import {delay} from "../util/delay";
import {MockActionError} from './MockActionError';

export interface IMockAPIEndpointClientMockings {
    actions: {
        [actionName: string]: (args: any) => any | Promise<any>
    }
}

export class MockAPIEndpointClient extends APIEndpointClient {
    private readonly mockings: IMockAPIEndpointClientMockings;
    public printMockFunctionErrors: boolean = true;

    //Stubs to override methods in APIEndpointClass
    protected registerSocketListeners() {}
    protected unregisterSocketListeners() {}
    disconnect() {}

    constructor(mockings: IMockAPIEndpointClientMockings) {
        super(null as any, '');
        this.mockings = mockings;
    }

    async callAction<T = any>(actionName: string, args: any = {}): Promise<T> {
        await delay(10); //Simulate server lag

        if (!(actionName in this.mockings.actions)) {
            throw new Error(`Action '${actionName}' does not exist`);
        }

        let result: any = null;
        try {
            result = await resolveValue(this.mockings.actions[actionName](args));
        } catch(e) {
            if (e instanceof MockActionError) {
                throw e;
            }

            if (this.printMockFunctionErrors) {
                console.error(e);
            }

            throw new Error(`Internal server error (While mocking action '${actionName}')`);
        }


        if (typeof result !== 'object') {
            throw new Error(`Action '${actionName}' did not return an object`);
        }

        return result;
    }

    //Mock specific functions
    simulateServerSentEvent(eventName: string, ...args: any[]) {
        this.handleReceivedEvent(eventName, args);
    }
}

async function resolveValue(potentialPromise: any) {
    if (potentialPromise && potentialPromise.then) {
        return await potentialPromise;
    }

    return potentialPromise;
}
