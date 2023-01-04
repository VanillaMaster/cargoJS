import * as SYMBOLS from "./symbols.js";
import { Base } from "./Base.js";

/*
     █████  ██████  ██████   █████  ██    ██ 
    ██   ██ ██   ██ ██   ██ ██   ██  ██  ██  
    ███████ ██████  ██████  ███████   ████   
    ██   ██ ██   ██ ██   ██ ██   ██    ██    
    ██   ██ ██   ██ ██   ██ ██   ██    ██    
*/

/*
if object mimic basic behaviors of native one, native methods also works,
so we (I) used them
it was obvious, but unexpected
*/

/**
 * meta object that acts like Array
 */
export const CargoArray = (function(){

    const SupportedMethods = [
        Array.prototype.pop,
        Array.prototype.push
    ]
    
    /**
     * @param { any } obj
     * @returns { obj is string } 
     */
    function isValidKey(obj){
        if (typeof obj !== "string" || obj.length === 0 || (obj.length > 1 && obj.charAt(0) === "0")) return false;
        for (const char of obj)
        if ((char < "0" || char > "9")) return false;
        return true; 
    }
    /**
     * @param {any} obj 
     * @returns {obj is (...args: any[])=>any} 
     */
    function isFunction(obj){
        return obj instanceof Function
    }
    
    class CargoArray extends Base {
        /**
         * @param {Array<any>} obj
         * @param {Cargo.Object | Cargo.Array | undefined} parent
         */
        constructor(obj = [], parent = undefined){
            super();
            /**@type {Map<string, Cargo.inner.CargoJSONType>} */
            this.props = new Map();
            this.length = obj.length;
            for (let key = 0; key < obj.length; key++) {
                const [done, CastedValue] = castToCargoCompatible(obj[key], this);
                if (done) { if (CastedValue != null) this.props.set(key.toString(), CastedValue)}
                else console.error("cant cast object:", obj[key]);
            }
            this.#parent = parent;
            this.#ref = new Proxy(this, CargoArray.handler);
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
                if (isInstanceOfBase(child)) result.push(child[SYMBOLS.metadata]);
            }
            return result;
        }

        *iterator(){
            for (let i = 0; i < this.length; i++) {
                yield this.props.get(i.toString()) ?? null;
            }
        }

        static defaultPrototypeProperty = /**@type {property<CargoArray>}*/({});
        static propertyDescriptor = /**@type {const}*/({ enumerable: true, configurable: true, writable: true });

        /**@type {ProxyHandler<CargoArray>}*/
        static handler = {
            get(target, prop){
                //console.log(prop);
                if (isValidKey(prop)) {
                    return (Number.parseInt(prop) < target.length) ? (target.props.get(prop) ?? null) : (undefined);
                }
                const { get, value: protoValue } = target.prototype.get(prop) ?? CargoArray.defaultPrototypeProperty;
                if (get !== undefined) {
                    return get.call(target);
                } else if (protoValue !== undefined) {
                    return (isFunction(protoValue))? protoValue.bind(target.ref) : protoValue;
                } else {
                    return undefined;
                }
            },
            set(target, prop, value){
                //console.log(prop, value);
                const { set } = target.prototype.get(prop) ?? CargoArray.defaultPrototypeProperty;
                if (set !== undefined) {
                    set.call(target, value);
                } else if (isValidKey(prop)) {
                    const i = Number.parseInt(prop);
                    const obj = target.props.get(prop) ?? (i < target.length ? null : undefined);
                    if (isInstanceOfBase(obj)) {
                        obj[SYMBOLS.metadata].dispatch("disconnect", null, "down");
                    }
                    if (value == undefined) {// null or undefined
                        target.props.delete(prop)
                    } else {
                        const [done, newValue] = castToCargoCompatible(value, target);
                        if (!done) return false;
                        if (i >= target.length) target.length = i + 1;
                        target.props.set(prop, newValue);
                        target.dispatch("update", {key: prop, oldValue: obj, newValue: newValue}, "up")
                    }
                } else {
                    return false;  
                };
                return true
            },
            has(target, prop){
                return isValidKey(prop) ? target.props.has(prop) : false;
            },
            ownKeys(target){
                return Array.from(target.props.keys());
            },
            getOwnPropertyDescriptor(target, prop){
                return CargoArray.propertyDescriptor;
            },
            
        }
    }

    Object.defineProperty(CargoArray.prototype, "prototype", {
        enumerable: false,
        value: new Map(/**@type {Array<[(String | Symbol),property<CargoArray>]>}*/([
            [SYMBOLS.metadata, {
                get(){
                    return this;
                }
            }],
            [Symbol.iterator, {
                /**@this {CargoArray} */
                value: function(){ return this.iterator(); }
            }],
            ["length", {
                get(){ return this.length },
                set(value){
                    const newLength = Number.parseInt(value)
                    if (!isNaN(newLength)){
                        const oldLength = this.length;
                        for (let i = oldLength - 1; i >= newLength; i--) {
                            const key = i.toString();
                            const oldValue = this.props.get(key);
                            if (this.props.delete(key) && isInstanceOfBase(oldValue)) {
                                oldValue[SYMBOLS.metadata].dispatch("disconnect", null, "down");
                            }
                        }
                        this.length = newLength;
                    }
                }
            }],
            ["toJSON", {
                value: function(){
                    /**@type {Cargo.inner.JSONType} */
                    const json = [];
                    for (let i = 0; i < this.length; i++) {
                        const value = this.props.get(i.toString()) ?? null;
                        json[i] = isInstanceOfBase(value)? value.toJSON() : value;
                    }
                    return json;
                }
            }],
            ...SupportedMethods.map((e)=>[e.name,{value: e}])
        ]))
    })

    return CargoArray;

})()

/*
     ██████  ██████       ██ ███████  ██████ ████████ 
    ██    ██ ██   ██      ██ ██      ██         ██    
    ██    ██ ██████       ██ █████   ██         ██    
    ██    ██ ██   ██ ██   ██ ██      ██         ██    
     ██████  ██████   █████  ███████  ██████    ██    
*/

/**
 * meta object that acts like Object
 */
export const CargoObject = (function(){

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

    class CargoObject extends Base {
        /**
         * @param {Object<string, any>} obj
         * @param {Cargo.Object | Cargo.Array | undefined} parent
         */
        constructor(obj = {}, parent = undefined){
            super();
            /**@type {Map<string, Cargo.inner.CargoJSONType>} */
            this.props = new Map();
            for (const [key, value] of Object.entries(obj)) {
                const [done, CastedValue] = castToCargoCompatible(value, this);
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
                if (isInstanceOfBase(child)) result.push(child[SYMBOLS.metadata]);
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
                    if (isInstanceOfBase(obj)) {
                        obj[SYMBOLS.metadata].dispatch("disconnect", null, "down");
                    }
                    if (value === undefined) {
                        target.props.delete(prop)
                    } else {
                        const [done, newValue] = castToCargoCompatible(value, target);
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
                        json[key] = isInstanceOfBase(value)? value.toJSON() : value;
                    }
                    return json;
                }
            }]
        ])),
    })

    return CargoObject;

})()

const instancesOfBase = new Set([
    CargoObject.prototype,
    CargoArray.prototype
]);

/**
 * @param { any } obj
 * @returns {obj is Cargo.external.Object | Cargo.external.Array}
 */
function isInstanceOfBase(obj){
    if (obj == undefined) return false;
    return instancesOfBase.has(Object.getPrototypeOf(obj));
}

const protoMap = new Map(/**@type {Array<[any,(obj: any, parent: Cargo.Object | Cargo.Array | undefined)=> Cargo.inner.CargoJSONType]>}*/([
    [String.prototype,(obj, parent)=>obj],
    [Number.prototype, (obj, parent)=>obj],
    [Boolean.prototype, (obj, parent)=>obj],

    [Object.prototype, (obj, parent)=>new CargoObject(obj, parent)],
    [Array.prototype, (obj, parent)=>new CargoArray(obj, parent)],

    [CargoObject.prototype, (obj, parent)=>obj],
    [CargoArray.prototype, (obj, parent)=>obj]
]));

/**
 * @param {any} obj
 * @param { Cargo.Object | Cargo.Array | undefined } parent
 * @returns { [false] | [true, Cargo.inner.CargoJSONType] } 
 */
function castToCargoCompatible(obj, parent = undefined){
    if (obj === null) return [true, null];
    if (obj === undefined) return [false];
    const handler = protoMap.get(Object.getPrototypeOf(obj));
    if (handler == undefined) return [false];
    return [true, handler(obj, parent)];
}