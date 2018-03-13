import {API} from './API';
import {CalculatorEndpoint} from './testEndpoints/CalculatorEndpoint';

async function main() {
    const api = new API();
    api.registerEndpoint('calculator', CalculatorEndpoint);

    await api.listen(8080);
    console.log('Test server listening on port 8080');
}

main().catch(console.error);
