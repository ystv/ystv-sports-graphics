import {
  CasMismatchError,
  DocumentExistsError,
  DocumentNotFoundError,
  GetOptions,
  ReplaceOptions,
  UpsertOptions,
  QueryResult,
  QueryOptions,
  GetResult,
  MutateInSpec,
  MutateInOptions,
} from "couchbase";
import { cloneDeep, isEqual } from "lodash-es";
import binding from "couchbase/dist/binding";

interface Rec {
  value: unknown;
  cas: number;
}

function newCas(): number {
  return Math.round(Math.random() * 1_000_000_000);
}

class MemDBError extends Error {}

export class InMemoryDB {
  private collections: Map<string, Map<string, Rec>> = new Map();

  public _reset() {
    this.collections = new Map();
  }

  public query = jest.fn();

  public _dump() {
    for (const coll of Array.from(this.collections.keys())) {
      const data = Array.from(this.collections.get(coll)?.entries() ?? []);
      console.log("Collection " + coll + ":\n" + JSON.stringify(data, null, 4));
    }
  }

  public collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const c = this.collections.get(name)!;
    return {
      async get(key: string, options?: GetOptions) {
        const val = c.get(key);
        if (!val) {
          throw new DocumentNotFoundError(new MemDBError(key));
        }
        return {
          content: cloneDeep(val.value),
          cas: val.cas,
        } as GetResult;
      },
      async insert(key: string, val: unknown) {
        if (c.has(key)) {
          throw new DocumentExistsError(new MemDBError(key));
        }
        c.set(key, { value: val, cas: newCas() });
      },
      async replace(key: string, val: unknown, options?: ReplaceOptions) {
        if (!c.has(key)) {
          throw new DocumentNotFoundError(new MemDBError(key));
        }
        if (options) {
          if (options.cas) {
            if (c.get(key)?.cas !== options.cas) {
              throw new CasMismatchError(
                new MemDBError(`expected ${c.get(key)?.cas} got ${options.cas}`)
              );
            }
          }
        }
        c.set(key, { value: val, cas: newCas() });
      },
      async upsert(key: string, val: unknown, options?: UpsertOptions) {
        c.set(key, { value: val, cas: newCas() });
      },
      async mutateIn(
        key: string,
        specs: MutateInSpec[],
        options?: MutateInOptions
      ) {
        if (!c.has(key)) {
          throw new DocumentNotFoundError(new MemDBError(key));
        }
        if (options) {
          if (options.cas) {
            if (c.get(key)?.cas !== options.cas) {
              throw new CasMismatchError(
                new MemDBError(`expected ${c.get(key)?.cas} got ${options.cas}`)
              );
            }
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let val = c.get(key)!.value;
        for (const op of specs) {
          switch (op._op) {
            case binding.LCBX_SDCMD_ARRAY_ADD_LAST:
              val = [...(val as unknown[]), JSON.parse(op._data)];
              break;
            default:
              throw new Error(`Unsupported subdoc operation ${op._op}`);
          }
        }
        c.set(key, { value: val, cas: newCas() });
      },
    };
  }
}

export const DB = new InMemoryDB();
