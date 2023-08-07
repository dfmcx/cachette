import { cloneDeep } from 'lodash';

export type Key = string | number | object;
export type Value = string | number | object;
interface MapEntry extends IterableIterator<MapEntry>
{ key: Key, cachedObject: CacheObject }

export interface CacheOptions {
  limit?: number
  duplicateAddThrows?: boolean
  throwOnEmpty?: boolean
  addObjectsAs?: 'clone' | 'stringify' | 'raw'
  lifetime?: {
    duration?: number
    disableOverride?: number
    frequency?: number
  }
}

export interface CacheObject {
  key: Key
  value: Value
  timestamp: number
}

export interface GetOptions {
  throwOnEmpty?: boolean
}

export interface AddOptions {
  addObjectAs?: 'clone' | 'stringify' | 'raw'
  lifetime?: number
  duplicateAddThrows?: boolean
}

export class Cache {
  private options: CacheOptions = {};
  private map: Map<Key, CacheObject>;

  constructor(options?: CacheOptions) {
    this.options = options || {};
    this.map = new Map();
    if(Boolean(this.options.lifetime?.duration)) {
      setInterval(async () => await this.prune(), this.options.lifetime?.frequency || 500);
    }
  }

  private prune = async () => {
    return new Promise<void>((resolve, reject) => {
      if (!this.options.lifetime || !this.options?.lifetime?.duration) {
        resolve();
        return;
      }

      const entries = Array.from(this.map);
      const expired = Date.now() - (this.options?.lifetime?.duration || 1000);
      for(let i = 0; i < this.map.size; i++) {
        const [key, obj] = entries[i];
        
        if(obj.timestamp < expired) {
          this.map.delete(key);
        }
      }
      resolve();
    })
  };
  
  async get(key: Key, throwOnEmpty?: boolean) {
    return new Promise((resolve, reject) => {
      const _throwOnEmpty = this.options.throwOnEmpty || throwOnEmpty;
      if (_throwOnEmpty && !this.map.has(key)) {
        const err = new Error(`get failed - value not found for key ${key.toString()}`);
        err.name = 'get failed';
        reject(err);
        return;
    }
      const entry = this.map.get(key);
      const value = entry?.value || undefined;
      resolve(value);
    });
  }

  add(key: Key, value: Value, addOptions?: AddOptions) {
    return new Promise<void>((resolve, reject) => {
      const options: AddOptions = {
        ...{
          addObjectAs: this.options.addObjectsAs || 'raw',
          lifetime: this.options.lifetime?.duration,
          duplicateAddThrows: this.options.duplicateAddThrows,
        },
        ...addOptions
      }

      const c = options;
      // Check for empty key or empty value. Neither is allowed.
      if(key === undefined || key === null || key.toString().length === 0) {
        const err = new Error('key cannot be empty');
        err.name = 'Empty key';
        reject(err);
        return;
      } else if (value === undefined || value === null || key.toString().length === 0) {
        const err = new Error('value cannot be empty');
        err.name = 'Empty value';
        reject(err);
        return;
      }

      // if key exists and dupes should throw
      if(options.duplicateAddThrows && this.map.has(key)) {
        const err = new Error(`add failed: value already exist with key ${key}`);
        err.name = 'add failed';
        reject(err);
      }

      // remove first entry if this new one will cause size to exceed limit set in options
      if (this.options.limit === this.map.size) {
        const [key, _] = Array.from(this.map)[0];
        this.map.delete(key);
      }
      /** @type CacheObject */
      const cacheObject: CacheObject = {
        key,
        value,
        timestamp: Date.now(),
      };

      if (typeof (cacheObject.value) === 'object') {
        if (options.addObjectAs === 'clone') {
          cacheObject.value = cloneDeep(value);
        } else if (options.addObjectAs === 'stringify') {
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

  async clear() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.map.clear();
        resolve();
      }
      catch(err: any) {
        err.name = 'clear failed';
        reject(err);
      }
    });
  }

  async pop(key: Key, throwOnEmpty?: boolean) {
    return new Promise<Value | undefined>((resolve, reject) => {
      if (!this.map.has(key)) {
        resolve(undefined);
        return;
      }

      const value = this.get(key, throwOnEmpty)
      this.map.delete(key);
      resolve(value);
    });
  }

  async has(key: Key): Promise<boolean>{
    return new Promise((resolve, reject) => {
      resolve(this.map.has(key));
    })
  }
}