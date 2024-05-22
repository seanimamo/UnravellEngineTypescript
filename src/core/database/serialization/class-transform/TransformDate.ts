import { Transform } from "class-transformer";
import { DateSerializer } from "../DateSerializer";

// Sourced from: https://stackoverflow.com/questions/59899045/plaintoclass-does-not-convert-a-date-to-string
// (Note I made a slight modification) based on a comment,
// "Note that in more recent versions, the argument to Transform function is now an object that has a value prop rather than just the value, so it needs to be extracted. E.g. with destructuring @Transform(({ value }) => ..."
// Another method of doing the same thing: https://github.com/typestack/class-transformer/blob/master/sample/sample5-custom-transformer/User.ts
export function TransformDate() {
    const toPlain = Transform(({ value }) => DateSerializer.serialize(value), {
        toPlainOnly: true,
    });

    const toClass = Transform(
        ({ value }) => DateSerializer.deserialize(value),
        { toClassOnly: true }
    );

    return function (target: any, key: string) {
        toPlain(target, key);
        toClass(target, key);
    };
}
