/**@type {Set<any>} */
const instancesOfBase = new Set();
/**
 * @template {new () => Cargo.Base } T
 * @param { T } obj 
 */
export function addInstancesOfBase(obj){
    instancesOfBase.add(obj.prototype)
}

const protoMap = /**@type {Map<any,(obj: any, parent: any) => any>} */(new Map())
    .set(String.prototype, obj => obj)
    .set(Number.prototype, obj => obj)
    .set(Boolean.prototype, obj => obj);

/**
 * @template {new () => any } T
 * @param { T } obj 
 * @param { typeof protoMap extends Map<any, infer V> ? V : never } func
 */
export function addCastfunction(obj, func){
    protoMap.set(obj.prototype, func);
}

/**
 * @param { any } obj
 * @returns {obj is Cargo.external.Object | Cargo.external.Array}
 */
export function isInstanceOfBase(obj) {
    if (obj == undefined) return false;
    return instancesOfBase.has(Object.getPrototypeOf(obj));
}

/**
 * @param {any} obj
 * @param { Cargo.Object | Cargo.Array | undefined } parent
 * @returns { [false, undefined] | [true, Cargo.inner.CargoJSONType] } 
 */
export function castToCargoCompatible(obj, parent = undefined) {
    if (obj === null) return [true, null];
    if (obj === undefined) return [false, undefined];
    const handler = protoMap.get(Object.getPrototypeOf(obj));
    if (handler == undefined) return [false, undefined];
    return [true, handler(obj, parent)];
}