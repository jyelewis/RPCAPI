
const rpcapiClient = require('rpcapi-websocket-client');

const api = new rpcapiClient.APIClient('http://localhost:8081/');

console.log('Connecting to server...');
api.connect().then(() => {
    window.apiClientExamples = {
        basic: basicExample,
        push: pushExample,
        restricted: restrictedExample,
        reconnect: reconnectExample
    };

    console.log('Connected!');
    console.log('------------------------------------');
    console.log('See "index.js" to see the code in these examples');
    console.log('');
    console.log('Try running some examples, type "apiClientExamples" to see a list of examples');
    console.log('Start with the basic example, type "apiClientExamples.basic()" to run');
}).catch(() => {
    console.log('There was an error connecting to the server, are you running the example server?');
});

//Uses the 'calculator' endpoint in the example server
async function basicExample() {
    //Connect to the calculator endpoint
    //This will create a new instance of CalculatorEndpoint on the server (just for us)
    const calculatorEndpoint = await api.connectToEndpoint('calculator');

    //Call a remote method on the CalculatorEndpoint instance
    const addResult = await calculatorEndpoint.callAction('add', { a: 1, b: 2 });
    console.log('1 + 2 =', addResult.value);


    //Call another method on the same instance
    const multiplyResult = await calculatorEndpoint.callAction('multiply', { a: 5, b: 4 });
    console.log('5 * 4 =', multiplyResult.value);

    //Disconnect once we are done
    //This will clean up the endpoint class instance for us on the server
    //If you do not explicitly disconnect from an endpoint it will be automatically disconnected when the client/server connection is lost
    calculatorEndpoint.disconnect();
}

//Uses the 'pushToClient' endpoint in the example server to demonstrate pushing data from the server to the client in the background
async function pushExample() {
    const pushToClientEndpoint = await api.connectToEndpoint('pushToClient');

    //Register code to run when the server sends us a 'time' event
    pushToClientEndpoint.on('time', (currentTime) => {
        console.log('The server says the time is', currentTime);
    });

    console.log('Calling action startPushing on server to request they tell us the time every second');
    await pushToClientEndpoint.callAction('startPushing');

    //After 10 seconds, ask the server to stop pushing
    setTimeout(() => {
        console.log('Calling action stopPushing on server to request they stop telling us the time every second');
        pushToClientEndpoint.callAction('stopPushing').catch(console.error);
    }, 10 * 1000);
}

async function reconnectExample() {
    async function calcResult(calculatorEndpoint) {
        const addResult = await calculatorEndpoint.callAction('add', { a: 1, b: 2 });
        console.log('1 + 2 =', addResult.value);
    }

    const initialEndpoint = await api.connectToEndpoint('calculator');
    await calcResult(initialEndpoint);

    api.on('disconnect', () => {
        console.log('Server disconnected');
    });

    api.on('reconnect', () => {
        console.log('Server reconnected, re-executing calculation');

        api.connectToEndpoint('calculator').then(reconnectedEndpoint => {
            return calcResult(reconnectedEndpoint);
        }).catch(console.error);
    });
}

async function restrictedExample() {
    //It is also possible to set the accessKey globally for this connection
    //api.accessKey = 'asdfqwer1234';
    //This will use that access key for every endpoint

    const restrictedEndpoint = await api.connectToEndpoint('restricted', 'asdfqwer1234');

    const data = await restrictedEndpoint.callAction('getSecretData');
    console.log(data);
}
