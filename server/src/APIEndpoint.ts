
export enum paramType {
    string = 'string',
    number = 'number',
    object = 'object',
    array = 'array',
    boolean = 'boolean'
}

export class APIEndpoint {
    private connected: boolean = false;
    private emitHandler: (eventName: string, args: any[]) => void;

    public accessKey: string = null;

    public get isConnected(): boolean {
        return this.connected;
    }

    actionExists(actionName: string) {
        const actionFunc = (<any>this)['$' + actionName];
        return actionFunc !== undefined;
    }

    actionParams(actionName: string): { [key: string]: paramType } {
        if (!this.actionExists(actionName)) {
            throw new Error(`Action '${actionName}' does not exist`);
        }

        const actionParams = (<any>this)['$' + actionName + 'Params'];
        return actionParams || {};
    }

    async callAction(actionName: string, args: any = {}): Promise<any> {
        if (!this.connected) {
            throw new Error('Cannot call action when endpoint is not connected (before connect() or after disconnect())');
        }
        if (!this.actionExists(actionName)) {
            throw new Error(`Action '${actionName}' does not exist`);
        }

        const actionFunc = (<any>this)['$' + actionName];
        const promVal = actionFunc.call(this, args);

        //Ensure we have a resolve value
        const retVal = await Promise.resolve(promVal);
        if (typeof retVal !== 'object') {
            throw new Error(`Action '${actionName}' did not return an object`);
        }

        return retVal;
    }

    async callConnect() {
        if (this.connected) {
            throw new Error('Cannot connect while already connected');
        }
        this.connected = true;
        await this.connect();
    }

    async callDisconnect() {
        if (!this.connected) {
            throw new Error('Cannot disconnect when not connected');
        }
        this.connected = false;
        await this.disconnect();
    }

    connect() {}

    disconnect() {}

    registerEmitHandler(emitHandler: (eventName: string, args: any[]) => void) {
        this.emitHandler = emitHandler;
    }

    canEmit() {
        return this.emitHandler !== undefined;
    }

    emit(eventName: string, ...args: any[]) {
        if (!this.connected) {
            throw new Error('Cannot emit when endpoint is not connected (before connect() or after disconnect())');
        }

        if (!this.canEmit()) {
            throw new Error('emit() called when no emit handler is registered');
        }

        this.emitHandler(eventName, args);
    }
}