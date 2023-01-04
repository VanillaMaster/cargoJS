/**
 * @typedef { "up" | "down" | "both" | "none" } Direction
 * @typedef { { } } listenerProps
 * @typedef { {payload: any; target: any; stopPropagation: ()=>void;} } EventObject
 * @typedef { { propagation: boolean; } } EventOptions
 */
export class Base {
    /**@type {Base | undefined } */
    get parent() {
        console.error("parent not implemented in", this)
        return undefined;
    }
    /**@type {Array<Base>} */
    get children() {
        console.error("children not implemented")
        return [];
    }
    /**@type {any} */
    get ref(){
        console.error("ref not implemented")
        return undefined;
    }

    /**@type { Map<string, Map<Function,any>> } */
    #listenersMap = new Map();
    
    /**
     * @param { string } event 
     * @param { Function } listener 
     * @param { Partial<listenerProps> } opts 
     */
    addEventListener(event, listener, opts = {}) {
        let container = this.#listenersMap.get(event);
        if (!container) this.#listenersMap.set(event, (container = new Map()));
        container.set(listener, opts);
    }
    /**
     * @param { string } event 
     * @param { Function } listener 
     */
    removeEventListener(event, listener) {
        const container = this.#listenersMap.get(event);
        if (!container) return false;
        const result = container.delete(listener);
        if (container.size == 0) this.#listenersMap.delete(event);
        return result;
    }


    /**
     * @param { string } event 
     * @param { any } payload 
     * @param { Direction } direction 
     */
    dispatch(event, payload, direction = "none") {
        /**@type {EventOptions} */
        const options = {
            propagation: true
        }
        /**@type {EventObject} */
        const eventObject = {
            payload,
            target: this.ref,
            stopPropagation() { options.propagation = false; }
        }
        return this.#passEvent(event, eventObject, options, direction);
    }

    /**
     * @param { string } event 
     * @param { EventObject } eventObject 
     * @param { EventOptions } options 
     * @param { Direction } direction 
     */
    #passEvent(event, eventObject, options, direction) {
        for (const [func, opts] of this.#listenersMap.get(event)?.entries() ?? []) {
            func(eventObject);
            if (!options.propagation) return false;
        }
        if (direction == "up" || direction == "both") {
            if (this.parent) if (!this.parent.#passEvent(event, eventObject, options, direction)) return false;
        }
        if (direction == "down" || direction == "both") {
            for (const elem of this.children) {
                if (!elem.#passEvent(event, eventObject, options, direction)) return false;
            }
        }
        return true;
    }
}