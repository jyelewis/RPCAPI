
export class AccessDeniedError extends Error {
    constructor(m: string = 'Access denied') {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, AccessDeniedError.prototype);
    }
}
