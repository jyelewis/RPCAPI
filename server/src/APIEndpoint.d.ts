export declare enum paramType {
    string = "string",
    number = "number",
    object = "object",
    array = "array",
    boolean = "boolean",
}
export declare class APIEndpoint {
    private emitHandler;
    actionExists(actionName: string): boolean;
    actionParams(actionName: string): {
        [key: string]: paramType;
    };
    callAction(actionName: string, args?: any): Promise<any>;
    connect(): void;
    disconnect(): void;
    registerEmitHandler(emitHandler: (eventName: string, args: any[]) => void): void;
    canEmit(): boolean;
    emit(eventName: string, ...args: any[]): void;
}
