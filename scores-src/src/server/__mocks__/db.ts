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
  RemoveOptions,
  GetAndLockOptions,
  UnlockOptions,
  Cas,
} from "couchbase";
import { cloneDeep, get, isEqual, set } from "lodash-es";
import binding from "couchbase/dist/binding";
import { CouchbaseCas } from "../dbHelpers";

interface Rec {
  value: unknown;
  cas: string;
  oldCas?: string;
}

function newCas(): string {
  return Math.round(Math.random() * 1_000_000_000).toString(10);
}

class MemDBError extends Error {}

const LOCKED_CAS = "-1";

export class InMemoryDB {
  private collections: Map<string, Map<string, Rec>> = new Map();

  public _reset() {
    this._assertAllUnlocked();
    this.collections = new Map();
  }

  public query = jest.fn();

  public _dump() {
    for (const coll of Array.from(this.collections.keys())) {
      const data = Array.from(this.collections.get(coll)?.entries() ?? []);
      console.log("Collection " + coll + ":\n" + JSON.stringify(data, null, 4));
    }
  }

  public _assertAllUnlocked() {
    for (const coll of Array.from(this.collections.keys())) {
      for (const [key, val] of Array.from(
        this.collections.get(coll)?.entries() ?? []
      )) {
        if (val.cas === LOCKED_CAS) {
          throw new Error(`Document ${key} is locked`);
        }
      }
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
          console.warn("Document not found: ", key);
          throw new DocumentNotFoundError(new MemDBError(key));
        }
        return {
          content: cloneDeep(val.value),
          cas: CouchbaseCas.from(val.cas),
          value: undefined,
          expiry: undefined,
        } as GetResult;
      },
      /**
       * TESTING NOTE: unlike real CB, locks aren't automatically released when the lock time expires.
       * Instead, the test harness is expected to call _assertAllUnlocked() which will error if
       * any are still open.
       */
      async getAndLock(
        key: string,
        lockTime: number,
        options?: GetAndLockOptions
      ) {
        const val = c.get(key);
        if (!val) {
          console.warn("Document not found: ", key);
          throw new DocumentNotFoundError(new MemDBError(key));
        }
        const oldCas = val.cas;
        c.set(key, { ...val, cas: LOCKED_CAS, oldCas });
        return { ...val, cas: oldCas };
      },
      async unlock(key: string, cas: Cas, options?: UnlockOptions) {
        const val = c.get(key);
        if (!val) {
          console.warn("Document not found: ", key);
          throw new DocumentNotFoundError(new MemDBError(key));
        }
        if (val.oldCas !== cas.toString()) {
          throw new CasMismatchError(
            new MemDBError("Unlock CAS mismatch: " + key)
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        c.set(key, { value: val.value, cas: val.oldCas! });
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
            if (c.get(key)?.cas !== options.cas.toString()) {
              throw new CasMismatchError(
                new MemDBError(`expected ${c.get(key)?.cas} got ${options.cas}`)
              );
            }
          }
        }
        c.set(key, { value: val, cas: newCas(), oldCas: undefined });
      },
      async upsert(key: string, val: unknown, options?: UpsertOptions) {
        if (c.has(key)) {
          if (c.get(key)?.cas === LOCKED_CAS) {
            throw new CasMismatchError(
              new MemDBError("upsert: key locked: " + key)
            );
          }
        }
        c.set(key, { value: cloneDeep(val), cas: newCas(), oldCas: undefined });
      },
      async remove(key: string, options?: RemoveOptions) {
        if (!c.has(key)) {
          throw new DocumentNotFoundError(new MemDBError(key));
        }
        if (options) {
          if (options.cas) {
            if (c.get(key)?.cas !== options.cas.toString()) {
              throw new CasMismatchError(
                new MemDBError(`expected ${c.get(key)?.cas} got ${options.cas}`)
              );
            }
          }
        }
        c.delete(key);
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
            if (c.get(key)?.cas !== options.cas.toString()) {
              throw new CasMismatchError(
                new MemDBError(`expected ${c.get(key)?.cas} got ${options.cas}`)
              );
            }
          }
        }
        // eslint-disable-next-line
        let val = c.get(key)!.value as any;
        for (const op of specs) {
          switch (op._op) {
            case binding.protocol_subdoc_opcode.array_push_last:
              val = [...(val as unknown[]), JSON.parse(op._data)];
              break;
            case binding.protocol_subdoc_opcode.remove:
              if (op._path[op._path.length - 1] == "]") {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const [_, arrayPath, index] = /(.*?)\[([0-9-]+)\]$/.exec(
                  op._path
                )!;
                let arra: unknown[];
                if (arrayPath.length === 0) {
                  arra = val;
                } else {
                  arra = get(val, arrayPath);
                }
                arra.splice(parseInt(index), 1);
                set(val, arrayPath, arra);
              } else {
                throw new Error(
                  "Unhandled non-array subdoc case (this is a test bug)"
                );
              }
              break;
            case binding.protocol_subdoc_opcode.array_insert:
              if (op._path[op._path.length - 1] == "]") {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const [_, arrayPath, index] = /(.*?)\[([0-9-]+)\]$/.exec(
                  op._path
                )!;
                let arra: unknown[];
                if (arrayPath.length === 0) {
                  arra = val;
                } else {
                  arra = get(val, arrayPath);
                }
                arra.splice(parseInt(index), 0, JSON.parse(op._data));
                set(val, arrayPath, arra);
              } else {
                throw new Error(
                  "Unhandled non-array subdoc case (this is a test bug)"
                );
              }
              break;
            case binding.protocol_subdoc_opcode.replace:
              if (op._path[op._path.length - 1] == "]") {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const [_, arrayPath, index] = /(.*?)\[([0-9-]+)\]$/.exec(
                  op._path
                )!;
                let arra: unknown[];
                if (arrayPath.length === 0) {
                  arra = val;
                } else {
                  arra = get(val, arrayPath);
                }
                arra[parseInt(index)] = JSON.parse(op._data);
                set(val, arrayPath, arra);
              } else {
                throw new Error(
                  "Unhandled non-array subdoc case (this is a test bug)"
                );
              }
              break;
            default:
              throw new Error(
                `Unsupported subdoc operation ${op._op} (this is a test bug)`
              );
          }
        }
        c.set(key, { value: cloneDeep(val), cas: newCas(), oldCas: undefined });
      },
    };
  }
}

export const DB = new InMemoryDB();
