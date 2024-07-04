import "reflect-metadata"; //required for class transformer to work;
import {
  ClassConstructor,
  instanceToPlain,
  plainToInstance,
} from "class-transformer";
import { ISerializer } from "./";

/**
 *
 * An implementation of {@link ISerializer} that uses class-transfromer npm package
 *
 * @remarks class-transformer is a powerful library controlling how we turning json into class instances
 *
 * Classes using this serializer MUST annotate all members with @Expose()
 * @see https://www.npmjs.com/package/class-transformer
 */
export class ClassSerializer<T> implements ISerializer<T> {
  constructor(private readonly classConstructor: ClassConstructor<T>) {}

  /**
   * Turns an instance of a class into plain json into an instance of a class using the class-transformer npm package.
   */
  public toJson(object: T): Record<string, any> {
    return instanceToPlain(object, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false,
    });
  }

  /**
   * Turns plain json into an instance of a class using the class-transformer npm package.
   *
   * @remarks Classes using this serializer MUST annotate all members with @Expose() because of the use of the `excludeExtraneousValues: true` option
   */
  public fromJson(json: Record<string, any>): T {
    return plainToInstance(this.classConstructor, json, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false,
    });
  }

  /**
   * Turns an object into a stringified json representation of the object
   */
  public serialize(object: Record<any, any>): string {
    return JSON.stringify(this.toJson(object));
  }

  /**
   * Turns stringified json back into a specific class
   */
  public deserialize(serializedJson: string): T {
    return this.fromJson(JSON.parse(serializedJson));
  }
}
