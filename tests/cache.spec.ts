import { Cache }  from '../src/cache';
import addMilliseconds from 'date-fns/addMilliseconds';


// const wait = async (ms: number) => new Promise<void>((resolve, reject) => setTimeout(() => resolve(), ms));

describe('cache', () => {
  it('add items to cache and retrieve', async () => {
    const cut = new Cache();
    await cut.add('key1', "value 1");
    await cut.add('key2', "value 2");
    let actual = await cut.get('key1');
    expect(actual).toEqual('value 1');
    actual = await cut.get('key2');
    expect(actual).toEqual('value 2');
  });

  it('remove can remove item', async () => {
    const cut = new Cache();
    await cut.add('key1', 'value1');
    const value = cut.get('key1');
    expect(value).toBeDefined();
    await cut.pop('key1');
    const next = await cut.get('key1');
    expect(next).toBeUndefined();
  })

  it('get returns undefined when key does not exist', async () => {
    const cut = new Cache();
    return expect(cut.get('unknown key')).resolves.toBeUndefined();
  });

  it('get throws when key does not exist and options say throw', async () => {
    const cut = new Cache({ throwOnEmpty: true});
    return expect(cut.get('unknown key')).rejects.toThrow('get failed');
  });

  it('add stringified object', async () => {
    const cut = new Cache();
    const obj = { foo: 'bar', person: { name: 'George'}};
    const expected = JSON.stringify(obj);

    await cut.add('key1', obj, { addObjectAs: 'stringify' });
    
    const actual = await cut.get('key1');
    expect(actual).toBe(expected);
  });

  it('add raw object', async () => {
    const cut = new Cache();
    const expected = { foo: 'bar', person: { name: 'George' } };
    
    await cut.add('key1', expected);
    const actual = await cut.get('key1');

    expect(actual).toBe(expected);
  })

  it('add clones object based on cache options', async () => {
    const cut = new Cache({ addObjectsAs: 'clone'});
    const obj1 = { foo: 'bar' };

    await cut.add('key1', obj1);
    const obj2 = await cut.get('key1');

    // these should be different objects
    expect(obj2).not.toBe(obj1);

    // but should be the same data-wise
    expect(JSON.stringify(obj2)).toBe(JSON.stringify(obj1));
  });

  it('add clones object based on method override', async () => {
    const cut = new Cache();
    const obj1 = { foo: 'bar' };

    await cut.add('key1', obj1, { addObjectAs: 'clone'});
    const obj2 = await cut.get('key1');

    // these should be different objects
    expect(obj2).not.toBe(obj1);

    // but should be the same data-wise
    expect(JSON.stringify(obj2)).toBe(JSON.stringify(obj1));
  });

  it('add does not clone objects by default', async () => {
    const cut = new Cache();
    const obj1 = { foo: 'bar' };

    await cut.add('key1', obj1);
    const obj2 = await cut.get('key1');

    expect(obj2).toBe(obj1);
  });

  it('add replaces duplicate (set at cache level)', async () => {
    const cut = new Cache();
    await cut.add('key1', 'value1');
    await cut.add('key1', 'value2');

    const value = await cut.get('key1');
    expect(value).toEqual('value2');
  })

  it('add throws on duplicate (set at cache level)', async () => {
    const cut = new Cache({ duplicateAddThrows: true });
    await cut.add('key1', 'value1');
    return expect(cut.add('key1', 'value2')).rejects.toThrow('add failed');
  })

  it('add throws on duplicate (overridden at cache level)', async () => {
    const cut = new Cache();
    await cut.add('key1', 'value1');
    return expect(cut.add('key1', 'value2', { duplicateAddThrows: true })).rejects.toThrow('add failed');
  })

  it('expires items', async () => {
    jest.useFakeTimers();
    const cut = new Cache({ lifetime: { duration: 500 } });
  
    await cut.add('key1','value1');
    const firstTry = await cut.get('key1');
    expect(firstTry).toBe('value1');
    const secondTry = await cut.get('key1');
    expect(secondTry).toBe('value1');
    const realDate = Date.now;
    const futureDate = addMilliseconds(Date.now(), 600);
    global.Date.now = jest.fn(() => futureDate) as any;
    jest.advanceTimersByTime(501);

    const expired = await cut.get('key1');

    expect(expired).toBeUndefined();
    global.Date.now = realDate;
  });

  it('expires items with custom lifetime', async () => {
    jest.useFakeTimers();
    const cut = new Cache({ lifetime: { duration: 500 } });
  
    await cut.add('key1','value1');
    await cut.add('key2','value2', { lifetime: 400});
    expect(cut.get('key1')).resolves.toEqual('value1')

    const realDate = Date.now;
    const futureDate = Date.now() + 501;
    global.Date.now = jest.fn(() => futureDate) as any;
    jest.advanceTimersByTime(501);

    expect(cut.get('key1')).resolves.toBeUndefined();
    expect(cut.get('key2')).resolves.toBe('value2')

    global.Date.now = realDate;
  });

  it('pop removes item from cache by default', async () => {
    const cache = new Cache();

    await cache.add('key1', 'value1');
    expect(cache.get('key1')).resolves.toEqual('value1');
    expect(cache.pop('key1')).resolves.toEqual('value1')
    expect(cache.get('key1')).resolves.toBeUndefined;
  })

  describe('object based keys', () => {
    it('add accepts an object by reference as a key', async () => {
      const cut = new Cache();
      const key = { foo: 'bar', person: { name: "George" } }
      await cut.add(key, 'value1', {})
      const actual = await cut.get(key);

      expect(actual).toBe('value1');
    })

    it('add  accepts an object by value as a key does not work', async () => {
      const cut = new Cache();
      const key = { foo: 'bar', person: { name: "George" } }
      await cut.add(key, 'value1')
      const actual = await cut.get({ foo: 'bar', person: { name: "George" } });

      expect(actual).toBeUndefined()
    })
  })
});