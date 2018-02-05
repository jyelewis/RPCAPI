
export class MockActionError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, MockActionError.prototype);
    }
}