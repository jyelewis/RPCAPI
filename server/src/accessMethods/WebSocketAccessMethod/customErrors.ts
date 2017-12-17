
export class NotFoundError extends Error {
    constructor(m?: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class InvalidTypeError extends Error {
    constructor(m?: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, InvalidTypeError.prototype);
    }
}