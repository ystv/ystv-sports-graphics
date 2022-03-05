
/**
 * If condition evaluates to false, throws ctor with message.
 * 
 * @example
 * 
 *   ensure(typeof foo === "string", BadRequest, "invalid foo");
 * 
 * @param condition 
 * @param ctor 
 * @param message 
 */
export function ensure(condition: boolean, ctor: new (msg: string) => any, message: string): asserts condition {
    if (!condition) {
        throw new ctor(message);
    }
}
