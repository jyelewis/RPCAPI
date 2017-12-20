
export class ConnectionTimeoutError extends Error {
    constructor(m?: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ConnectionTimeoutError.prototype);
    }
}
