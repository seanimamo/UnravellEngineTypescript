import { ISerializer } from "./ISerializer";

/**
 * A very simple serializer for working with javascript objects that are not class based and
 * do not require any additional serialization logic
 */
export class NaiveJsonSerializer<T extends Record<string, any>>
    implements ISerializer<T>
{
    toJson(object: T): Record<string, any> {
        return object;
    }
    fromJson(json: Record<string, any>): T {
        return json as T;
    }
    serialize(object: Record<any, any>): string {
        return JSON.stringify(object);
    }
    deserialize(serializedJson: string): T {
        return JSON.parse(serializedJson);
    }
}
