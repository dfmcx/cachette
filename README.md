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
| `addObjectAs`        | `string` ('clone' | 'stringify' | 'byReference' | 'byReference' | Sets how objects will be stored within the cache |
