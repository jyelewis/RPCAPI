import { APIEndpointClient } from "../APIEndpointClient";
export interface IMockAPIEndpointClientMockings {
    actions: {
        [actionName: string]: (args: any) => any | Promise<any>;
    };
}
export declare class MockAPIEndpointClient extends APIEndpointClient {
    private readonly mockings;
    printMockFunctionErrors: boolean;
    protected registerSocketListeners(): void;
    protected unregisterSocketListeners(): void;
    disconnect(): void;
    constructor(mockings: IMockAPIEndpointClientMockings);
    callAction<T = any>(actionName: string, args?: any): Promise<T>;
    simulateServerSentEvent(eventName: string, ...args: any[]): void;
}
