import { Cache } from './cache'
import type { Value } from './cache'
export const memoizer = <T, R extends Value>(fn: (args: T) => R) => {
    const cache = new Cache();
    if (typeof fn !== 'function') {
        throw new Error('must provide a function with arguments to be provided as parameter')
    }
    return async (args: T): Promise<R> => {
        if (!args) {
            throw new Error('memoized functions must have arguments');
        }
        const key = JSON.stringify(args);
        if (await cache.has(key)) {
            const result = await cache.get(key) as any;
            return result;
        }

        const result = fn(args);

        await cache.add(key, result)
        return result;
    }
}