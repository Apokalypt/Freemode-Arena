export type WithoutReadonly<T> = { [P in Exclude<keyof T, "readonly">]-?: T[P] };

export type ExtractProperties<T> = Pick<T, {
    [Key in keyof T]: T[Key] extends Function ? never : Key;
}[keyof T]>;

export type WithoutModifiers<T> = WithoutReadonly<ExtractProperties<T>>;
