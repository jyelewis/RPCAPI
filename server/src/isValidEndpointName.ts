
const endpointRegex = /^[-_\.\/a-z0-9]+$/;

export function isValidEndpointName(endpointName: string): boolean {
    endpointName = endpointName.toLowerCase();
    return endpointRegex.test(endpointName);
}
