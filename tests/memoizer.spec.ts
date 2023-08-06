import { memoizer } from '../src/memoizer';

const fixedDate = Date.now();
interface Person {
    name: string
}

const simpleFunc = (x: number) => Date.now() / x;
const objFunc = (person: Person) => ({
    name: person.name + (Date.now() / 1000)
})

describe('memoizer', () => {
    it('works', async () => {
        const fn = memoizer(simpleFunc);

        const expected = await fn(5);
        const realDate = Date.now;
        const futureDate = Date.now() + 600;
        global.Date.now = jest.fn(() => futureDate) as any;

        const actual = await fn(5);

        expect(actual).toBe(expected)


        global.Date.now = realDate;
    })

    it('no args in function throws error', async () => {
        const fn = memoizer(() => 'foo') as () => any;
        expect(fn).rejects.toThrow('memoized functions must have arguments');
    })
    it('provide something other than function throws error', async () => {
        expect(() => (memoizer as any)("I'm bad")).toThrow('must provide a function with arguments to be provided as parameter');
    })
    it('works still', async () => {
        const fn = memoizer(objFunc);
        const obj = { name: 'bar'}
        const expected = await fn(obj);
        const realDate = Date.now;
        const futureDate = Date.now() + 600;
        global.Date.now = jest.fn(() => futureDate) as any;

        const actual = await fn(obj);

        expect(actual).toBe(expected)


        global.Date.now = realDate;
    })
})