/**
 * Interface for an object serializer.
 * @remarks The most common use for this is saving and retrieving data to/from a database.
 */
export interface ISerializer<T> {
  /**
   * Turns an object into a JSON.
   *
   * @remarks Implements will add logic to jsonify things such as javascript classes
   * or other objects that cannot be easily expressed with JSON
   */
  toJson(object: T): Record<string, any>;
  /**
   * Turns JSON into an object.
   */
  fromJson(json: Record<string, any>): T;
  /**
   * Turns an object into a parseable string representation
   */
  serialize(object: Record<any, any>): string;
  /**
   * Parses a string and turns it into an object.
   */
  deserialize(serializedJson: string): T;
}
