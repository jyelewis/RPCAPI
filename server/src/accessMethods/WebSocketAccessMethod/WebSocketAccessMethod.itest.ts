import test from 'ava';
import {WebSocketAccessMethod} from './index'
import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as ioClient from 'socket.io-client';
import {APIEndpoint} from "../../APIEndpoint";
import {API} from "../../API";
import {AccessDeniedError} from "../../errorTypes";
import * as SocketIO from 'socket.io';

let socketAM: WebSocketAccessMethod;
let server: http.Server;
let io: SocketIO.Server;

let hasDisconnected1 = false;
let hasDisconnected2 = false;

test.before(() => {
    class TestEndpoint extends APIEndpoint {
        disconnect() {
            hasDisconnected1 = true;
        }

        $sayHello() {
            return { hello: 'world' };
        }

        $accessDenied() {
            throw new AccessDeniedError('Test access denied');
        }

        $addParams = { a: 'number', b: 'number' };
        $add({ a, b }: { a: number, b: number }) {
            return {
                result: a + b
            };
        }

        $throws() {
            throw new Error('Test error');
        }
    }

    class TestEndpoint2 extends APIEndpoint {
        disconnect() {
            hasDisconnected2 = true;
        }
    }

    class TestThrowingEndpoint extends APIEndpoint {
        connect() {
            throw new AccessDeniedError();
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    testAPI.registerEndpoint('test2', TestEndpoint2);
    testAPI.registerEndpoint('throws', TestThrowingEndpoint);

    const app = express();
    server = new http.Server(app);
    io = socketio(server);

    //Setup access methods
    socketAM = new WebSocketAccessMethod(testAPI);
    socketAM.outputActionErrors = false;

    socketAM.bind(io);

    //server listen
    server.listen(8056);
});

test.after(async t => {
    server.close();
});

test('Throws if attempting to bind io while already bound', async t => {
    t.throws(() =>
        socketAM.bind(io)
    );
});

test('Websocket emits serverReady after connecting',  t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {
            t.pass();
            resolve();
        });
    });
});

test('Returns error when trying to connect to endpoint that doesnt exist', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'doesntExist', undefined, (error: string) => {
                t.is(error, 'Unable to create endpoint connection, \'doesntExist\' does not exist');
                resolve();
            });

        });
    });
});

test('Gets endpoint conenction ID when connected to endpoint', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'test', undefined, (error: string, epcid: string) => {
                t.falsy(error);
                t.truthy(epcid);
                resolve();
            });

        });
    });
});

test('Calls action and gets return value', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'test', undefined, (error: string, epcid: string) => {
                t.falsy(error);
                t.truthy(epcid);

                connection.emit('callEndpointFunction', epcid, 'sayHello', {}, (error: string, res: any) => {
                    t.falsy(error);
                    t.deepEqual(res, { hello: 'world' });

                    resolve();
                });
            });
        });
    });
});

test('Sends NotFoundError if action doesnt exist', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'test', undefined, (error: string, epcid: string) => {
                t.falsy(error);
                t.truthy(epcid);

                connection.emit('callEndpointFunction', epcid, 'doesntExist', {}, (error: string, res: any) => {
                    t.is(error, 'action \'doesntExist\' does not exist');
                    t.falsy(res);

                    resolve();
                });
            });
        });
    });
});

test('Sends InvalidTypeError if types are invalid', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'test', undefined, (error: string, epcid: string) => {
                t.falsy(error);
                t.truthy(epcid);

                connection.emit('callEndpointFunction', epcid, 'add', { a: 'a', b: 2 }, (error: string, res: any) => {
                    t.is(error, 'Expected param \'a\' to be a number, but it was not');
                    t.falsy(res);

                    resolve();
                });
            });
        });
    });
});

test('Sends Internal server error if action throws', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'test', undefined, (error: string, epcid: string) => {
                t.falsy(error);
                t.truthy(epcid);

                connection.emit('callEndpointFunction', epcid, 'throws', { a: 'a', b: 2 }, (error: string, res: any) => {
                    t.is(error, 'Internal server error');
                    t.falsy(res);

                    resolve();
                });
            });
        });
    });
});

test('Sends AccessDeniedError if action throws AccessDeniedError', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'test', undefined, (error: string, epcid: string) => {
                t.falsy(error);
                t.truthy(epcid);

                connection.emit('callEndpointFunction', epcid, 'accessDenied', {}, (error: string, res: any) => {
                    t.is(error, 'Access denied: Test access denied');
                    t.falsy(res);

                    resolve();
                });
            });
        });
    });
});

test('Sends AccessDeniedError if endpoint connect throws AccessDeniedError',  t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'throws', undefined, (error: string, epcid: string) => {
                t.is(error, 'Access denied: Access denied');
                t.falsy(epcid);

                resolve();
            });
        });
    });
});

test('Calls disconenct() on the endpoint when client asks to disconnect endpoint', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'test', undefined, (error: string, epcid: string) => {
                t.falsy(error);
                t.truthy(epcid);

                t.false(hasDisconnected1);

                connection.emit('disconnectEndpointConnection', epcid);

                setTimeout(() => {
                    t.true(hasDisconnected1);
                    resolve();
                }, 50);
            });
        });
    });
});

test('Calls disconnect() on all endpoints when client socket conenction is lost', t => {
    return new Promise(resolve => {
        const connection = ioClient('http://localhost:8056/');
        connection.on('serverReady', () => {

            connection.emit('connectToEndpoint', 'test2', undefined, (error: string, epcid: string) => {
                t.falsy(error);
                t.truthy(epcid);

                t.false(hasDisconnected2);

                connection.close();

                setTimeout(() => {
                    t.true(hasDisconnected2);
                    resolve();
                }, 50);
            });
        });
    });
});