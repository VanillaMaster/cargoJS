import { Base, SYMBOLS, utilities } from "../innerDeps.js";


/**
 * @param { any } obj
 * @returns { obj is string } 
 */
function isValidKey(obj){
    return typeof obj === "string"; 
}
/**
 * @param {any} obj 
 * @returns {obj is (...args: any[])=>any} 
 */
function isFunction(obj){
    return obj instanceof Function
}

export class CargoObject extends Base {
    /**
     * @param {Object<string, any>} obj
     * @param {Cargo.Object | Cargo.Array | undefined} parent
     */
    constructor(obj = {}, parent = undefined){
        super();
        /**@type {Map<string, Cargo.inner.CargoJSONType>} */
        this.props = new Map();
        for (const [key, value] of Object.entries(obj)) {
            const [done, CastedValue] = utilities.castToCargoCompatible(value, this);
            if (done) this.props.set(key, CastedValue)
            else console.error("cant cast object:", value,);
        }
        this.#parent = parent;
        this.#ref = new Proxy(this, CargoObject.handler);
        return this.#ref;
    }

    get ref(){return this.#ref}
    #ref;
    get parent() {return this.#parent}
    #parent;
    get children(){
        /**@type {Cargo.Base[]} */
        const result = [];
        for (const child of this.props.values()) {
            if (utilities.isInstanceOfBase(child)) result.push(child[SYMBOLS.metadata]);
        }
        return result;
    }

    static defaultPrototypeProperty = /**@type {property<CargoObject>}*/({});
    static propertyDescriptor = /**@type {const}*/({ enumerable: true, configurable: true, writable: true });

    /**@type {ProxyHandler<CargoObject>}*/
    static handler = {
        get(target, prop){
            if (isValidKey(prop)) {
                const propValue = target.props.get(prop);
                if (propValue !== undefined) return propValue;
            }
            const {get, value: protoValue} = target.prototype.get(prop) ?? CargoObject.defaultPrototypeProperty;
            if (get !== undefined) {
                return get.call(target);
            } else if (protoValue !== undefined) {
                return (isFunction(protoValue))? protoValue.bind(target) : protoValue;
            } else {
                return undefined;
            }
        },
        set(target, prop, value){
            const { set } = target.prototype.get(prop) ?? CargoObject.defaultPrototypeProperty;
            if (set !== undefined) {
                set.call(target,value);
            } else if (isValidKey(prop)) {
                const obj = target.props.get(prop);
                if (utilities.isInstanceOfBase(obj)) {
                    obj[SYMBOLS.metadata].dispatch("disconnect", null, "down");
                }
                if (value === undefined) {
                    target.props.delete(prop)
                } else {
                    const [done, newValue] = utilities.castToCargoCompatible(value, target);
                    if (!done) return false;
                    target.props.set(prop, newValue);
                    target.dispatch("update", {key: prop, oldValue: obj, newValue: newValue}, "up")
                }
            } else {
                return false;
            }
            return true
        },
        has(target, prop){
            return isValidKey(prop) ? target.props.has(prop) : false;
        },
        ownKeys(target){
            return Array.from(target.props.keys());
        },
        getOwnPropertyDescriptor(target, prop){
            return CargoObject.propertyDescriptor;
        }
    }
}

Object.defineProperty(CargoObject.prototype, "prototype", {
    enumerable: false,
    value: new Map(/**@type {Array<[(String | Symbol),property<CargoObject>]>}*/([
        [SYMBOLS.metadata, {
            get(){
                return this;
            }
        }],
        ["toJSON", {
            value: function() {
                /**@type {Cargo.inner.JSONType} */
                const json = {};
                for (const [key, value] of this.props.entries()) {
                    json[key] = utilities.isInstanceOfBase(value)? value.toJSON() : value;
                }
                return json;
            }
        }]
    ])),
})