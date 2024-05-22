import { LexographicNumberEncoder } from "../serialization/utils/LexographicNumberEncoder";
import { DateSerializer } from "../serialization/DateSerializer";

export abstract class KeyFactory {
    public static readonly ID_DELIMETER = "!!";

    public static create(
        params: unknown[],
        encodeNumbersLexographically: boolean = false
    ) {
        if (Array.isArray(params)) {
            const paramsToJoin: string[] = [];
            params.forEach((param) => {
                KeyFactory.serializeAndAddToArray(
                    param,
                    paramsToJoin,
                    encodeNumbersLexographically
                );
            });
            return paramsToJoin.join(KeyFactory.ID_DELIMETER);
        } else {
            throw new Error(
                "Unknown param type provided to KeyFactory constructor"
            );
        }
    }

    private static serializeAndAddToArray(
        param: unknown,
        array: string[],
        encodeNumbersLexographically: boolean
    ) {
        if (Array.isArray(param)) {
            param.forEach((x) =>
                KeyFactory.serializeAndAddToArray(
                    x,
                    array,
                    encodeNumbersLexographically
                )
            );
            return;
        }

        switch (typeof param) {
            case "string":
                array.push(param as string);
                break;
            case "number":
                if (encodeNumbersLexographically) {
                    array.push(LexographicNumberEncoder.encodeLong(`${param}`));
                } else {
                    array.push(`${param}`);
                }
                break;
            case "boolean":
                array.push(`${param}`);
                break;
            default:
                const complexParam = param as any;
                if (complexParam instanceof Date) {
                    array.push(KeyFactory.dateToString(complexParam)!);
                } else {
                    throw new Error("Unsupported data type passed to createId");
                }
        }
    }

    static parseId(id: string) {
        let paramters;
        paramters = id.split(KeyFactory.ID_DELIMETER);
    }

    static dateToString(date: Date) {
        return DateSerializer.serialize(date);
    }
}
