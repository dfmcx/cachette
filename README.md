# cachette (french: 'hiding place')

A client-side caching written in TypeScript.

## install
`npm install @dfmartin/cachette`

## usage
```ts
import { Cache } from '@dfmartin/cachette'

const cache = new Cache();

cache.add('myUniqueKey', { name: 'George Washington', role: 'President'});

const person = cache.get('myUniqueKey');
```

## options
The cache object can take an options object in the constructor.

|property              |type                                             |default        |description                                       |
|--------------------  |-------------------------------------------------|---------------|--------------------------------------------------|
| `addObjectAs`        | `string` - optional <br/><sup>('clone' \| 'stringify' \| 'byReference'</sup> | 'byReference' | Sets how objects will be stored within the cache |
| `limit` | `number` - optional | `undefined` <br />  <sup><sub>(no limit)</sub></sup> | Set the maximun number of entries allowed in the cache. Uses first-in-first-out. If no value is provided or set to 0 no limit will be the behavior. |
| `duplicateAddThrows` | `boolean` -optional | `false` | If `true` the `add` operation will throw an exception if the key already exists in the cache. Otherwise the key will be replaced with the new value. |
| `lifetime` | [Lifetime Options](#lifetime-options) - optional | `undefined` - see defaults for lifetime options | Configures the various options for controlling how the lifetime of cache entries is handled. |
| `throwOnEmoty` | `boolean` - optional | `false` | If `true` the `get` operation will throw an exception if the key requested is not in the cache. Otherwise, the cache will return `undefined`.|

### Lifetime Options
Lifetime options are optional.  If none are provided when setting up the cache, no lifetime management will occur and entries will live forever.

|property              |type                                             |default        |description                                       |
|--------------------  |-------------------------------------------------|---------------|--------------------------------------------------|
| `duration` | `number` or `undefined` | `undefined` | Milliseconds. If set to `undefined` the cache will not perform any lifetime management. Entries will live forever |
| `frequency` | `number` or `undefined` | 500 | Milliseconds. Sets the amount of time cache wil wait between checking lifetimes and pruning expired entries. This value has no effect if `duration` is `unfefined` or `0`. |
