import "reflect-metadata"; //required for class transformer to work;
import {
    ClassConstructor,
    instanceToPlain,
    plainToInstance,
} from "class-transformer";
import { ISerializer } from "./";

/**
 *
 * An implementation of {@link ISerializer} that uses the
 * class-transfromer npm package. class-transformer enables to quickly add complex
 * jsonification logic to Javascript classes.
 *
 * Classes must be annotated according using class-transformer
 * for this serializer to work as expected.
 * @see https://www.npmjs.com/package/class-transformer
 *
 */
export class ClassSerializer<T> implements ISerializer<T> {
    constructor(private readonly classConstructor: ClassConstructor<T>) {}

    public toJson(object: T): Record<string, any> {
        return ClassSerializer.classToPlainJson(object);
    }

    public fromJson(json: Record<string, any>): T {
        return ClassSerializer.plainJsonToClass(this.classConstructor, json);
    }

    public serialize(classBasedObject: Record<any, any>): string {
        return JSON.stringify(
            instanceToPlain(classBasedObject, { exposeUnsetFields: false })
        );
    }

    public deserialize(serializedJson: string): T {
        return plainToInstance(
            this.classConstructor,
            JSON.parse(serializedJson),
            {
                excludeExtraneousValues: true,
            }
        );
    }

    /**
     * This method enables turning json into any class annotated with class-transformer
     * without the need to make a typed instance of an {@link ClassSerializer}
     */
    static plainJsonToClass<V>(
        classConstructor: ClassConstructor<V>,
        json: Record<any, any>
    ): V {
        return plainToInstance(classConstructor, json, {
            excludeExtraneousValues: true,
            exposeUnsetFields: false,
        });
    }

    /**
     * This method enables jsonifying any class annotated with class-transformer
     * without the need to make a typed instance of an {@link ClassSerializer}
     */
    static classToPlainJson<T>(classBasedObject: T): Record<string, any> {
        return instanceToPlain(classBasedObject, { exposeUnsetFields: false });
    }
}
