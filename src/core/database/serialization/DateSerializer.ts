export namespace DateSerializer {
    export const serialize = (value: Date | undefined): string | undefined => value === undefined ? undefined : (value as Date).toISOString();
    export const deserialize = (value: string | undefined): Date | undefined => value === undefined ? undefined : new Date(value);
}