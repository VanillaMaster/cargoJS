//import * as SYMBOLS from "./src/symbols";

type property<T> = {
    get?(this: T): any;
    set?(this: T, value: any): void;
    value: infer V extends Function? ((this: T,...args: any[])=> any): any; 
}


namespace Cargo{
    type Base = import("./src/Base").Base;

    type Object = import("./entities/Object").CargoObject;
    type Array = import("./entities/Array").CargoArray;

    namespace external {
        type Object = {
            [key: string]: any;
            [symbols.metadata]: Cargo.Object;
            toJSON: () => Cargo.inner.JSONType;
        }
        type Array = {
            [key: string]: any
            [symbols.metadata]: Base;
            length: number;
            toJSON: () => Cargo.inner.JSONType;
        }
    }

    namespace inner {
        type JSONType = string | number | boolean | null | {[key: string]: JSONType} | JSONType[];
        type CargoJSONType = string | number | boolean | null | Cargo.external.Object | Cargo.external.Array;
    }

    namespace symbols {
        const metadata: typeof import("./src/symbols").metadata;
    }
}