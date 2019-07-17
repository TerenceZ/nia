import Vue from 'vue';
/// Dirty Hack Code to Get Vue Internal Constructorrs
let Watcher;
let Dep;
new Vue({
    data: { v: 0 },
    computed: {
        f() {
            return this.v;
        },
    },
    render(c) {
        return c('a');
    },
    mounted() {
        // Trigger lazy watcher to collect deps.
        const _ = this.f; // eslint-disable-line @typescript-eslint/no-unused-vars
        const watcher = this._watchers[0];
        Watcher = watcher.constructor;
        Dep = watcher.deps[0].constructor;
    },
}).$mount();
export function defineTagProperty(target, name) {
    Reflect.defineProperty(target, name, {
        value: true,
        configurable: true,
        enumerable: false,
        writable: false,
    });
    return target;
}
export const noop = () => { };
export const identity = (value) => {
    return value;
};
export { Watcher, Dep };
