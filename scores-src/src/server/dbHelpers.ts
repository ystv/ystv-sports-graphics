import { Cas } from "couchbase";

// https://issues.couchbase.com/browse/JSCBC-1164
export class CouchbaseCas implements Cas {
  private readonly cas: string;

  constructor(casString: string) {
    this.cas = casString;
  }

  static from(casString: string | number) {
    return new CouchbaseCas(
      typeof casString === "number" ? casString.toString() : casString
    );
  }

  toJSON() {
    return this.cas;
  }

  toString() {
    return this.cas;
  }
}
