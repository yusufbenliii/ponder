import { AbiEvent, Abi, FormatAbiItem } from 'abitype';
import { ParseAbiItem, Abi as Abi$1, GetEventArgs, Narrow, Transport, Hex, AbiItem, Hash, Address, AccessList, Chain, Client, PublicRpcSchema, GetBalanceParameters, GetBalanceReturnType, GetBytecodeParameters, GetBytecodeReturnType, GetStorageAtParameters, GetStorageAtReturnType, ContractFunctionConfig, MulticallParameters, MulticallReturnType, ReadContractParameters, ReadContractReturnType } from 'viem';

/**
 * @description Combines members of an intersection into a readable type.
 *
 * @link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg
 * @example
 * Prettify<{ a: string } | { b: string } | { c: number, d: bigint }>
 * => { a: string, b: string, c: number, d: bigint }
 */
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
/**
 * @description Returns true if T only has a property named "id".
 */
type HasOnlyIdProperty<T> = Exclude<keyof T, "id"> extends never ? true : false;
/**
 * @description Creates a union of the names of all the required properties of T.
 */
type RequiredPropertyNames<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
type HasRequiredPropertiesOtherThanId<T> = Exclude<RequiredPropertyNames<T>, "id"> extends never ? false : true;

type GetAddress<contract> = contract extends {
    factory: unknown;
} ? contract extends {
    factory: {
        event: infer event extends AbiEvent;
    };
} ? {
    address?: never;
    factory?: {
        /** Address of the factory contract that creates this contract. */
        address: `0x${string}`;
        /** ABI event that announces the creation of a new instance of this contract. */
        event: AbiEvent;
        /** Name of the factory event parameter that contains the new child contract address. */
        parameter: Exclude<event["inputs"][number]["name"], undefined>;
    };
} : {
    address?: never;
    factory?: {
        /** Address of the factory contract that creates this contract. */
        address: `0x${string}`;
        /** ABI event that announces the creation of a new instance of this contract. */
        event: AbiEvent;
        /** Name of the factory event parameter that contains the new child contract address. */
        parameter: string;
    };
} : contract extends {
    address: `0x${string}` | readonly `0x${string}`[];
} ? {
    address?: `0x${string}` | readonly `0x${string}`[];
    factory?: never;
} : {
    address?: `0x${string}` | readonly `0x${string}`[];
    factory?: {
        /** Address of the factory contract that creates this contract. */
        address: `0x${string}`;
        /** ABI event that announces the creation of a new instance of this contract. */
        event: AbiEvent;
        /** Name of the factory event parameter that contains the new child contract address. */
        parameter: string;
    };
};

type NonStrictPick<T, K> = {
    [P in Extract<keyof T, K>]: T[P];
};
type ExtractAbiEvents<abi extends Abi, events = Extract<abi[number], {
    type: "event";
}>> = [events] extends [never] ? AbiEvent : events;
type ParseAbiEvent<abi extends Abi, signature extends string, abiEvents extends AbiEvent = ExtractAbiEvents<abi>, noOverloadEvent = Extract<abiEvents, {
    name: signature;
}>, overloadEvent = Extract<abiEvents, ParseAbiItem<`event ${signature}`>>> = [noOverloadEvent] extends [never] ? [overloadEvent] extends [never] ? AbiEvent : overloadEvent : noOverloadEvent;
type FormatAbiEvent<abi extends Abi, event extends AbiEvent, abiEvents extends AbiEvent = ExtractAbiEvents<abi>, matchingNameEvents extends AbiEvent = Extract<abiEvents, {
    name: event["name"];
}>> = [matchingNameEvents] extends [never] ? never : [Exclude<matchingNameEvents, event>] extends [never] ? event["name"] : FormatAbiItem<event> extends `event ${infer signature}` ? signature : never;
/**
 * Return an union of safe event names that handle event overridding.
 */
type SafeEventNames<abi extends Abi, abiEvents extends AbiEvent = ExtractAbiEvents<abi>> = abiEvents extends abiEvents ? FormatAbiEvent<abi, abiEvents> : never;

type GetEventFilter<abi extends Abi$1, contract, safeEventNames extends string = SafeEventNames<abi>> = contract extends {
    filter: {
        event: infer event extends readonly string[] | string;
    };
} ? event extends readonly string[] ? {
    filter?: {
        event: readonly safeEventNames[];
    };
} : event extends safeEventNames ? {
    filter?: {
        event: safeEventNames | event;
        args?: GetEventArgs<abi, string, {
            EnableUnion: true;
            IndexedOnly: true;
            Required: false;
        }, ParseAbiEvent<abi, event>>;
    };
} : {
    filter?: {
        event: safeEventNames;
        args?: GetEventArgs<Abi$1 | readonly unknown[], string>;
    };
} : {
    filter?: {
        event: safeEventNames | readonly safeEventNames[];
        args?: GetEventArgs<Abi$1 | readonly unknown[], string>;
    };
};

type BlockConfig = {
    /** Block number at which to start indexing events (inclusive). If `undefined`, events will be processed from block 0. Default: `undefined`. */
    startBlock?: number;
    /** Block number at which to stop indexing events (inclusive). If `undefined`, events will be processed in real-time. Default: `undefined`. */
    endBlock?: number;
    /** Maximum block range to use when calling `eth_getLogs`. Default: `10_000`. */
    maxBlockRange?: number;
};
type DatabaseConfig = {
    kind: "sqlite";
    /** Path to SQLite database file. Default: `".ponder/store"`. */
    filename?: string;
} | {
    kind: "postgres";
    /** PostgreSQL database connection string. Default: `process.env.DATABASE_PRIVATE_URL` or `process.env.DATABASE_URL`. */
    connectionString?: string;
};
type OptionConfig = {
    /** Maximum number of seconds to wait for event processing to be complete before responding as healthy. If event processing exceeds this duration, the API may serve incomplete data. Default: `240` (4 minutes). */
    maxHealthcheckDuration?: number;
};
type NetworkConfig<network> = {
    /** Chain ID of the network. */
    chainId: network extends {
        chainId: infer chainId extends number;
    } ? chainId | number : number;
    /** A viem `http`, `webSocket`, or `fallback` [Transport](https://viem.sh/docs/clients/transports/http.html).
     *
     * __To avoid rate limiting, include a custom RPC URL.__ Usage:
     *
     * ```ts
     * import { http } from "viem";
     *
     * const network = {
     *    name: "mainnet",
     *    chainId: 1,
     *    transport: http("https://eth-mainnet.g.alchemy.com/v2/..."),
     * }
     * ```
     */
    transport: Transport;
    /** Polling frequency (in ms). Default: `1_000`. */
    pollingInterval?: number;
    /** Maximum number of RPC requests per second. Default: `50`. */
    maxRequestsPerSecond?: number;
    /** (Deprecated) Maximum concurrency of tasks during the historical sync. Default: `20`. */
    maxHistoricalTaskConcurrency?: number;
};
type AbiConfig<abi extends Abi | readonly unknown[]> = {
    /** Contract application byte interface. */
    abi: abi;
};
type GetNetwork<networks, contract, abi extends Abi, allNetworkNames extends string = [keyof networks] extends [never] ? string : keyof networks & string> = contract extends {
    network: infer network;
} ? {
    /**
     * Network that this contract is deployed to. Must match a network name in `networks`.
     * Any filter information overrides the values in the higher level "contracts" property.
     * Factories cannot override an address and vice versa.
     */
    network: allNetworkNames | {
        [name in allNetworkNames]?: Prettify<GetAddress<NonStrictPick<network, "factory" | "address">> & GetEventFilter<abi, NonStrictPick<contract, "filter">> & BlockConfig>;
    };
} : {
    /**
     * Network that this contract is deployed to. Must match a network name in `networks`.
     * Any filter information overrides the values in the higher level "contracts" property.
     * Factories cannot override an address and vice versa.
     */
    network: allNetworkNames | {
        [name in allNetworkNames]?: Prettify<GetAddress<unknown> & GetEventFilter<abi, unknown> & BlockConfig>;
    };
};
type ContractConfig<networks, contract, abi extends Abi> = Prettify<AbiConfig<abi> & GetNetwork<networks, NonStrictPick<contract, "network">, abi> & GetAddress<NonStrictPick<contract, "factory" | "address">> & GetEventFilter<abi, NonStrictPick<contract, "filter">> & BlockConfig>;
type GetContract<networks = unknown, contract = unknown> = contract extends {
    abi: infer abi extends Abi;
} ? ContractConfig<networks, contract, abi> : ContractConfig<networks, contract, Abi>;
type ContractsConfig<networks, contracts> = {} extends contracts ? {} : {
    [name in keyof contracts]: GetContract<networks, contracts[name]>;
};
type NetworksConfig<networks> = {} extends networks ? {} : {
    [networkName in keyof networks]: NetworkConfig<networks[networkName]>;
};
declare const createConfig: <const networks, const contracts>(config: {
    networks: NetworksConfig<Narrow<networks>>;
    contracts: ContractsConfig<networks, Narrow<contracts>>;
    database?: DatabaseConfig | undefined;
    options?: OptionConfig | undefined;
}) => CreateConfigReturnType<networks, contracts>;
type Config = {
    networks: {
        [name: string]: NetworkConfig<unknown>;
    };
    contracts: {
        [name: string]: GetContract;
    };
    database?: DatabaseConfig;
    options?: OptionConfig;
};
type CreateConfigReturnType<networks, contracts> = {
    networks: networks;
    contracts: contracts;
    database?: DatabaseConfig;
    options?: OptionConfig;
};

type Scalar = "string" | "int" | "float" | "boolean" | "hex" | "bigint";
type ID = "string" | "int" | "bigint" | "hex";
type BaseColumn<TType extends Scalar = Scalar, TReferences extends `${string}.id` | undefined | unknown = unknown, TOptional extends boolean | unknown = unknown, TList extends boolean | unknown = unknown> = {
    _type: "b";
    type: TType;
    references: TReferences;
    optional: TOptional;
    list: TList;
};
type ReferenceColumn<TType extends Scalar = Scalar, TReferences extends `${string}.id` = `${string}.id`, TOptional extends boolean = boolean> = BaseColumn<TType, TReferences, TOptional, false>;
type NonReferenceColumn<TType extends Scalar = Scalar, TOptional extends boolean = boolean, TList extends boolean = boolean> = BaseColumn<TType, undefined, TOptional, TList>;
type InternalColumn<TType extends Scalar = Scalar, TReferences extends `${string}.id` | undefined | unknown = unknown, TOptional extends boolean | unknown = unknown, TList extends boolean | unknown = unknown> = {
    " column": BaseColumn<TType, TReferences, TOptional, TList>;
};
type IDColumn<TType extends ID = ID> = {
    " column": BaseColumn<TType, undefined, false, false>;
};
type InternalEnum<TType extends string | unknown = unknown, TOptional extends boolean | unknown = unknown, TList extends boolean | unknown = unknown> = {
    " enum": EnumColumn<TType, TOptional, TList>;
};
type EnumColumn<TType extends string | unknown = unknown, TOptional extends boolean | unknown = unknown, TList extends boolean | unknown = unknown> = {
    _type: "e";
    type: TType;
    optional: TOptional;
    list: TList;
};
type ManyColumn<T extends `${string}.${string}` | unknown = unknown> = T extends `${infer TTableName extends string}.${infer TColumnName extends string}` ? {
    _type: "m";
    referenceTable: TTableName;
    referenceColumn: TColumnName;
} : {
    _type: "m";
};
type OneColumn<T extends string | unknown = unknown> = T extends string ? {
    _type: "o";
    referenceColumn: T;
} : {
    _type: "o";
};
type Table$1<TColumns extends ({
    id: {
        " column": IDColumn;
    };
} & Record<string, InternalEnum | InternalColumn | ManyColumn | OneColumn>) | unknown = ({
    id: {
        " column": IDColumn;
    };
} & Record<string, InternalEnum | InternalColumn | ManyColumn | OneColumn>) | unknown> = TColumns;
type Enum<TValues extends readonly string[] | unknown = readonly string[] | unknown> = TValues;
type Schema = {
    tables: Record<string, Table$1<{
        id: NonReferenceColumn<ID, false, false>;
    } & Record<string, NonReferenceColumn<Scalar, boolean, boolean> | ReferenceColumn<Scalar, `${string}.id`, boolean> | EnumColumn<string, boolean, boolean> | ManyColumn<`${string}.${string}`> | OneColumn<string>>>>;
    enums: Record<string, Enum<readonly string[]>>;
};
/**
 * Keeps only the enums from a schema
 */
type FilterEnums<TSchema extends Record<string, Enum | Table$1>> = Pick<TSchema, {
    [key in keyof TSchema]: TSchema[key] extends Enum<readonly string[]> ? key : never;
}[keyof TSchema]>;
/**
 * Keeps only the tables from a schema
 */
type FilterTables<TSchema extends Record<string, Enum | Table$1>> = Pick<TSchema, {
    [key in keyof TSchema]: TSchema[key] extends Table$1<Record<string, NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn>> ? key : never;
}[keyof TSchema]>;
/**
 * Keeps only the reference columns from a schema
 */
type FilterReferenceColumns<TTableName extends string, TColumns extends Record<string, NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn> | Enum> = Pick<TColumns, {
    [key in keyof TColumns]: TColumns[key] extends ReferenceColumn<Scalar, `${TTableName}.id`> ? key : never;
}[keyof TColumns]>;
type ExtractAllNames<TTableName extends string, TSchema extends Record<string, Record<string, NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn> | Enum>> = {
    [tableName in keyof FilterTables<TSchema>]: `${tableName & string}.${keyof FilterReferenceColumns<TTableName, TSchema[tableName]> & string}`;
}[keyof FilterTables<TSchema>];
/**
 * Recover raw typescript types from the intermediate representation
 */
type RecoverScalarType<TScalar extends Scalar> = TScalar extends "string" ? string : TScalar extends "int" ? number : TScalar extends "float" ? number : TScalar extends "boolean" ? boolean : TScalar extends "hex" ? Hex : TScalar extends "bigint" ? bigint : never;
type RecoverColumnType<TColumn extends NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn> = TColumn extends {
    type: infer _type extends Scalar;
    list: infer _list extends boolean;
} ? _list extends false ? RecoverScalarType<_type> : RecoverScalarType<_type>[] : never;
type RecoverOptionalColumns<TColumns extends Record<string, NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn>> = Pick<TColumns, {
    [key in keyof TColumns]: TColumns[key] extends NonReferenceColumn | ReferenceColumn ? TColumns[key]["optional"] extends true ? key : never : never;
}[keyof TColumns]>;
type RecoverRequiredColumns<TColumns extends Record<string, NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn>> = Pick<TColumns, {
    [key in keyof TColumns]: TColumns[key] extends NonReferenceColumn | ReferenceColumn ? TColumns[key]["optional"] extends false ? key : never : never;
}[keyof TColumns]>;
type RecoverOptionalEnumColumns<TColumns extends Record<string, NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn>> = Pick<TColumns, {
    [key in keyof TColumns]: TColumns[key] extends EnumColumn ? TColumns[key]["optional"] extends true ? key : never : never;
}[keyof TColumns]>;
type RecoverRequiredEnumColumns<TColumns extends Record<string, NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn>> = Pick<TColumns, {
    [key in keyof TColumns]: TColumns[key] extends EnumColumn ? TColumns[key]["optional"] extends false ? key : never : never;
}[keyof TColumns]>;
type RecoverEnumType<TEnums extends Record<string, Enum>, TColumn extends NonReferenceColumn | ReferenceColumn | EnumColumn | ManyColumn | OneColumn> = TColumn extends EnumColumn ? TEnums[TColumn["type"] & keyof TEnums] extends infer _enum extends readonly string[] ? TColumn["list"] extends false ? _enum[number] : _enum[number][] : never : never;
type RecoverTableType<TEnums extends Record<string, Enum>, TTable extends Table$1> = TTable extends infer _columns extends Record<string, ReferenceColumn | NonReferenceColumn | EnumColumn | ManyColumn | OneColumn> ? Prettify<{
    id: RecoverColumnType<_columns["id"]>;
} & {
    [key in keyof RecoverRequiredColumns<_columns>]: RecoverColumnType<_columns[key]>;
} & {
    [key in keyof RecoverOptionalColumns<_columns>]?: RecoverColumnType<_columns[key]>;
} & {
    [key in keyof RecoverRequiredEnumColumns<_columns>]: RecoverEnumType<TEnums, _columns[key]>;
} & {
    [key in keyof RecoverOptionalEnumColumns<_columns>]?: RecoverEnumType<TEnums, _columns[key]>;
}> : never;
type Infer<TSchema extends Schema> = {
    [key in keyof TSchema["tables"]]: RecoverTableType<TSchema["enums"], TSchema["tables"][key]>;
};

type Optional<TScalar extends Scalar, TReferences extends `${string}.id` | undefined, TList extends boolean> = () => TReferences extends undefined ? TList extends true ? InternalColumn<TScalar, TReferences, true, TList> : InternalColumn<TScalar, TReferences, true, TList> & {
    /**
     * Mark the column as optional.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#optional
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *     o: p.int().optional(),
     *   })
     * })
     */
    list: List<TScalar, true>;
    /**
     * Mark the column as a foreign key.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#foreign-key
     *
     * @param references Table that this column is a key of.
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   a: p.createTable({
     *     id: p.string(),
     *     b_id: p.string.references("b.id"),
     *   })
     *   b: p.createTable({
     *     id: p.string(),
     *   })
     * })
     */
    references: References<TScalar, true>;
} : InternalColumn<TScalar, TReferences, true, TList>;
type List<TScalar extends Scalar, TOptional extends boolean> = () => TOptional extends true ? InternalColumn<TScalar, undefined, TOptional, true> : InternalColumn<TScalar, undefined, TOptional, true> & {
    /**
     * Mark the column as optional.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#optional
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *     o: p.int().optional(),
     *   })
     * })
     */
    optional: Optional<TScalar, undefined, true>;
};
type References<TScalar extends Scalar, TOptional extends boolean> = <TReferences extends `${string}.id`>(references: TReferences) => TOptional extends true ? InternalColumn<TScalar, TReferences, TOptional, false> : InternalColumn<TScalar, TReferences, TOptional, false> & {
    /**
     * Mark the column as optional.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#optional
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *     o: p.int().optional(),
     *   })
     * })
     */
    optional: Optional<TScalar, TReferences, false>;
};
type EmptyModifier<TScalar extends Scalar> = InternalColumn<TScalar, undefined, false, false> & {
    /**
     * Mark the column as optional.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#optional
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *     o: p.int().optional(),
     *   })
     * })
     */
    optional: Optional<TScalar, undefined, false>;
    /**
     * Mark the column as a list.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#list
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *     l: p.int().list(),
     *   })
     * })
     */
    list: List<TScalar, false>;
    /**
     * Mark the column as a foreign key.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#foreign-key
     *
     * @param references Table that this column is a key of.
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   a: p.createTable({
     *     id: p.string(),
     *     b_id: p.string.references("b.id"),
     *   })
     *   b: p.createTable({
     *     id: p.string(),
     *   })
     * })
     */
    references: References<TScalar, false>;
};
type _Enum<TType extends string, TOptional extends boolean, TList extends boolean> = InternalEnum<TType, TOptional, TList> & (TOptional extends true ? {} : {
    /**
     * Mark the column as optional.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#optional
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   e: p.createEnum(["ONE", "TWO"])
     *   t: p.createTable({
     *     id: p.string(),
     *     a: p.enum("e").optional(),
     *   })
     * })
     */
    optional: () => _Enum<TType, true, TList>;
}) & (TList extends true ? {} : {
    /**
     * Mark the column as a list.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#list
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default p.createSchema({
     *   e: p.createEnum(["ONE", "TWO"])
     *   t: p.createTable({
     *     id: p.string(),
     *     a: p.enum("e").list(),
     *   })
     * })
     */
    list: () => _Enum<TType, TOptional, true>;
});

/**
 * Fix issue with Array.isArray not checking readonly arrays
 * {@link https://github.com/microsoft/TypeScript/issues/17002}
 */
declare global {
    interface ArrayConstructor {
        isArray(arg: ReadonlyArray<any> | any): arg is ReadonlyArray<any>;
    }
}
declare const createTable: <TColumns extends unknown = unknown>(columns: TColumns) => { [key in keyof TColumns]: TColumns[key] extends InternalColumn ? TColumns[key][" column"] : TColumns[key] extends InternalEnum ? TColumns[key][" enum"] : TColumns[key]; };
declare const createEnum: <const TEnum extends unknown>(_enum: TEnum) => TEnum;
declare const P: {
    createEnum: <const TEnum extends unknown>(_enum: TEnum) => TEnum;
    createTable: <TColumns extends unknown = unknown>(columns: TColumns) => { [key in keyof TColumns]: TColumns[key] extends InternalColumn ? TColumns[key][" column"] : TColumns[key] extends InternalEnum ? TColumns[key][" enum"] : TColumns[key]; };
    string: () => EmptyModifier<"string">;
    bigint: () => EmptyModifier<"bigint">;
    int: () => EmptyModifier<"int">;
    float: () => EmptyModifier<"float">;
    hex: () => EmptyModifier<"hex">;
    boolean: () => EmptyModifier<"boolean">;
    one: <T extends string>(derivedColumn: T) => OneColumn<T>;
    many: <T_1 extends `${string}.${string}`>(derived: T_1) => ManyColumn<T_1>;
    enum: <TType extends string>(type: TType) => _Enum<TType, false, false>;
};
type P = {
    /**
     * Primitive `string` column type.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#primitives
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *   })
     * })
     */
    string: () => EmptyModifier<"string">;
    /**
     * Primitive `int` column type.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#primitives
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default createSchema({
     *   t: p.createTable({
     *     id: p.int(),
     *   })
     * })
     */
    int: () => EmptyModifier<"int">;
    /**
     * Primitive `float` column type.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#primitives
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *     f: p.float(),
     *   })
     * })
     */
    float: () => EmptyModifier<"float">;
    /**
     * Primitive `hex` column type.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#primitives
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default createSchema({
     *   t: p.createTable({
     *     id: p.hex(),
     *   })
     * })
     */
    hex: () => EmptyModifier<"hex">;
    /**
     * Primitive `boolean` column type.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#primitives
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *     b: p.boolean(),
     *   })
     * })
     */
    boolean: () => EmptyModifier<"boolean">;
    /**
     * Primitive `bigint` column type.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#primitives
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default createSchema({
     *   t: p.createTable({
     *     id: p.bigint(),
     *   })
     * })
     */
    bigint: () => EmptyModifier<"bigint">;
    /**
     * Custom defined allowable value column type.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#enum
     *
     * @param type Enum defined elsewhere in the schema with `p.createEnum()`.
     *
     * @example
     * export default createSchema({
     *   e: p.createEnum(["ONE", "TWO"])
     *   t: p.createTable({
     *     id: p.string(),
     *     a: p.enum("e"),
     *   })
     * })
     */
    enum: <TType extends string>(type: TType) => _Enum<TType, false, false>;
    /**
     * One-to-one column type.`one` columns don't exist in the database. They are only present when querying data from the GraphQL API.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#one-to-one
     *
     * @param reference Reference column to be resolved.
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default createSchema({
     *   a: p.createTable({
     *     id: p.string(),
     *     b_id: p.string.references("b.id"),
     *     b: p.one("b_id"),
     *   })
     *   b: p.createTable({
     *     id: p.string(),
     *   })
     * })
     */
    one: <T extends string>(derivedColumn: T) => OneColumn<T>;
    /**
     * Many-to-one column type. `many` columns don't exist in the database. They are only present when querying data from the GraphQL API.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#one-to-many
     *
     * @param reference Reference column that references the `id` column of the current table.
     *
     * @example
     * import { p } from '@ponder/core'
     *
     * export default createSchema({
     *   a: p.createTable({
     *     id: p.string(),
     *     ref: p.string.references("b.id"),
     *   })
     *   b: p.createTable({
     *     id: p.string(),
     *     m: p.many("a.ref"),
     *   })
     * })
     */
    many: <T extends `${string}.${string}`>(derived: T) => ManyColumn<T>;
    /**
     * Create an Enum type for the database.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#tables
     *
     * @example
     * export default createSchema({
     *   e: p.createEnum(["ONE", "TWO"])
     *   t: p.createTable({
     *     id: p.string(),
     *     a: p.enum("e"),
     *   })
     * })
     */
    createEnum: typeof createEnum;
    /**
     * Create a database table.
     *
     * - Docs: https://ponder.sh/docs/guides/design-your-schema#tables
     *
     * @example
     * export default createSchema({
     *   t: p.createTable({
     *     id: p.string(),
     *   })
     * })
     */
    createTable: typeof createTable;
};
/**
 * Create a database schema.
 *
 * - Docs: https://ponder.sh/docs/guides/design-your-schema#tables
 *
 * @example
 * export default createSchema({
 *   t: p.createTable({
 *     id: p.string(),
 *   })
 * })
 */
declare const createSchema: <TSchema extends { [tableName in keyof TSchema]: readonly string[] | ({
    id: NonReferenceColumn<ID, false, false>;
} & (TSchema[tableName] extends infer T ? { [columnName in keyof T]: NonReferenceColumn | ReferenceColumn<Scalar, `${{ [key in keyof TSchema]: TSchema[key] extends Record<string, {
    _type: "m";
} | {
    _type: "o";
} | NonReferenceColumn<Scalar, boolean, boolean> | ReferenceColumn<Scalar, `${string}.id`, boolean> | EnumColumn<unknown, unknown, unknown>> ? key : never; }[keyof TSchema] & string}.id`> | EnumColumn<{ [key_1 in keyof TSchema]: TSchema[key_1] extends readonly string[] ? key_1 : never; }[keyof TSchema], boolean, boolean> | ManyColumn<ExtractAllNames<tableName & string, TSchema>> | OneColumn<Exclude<keyof TSchema[tableName], columnName>>; } : never)); }>(_schema: (p: P) => TSchema) => {
    tables: FilterTables<TSchema> extends infer T_1 ? { [key_2 in keyof T_1]: TSchema[key_2]; } : never;
    enums: FilterEnums<TSchema> extends infer T_2 ? { [key_3 in keyof T_2]: TSchema[key_3]; } : never;
};

type MergeAbi<TBase extends Abi, TInsert extends Abi> = TInsert extends readonly [
    infer First extends AbiItem,
    ...infer Rest extends Abi
] ? Extract<TBase[number], First> extends never ? First["type"] extends "constructor" | "receive" | "fallback" ? MergeAbi<TBase, Rest> : MergeAbi<readonly [...TBase, First], Rest> : MergeAbi<TBase, Rest> : TBase;
type MergeAbis<TAbis extends readonly Abi[], TMerged extends Abi = []> = TAbis extends readonly [
    infer First extends Abi,
    ...infer Rest extends readonly Abi[]
] ? MergeAbis<Rest, MergeAbi<TMerged, First>> : TMerged;
/**
 * Combine multiple ABIs into one, removing duplicates if necessary.
 */
declare const mergeAbis: <const TAbis extends readonly Abi[]>(abis: TAbis) => MergeAbis<TAbis, []>;

/**
 * A confirmed Ethereum block.
 *
 * @link https://docs.soliditylang.org/en/v0.8.20/introduction-to-smart-contracts.html#blocks
 */
type Block = {
    /** Base fee per gas */
    baseFeePerGas: bigint | null;
    /** Difficulty for this block */
    difficulty: bigint;
    /** "Extra data" field of this block */
    extraData: Hex;
    /** Maximum gas allowed in this block */
    gasLimit: bigint;
    /** Total used gas by all transactions in this block */
    gasUsed: bigint;
    /** Block hash */
    hash: Hash;
    /** Logs bloom filter */
    logsBloom: Hex;
    /** Address that received this block’s mining rewards */
    miner: Address;
    /** Unique identifier for the block. */
    mixHash: Hash | null;
    /** Proof-of-work hash */
    nonce: Hex | null;
    /** Block number */
    number: bigint;
    /** Parent block hash */
    parentHash: Hash;
    /** Root of the this block’s receipts trie */
    receiptsRoot: Hex;
    /** SHA3 of the uncles data in this block */
    sha3Uncles: Hash;
    /** Size of this block in bytes */
    size: bigint;
    /** Root of this block’s final state trie */
    stateRoot: Hash;
    /** Unix timestamp of when this block was collated */
    timestamp: bigint;
    /** Total difficulty of the chain until this block */
    totalDifficulty: bigint;
    /** Root of this block’s transaction trie */
    transactionsRoot: Hash;
};
/**
 * A confirmed Ethereum transaction. Contains `legacy`, `EIP-1559`, or `EIP-2930` fee values depending on the transaction `type`.
 *
 * @link https://docs.soliditylang.org/en/v0.8.20/introduction-to-smart-contracts.html#transactions
 */
type Transaction = Prettify<{
    /** Hash of block containing this transaction */
    blockHash: Hash;
    /** Number of block containing this transaction */
    blockNumber: bigint;
    /** Transaction sender */
    from: Address;
    /** Gas provided for transaction execution */
    gas: bigint;
    /** Hash of this transaction */
    hash: Hash;
    /** Contract code or a hashed method call */
    input: Hex;
    /** Unique number identifying this transaction */
    nonce: number;
    /** ECDSA signature r */
    r: Hex;
    /** ECDSA signature s */
    s: Hex;
    /** Transaction recipient or `null` if deploying a contract */
    to: Address | null;
    /** Index of this transaction in the block */
    transactionIndex: number;
    /** ECDSA recovery ID */
    v: bigint;
    /** Value in wei sent with this transaction */
    value: bigint;
} & ({
    /** Transaction type. */
    type: "legacy";
    accessList?: never;
    /** Base fee per gas. Only present in legacy and EIP-2930 transactions. */
    gasPrice: bigint;
    maxFeePerGas?: never;
    maxPriorityFeePerGas?: never;
} | {
    /** Transaction type. */
    type: "eip2930";
    /** List of addresses and storage keys the transaction will access. */
    accessList: AccessList;
    /** Base fee per gas. Only present in legacy and EIP-2930 transactions. */
    gasPrice: bigint;
    maxFeePerGas?: never;
    maxPriorityFeePerGas?: never;
} | {
    /** Transaction type. */
    type: "eip1559";
    accessList?: never;
    gasPrice?: never;
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). Only present in EIP-1559 transactions. */
    maxFeePerGas: bigint;
    /** Max priority fee per gas (in wei). Only present in EIP-1559 transactions. */
    maxPriorityFeePerGas: bigint;
} | {
    /** Transaction type. */
    type: "deposit";
    accessList?: never;
    gasPrice?: never;
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). Only present in EIP-1559 transactions. */
    maxFeePerGas?: bigint;
    /** Max priority fee per gas (in wei). Only present in EIP-1559 transactions. */
    maxPriorityFeePerGas?: bigint;
} | {
    /** Transaction type. */
    type: Hex;
    gasPrice?: never;
    accessList?: never;
    maxFeePerGas?: never;
    maxPriorityFeePerGas?: never;
})>;
/**
 * A confirmed Ethereum log.
 *
 * @link https://docs.soliditylang.org/en/v0.8.20/abi-spec.html#events
 */
type Log = {
    /** Globally unique identifier for this log (`${blockHash}-${logIndex}`). */
    id: string;
    /** The address from which this log originated */
    address: Address;
    /** Hash of block containing this log */
    blockHash: Hash;
    /** Number of block containing this log */
    blockNumber: bigint;
    /** Contains the non-indexed arguments of the log */
    data: Hex;
    /** Index of this log within its block */
    logIndex: number;
    /** `true` if this log has been removed in a chain reorganization */
    removed: boolean;
    /** List of order-dependent topics */
    topics: [Hex, ...Hex[]] | [];
    /** Hash of the transaction that created this log */
    transactionHash: Hash;
    /** Index of the transaction that created this log */
    transactionIndex: number;
};

type PonderActions = {
    getBalance: (args: Omit<GetBalanceParameters, "blockTag" | "blockNumber"> & {
        cache?: "immutable";
    }) => Promise<GetBalanceReturnType>;
    getBytecode: (args: Omit<GetBytecodeParameters, "blockTag" | "blockNumber"> & {
        cache?: "immutable";
    }) => Promise<GetBytecodeReturnType>;
    getStorageAt: (args: Omit<GetStorageAtParameters, "blockTag" | "blockNumber"> & {
        cache?: "immutable";
    }) => Promise<GetStorageAtReturnType>;
    multicall: <TContracts extends ContractFunctionConfig[], TAllowFailure extends boolean = true>(args: Omit<MulticallParameters<TContracts, TAllowFailure>, "blockTag" | "blockNumber"> & {
        cache?: "immutable";
    }) => Promise<MulticallReturnType<TContracts, TAllowFailure>>;
    readContract: <const TAbi extends Abi$1 | readonly unknown[], TFunctionName extends string>(args: Omit<ReadContractParameters<TAbi, TFunctionName>, "blockTag" | "blockNumber"> & {
        cache?: "immutable";
    }) => Promise<ReadContractReturnType<TAbi, TFunctionName>>;
};
type ReadOnlyClient<transport extends Transport = Transport, chain extends Chain | undefined = Chain | undefined> = Prettify<Client<transport, chain, undefined, PublicRpcSchema, PonderActions>>;

type Table = {
    [key: string]: string | bigint | number | boolean | Hex | (string | bigint | number | boolean | Hex)[];
};
type OperatorMap<TField extends string | bigint | number | boolean | Hex | (string | bigint | number | boolean | Hex)[]> = {
    equals?: TField;
    not?: TField;
} & (TField extends any[] ? {
    has?: TField[number];
    notHas?: TField[number];
} : {
    in?: TField[];
    notIn?: TField[];
}) & (TField extends string ? TField extends Hex ? {} : {
    contains?: TField;
    notContains?: TField;
    startsWith?: TField;
    notStartsWith?: TField;
    endsWith?: TField;
    notEndsWith?: TField;
} : {}) & (TField extends number | bigint | Hex ? {
    gt?: TField;
    gte?: TField;
    lt?: TField;
    lte?: TField;
} : {});
type WhereInput<TTable extends Table> = {
    [ColumnName in keyof TTable]?: Prettify<OperatorMap<TTable[ColumnName]>> | TTable[ColumnName];
};
type OrderByInput<table, columns extends keyof table = keyof table> = {
    [ColumnName in columns]?: "asc" | "desc";
};

type DatabaseModel<T extends {
    id: string | number | bigint | Hex;
}> = {
    create: (options: Prettify<{
        id: T["id"];
    } & (HasOnlyIdProperty<T> extends true ? {
        data?: never;
    } : HasRequiredPropertiesOtherThanId<T> extends true ? {
        data: Prettify<Omit<T, "id">>;
    } : {
        data?: Prettify<Omit<T, "id">>;
    })>) => Promise<Prettify<T>>;
    createMany: (options: {
        data: Prettify<T>[];
    }) => Promise<Prettify<T>[]>;
    update: (options: Prettify<{
        id: T["id"];
    } & (HasOnlyIdProperty<T> extends true ? {
        data?: never;
    } : HasRequiredPropertiesOtherThanId<T> extends true ? {
        data: Prettify<Omit<Partial<T>, "id">> | ((options: {
            current: Prettify<T>;
        }) => Prettify<Omit<Partial<T>, "id">>);
    } : {
        data?: Prettify<Omit<Partial<T>, "id">> | ((options: {
            current: Prettify<T>;
        }) => Prettify<Omit<Partial<T>, "id">>);
    })>) => Promise<Prettify<T>>;
    updateMany: (options: {
        where: Prettify<WhereInput<T>>;
        data: Prettify<Omit<Partial<T>, "id">> | ((options: {
            current: Prettify<T>;
        }) => Prettify<Omit<Partial<T>, "id">>);
    }) => Promise<Prettify<T>[]>;
    upsert: (options: Prettify<{
        id: T["id"];
    } & (HasOnlyIdProperty<T> extends true ? {
        create?: never;
        update?: never;
    } : HasRequiredPropertiesOtherThanId<T> extends true ? {
        create: Prettify<Omit<T, "id">>;
        update: Prettify<Omit<Partial<T>, "id">> | ((options: {
            current: Prettify<T>;
        }) => Prettify<Omit<Partial<T>, "id">>);
    } : {
        create?: Prettify<Omit<T, "id">>;
        update?: Prettify<Omit<Partial<T>, "id">> | ((options: {
            current: Prettify<T>;
        }) => Prettify<Omit<Partial<T>, "id">>);
    })>) => Promise<Prettify<T>>;
    findUnique: (options: {
        id: T["id"];
    }) => Promise<Prettify<T> | null>;
    findMany: (options?: {
        where?: Prettify<WhereInput<T>>;
        orderBy?: Prettify<OrderByInput<T>>;
        limit?: number;
        before?: string;
        after?: string;
    }) => Promise<{
        items: Prettify<T>[];
        pageInfo: {
            startCursor: string | null;
            endCursor: string | null;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    delete: (options: {
        id: T["id"];
    }) => Promise<boolean>;
};

declare namespace Virtual {
    type Setup = "setup";
    type _FormatEventNames<contract extends Config["contracts"][string], safeEventNames = SafeEventNames<contract["abi"]>> = string extends safeEventNames ? never : contract extends {
        filter: {
            event: infer event extends string | readonly string[];
        };
    } ? event extends safeEventNames ? event : event[number] extends safeEventNames ? event[number] : safeEventNames : safeEventNames;
    /** "{ContractName}:{EventName}". */
    export type FormatEventNames<contracts extends Config["contracts"]> = {
        [name in keyof contracts]: `${name & string}:${_FormatEventNames<contracts[name]> | Setup}`;
    }[keyof contracts];
    export type ExtractEventName<name extends string> = name extends `${string}:${infer EventName extends string}` ? EventName : never;
    export type ExtractContractName<name extends string> = name extends `${infer ContractName extends string}:${string}` ? ContractName : never;
    export type EventNames<config extends Config> = FormatEventNames<config["contracts"]>;
    export type Event<config extends Config, name extends EventNames<config>, contractName extends ExtractContractName<name> = ExtractContractName<name>, eventName extends ExtractEventName<name> = ExtractEventName<name>> = eventName extends Setup ? never : {
        name: eventName;
        args: GetEventArgs<Abi$1, string, {
            EnableUnion: false;
            IndexedOnly: false;
            Required: true;
        }, ParseAbiEvent<config["contracts"][contractName]["abi"], eventName>>;
        log: Prettify<Log>;
        block: Prettify<Block>;
        transaction: Prettify<Transaction>;
    };
    type ContextContractProperty = Exclude<keyof Config["contracts"][string], "abi" | "network" | "filter" | "factory">;
    type ExtractOverridenProperty<contract extends Config["contracts"][string], property extends ContextContractProperty, base = Extract<contract, {
        [p in property]: unknown;
    }>[property], override = Extract<contract["network"][keyof contract["network"]], {
        [p in property]: unknown;
    }>[property]> = ([base] extends [never] ? undefined : base) | override;
    export type Context<config extends Config, schema extends Schema, name extends EventNames<config>, contractName extends ExtractContractName<name> = ExtractContractName<name>> = {
        contracts: {
            [_contractName in keyof config["contracts"]]: {
                abi: config["contracts"][_contractName]["abi"];
                address: ExtractOverridenProperty<config["contracts"][_contractName], "address">;
                startBlock: ExtractOverridenProperty<config["contracts"][_contractName], "startBlock">;
                endBlock: ExtractOverridenProperty<config["contracts"][_contractName], "endBlock">;
            };
        };
        network: config["contracts"][contractName]["network"] extends string ? {
            name: config["contracts"][contractName]["network"];
            chainId: config["networks"][config["contracts"][contractName]["network"]]["chainId"];
        } : {
            [key in keyof config["contracts"][contractName]["network"]]: {
                name: key;
                chainId: config["networks"][key & keyof config["networks"]]["chainId"];
            };
        }[keyof config["contracts"][contractName]["network"]];
        client: Prettify<Omit<ReadOnlyClient, "extend" | "key" | "batch" | "cacheTime" | "account" | "type" | "uid" | "chain" | "name" | "pollingInterval" | "transport">>;
        db: {
            [key in keyof Infer<schema>]: DatabaseModel<Infer<schema>[key]>;
        };
    };
    export type IndexingFunctionArgs<config extends Config, schema extends Schema, name extends EventNames<config>> = {
        event: Event<config, name>;
        context: Context<config, schema, name>;
    };
    export type Schema<schema extends Schema> = Infer<schema>;
    export type Registry<config extends Config, schema extends Schema> = {
        on: <name extends EventNames<config>>(_name: name, indexingFunction: (args: {
            event: Event<config, name>;
        } & {
            context: Prettify<Context<config, schema, name>>;
        }) => Promise<void> | void) => void;
    };
    export {  };
}

export { type Block, type Log, type Transaction, Virtual, createConfig, createSchema, mergeAbis };
