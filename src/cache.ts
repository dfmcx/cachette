import { cloneDeep } from 'lodash';

export type Key = string | number | object;
export type Value = string | number | object;
export type AddObjectAs =
  /** deep clone */
  | 'clone'
  | 'stringify'
  | 'byReference'

export interface CacheOptions {
  /** max number of entries allowed in cache
   * 
   * When adding to cache if new entry would exceed limit, the oldest item is removed.
   * 
   * @default undefined - no limit
   */
  limit?: number;
  /** throw exception when trying to add a key that already exists 
   * 
   * @default false
  */
  duplicateAddThrows?: boolean;
  /** throw exception when attempting to get a key that does not exist
   * 
   * @default false
   */
  throwOnEmpty?: boolean;
  /** 
   * Objects added to cache should inserted as cloned, stringified, or by reference
   * ```
   * 'clone'        // deep clone of provided object
   * 'stringify'    // JSON.stringify()
   * 'byReference': // object is stored by reference
   * ```
   * @default byReference
  */
  addObjectsAs?: AddObjectAs;
  /** options controlling how entry lifetimes are handled */
  lifetime?: {
    /** how long, in milliseconds, are entries allowed to live
     * 
     * @default undefined - entries will live forever
     */
    duration?: number;
    /** how often are lifetimes checked (in milliseconds) 
     * 
     * @default 500
    */
    frequency?: number
  };
}
 
export interface CacheObject {
  key: Key;
  value: Value;
  timestamp: number;
}

export interface GetOptions {
  /** throw exception when attempting to get a key that does not exist
   * 
   * @default false
   */
  throwOnEmpty?: boolean;
}

export class Cache {
  private options: CacheOptions = {};
  private map: Map<Key, CacheObject>;

  constructor(options?: CacheOptions) {
    this.options = options || {};
    this.map = new Map();
    if (this.options.lifetime?.duration) {
      setInterval(
        async () => await this.prune(),
        this.options.lifetime?.frequency || 500
      );
    }
  }

  private prune = async () => {
    const fn =() => new Promise<void>((resolve) => {
      resolve();
    })
    fn();         

    return new Promise<void>((resolve) => {
      if (!this.options.lifetime || !this.options?.lifetime?.duration) {
        resolve();
        return;
      }

      const entries = Array.from(this.map);
      const expired = Date.now() - (this.options?.lifetime?.duration || 1000);
      for (let i = 0; i < this.map.size; i++) { 
        const [key, obj] = entries[i];

        if (obj.timestamp < expired) {
          this.map.delete(key);
        }
      }
      resolve();
    });
  };

  /**
   * Retrieve value from cache by key
   * @param key unique identifier. Can be object, string, or number
   * @param throwOnEmpty override default options. throw exception if key does not exist
   * @returns any - object stored in cache
   */
  async get(key: Key, throwOnEmpty?: boolean) {
    return new Promise<Value | undefined>((resolve, reject) => {
      const _throwOnEmpty = this.options.throwOnEmpty || throwOnEmpty;
      if (_throwOnEmpty && !this.map.has(key)) {
        const err = new Error(
          `get failed - value not found for key ${key.toString()}`
        );
        err.name = 'get failed';
        reject(err);
        return;
      }
      const entry = this.map.get(key);
      const value = entry?.value || undefined;
      resolve(value);
    });
  }

  /**
   * Add a value to the cache with the given key
   * 
   * Depending on cache options this function will replace an existing key or throw an exception if the key exists.
   * 
   * @param key unique identifier. Can be object, string, or number
   * @param value value to be stored in cache. Can be object, string, or number
   * @param addObjectAs If value provided is an object, determines how that object is stored. Options are clone, stringify, byReference
   * @returns void
   * 
   * @see CacheOptions
   */
  add(key: Key, value: Value, addOptions: { addObjectAs?: AddObjectAs, throwOnExist?: boolean} = { addObjectAs: undefined, throwOnExist: undefined}) {
    const addAs = addOptions.addObjectAs || this.options.addObjectsAs || 'byReference';
    const throwIfKeyExists = addOptions.throwOnExist || this.options.duplicateAddThrows;
    return new Promise<void>((resolve, reject) => {

      // Check for empty key or empty value. Neither is allowed.
      if (key === undefined || key === null || key.toString().length === 0) {
        const err = new Error('key cannot be empty');
        err.name = 'Empty key';
        reject(err);
        return;
      } else if (
        value === undefined ||
        value === null ||
        key.toString().length === 0
      ) {
        const err = new Error('value cannot be empty');
        err.name = 'Empty value';
        reject(err);
        return;
      }

      // if key exists and dupes should throw
      if (throwIfKeyExists && this.map.has(key)) {
        const err = new Error(
          `add failed: value already exist with key ${key}`
        );
        err.name = 'add failed';
        reject(err);
      }

      // remove first entry if this new one will cause size to exceed limit set in options
      if (this.options.limit === this.map.size) {
        const [key] = Array.from(this.map)[0];
        this.map.delete(key);
      }
      const cacheObject: CacheObject = {
        key,
        value,
        timestamp: Date.now(),
      };

      if (typeof cacheObject.value === 'object') {
        if (addAs === 'clone') {
          cacheObject.value = cloneDeep(value);
        } else if (addAs === 'stringify') {
          cacheObject.value = JSON.stringify(value);
        } else {
          cacheObject.value = value;
        }
      }
      // clone object (deeply) if options specify cloning
      this.map.set(key, cacheObject);
      resolve();
    });
  }

  /** Removes all entries in the cache*/
  async clear() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.map.clear();
        resolve();
      } catch (err: any) {
        err.name = 'clear failed';
        reject(err);
      }
    });
  }

  /**
   * Removes an entry from the cache and returns it
   * @param key 
   * @param throwOnEmpty 
   * @returns value associated with the key
   */
  async pop(key: Key, throwOnEmpty?: boolean) {
    return new Promise<Value | undefined>((resolve, reject) => {
      if (!this.map.has(key)) {
        if (throwOnEmpty || this.options.throwOnEmpty) {
          reject(`Pop Error: Key does not exist [${key}]`)
        } else {
          resolve(undefined);
        }
        return;
      }

      this.get(key, throwOnEmpty).then((value) => {
        this.map.delete(key);
        resolve(value);
      });
    });
  }

  
  /**
   * Check to see if the key exists
   * @param key 
   * @returns true if the key exists; otherwise, false.
   */
  async has(key: Key): Promise<boolean> {
    return new Promise((resolve) => {
      resolve(this.map.has(key));
    });
  }
}
