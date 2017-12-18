import { APIEndpoint } from "../APIEndpoint";
export declare class CalculatorEndpoint extends APIEndpoint {
    private sendAdds;
    $watchAdds(): {
        done: boolean;
    };
    $addParams: {
        a: string;
        b: string;
    };
    $add({a, b}: {
        a: number;
        b: number;
    }): {
        value: number;
    };
    $specialAddParams: {
        a: string;
        b: string;
        strAdd: string;
    };
    $specialAdd({a, b, strAdd}: {
        a: number;
        b: number;
        strAdd: boolean;
    }): {
        value: number;
    };
    $subtractParams: {
        a: string;
        b: string;
    };
    $subtract({a, b}: {
        a: number;
        b: number;
    }): {
        value: number;
    };
    $multiplyParams: {
        a: string;
        b: string;
    };
    $multiply({a, b}: {
        a: number;
        b: number;
    }): {
        value: number;
    };
    $slowAddParams: {
        a: string;
        b: string;
    };
    $slowAdd({a, b}: {
        a: number;
        b: number;
    }): Promise<{
        value: number;
    }>;
    $throws(): void;
}
