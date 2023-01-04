import { CargoArray, CargoObject, SYMBOLS } from "../innerDeps.js";

/**
 * @param { any } obj
 * @returns {obj is Cargo.external.Object | Cargo.external.Array}
 */
export function isInstanceOfBase(obj){
    return obj?.[SYMBOLS.metadata] !== undefined;
}

const protoMap = new Map(/**@type {Array<[any,(obj: any, parent: Cargo.Object | Cargo.Array | undefined)=> Cargo.inner.CargoJSONType]>}*/([
    [String.prototype,(obj, parent)=>obj],
    [Number.prototype, (obj, parent)=>obj],
    [Boolean.prototype, (obj, parent)=>obj],
    [Object.prototype, (obj, parent)=>new CargoObject(obj, parent)],
    [Array.prototype, (obj, parent)=>new CargoArray(obj, parent)]
]));

/**
 * @param {any} obj
 * @param { Cargo.Object | Cargo.Array | undefined } parent
 * @returns { [false] | [true, Cargo.inner.CargoJSONType] } 
 */
export function castToCargoCompatible(obj, parent = undefined){
    if (obj === null) return [true, null];
    if (obj === undefined) return [false];
    const handler = protoMap.get(Object.getPrototypeOf(obj));
    if (handler == undefined) return [false];
    return [true, handler(obj, parent)];
}