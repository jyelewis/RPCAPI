export type eventHandler = (...args: any[]) => void;

//Small super class for event emitters
export class EventEmitter {
    private listeners: { [key: string]: eventHandler[] } = {};

    constructor() {
        this.listeners = {};
    }

    on(eventName: string, handler: eventHandler) {
        if(typeof this.listeners[eventName] === 'undefined') {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(handler);
    }

    off(eventName: string, handler: eventHandler) {
        if(typeof this.listeners[eventName] !== 'undefined') {
            this.listeners[eventName] = this.listeners[eventName].filter((x) => x !== handler);
        }
    }

    emit(eventName: string, ...args: any[]) {
        if(typeof this.listeners[eventName] !== 'undefined') {
            this.listeners[eventName].forEach((handler) => {
                //Take the chance here to abstractly give the main thread a chance to breath
                nextTick(() => handler.apply(null, args));
            });
        }
    }

    //For testing purposes
    numListeners(eventName: string) {
        const listenersArr = this.listeners[eventName] || [];
        return listenersArr.length;
    }
}

function nextTick(cb: () => void) {
    setTimeout(cb, 0);
}