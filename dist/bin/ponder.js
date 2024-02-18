#!/usr/bin/env node

// src/bin/ponder.ts
import { readFileSync as readFileSync3 } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cac } from "cac";
import dotenv from "dotenv";
import pc3 from "picocolors";

// src/Ponder.ts
import { existsSync as existsSync2 } from "node:fs";
import path9 from "node:path";
import process3 from "node:process";

// src/build/service.ts
import path2 from "node:path";

// src/schema/utils.ts
var referencedTableName = (references) => references.split(".")[0];
var isOneColumn = (column) => column._type === "o";
var isBaseColumn = (column) => column._type === "b";
var isManyColumn = (column) => column._type === "m";
var isEnumColumn = (column) => column._type === "e";
var isReferenceColumn = (column) => column._type === "b" && column.references !== void 0;

// src/build/schema/schema.ts
var buildSchema = ({ schema }) => {
  Object.entries(schema.enums).forEach(([name, _enum]) => {
    validateTableOrColumnName(name, "Enum");
    const enumValues = /* @__PURE__ */ new Set();
    for (const enumValue of _enum) {
      if (enumValues.has(enumValue)) {
        throw Error(
          `Validation failed: Enum '${name}' contains duplicate value '${enumValue}'.`
        );
      }
      enumValues.add(enumValue);
    }
  });
  Object.entries(schema.tables).forEach(([tableName, columns]) => {
    validateTableOrColumnName(tableName, "Table");
    if (columns.id === void 0)
      throw Error(
        `Validation failed: Table '${tableName}' does not have an 'id' column.`
      );
    if (isEnumColumn(columns.id))
      throw Error(
        `Validation failed: Invalid type for ID column '${tableName}.id'. Got 'enum', expected one of ['string', 'hex', 'bigint', 'int'].`
      );
    if (isOneColumn(columns.id))
      throw Error(
        `Validation failed: Invalid type for ID column '${tableName}.id'. Got 'one', expected one of ['string', 'hex', 'bigint', 'int'].`
      );
    if (isManyColumn(columns.id))
      throw Error(
        `Validation failed: Invalid type for ID column '${tableName}.id'. Got 'many', expected one of ['string', 'hex', 'bigint', 'int'].`
      );
    if (isReferenceColumn(columns.id))
      throw Error(
        `Validation failed: Invalid type for ID column '${tableName}.id'. ID columns cannot use the '.references' modifier.`
      );
    if (columns.id.type !== "bigint" && columns.id.type !== "string" && columns.id.type !== "hex" && columns.id.type !== "int")
      throw Error(
        `Validation failed: Invalid type for ID column '${tableName}.id'. Got '${columns.id.type}', expected one of ['string', 'hex', 'bigint', 'int'].`
      );
    if (columns.id.optional === true)
      throw Error(
        `Validation failed: Invalid type for ID column '${tableName}.id'. ID columns cannot be optional.`
      );
    if (columns.id.list === true)
      throw Error(
        `Validation failed: Invalid type for ID column '${tableName}.id'. ID columns cannot be a list.`
      );
    Object.entries(columns).forEach(([columnName, column]) => {
      if (columnName === "id")
        return;
      validateTableOrColumnName(columnName, "Column");
      if (isOneColumn(column)) {
        const usedColumn = Object.entries(columns).find(
          ([c]) => c === column.referenceColumn
        );
        if (usedColumn === void 0) {
          const otherColumns = Object.keys(columns).filter(
            (c) => c !== columnName
          );
          throw Error(
            `Validation failed. Relationship column '${tableName}.${columnName}' uses a column that does not exist. Got '${column.referenceColumn}', expected one of [${otherColumns.map((c) => `'${c}'`).join(", ")}].`
          );
        }
        if (!isReferenceColumn(usedColumn[1])) {
          const foreignKeyColumns = Object.keys(columns).filter(
            (c) => c !== columnName && isReferenceColumn(columns[c])
          );
          throw Error(
            `Validation failed. Relationship column '${tableName}.${columnName}' uses a column that is not foreign key column. Got '${column.referenceColumn}', expected one of [${foreignKeyColumns.map((c) => `'${c}'`).join(", ")}].`
          );
        }
      }
      if (isManyColumn(column)) {
        const usedTable = Object.entries(schema.tables).find(
          ([name]) => name === column.referenceTable
        );
        if (usedTable === void 0) {
          const otherTables = Object.keys(schema.tables).filter(
            (t) => t !== tableName
          );
          throw Error(
            `Validation failed. Relationship column '${tableName}.${columnName}' uses a table that does not exist. Got '${column.referenceTable}', expected one of [${otherTables.map((t) => `'${t}'`).join(", ")}].`
          );
        }
        const usedTableColumns = Object.entries(usedTable[1]);
        const usedColumn = usedTableColumns.find(
          ([columnName2]) => columnName2 === column.referenceColumn
        );
        if (usedColumn === void 0) {
          throw Error(
            `Validation failed. Relationship column '${tableName}.${columnName}' uses a column that does not exist. Got '${column.referenceTable}.${column.referenceColumn}', expected one of [${usedTableColumns.map((c) => `'${usedTable[0]}.${c}'`).join(", ")}].`
          );
        }
        if (!isReferenceColumn(usedColumn[1])) {
          const foreignKeyColumnNames = usedTableColumns.filter(
            ([, c]) => isReferenceColumn(c)
          );
          throw Error(
            `Validation failed. Relationship column '${tableName}.${columnName}' uses a column that is not foreign key column. Got '${column.referenceTable}.${column.referenceColumn}', expected one of [${foreignKeyColumnNames.map((c) => `'${usedTable[0]}.${c}'`).join(", ")}].`
          );
        }
      }
      if (isEnumColumn(column)) {
        const referencedEnum = Object.entries(schema.enums).find(
          ([enumName]) => enumName === column.type
        );
        if (referencedEnum === void 0) {
          throw Error(
            `Validation failed: Enum column '${tableName}.${columnName}' doesn't reference a valid enum. Got '${column.type}', expected one of [${Object.keys(schema.enums).map((e) => `'${e}'`).join(", ")}].`
          );
        }
      }
      if (isReferenceColumn(column)) {
        const referencedTable = Object.entries(schema.tables).find(
          ([tableName2]) => tableName2 === referencedTableName(column.references)
        );
        if (referencedTable === void 0) {
          throw Error(
            `Validation failed: Foreign key column '${tableName}.${columnName}' does not reference a valid ID column. Got '${column.references}', expected one of [${Object.keys(schema.tables).map((t) => `'${t}.id'`).join(", ")}].`
          );
        }
        if (referencedTable[1].id.type !== column.type) {
          throw Error(
            `Validation failed: Foreign key column '${tableName}.${columnName}' type does not match the referenced table's ID column type. Got '${column.type}', expected '${referencedTable[1].id.type}'.`
          );
        }
      }
    });
  });
  return { schema };
};
var validateTableOrColumnName = (key, type) => {
  if (key === "")
    throw Error(`Validation failed: ${type} name can't be an empty string.`);
  if (!/^[a-z|A-Z|0-9]+$/.test(key))
    throw Error(
      `Validation failed: ${type} name '${key}' contains an invalid character.`
    );
};
function safeBuildSchema({ schema }) {
  try {
    const result = buildSchema({ schema });
    return { success: true, data: result };
  } catch (error_) {
    const error = error_;
    error.stack = void 0;
    return { success: false, error };
  }
}

// src/server/graphql/schema.ts
import {
  GraphQLBoolean as GraphQLBoolean2,
  GraphQLFloat,
  GraphQLInt as GraphQLInt4,
  GraphQLObjectType as GraphQLObjectType3,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString as GraphQLString3
} from "graphql";

// src/utils/checkpoint.ts
var BLOCK_TIMESTAMP_DIGITS = 10;
var CHAIN_ID_DIGITS = 16;
var BLOCK_NUMBER_DIGITS = 16;
var EXECUTION_INDEX_DIGITS = 16;
var encodeCheckpoint = (checkpoint) => {
  const { blockTimestamp, chainId, blockNumber, logIndex } = checkpoint;
  const result = blockTimestamp.toString().padStart(BLOCK_TIMESTAMP_DIGITS, "0") + chainId.toString().padStart(CHAIN_ID_DIGITS, "0") + blockNumber.toString().padStart(BLOCK_NUMBER_DIGITS, "0") + (logIndex !== void 0 ? logIndex.toString().padStart(EXECUTION_INDEX_DIGITS, "0") : "9".repeat(EXECUTION_INDEX_DIGITS));
  if (result.length !== BLOCK_TIMESTAMP_DIGITS + CHAIN_ID_DIGITS + BLOCK_NUMBER_DIGITS + EXECUTION_INDEX_DIGITS)
    throw new Error(`Invalid stringified checkpoint: ${result}`);
  return result;
};
var zeroCheckpoint = {
  blockTimestamp: 0,
  chainId: 0,
  blockNumber: 0,
  logIndex: 0
};
var maxCheckpoint = {
  blockTimestamp: 9999999999,
  chainId: 2147483647,
  blockNumber: 9999999999,
  logIndex: 2147483647
};
var isCheckpointEqual = (a, b) => {
  return a.blockTimestamp === b.blockTimestamp && a.chainId === b.chainId && a.blockNumber === b.blockNumber && (a.logIndex === void 0 && b.logIndex === void 0 || a.logIndex === b.logIndex);
};
var isCheckpointGreaterThan = (a, b) => {
  if (a.blockTimestamp !== b.blockTimestamp)
    return a.blockTimestamp > b.blockTimestamp;
  if (a.chainId !== b.chainId)
    return a.chainId > b.chainId;
  if (a.blockNumber !== b.blockNumber)
    return a.blockNumber > b.blockNumber;
  if (a.logIndex !== void 0 && b.logIndex !== void 0) {
    return a.logIndex > b.logIndex;
  }
  if (a.logIndex === void 0 && b.logIndex === void 0) {
    return false;
  }
  if (a.logIndex === void 0)
    return true;
  else
    return false;
};
var isCheckpointGreaterThanOrEqualTo = (a, b) => {
  return isCheckpointGreaterThan(a, b) || isCheckpointEqual(a, b);
};
var checkpointMax = (...checkpoints) => checkpoints.reduce((max, checkpoint) => {
  return isCheckpointGreaterThan(checkpoint, max) ? checkpoint : max;
});
var checkpointMin = (...checkpoints) => checkpoints.reduce((min, checkpoint) => {
  return isCheckpointGreaterThan(min, checkpoint) ? checkpoint : min;
});

// src/server/graphql/entity.ts
import { GraphQLBoolean } from "graphql";
import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from "graphql";
var GraphQLPageInfo = new GraphQLObjectType({
  name: "PageInfo",
  fields: {
    hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    hasPreviousPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString }
  }
});
var buildEntityTypes = ({ schema }) => {
  const enumTypes = {};
  const entityTypes = {};
  const entityPageTypes = {};
  for (const [enumName, _enum] of Object.entries(schema.enums)) {
    enumTypes[enumName] = new GraphQLEnumType({
      name: enumName,
      values: _enum.reduce(
        (acc, cur) => ({ ...acc, [cur]: {} }),
        {}
      )
    });
  }
  for (const [tableName, table] of Object.entries(schema.tables)) {
    entityTypes[tableName] = new GraphQLObjectType({
      name: tableName,
      fields: () => {
        const fieldConfigMap = {};
        Object.entries(table).forEach(([columnName, column]) => {
          if (isOneColumn(column)) {
            const referenceColumn = table[column.referenceColumn];
            const referencedTable = referencedTableName(
              referenceColumn.references
            );
            const resolver = async (parent, _args, context) => {
              const { store } = context;
              const relatedRecordId = parent[column.referenceColumn];
              if (relatedRecordId === null || relatedRecordId === void 0)
                return null;
              return await store.findUnique({
                tableName: referencedTable,
                id: relatedRecordId
              });
            };
            fieldConfigMap[columnName] = {
              type: referenceColumn.optional ? entityTypes[referencedTable] : new GraphQLNonNull(entityTypes[referencedTable]),
              resolve: resolver
            };
          } else if (isManyColumn(column)) {
            const resolver = async (parent, args, context) => {
              const { store } = context;
              const {
                timestamp,
                where,
                orderBy,
                orderDirection,
                limit,
                after,
                before
              } = args;
              const entityId = parent.id;
              const checkpoint = timestamp ? { ...maxCheckpoint, blockTimestamp: timestamp } : void 0;
              const whereObject = where ? buildWhereObject({ where }) : {};
              whereObject[column.referenceColumn] = entityId;
              const orderByObject = orderBy ? { [orderBy]: orderDirection || "asc" } : void 0;
              return await store.findMany({
                tableName: column.referenceTable,
                checkpoint,
                where: whereObject,
                orderBy: orderByObject,
                limit,
                before,
                after
              });
            };
            fieldConfigMap[columnName] = {
              type: entityPageTypes[column.referenceTable],
              args: {
                timestamp: { type: GraphQLInt },
                orderBy: { type: GraphQLString },
                orderDirection: { type: GraphQLString },
                before: { type: GraphQLString },
                after: { type: GraphQLString },
                limit: { type: GraphQLInt }
              },
              resolve: resolver
            };
          } else {
            const type = isEnumColumn(column) ? enumTypes[column.type] : tsTypeToGqlScalar[column.type];
            if (column.list) {
              const listType = new GraphQLList(new GraphQLNonNull(type));
              fieldConfigMap[columnName] = {
                type: column.optional ? listType : new GraphQLNonNull(listType)
              };
            } else {
              fieldConfigMap[columnName] = {
                type: column.optional ? type : new GraphQLNonNull(type)
              };
            }
          }
        });
        return fieldConfigMap;
      }
    });
    entityPageTypes[tableName] = new GraphQLObjectType({
      name: `${tableName}Page`,
      fields: () => ({
        items: {
          type: new GraphQLList(new GraphQLNonNull(entityTypes[tableName]))
        },
        pageInfo: { type: GraphQLPageInfo }
      })
    });
  }
  return { entityTypes, entityPageTypes, enumTypes };
};
var graphqlFilterToStoreCondition = {
  "": "equals",
  not: "not",
  in: "in",
  not_in: "notIn",
  has: "has",
  not_has: "notHas",
  gt: "gt",
  lt: "lt",
  gte: "gte",
  lte: "lte",
  contains: "contains",
  not_contains: "notContains",
  starts_with: "startsWith",
  not_starts_with: "notStartsWith",
  ends_with: "endsWith",
  not_ends_with: "notEndsWith"
};
function buildWhereObject({ where }) {
  const whereObject = {};
  Object.entries(where).forEach(([whereKey, rawValue]) => {
    const [fieldName, condition_] = whereKey.split(/_(.*)/s);
    const condition = condition_ === void 0 ? "" : condition_;
    const storeCondition = graphqlFilterToStoreCondition[condition];
    if (!storeCondition) {
      throw new Error(
        `Invalid query: Unknown where condition: ${fieldName}_${condition}`
      );
    }
    whereObject[fieldName] = { [storeCondition]: rawValue };
  });
  return whereObject;
}

// src/server/graphql/plural.ts
import {
  GraphQLInputObjectType,
  GraphQLInt as GraphQLInt2,
  GraphQLList as GraphQLList2,
  GraphQLString as GraphQLString2
} from "graphql";
var operators = {
  universal: ["", "_not"],
  singular: ["_in", "_not_in"],
  plural: ["_has", "_not_has"],
  numeric: ["_gt", "_lt", "_gte", "_lte"],
  string: [
    "_contains",
    "_not_contains",
    "_starts_with",
    "_ends_with",
    "_not_starts_with",
    "_not_ends_with"
  ]
};
var buildPluralField = ({
  tableName,
  table,
  entityPageType,
  enumTypes
}) => {
  const filterFields = {};
  Object.entries(table).forEach(([columnName, column]) => {
    if (isOneColumn(column))
      return;
    if (isManyColumn(column))
      return;
    const type = isEnumColumn(column) ? enumTypes[column.type] : tsTypeToGqlScalar[column.type];
    if (column.list) {
      operators.universal.forEach((suffix) => {
        filterFields[`${columnName}${suffix}`] = {
          type: new GraphQLList2(type)
        };
      });
      operators.plural.forEach((suffix) => {
        filterFields[`${columnName}${suffix}`] = {
          type
        };
      });
    } else {
      operators.universal.forEach((suffix) => {
        filterFields[`${columnName}${suffix}`] = {
          type
        };
      });
      operators.singular.forEach((suffix) => {
        filterFields[`${columnName}${suffix}`] = {
          type: new GraphQLList2(type)
        };
      });
      if (["int", "bigint", "float", "hex"].includes(column.type)) {
        operators.numeric.forEach((suffix) => {
          filterFields[`${columnName}${suffix}`] = {
            type
          };
        });
      }
      if ("string" === column.type) {
        operators.string.forEach((suffix) => {
          filterFields[`${columnName}${suffix}`] = {
            type
          };
        });
      }
    }
  });
  const filterType = new GraphQLInputObjectType({
    name: `${tableName}Filter`,
    fields: filterFields
  });
  const resolver = async (_, args, context) => {
    const { store } = context;
    const { timestamp, where, orderBy, orderDirection, before, limit, after } = args;
    const checkpoint = timestamp ? { ...maxCheckpoint, blockTimestamp: timestamp } : void 0;
    const whereObject = where ? buildWhereObject2({ where }) : {};
    const orderByObject = orderBy ? { [orderBy]: orderDirection || "asc" } : void 0;
    return await store.findMany({
      tableName,
      checkpoint,
      where: whereObject,
      orderBy: orderByObject,
      limit,
      before,
      after
    });
  };
  return {
    type: entityPageType,
    args: {
      timestamp: { type: GraphQLInt2 },
      where: { type: filterType },
      orderBy: { type: GraphQLString2 },
      orderDirection: { type: GraphQLString2 },
      before: { type: GraphQLString2 },
      after: { type: GraphQLString2 },
      limit: { type: GraphQLInt2 }
    },
    resolve: resolver
  };
};
var graphqlFilterToStoreCondition2 = {
  "": "equals",
  not: "not",
  in: "in",
  not_in: "notIn",
  has: "has",
  not_has: "notHas",
  gt: "gt",
  lt: "lt",
  gte: "gte",
  lte: "lte",
  contains: "contains",
  not_contains: "notContains",
  starts_with: "startsWith",
  not_starts_with: "notStartsWith",
  ends_with: "endsWith",
  not_ends_with: "notEndsWith"
};
function buildWhereObject2({ where }) {
  const whereObject = {};
  Object.entries(where).forEach(([whereKey, rawValue]) => {
    const [fieldName, condition_] = whereKey.split(/_(.*)/s);
    const condition = condition_ === void 0 ? "" : condition_;
    const storeCondition = graphqlFilterToStoreCondition2[condition];
    if (!storeCondition) {
      throw new Error(
        `Invalid query: Unknown where condition: ${fieldName}_${condition}`
      );
    }
    whereObject[fieldName] = { [storeCondition]: rawValue };
  });
  return whereObject;
}

// src/server/graphql/singular.ts
import {
  GraphQLInt as GraphQLInt3,
  GraphQLNonNull as GraphQLNonNull2
} from "graphql";
var buildSingularField = ({
  tableName,
  table,
  entityType
}) => {
  const resolver = async (_, args, context) => {
    const { store } = context;
    const { id, timestamp } = args;
    if (id === void 0)
      return null;
    const checkpoint = timestamp ? { ...maxCheckpoint, blockTimestamp: timestamp } : void 0;
    const entityInstance = await store.findUnique({
      tableName,
      id,
      checkpoint
    });
    return entityInstance;
  };
  return {
    type: entityType,
    args: {
      id: {
        type: new GraphQLNonNull2(
          tsTypeToGqlScalar[table.id.type]
        )
      },
      timestamp: { type: GraphQLInt3 }
    },
    resolve: resolver
  };
};

// src/server/graphql/schema.ts
var GraphQLBigInt = new GraphQLScalarType({
  name: "BigInt",
  serialize: (value) => String(value),
  // TODO: Kyle this cast is probably a bad idea.
  parseValue: (value) => BigInt(value),
  parseLiteral: (value) => {
    if (value.kind === "StringValue") {
      return BigInt(value.value);
    } else {
      throw new Error(
        `Invalid value kind provided for field of type BigInt: ${value.kind}. Expected: StringValue`
      );
    }
  }
});
var tsTypeToGqlScalar = {
  int: GraphQLInt4,
  float: GraphQLFloat,
  string: GraphQLString3,
  boolean: GraphQLBoolean2,
  bigint: GraphQLBigInt,
  hex: GraphQLString3
};
var buildGqlSchema = (schema) => {
  const queryFields = {};
  const { entityTypes, entityPageTypes, enumTypes } = buildEntityTypes({
    schema
  });
  for (const [tableName, table] of Object.entries(schema.tables)) {
    const entityType = entityTypes[tableName];
    const entityPageType = entityPageTypes[tableName];
    const singularFieldName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    queryFields[singularFieldName] = buildSingularField({
      tableName,
      table,
      entityType
    });
    const pluralFieldName = `${singularFieldName}s`;
    queryFields[pluralFieldName] = buildPluralField({
      table,
      tableName,
      entityPageType,
      enumTypes
    });
  }
  const queryType = new GraphQLObjectType3({
    name: "Query",
    fields: queryFields
  });
  const gqlSchema = new GraphQLSchema({
    query: queryType
  });
  return gqlSchema;
};

// src/utils/emittery.ts
import { E_CANCELED, Mutex } from "async-mutex";
import _Emittery from "emittery";
var Emittery = class extends _Emittery {
  listenerMutexes = /* @__PURE__ */ new Map();
  onSerial(eventName, listener) {
    if (!this.listenerMutexes.has(eventName))
      this.listenerMutexes.set(eventName, /* @__PURE__ */ new Map());
    if (this.listenerMutexes.get(eventName).has(listener))
      return this.listenerMutexes.get(eventName).get(listener).unsubscribe;
    const innerListener = async (eventData) => {
      const eventMutex = this.listenerMutexes.get(eventName).get(listener);
      eventMutex.latestEventData = eventData;
      try {
        await eventMutex.mutex.runExclusive(async () => {
          if (eventMutex.latestEventData === void 0)
            return;
          const toProcess = eventMutex.latestEventData;
          eventMutex.latestEventData = void 0;
          await listener(toProcess);
        });
      } catch (error) {
        if (error !== E_CANCELED)
          throw error;
      }
    };
    const unsubscribe = super.on(eventName, innerListener);
    this.listenerMutexes.get(eventName).set(listener, {
      mutex: new Mutex(),
      latestEventData: void 0,
      unsubscribe
    });
    return unsubscribe;
  }
  cancelMutexes() {
    for (const [, listenerMap] of this.listenerMutexes) {
      for (const [, { mutex }] of listenerMap) {
        mutex.cancel();
      }
    }
  }
};

// src/build/service.ts
import { glob } from "glob";
import "graphql";
import { createServer } from "vite";
import { ViteNodeRunner } from "vite-node/client";
import { ViteNodeServer } from "vite-node/server";
import { installSourcemapsSupport } from "vite-node/source-map";
import { normalizeModuleId, toFilePath } from "vite-node/utils";
import viteTsconfigPathsPlugin from "vite-tsconfig-paths";

// src/config/abi.ts
import { formatAbiItem } from "abitype";
import {
  encodeEventTopics,
  getAbiItem,
  getEventSelector,
  parseAbiItem
} from "viem";

// src/utils/duplicates.ts
function getDuplicateElements(arr) {
  const uniqueElements = /* @__PURE__ */ new Set();
  const duplicates = /* @__PURE__ */ new Set();
  arr.forEach((element) => {
    if (uniqueElements.has(element)) {
      duplicates.add(element);
    } else {
      uniqueElements.add(element);
    }
  });
  return duplicates;
}

// src/config/abi.ts
var buildAbiEvents = ({ abi }) => {
  const abiEvents = abi.filter((item) => item.type === "event").filter((item) => item.anonymous === void 0 || item.anonymous === false);
  const overloadedEventNames = getDuplicateElements(
    abiEvents.map((item) => item.name)
  );
  return abiEvents.reduce(
    (acc, item) => {
      const signature = formatAbiItem(item);
      const safeName = overloadedEventNames.has(item.name) ? signature.split("event ")[1] : item.name;
      const selector = getEventSelector(item);
      const abiEventMeta = { safeName, signature, selector, item };
      acc.bySafeName[safeName] = abiEventMeta;
      acc.bySelector[selector] = abiEventMeta;
      return acc;
    },
    { bySafeName: {}, bySelector: {} }
  );
};
function buildTopics(abi, filter) {
  if (Array.isArray(filter.event)) {
    return [
      filter.event.map((event) => getEventSelector(findAbiEvent(abi, event)))
    ];
  } else {
    return encodeEventTopics({
      abi: [findAbiEvent(abi, filter.event)],
      args: filter.args
    });
  }
}
var findAbiEvent = (abi, eventName) => {
  if (eventName.includes("(")) {
    return parseAbiItem(`event ${eventName}`);
  } else {
    return getAbiItem({ abi, name: eventName });
  }
};

// src/config/factories.ts
import { getEventSelector as getEventSelector2 } from "viem";

// src/utils/lowercase.ts
function toLowerCase(value) {
  return value.toLowerCase();
}

// src/utils/offset.ts
import { InvalidAbiDecodingTypeError } from "viem";
function getBytesConsumedByParam(param) {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, innerType] = arrayComponents;
    if (!length || hasDynamicChild(param)) {
      return 32;
    }
    const bytesConsumedByInnerType = getBytesConsumedByParam({
      ...param,
      type: innerType
    });
    return length * bytesConsumedByInnerType;
  }
  if (param.type === "tuple") {
    if (hasDynamicChild(param)) {
      return 32;
    }
    let consumed = 0;
    for (const component of param.components ?? []) {
      consumed += getBytesConsumedByParam(component);
    }
    return consumed;
  }
  if (param.type === "string" || param.type.startsWith("bytes") || param.type.startsWith("uint") || param.type.startsWith("int") || param.type === "address" || param.type === "bool") {
    return 32;
  }
  throw new InvalidAbiDecodingTypeError(param.type, {
    docsPath: "/docs/contract/decodeAbiParameters"
  });
}
function hasDynamicChild(param) {
  const { type } = param;
  if (type === "string")
    return true;
  if (type === "bytes")
    return true;
  if (type.endsWith("[]"))
    return true;
  if (type === "tuple")
    return param.components?.some(hasDynamicChild);
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents && hasDynamicChild({ ...param, type: arrayComponents[1] }))
    return true;
  return false;
}
function getArrayComponents(type) {
  const matches = type.match(/^(.*)\[(\d+)?\]$/);
  return matches ? (
    // Return `null` if the array is dynamic.
    [matches[2] ? Number(matches[2]) : null, matches[1]]
  ) : void 0;
}

// src/config/factories.ts
function buildFactoryCriteria({
  address: _address,
  event,
  parameter
}) {
  const address = toLowerCase(_address);
  const eventSelector = getEventSelector2(event);
  const indexedInputPosition = event.inputs.filter((x) => "indexed" in x && x.indexed).findIndex((input) => input.name === parameter);
  if (indexedInputPosition > -1) {
    return {
      address,
      eventSelector,
      // Add 1 because inputs will not contain an element for topic0 (the signature).
      childAddressLocation: `topic${indexedInputPosition + 1}`
    };
  }
  const nonIndexedInputs = event.inputs.filter(
    (x) => !("indexed" in x && x.indexed)
  );
  const nonIndexedInputPosition = nonIndexedInputs.findIndex(
    (input) => input.name === parameter
  );
  if (nonIndexedInputPosition === -1) {
    throw new Error(
      `Factory event parameter not found in factory event signature. Got '${parameter}', expected one of [${event.inputs.map((i) => `'${i.name}'`).join(", ")}].`
    );
  }
  let offset = 0;
  for (let i = 0; i < nonIndexedInputPosition; i++) {
    offset += getBytesConsumedByParam(nonIndexedInputs[i]);
  }
  return {
    address,
    eventSelector,
    childAddressLocation: `offset${offset}`
  };
}

// src/utils/chains.ts
import * as _chains from "viem/chains";
var chains = _chains;

// src/config/networks.ts
function getDefaultMaxBlockRange({
  chainId,
  rpcUrls
}) {
  let maxBlockRange;
  switch (chainId) {
    case 1:
    case 3:
    case 4:
    case 5:
    case 42:
    case 11155111:
      maxBlockRange = 2e3;
      break;
    case 10:
    case 420:
      maxBlockRange = 5e4;
      break;
    case 137:
    case 80001:
      maxBlockRange = 5e4;
      break;
    case 42161:
    case 421613:
      maxBlockRange = 5e4;
      break;
    default:
      maxBlockRange = 5e4;
  }
  const isQuickNode = rpcUrls.filter((url) => url !== void 0).some((url) => url.includes("quiknode"));
  const isCloudflare = rpcUrls.filter((url) => url !== void 0).some((url) => url.includes("cloudflare-eth"));
  if (isQuickNode) {
    maxBlockRange = Math.min(maxBlockRange, 1e4);
  } else if (isCloudflare) {
    maxBlockRange = Math.min(maxBlockRange, 800);
  }
  return maxBlockRange;
}
function getFinalityBlockCount({ chainId }) {
  let finalityBlockCount;
  switch (chainId) {
    case 1:
    case 3:
    case 4:
    case 5:
    case 42:
    case 11155111:
      finalityBlockCount = 32;
      break;
    case 10:
    case 420:
      finalityBlockCount = 5;
      break;
    case 137:
    case 80001:
      finalityBlockCount = 100;
      break;
    case 42161:
    case 421613:
      finalityBlockCount = 40;
      break;
    case 7777777:
      finalityBlockCount = 5;
      break;
    default:
      finalityBlockCount = 5;
  }
  return finalityBlockCount;
}
async function getRpcUrlsForClient(parameters) {
  const { config, value } = parameters.transport({
    chain: parameters.chain,
    pollingInterval: 4e3
    // default viem value
  });
  const transport = { ...config, ...value };
  async function getRpcUrlsForTransport(transport2) {
    switch (transport2.type) {
      case "http": {
        return [transport2.url ?? parameters.chain.rpcUrls.default.http[0]];
      }
      case "webSocket": {
        try {
          const socket = await transport2.getSocket();
          return [socket.url];
        } catch (e) {
          const symbol = Object.getOwnPropertySymbols(e).find(
            (symbol2) => symbol2.toString() === "Symbol(kTarget)"
          );
          if (!symbol)
            return [];
          const url = e[symbol]?._url;
          if (!url)
            return [];
          return [url.replace(/\/$/, "")];
        }
      }
      case "fallback": {
        const fallbackTransports = transport2.transports.map((t) => ({
          ...t.config,
          ...t.value
        }));
        const urls = [];
        for (const fallbackTransport of fallbackTransports) {
          urls.push(...await getRpcUrlsForTransport(fallbackTransport));
        }
        return urls;
      }
      default: {
        return [];
      }
    }
  }
  return getRpcUrlsForTransport(transport);
}
var publicRpcUrls = void 0;
function isRpcUrlPublic(rpcUrl) {
  if (rpcUrl === void 0)
    return true;
  if (!publicRpcUrls) {
    publicRpcUrls = Object.values(chains).reduce((acc, chain) => {
      chain.rpcUrls.default.http.forEach((httpRpcUrl) => {
        acc.add(httpRpcUrl);
      });
      (chain.rpcUrls.default.webSocket ?? []).forEach((webSocketRpcUrl) => {
        acc.add(webSocketRpcUrl);
      });
      return acc;
    }, /* @__PURE__ */ new Set());
  }
  return publicRpcUrls.has(rpcUrl);
}

// src/build/config/config.ts
async function buildNetworksAndSources({ config }) {
  const warnings = [];
  const networks = await Promise.all(
    Object.entries(config.networks).map(async ([networkName, network]) => {
      const { chainId, transport } = network;
      const defaultChain = Object.values(chains).find(
        (c) => "id" in c ? c.id === chainId : false
      ) ?? chains.mainnet;
      const chain = { ...defaultChain, name: networkName, id: chainId };
      const rpcUrls = await getRpcUrlsForClient({ transport, chain });
      rpcUrls.forEach((rpcUrl) => {
        if (isRpcUrlPublic(rpcUrl)) {
          warnings.push(
            `Network '${networkName}' is using a public RPC URL (${rpcUrl}). Most apps require an RPC URL with a higher rate limit.`
          );
        }
      });
      return {
        name: networkName,
        chainId,
        chain,
        transport: network.transport({ chain }),
        maxRequestsPerSecond: network.maxRequestsPerSecond ?? 50,
        pollingInterval: network.pollingInterval ?? 1e3,
        defaultMaxBlockRange: getDefaultMaxBlockRange({ chainId, rpcUrls }),
        finalityBlockCount: getFinalityBlockCount({ chainId }),
        maxHistoricalTaskConcurrency: 20
      };
    })
  );
  const sources = Object.entries(config.contracts).flatMap(([contractName, contract]) => {
    if (contract.network === null || contract.network === void 0) {
      throw new Error(
        `Validation failed: Network for contract '${contractName}' is null or undefined. Expected one of [${networks.map((n) => `'${n.name}'`).join(", ")}].`
      );
    }
    if (typeof contract.network === "string") {
      return {
        id: `${contractName}_${contract.network}`,
        contractName,
        networkName: contract.network,
        abi: contract.abi,
        address: "address" in contract ? contract.address : void 0,
        factory: "factory" in contract ? contract.factory : void 0,
        filter: contract.filter,
        startBlock: contract.startBlock ?? 0,
        endBlock: contract.endBlock,
        maxBlockRange: contract.maxBlockRange
      };
    }
    return Object.entries(contract.network).filter((n) => !!n[1]).map(([networkName, overrides]) => ({
      id: `${contractName}_${networkName}`,
      contractName,
      networkName,
      abi: contract.abi,
      address: ("address" in overrides ? overrides?.address : void 0) ?? ("address" in contract ? contract.address : void 0),
      factory: ("factory" in overrides ? overrides.factory : void 0) ?? ("factory" in contract ? contract.factory : void 0),
      filter: overrides.filter ?? contract.filter,
      startBlock: overrides.startBlock ?? contract.startBlock ?? 0,
      endBlock: overrides.endBlock ?? contract.endBlock,
      maxBlockRange: overrides.maxBlockRange ?? contract.maxBlockRange
    }));
  }).map((rawContract) => {
    const network = networks.find((n) => n.name === rawContract.networkName);
    if (!network) {
      throw new Error(
        `Validation failed: Invalid network for contract '${rawContract.contractName}'. Got '${rawContract.networkName}', expected one of [${networks.map((n) => `'${n.name}'`).join(", ")}].`
      );
    }
    const abiEvents = buildAbiEvents({ abi: rawContract.abi });
    let topics = void 0;
    if (rawContract.filter !== void 0) {
      if (Array.isArray(rawContract.filter.event) && rawContract.filter.args !== void 0) {
        throw new Error(
          `Validation failed: Event filter for contract '${rawContract.contractName}' cannot contain indexed argument values if multiple events are provided.`
        );
      }
      const filterSafeEventNames = Array.isArray(rawContract.filter.event) ? rawContract.filter.event : [rawContract.filter.event];
      for (const filterSafeEventName of filterSafeEventNames) {
        const abiEvent = abiEvents.bySafeName[filterSafeEventName];
        if (!abiEvent) {
          throw new Error(
            `Validation failed: Invalid filter for contract '${rawContract.contractName}'. Got event name '${filterSafeEventName}', expected one of [${Object.keys(
              abiEvents.bySafeName
            ).map((n) => `'${n}'`).join(", ")}].`
          );
        }
      }
      topics = buildTopics(rawContract.abi, rawContract.filter);
    }
    const baseContract = {
      id: rawContract.id,
      contractName: rawContract.contractName,
      networkName: rawContract.networkName,
      chainId: network.chainId,
      abi: rawContract.abi,
      abiEvents,
      startBlock: rawContract.startBlock,
      endBlock: rawContract.endBlock,
      maxBlockRange: rawContract.maxBlockRange
    };
    const resolvedFactory = rawContract?.factory;
    const resolvedAddress = rawContract?.address;
    if (resolvedFactory !== void 0 && resolvedAddress !== void 0) {
      throw new Error(
        `Validation failed: Contract '${baseContract.contractName}' cannot specify both 'factory' and 'address' options.`
      );
    }
    if (resolvedFactory) {
      const factoryCriteria = buildFactoryCriteria(resolvedFactory);
      return {
        ...baseContract,
        type: "factory",
        criteria: { ...factoryCriteria, topics }
      };
    }
    const validatedAddress = Array.isArray(resolvedAddress) ? resolvedAddress.map((r) => toLowerCase(r)) : resolvedAddress ? toLowerCase(resolvedAddress) : void 0;
    if (validatedAddress !== void 0) {
      for (const address of Array.isArray(validatedAddress) ? validatedAddress : [validatedAddress]) {
        if (!address.startsWith("0x"))
          throw new Error(
            `Validation failed: Invalid prefix for address '${address}'. Got '${address.slice(
              0,
              2
            )}', expected '0x'.`
          );
        if (address.length !== 42)
          throw new Error(
            `Validation failed: Invalid length for address '${address}'. Got ${address.length}, expected 42 characters.`
          );
      }
    }
    return {
      ...baseContract,
      type: "logFilter",
      criteria: {
        address: validatedAddress,
        topics
      }
    };
  });
  return { networks, sources, warnings };
}
async function safeBuildNetworksAndSources({
  config
}) {
  try {
    const result = await buildNetworksAndSources({ config });
    return { success: true, data: result };
  } catch (error_) {
    const error = error_;
    error.stack = void 0;
    return { success: false, error };
  }
}

// src/build/functions/functions.ts
function buildIndexingFunctions({
  rawIndexingFunctions
}) {
  const warnings = [];
  let indexingFunctionCount = 0;
  const indexingFunctions = {};
  for (const fileFns of Object.values(rawIndexingFunctions)) {
    for (const { name: eventKey, fn } of fileFns) {
      const eventNameComponents = eventKey.split(":");
      const [sourceName, eventName] = eventNameComponents;
      if (eventNameComponents.length !== 2 || !sourceName || !eventName) {
        throw new Error(
          `Validation failed: Invalid event '${eventKey}', expected format '{contractName}:{eventName}'.`
        );
      }
      indexingFunctions[sourceName] ||= {};
      if (eventName in indexingFunctions[sourceName]) {
        throw new Error(
          `Validation failed: Multiple indexing functions registered for event '${eventKey}'.`
        );
      }
      indexingFunctions[sourceName][eventName] = fn;
      indexingFunctionCount += 1;
    }
  }
  if (indexingFunctionCount === 0) {
    warnings.push("No indexing functions were registered.");
  }
  return { indexingFunctions, warnings };
}
function safeBuildIndexingFunctions({
  rawIndexingFunctions
}) {
  try {
    const result = buildIndexingFunctions({ rawIndexingFunctions });
    return { success: true, data: result };
  } catch (error_) {
    const error = error_;
    error.stack = void 0;
    return { success: false, error };
  }
}

// src/build/functions/parseAst.ts
import fs from "node:fs";
import path from "node:path";
import { js, ts } from "@ast-grep/napi";
var ormFunctions = {
  create: ["write"],
  update: ["read", "write"],
  upsert: ["read", "write"],
  delete: ["write"],
  findUnique: ["read"],
  findMany: ["read"],
  createMany: ["write"],
  updateMany: ["read", "write"]
};
var getEventSignature = (node) => {
  return node.getMatch("NAME")?.text();
};
var parseTableReference = (node, tableNames) => {
  const _table = node.getMatch("TABLE").text().split(".");
  const table = _table.length === 1 ? _table[0] : _table[_table.length - 1];
  const isIncluded = tableNames.includes(table);
  return isIncluded ? table : null;
};
var findAllORMCalls = (root) => {
  return Object.keys(ormFunctions).map((ormf) => ({
    method: ormf,
    nodes: root.findAll(`$TABLE.${ormf}($_)`)
  }));
};
var helperFunctionName = (node) => {
  const arrowFuncAncestor = node.ancestors().filter((n) => n.kind() === "arrow_function");
  const arrowFuncName = arrowFuncAncestor.map(
    (f) => f.prevAll().find((a) => a.kind() === "identifier")?.text()
  );
  const funcDeclarAncestor = node.ancestors().filter((n) => n.kind() === "function_declaration");
  const funcDeclarName = funcDeclarAncestor.map(
    (f) => f.children().find((c) => c.kind() === "identifier")?.text()
  );
  return [...arrowFuncName, ...funcDeclarName].filter(
    (name) => !!name
  );
};
var parseAst = ({
  tableNames,
  filePaths
}) => {
  const tableAccessMap = [];
  const helperFunctionAccess = {};
  const addToTableAccess = (table, indexingFunctionKey, method) => {
    if (table) {
      for (const access of ormFunctions[method]) {
        tableAccessMap.push({
          table,
          indexingFunctionKey,
          access
        });
      }
    } else {
      for (const table2 of tableNames) {
        for (const access of ormFunctions[method]) {
          tableAccessMap.push({
            table: table2,
            indexingFunctionKey,
            access
          });
        }
      }
    }
  };
  for (const filePath of filePaths) {
    const file = fs.readFileSync(filePath).toString();
    const isJs = path.extname(filePath) === ".js";
    const ast = isJs ? js.parse(file) : ts.parse(file);
    const root = ast.root();
    const ormCalls = findAllORMCalls(root);
    for (const call of ormCalls) {
      for (const node of call.nodes) {
        const helperNames = helperFunctionName(node);
        const table = parseTableReference(node, tableNames);
        for (const helperName of helperNames) {
          if (helperFunctionAccess[helperName] === void 0) {
            helperFunctionAccess[helperName] = [];
          }
          helperFunctionAccess[helperName].push({
            table,
            method: call.method,
            filePath
          });
        }
      }
    }
  }
  for (const filePath of filePaths) {
    const file = fs.readFileSync(filePath).toString();
    const isJs = path.extname(filePath) === ".js";
    const ast = isJs ? js.parse(file) : ts.parse(file);
    const root = ast.root();
    const nodes = root.findAll('ponder.on("$NAME", $FUNC)').concat(root.findAll("ponder.on('$NAME', $FUNC)")).concat(root.findAll("ponder.on(`$NAME`, $FUNC)"));
    for (const node of nodes) {
      const indexingFunctionKey = getEventSignature(node);
      const funcNode = node.getMatch("FUNC");
      const ormCalls = findAllORMCalls(funcNode);
      for (const [name, helperFunctionState] of Object.entries(
        helperFunctionAccess
      )) {
        if (funcNode.find(`${name}`) !== null) {
          for (const state of helperFunctionState) {
            addToTableAccess(state.table, indexingFunctionKey, state.method);
          }
        }
      }
      for (const call of ormCalls) {
        for (const n of call.nodes) {
          const table = parseTableReference(n, tableNames);
          addToTableAccess(table, indexingFunctionKey, call.method);
        }
      }
    }
  }
  return tableAccessMap;
};

// src/build/plugin.ts
import MagicString from "magic-string";
var regex = /^import\s+\{[^}]*\bponder\b[^}]*\}\s+from\s+["']@\/generated["'];?.*$/gm;
var shim = `export let ponder = {
  fns: [],
  on(name, fn) {
    this.fns.push({ name, fn });
  },
};
`;
function replaceStateless(code) {
  const s = new MagicString(code);
  regex.lastIndex = 0;
  s.replace(regex, shim);
  return s;
}
var vitePluginPonder = () => {
  return {
    name: "ponder",
    transform: (code, id) => {
      if (regex.test(code)) {
        const s = replaceStateless(code);
        const transformed = s.toString();
        const sourcemap = s.generateMap({ source: id });
        return { code: transformed, map: sourcemap };
      } else {
        return null;
      }
    }
  };
};

// src/build/stacktrace.ts
import { readFileSync } from "node:fs";
import { codeFrameColumns } from "@babel/code-frame";
import { parse as parseStackTrace } from "stacktrace-parser";
var ESBuildTransformError = class extends Error {
  name = "ESBuildTransformError";
};
var ESBuildBuildError = class extends Error {
  name = "ESBuildBuildError";
};
var ESBuildContextError = class extends Error {
  name = "ESBuildContextError";
};
function parseViteNodeError(file, error) {
  let resolvedError;
  if (/^(Transform failed|Build failed|Context failed)/.test(error.message)) {
    const errorKind = error.message.split(" with ")[0];
    const innerError = error.message.split("\n").slice(1).map((message) => {
      let location = void 0;
      let detail = void 0;
      if (message.includes(": ERROR: ")) {
        const s = message.split(": ERROR: ");
        location = s[0];
        detail = s[1];
      } else {
        detail = message.slice(7);
      }
      return { location, detail };
    })[0];
    if (!innerError)
      return error;
    resolvedError = errorKind === "Transform failed" ? new ESBuildTransformError(innerError.detail) : errorKind === "Build failed" ? new ESBuildBuildError(innerError.detail) : new ESBuildContextError(innerError.detail);
    if (innerError.location)
      resolvedError.stack = `    at ${innerError.location}`;
  } else if (error.stack) {
    const stackFrames = parseStackTrace(error.stack);
    const userStackFrames = [];
    for (const rawStackFrame of stackFrames) {
      if (rawStackFrame.methodName.includes("ViteNodeRunner.runModule"))
        break;
      userStackFrames.push(rawStackFrame);
    }
    const userStack = userStackFrames.map(({ file: file2, lineNumber, column, methodName }) => {
      const prefix = "    at";
      const path10 = `${file2}${lineNumber !== null ? `:${lineNumber}` : ""}${column !== null ? `:${column}` : ""}`;
      if (methodName === null || methodName === "<unknown>") {
        return `${prefix} ${path10}`;
      } else {
        return `${prefix} ${methodName} (${path10})`;
      }
    }).join("\n");
    resolvedError = error;
    resolvedError.stack = userStack;
  } else {
    resolvedError = error;
  }
  if (resolvedError.stack) {
    const userStackFrames = parseStackTrace(resolvedError.stack);
    let codeFrame = void 0;
    for (const { file: file2, lineNumber, column } of userStackFrames) {
      if (file2 !== null && lineNumber !== null) {
        try {
          const sourceFileContents = readFileSync(file2, { encoding: "utf-8" });
          codeFrame = codeFrameColumns(
            sourceFileContents,
            { start: { line: lineNumber, column: column ?? void 0 } },
            { highlightCode: true }
          );
          break;
        } catch (err) {
        }
      }
    }
    resolvedError.stack = `${resolvedError.name}: ${resolvedError.message}
${resolvedError.stack}`;
    if (codeFrame)
      resolvedError.stack += `
${codeFrame}`;
  }
  const verb = resolvedError.name === "ESBuildTransformError" ? "transforming" : resolvedError.name === "ESBuildBuildError" || resolvedError.name === "ESBuildContextError" ? "building" : "executing";
  resolvedError.message = `Error while ${verb} ${file}: ${resolvedError.message}`;
  return resolvedError;
}

// src/build/service.ts
var BuildService = class extends Emittery {
  common;
  viteDevServer = void 0;
  viteNodeServer = void 0;
  viteNodeRunner = void 0;
  rawIndexingFunctions = {};
  // Maintain the latest version of built user code to support validation.
  // Note that `networks` and `schema` are not currently needed for validation.
  sources;
  schema;
  indexingFunctions;
  constructor({ common }) {
    super();
    this.common = common;
  }
  async setup() {
    const viteLogger = {
      warnedMessages: /* @__PURE__ */ new Set(),
      loggedErrors: /* @__PURE__ */ new WeakSet(),
      hasWarned: false,
      clearScreen() {
      },
      hasErrorLogged: (error) => viteLogger.loggedErrors.has(error),
      info: (msg) => {
        this.common.logger.trace({ service: "build(vite)", msg });
      },
      warn: (msg) => {
        viteLogger.hasWarned = true;
        this.common.logger.trace({ service: "build(vite)", msg });
      },
      warnOnce: (msg) => {
        if (viteLogger.warnedMessages.has(msg))
          return;
        viteLogger.hasWarned = true;
        this.common.logger.trace({ service: "build(vite)", msg });
        viteLogger.warnedMessages.add(msg);
      },
      error: (msg) => {
        viteLogger.hasWarned = true;
        this.common.logger.trace({ service: "build(vite)", msg });
      }
    };
    this.viteDevServer = await createServer({
      root: this.common.options.rootDir,
      cacheDir: path2.join(this.common.options.ponderDir, "vite"),
      publicDir: false,
      customLogger: viteLogger,
      server: { hmr: false },
      plugins: [viteTsconfigPathsPlugin(), vitePluginPonder()]
    });
    await this.viteDevServer.pluginContainer.buildStart({});
    this.viteNodeServer = new ViteNodeServer(this.viteDevServer);
    installSourcemapsSupport({
      getSourceMap: (source) => this.viteNodeServer.getSourceMap(source)
    });
    this.viteNodeRunner = new ViteNodeRunner({
      root: this.viteDevServer.config.root,
      fetchModule: (id) => this.viteNodeServer.fetchModule(id, "ssr"),
      resolveId: (id, importer) => this.viteNodeServer.resolveId(id, importer, "ssr")
    });
    const handleFileChange = async (files_) => {
      const files = files_.map(
        (file) => toFilePath(normalizeModuleId(file), this.common.options.rootDir).path
      );
      const invalidated = [
        ...this.viteNodeRunner.moduleCache.invalidateDepTree(files)
      ];
      this.common.logger.info({
        service: "build",
        msg: `Hot reload ${invalidated.map((f) => path2.relative(this.common.options.rootDir, f)).join(", ")}`
      });
      if (invalidated.includes(this.common.options.configFile)) {
        const configResult = await this.loadConfig();
        const validationResult = this.validate();
        if (configResult.success && validationResult.success) {
          this.emit("newConfig", configResult);
        } else {
          const error = configResult.error ?? validationResult.error;
          this.common.logger.error({ service: "build", error });
          this.emit("error", { kind: "config", error });
        }
      }
      if (invalidated.includes(this.common.options.schemaFile)) {
        const schemaResult = await this.loadSchema();
        const validationResult = this.validate();
        const analyzeResult = this.analyze();
        if (schemaResult.success && validationResult.success) {
          this.emit("newSchema", {
            ...schemaResult,
            tableAccess: analyzeResult
          });
        } else {
          const error = schemaResult.error ?? validationResult.error;
          this.common.logger.error({ service: "build", error });
          this.emit("error", { kind: "schema", error });
        }
      }
      const indexingFunctionRegex = new RegExp(
        `^${this.common.options.srcDir.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}/.*\\.(js|ts)$`
      );
      const indexingFunctionFiles = invalidated.filter(
        (file) => indexingFunctionRegex.test(file)
      );
      if (indexingFunctionFiles.length > 0) {
        const indexingFunctionsResult = await this.loadIndexingFunctions({
          files: indexingFunctionFiles
        });
        const validationResult = this.validate();
        const analyzeResult = this.analyze();
        if (indexingFunctionsResult.success && validationResult.success) {
          this.emit("newIndexingFunctions", {
            ...indexingFunctionsResult,
            tableAccess: analyzeResult
          });
        } else {
          const error = indexingFunctionsResult.error ?? validationResult.error;
          this.common.logger.error({ service: "build", error });
          this.emit("error", { kind: "indexingFunctions", error });
        }
      }
    };
    this.viteDevServer.watcher.on("change", async (file) => {
      const ignoreRegex = new RegExp(
        `^${this.common.options.ponderDir.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}/.*[^/]$`
      );
      if (ignoreRegex.test(file) || path2.join(this.common.options.generatedDir, "schema.graphql") === file || path2.join(this.common.options.rootDir, "ponder-env.d.ts") === file)
        return;
      await handleFileChange([file]);
    });
  }
  async kill() {
    this.cancelMutexes();
    await this.viteDevServer?.close();
    this.common.logger.debug({
      service: "build",
      msg: "Killed build service"
    });
  }
  async initialLoad() {
    const configResult = await this.loadConfig();
    if (!configResult.success)
      return { error: configResult.error };
    const schemaResult = await this.loadSchema();
    if (!schemaResult.success)
      return { error: schemaResult.error };
    const files = glob.sync(
      path2.join(this.common.options.srcDir, "**/*.{js,mjs,ts,mts}")
    );
    const indexingFunctionsResult = await this.loadIndexingFunctions({ files });
    if (!indexingFunctionsResult.success)
      return { error: indexingFunctionsResult.error };
    const validationResult = this.validate();
    const analyzeResult = this.analyze();
    if (!validationResult.success)
      return { error: validationResult.error };
    const { config, sources, networks } = configResult;
    const { schema, graphqlSchema } = schemaResult;
    const { indexingFunctions } = indexingFunctionsResult;
    return {
      config,
      networks,
      sources,
      schema,
      graphqlSchema,
      indexingFunctions,
      tableAccess: analyzeResult
    };
  }
  async loadConfig() {
    const loadResult = await this.executeFile(this.common.options.configFile);
    if (!loadResult.success) {
      return { success: false, error: loadResult.error };
    }
    const rawConfig = loadResult.exports.default;
    const buildResult = await safeBuildNetworksAndSources({
      config: rawConfig
    });
    if (buildResult.error) {
      return { success: false, error: buildResult.error };
    }
    for (const warning of buildResult.data.warnings) {
      this.common.logger.warn({ service: "build", msg: warning });
    }
    const { sources, networks } = buildResult.data;
    this.sources = sources;
    return { success: true, config: rawConfig, sources, networks };
  }
  async loadSchema() {
    const loadResult = await this.executeFile(this.common.options.schemaFile);
    if (loadResult.error) {
      return { success: false, error: loadResult.error };
    }
    const rawSchema = loadResult.exports.default;
    const buildResult = safeBuildSchema({ schema: rawSchema });
    if (buildResult.error) {
      return { success: false, error: buildResult.error };
    }
    const schema = buildResult.data.schema;
    this.schema = schema;
    const graphqlSchema = buildGqlSchema(buildResult.data.schema);
    return { success: true, schema, graphqlSchema };
  }
  async loadIndexingFunctions({ files }) {
    const rawLoadResults = await Promise.all(
      files.map((file) => this.executeFile(file))
    );
    const loadResultErrors = rawLoadResults.filter(
      (r) => !r.success
    );
    const loadResults = rawLoadResults.filter(
      (r) => r.success
    );
    if (loadResultErrors.length > 0) {
      return { success: false, error: loadResultErrors[0].error };
    }
    for (const result of loadResults) {
      const { file, exports } = result;
      const fns = exports?.ponder?.fns ?? [];
      (this.rawIndexingFunctions || {})[file] = fns;
    }
    const buildResult = safeBuildIndexingFunctions({
      rawIndexingFunctions: this.rawIndexingFunctions
    });
    if (!buildResult.success) {
      return { success: false, error: buildResult.error };
    }
    for (const warning of buildResult.data.warnings) {
      this.common.logger.warn({ service: "build", msg: warning });
    }
    const indexingFunctions = buildResult.data.indexingFunctions;
    this.indexingFunctions = indexingFunctions;
    return { success: true, indexingFunctions };
  }
  /**
   * Validates and builds the latest config, schema, and indexing functions.
   * Returns an error if validation fails.
   */
  validate() {
    if (!this.sources || !this.indexingFunctions)
      return { success: true };
    for (const [sourceName, fns] of Object.entries(this.indexingFunctions)) {
      for (const eventName of Object.keys(fns)) {
        const eventKey = `${sourceName}:${eventName}`;
        const source = this.sources.find((s) => s.contractName === sourceName);
        if (!source) {
          const uniqueContractNames = [
            ...new Set(this.sources.map((s) => s.contractName))
          ];
          const error = new Error(
            `Validation failed: Invalid contract name for event '${eventKey}'. Got '${sourceName}', expected one of [${uniqueContractNames.map((n) => `'${n}'`).join(", ")}].`
          );
          error.stack = void 0;
          return { success: false, error };
        }
        const eventNames = [
          ...Object.keys(source.abiEvents.bySafeName),
          "setup"
        ];
        if (!eventNames.find((e) => e === eventName)) {
          const error = new Error(
            `Validation failed: Invalid event name for event '${eventKey}'. Got '${eventName}', expected one of [${eventNames.map((eventName2) => `'${eventName2}'`).join(", ")}].`
          );
          error.stack = void 0;
          return { success: false, error };
        }
      }
    }
    return { success: true };
  }
  analyze() {
    if (!this.rawIndexingFunctions || !this.schema)
      return [];
    const tableNames = Object.keys(this.schema.tables);
    const filePaths = Object.keys(this.rawIndexingFunctions);
    const indexingFunctionKeys = Object.values(
      this.rawIndexingFunctions
    ).flatMap((indexingFunctions) => indexingFunctions.map((x) => x.name));
    const tableAccessMap = parseAst({
      tableNames,
      filePaths,
      indexingFunctionKeys
    });
    return tableAccessMap;
  }
  async executeFile(file) {
    try {
      const exports = await this.viteNodeRunner.executeFile(file);
      return { success: true, file, exports };
    } catch (error_) {
      const relativePath = path2.relative(this.common.options.rootDir, file);
      const error = parseViteNodeError(relativePath, error_);
      return { success: false, error };
    }
  }
};

// src/codegen/service.ts
import { writeFileSync } from "node:fs";
import path4 from "node:path";

// src/utils/exists.ts
import { existsSync, mkdirSync } from "node:fs";
import path3 from "node:path";
var ensureDirExists = (filePath) => {
  const dirname2 = path3.dirname(filePath);
  if (existsSync(dirname2)) {
    return;
  }
  mkdirSync(dirname2, { recursive: true });
};

// src/codegen/service.ts
import { printSchema } from "graphql";

// src/codegen/ponderEnv.ts
var ponderEnv = `// This file enables type checking and editor autocomplete for this Ponder project.
// After upgrading, you may find that changes have been made to this file.
// If this happens, please commit the changes. Do not manually edit this file.
// See https://ponder.sh/docs/guides/typescript for more information.

declare module "@/generated" {
  import type { Virtual } from "@ponder/core";

  type config = typeof import("./ponder.config.ts").default;
  type schema = typeof import("./ponder.schema.ts").default;

  export const ponder: Virtual.Registry<config, schema>;

  export type EventNames = Virtual.EventNames<config>;
  export type Event<name extends EventNames = EventNames> = Virtual.Event<
    config,
    name
  >;
  export type Context<name extends EventNames = EventNames> = Virtual.Context<
    config,
    schema,
    name
  >;
  export type IndexingFunctionArgs<name extends EventNames = EventNames> =
    Virtual.IndexingFunctionArgs<config, schema, name>;
  export type Schema = Virtual.Schema<schema>;
}
`;

// src/codegen/service.ts
var CodegenService = class extends Emittery {
  common;
  constructor({ common }) {
    super();
    this.common = common;
  }
  generatePonderEnv() {
    const filePath = path4.join(this.common.options.rootDir, "ponder-env.d.ts");
    writeFileSync(filePath, ponderEnv, "utf8");
    this.common.logger.debug({
      service: "codegen",
      msg: "Wrote new file at ponder-env.d.ts"
    });
  }
  generateGraphqlSchemaFile({
    graphqlSchema
  }) {
    const final = printSchema(graphqlSchema);
    const filePath = path4.join(
      this.common.options.generatedDir,
      "schema.graphql"
    );
    ensureDirExists(filePath);
    writeFileSync(filePath, final, "utf8");
    this.common.logger.debug({
      service: "codegen",
      msg: "Wrote new file at generated/schema.graphql"
    });
  }
};

// src/config/database.ts
import path5 from "node:path";

// src/utils/pg.ts
import pg from "pg";

// src/utils/print.ts
function prettyPrint(args) {
  const entries = Object.entries(args).map(([key, value]) => {
    if (value === void 0 || value === false)
      return null;
    const trimmedValue = typeof value === "string" && value.length > 80 ? value.slice(0, 80).concat("...") : value;
    return [key, trimmedValue];
  }).filter(Boolean);
  const maxLength = entries.reduce(
    (acc, [key]) => Math.max(acc, key.length),
    0
  );
  return entries.map(([key, value]) => `  ${`${key}:`.padEnd(maxLength + 1)}  ${value}`).join("\n");
}

// src/utils/pg.ts
pg.types.setTypeParser(pg.types.builtins.NUMERIC, BigInt);
pg.types.setTypeParser(pg.types.builtins.INT8, Number);
var originalClientQuery = pg.Client.prototype.query;
pg.Client.prototype.query = function query(...args) {
  try {
    return originalClientQuery.apply(this, args);
  } catch (error_) {
    const error = error_;
    const [statement, parameters_] = args ?? ["empty", []];
    error.name = "PostgresError";
    let parameters = parameters_ ?? [];
    parameters = parameters.length <= 25 ? parameters : parameters.slice(0, 26).concat(["..."]);
    const params = parameters.reduce(
      (acc, parameter, idx) => {
        acc[idx + 1] = parameter;
        return acc;
      },
      {}
    );
    const metaMessages = [];
    if (error.detail)
      metaMessages.push(`Detail:
  ${error.detail}`);
    metaMessages.push(`Statement:
  ${statement}`);
    metaMessages.push(`Parameters:
${prettyPrint(params)}`);
    error.meta = metaMessages.join("\n");
    throw error;
  }
};
function createPool(config) {
  return new pg.Pool({
    // https://stackoverflow.com/questions/59155572/how-to-set-query-timeout-in-relation-to-statement-timeout
    statement_timeout: 3e4,
    ...config
  });
}

// src/utils/sqlite.ts
import BetterSqlite3 from "better-sqlite3";
function improveSqliteErrors(database) {
  const originalPrepare = database.prepare;
  database.prepare = (source) => {
    const statement = originalPrepare.apply(database, [source]);
    const wrapper = (fn) => (...args) => {
      try {
        return fn.apply(statement, args);
      } catch (error_) {
        const error = error_;
        error.name = "SqliteError";
        let parameters = args[0] ?? [];
        parameters = parameters.length <= 25 ? parameters : parameters.slice(0, 26).concat(["..."]);
        const params = parameters.reduce(
          (acc, parameter, idx) => {
            acc[idx + 1] = parameter;
            return acc;
          },
          {}
        );
        const metaMessages = [];
        if (error.detail)
          metaMessages.push(`Detail:
  ${error.detail}`);
        metaMessages.push(`Statement:
  ${source}`);
        metaMessages.push(`Parameters:
${prettyPrint(params)}`);
        error.meta = metaMessages.join("\n");
        throw error;
      }
    };
    for (const method of ["run", "get", "all"]) {
      statement[method] = wrapper(statement[method]);
    }
    return statement;
  };
}
function createSqliteDatabase(file) {
  ensureDirExists(file);
  const database = new BetterSqlite3(file);
  improveSqliteErrors(database);
  database.pragma("journal_mode = WAL");
  return database;
}

// src/config/database.ts
import parse from "pg-connection-string";
var getDatabaseName = (connectionString) => {
  const parsed = parse(connectionString);
  return `${parsed.host}:${parsed.port}/${parsed.database}`;
};
var buildDatabase = ({
  common,
  config
}) => {
  const { ponderDir, rootDir } = common.options;
  const defaultStorePath = path5.join(ponderDir, "store");
  const defaultSyncFilePath = path5.join(defaultStorePath, "sync.db");
  const defaultIndexingFilePath = path5.join(defaultStorePath, "indexing.db");
  const sqlitePrintPath = path5.relative(rootDir, defaultStorePath);
  if (config.database?.kind) {
    if (config.database.kind === "postgres") {
      let connectionString2 = void 0;
      let source2 = void 0;
      if (config.database.connectionString) {
        connectionString2 = config.database.connectionString;
        source2 = "ponder.config.ts";
      } else if (process.env.DATABASE_PRIVATE_URL) {
        connectionString2 = process.env.DATABASE_PRIVATE_URL;
        source2 = "DATABASE_PRIVATE_URL env var";
      } else if (process.env.DATABASE_URL) {
        connectionString2 = process.env.DATABASE_URL;
        source2 = "DATABASE_URL env var";
      } else {
        throw new Error(
          `Invalid database configuration: "kind" is set to "postgres" but no connection string was provided.`
        );
      }
      common.logger.info({
        service: "database",
        msg: `Using Postgres database ${getDatabaseName(
          connectionString2
        )} (from ${source2})`
      });
      const pool = createPool({ connectionString: connectionString2 });
      return {
        sync: { kind: "postgres", pool },
        indexing: { kind: "postgres", pool }
      };
    }
    common.logger.info({
      service: "database",
      msg: `Using SQLite database at ${sqlitePrintPath} (from ponder.config.ts)`
    });
    return {
      sync: {
        kind: "sqlite",
        database: createSqliteDatabase(defaultSyncFilePath)
      },
      indexing: {
        kind: "sqlite",
        database: createSqliteDatabase(defaultIndexingFilePath)
      }
    };
  }
  let connectionString = void 0;
  let source = void 0;
  if (process.env.DATABASE_PRIVATE_URL) {
    connectionString = process.env.DATABASE_PRIVATE_URL;
    source = "DATABASE_PRIVATE_URL env var";
  } else if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL;
    source = "DATABASE_URL env var";
  }
  if (connectionString !== void 0) {
    const pool = createPool({ connectionString });
    common.logger.info({
      service: "database",
      msg: `Using Postgres database ${getDatabaseName(
        connectionString
      )} (from ${source})`
    });
    return {
      sync: { kind: "postgres", pool },
      indexing: { kind: "postgres", pool }
    };
  }
  common.logger.info({
    service: "database",
    msg: `Using SQLite database at ${sqlitePrintPath} (default)`
  });
  return {
    sync: {
      kind: "sqlite",
      database: createSqliteDatabase(defaultSyncFilePath)
    },
    indexing: {
      kind: "sqlite",
      database: createSqliteDatabase(defaultIndexingFilePath)
    }
  };
};

// src/config/options.ts
import path6 from "node:path";
var buildOptions = ({
  cliOptions
}) => {
  let rootDir;
  if (cliOptions.root !== void 0) {
    rootDir = path6.resolve(cliOptions.root);
  } else {
    rootDir = path6.resolve(".");
  }
  let logLevel;
  if (cliOptions.trace) {
    logLevel = "trace";
  } else if (cliOptions.v !== void 0) {
    if (Array.isArray(cliOptions.v)) {
      logLevel = "trace";
    } else {
      logLevel = "debug";
    }
  } else if (process.env.PONDER_LOG_LEVEL !== void 0 && ["silent", "fatal", "error", "warn", "info", "debug", "trace"].includes(
    process.env.PONDER_LOG_LEVEL
  )) {
    logLevel = process.env.PONDER_LOG_LEVEL;
  } else {
    logLevel = "info";
  }
  let port;
  if (cliOptions.port !== void 0) {
    port = Number(cliOptions.port);
  } else if (process.env.PORT !== void 0) {
    port = Number(process.env.PORT);
  } else {
    port = 42069;
  }
  const hostname = cliOptions.hostname;
  let maxHealthcheckDuration;
  if (process.env.RAILWAY_HEALTHCHECK_TIMEOUT_SEC) {
    const railwayTimeout = Number(process.env.RAILWAY_HEALTHCHECK_TIMEOUT_SEC);
    maxHealthcheckDuration = Math.max(railwayTimeout - 5, 0);
  } else {
    maxHealthcheckDuration = 240;
  }
  return {
    rootDir,
    configFile: path6.join(rootDir, cliOptions.config),
    schemaFile: path6.join(rootDir, "ponder.schema.ts"),
    srcDir: path6.join(rootDir, "src"),
    generatedDir: path6.join(rootDir, "generated"),
    ponderDir: path6.join(rootDir, ".ponder"),
    logDir: path6.join(rootDir, ".ponder", "logs"),
    port,
    hostname,
    maxHealthcheckDuration,
    telemetryUrl: "https://ponder.sh/api/telemetry",
    telemetryDisabled: Boolean(process.env.PONDER_TELEMETRY_DISABLED),
    telemetryIsExampleProject: Boolean(
      process.env.PONDER_TELEMETRY_IS_EXAMPLE_PROJECT
    ),
    logLevel,
    uiEnabled: true
  };
};

// src/indexing-store/postgres/store.ts
import { Kysely, PostgresDialect, WithSchemaPlugin, sql } from "kysely";

// src/utils/serialize.ts
function serialize(value) {
  return JSON.stringify(
    value,
    (_, v) => typeof v === "bigint" ? { __type: "bigint", value: v.toString() } : v
  );
}
function deserialize(value) {
  return JSON.parse(
    value,
    (_, value_) => value_?.__type === "bigint" ? BigInt(value_.value) : value_
  );
}

// src/indexing-store/utils/cursor.ts
function encodeCursor(record, orderByConditions) {
  const cursorValues = orderByConditions.map(([columnName]) => [
    columnName,
    record[columnName]
  ]);
  return Buffer.from(serialize(cursorValues)).toString("base64");
}
function decodeCursor(cursor, orderByConditions) {
  const cursorValues = deserialize(
    Buffer.from(cursor, "base64").toString()
  );
  if (cursorValues.length !== orderByConditions.length) {
    throw new Error(
      `Invalid cursor. Got ${cursorValues.length}, ${orderByConditions.length} conditions`
    );
  }
  for (const [index, [columnName]] of orderByConditions.entries()) {
    if (cursorValues[index][0] !== columnName) {
      throw new Error(
        `Invalid cursor. Got column '${cursorValues[index][0]}' at index ${index}, expected '${columnName}'.`
      );
    }
  }
  return cursorValues;
}
function buildCursorConditions(cursorValues, kind, direction, eb) {
  const comparator = kind === "after" ? direction === "asc" ? ">" : "<" : direction === "asc" ? "<" : ">";
  const comparatorOrEquals = `${comparator}=`;
  if (cursorValues.length === 1) {
    const [columnName, value] = cursorValues[0];
    return eb.eb(columnName, comparatorOrEquals, value);
  } else if (cursorValues.length === 2) {
    const [columnName1, value1] = cursorValues[0];
    const [columnName2, value2] = cursorValues[1];
    return eb.or([
      eb.eb(columnName1, comparator, value1),
      eb.and([
        eb.eb(columnName1, "=", value1),
        eb.eb(columnName2, comparatorOrEquals, value2)
      ])
    ]);
  } else {
    throw new Error(
      `Invalid cursor. Got ${cursorValues.length} value pairs, expected 1 or 2.`
    );
  }
}

// src/utils/encoding.ts
var EVM_MAX_UINT = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;
var EVM_MIN_INT = -57896044618658097711785492504343953926634992332820282019728792003956564819968n;
function encodeAsText(value) {
  if (typeof value === "string" || typeof value === "number")
    value = BigInt(value);
  if (value > EVM_MAX_UINT)
    throw new Error(`Value cannot be greater than EVM_MAX_UINT (${value})`);
  if (value < EVM_MIN_INT)
    throw new Error(`Value cannot be less than EVM_MIN_INT (${value})`);
  const signChar = value >= 0n ? "0" : "-";
  if (value < 0n)
    value = value - EVM_MIN_INT;
  const chars = value.toString(10);
  return signChar + chars.padStart(78, "0");
}
function decodeToBigInt(text) {
  if (typeof text === "bigint")
    return text;
  const signChar = text.at(0);
  let valueChars = text.substring(1).replace(/^0+/, "");
  if (valueChars.length === 0)
    valueChars = "0";
  let value = BigInt(valueChars);
  if (signChar === "-")
    value = value + EVM_MIN_INT;
  return value;
}

// src/indexing-store/utils/encoding.ts
import { bytesToHex, hexToBytes, isHex } from "viem";
var scalarToTsType = {
  int: "number",
  float: "number",
  bigint: "bigint",
  boolean: "boolean",
  string: "string",
  hex: "`0x${string}`"
};
function encodeRow(data, table, encoding) {
  const instance = {};
  for (const [columnName, value] of Object.entries(data)) {
    const column = table[columnName];
    if (!column) {
      throw Error(
        `Invalid record: Column does not exist. Got ${columnName}, expected one of [${Object.keys(
          table
        ).filter((key) => isBaseColumn(table[key]) || isEnumColumn(table[key])).join(", ")}]`
      );
    }
    instance[columnName] = encodeValue(value, column, encoding);
  }
  return instance;
}
function encodeValue(value, column, encoding) {
  if (isEnumColumn(column)) {
    if (column.optional && (value === void 0 || value === null)) {
      return null;
    }
    if (column.list) {
      if (!Array.isArray(value)) {
        throw Error(
          `Unable to encode ${value} as a list. Got type '${typeof value}' but expected type 'string[]'.`
        );
      }
      return JSON.stringify(value);
    } else if (typeof value !== "string") {
      throw Error(
        `Unable to encode ${value} as an enum. Got type '${typeof value}' but expected type 'string'.`
      );
    }
    return value;
  } else if (isBaseColumn(column)) {
    if (column.optional && (value === void 0 || value === null)) {
      return null;
    }
    if (column.list) {
      if (!Array.isArray(value)) {
        throw Error(
          `Unable to encode ${value} as a list. Got type '${typeof value}' but expected type '${scalarToTsType[column.type]}[]'.`
        );
      }
      if (column.type === "bigint") {
        return JSON.stringify(value.map(String));
      } else {
        return JSON.stringify(value);
      }
    }
    if (column.type === "string") {
      if (typeof value !== "string") {
        throw Error(
          `Unable to encode ${value} as a string. Got type '${typeof value}' but expected type 'string'.`
        );
      }
      return value;
    } else if (column.type === "hex") {
      if (typeof value !== "string" || !isHex(value)) {
        throw Error(
          `Unable to encode ${value} as a hex. Got type '${typeof value}' but expected type '\`0x\${string}\`'.`
        );
      }
      return Buffer.from(hexToBytes(value));
    } else if (column.type === "int") {
      if (typeof value !== "number") {
        throw Error(
          `Unable to encode ${value} as an int. Got type '${typeof value}' but expected type 'number'.`
        );
      }
      return value;
    } else if (column.type === "float") {
      if (typeof value !== "number") {
        throw Error(
          `Unable to encode ${value} as a float. Got type '${typeof value}' but expected type 'number'.`
        );
      }
      return value;
    } else if (column.type === "bigint") {
      if (typeof value !== "bigint") {
        throw Error(
          `Unable to encode ${value} as a bigint. Got type '${typeof value}' but expected type 'bigint'.`
        );
      }
      return encoding === "sqlite" ? encodeAsText(value) : value;
    } else if (column.type === "boolean") {
      if (typeof value !== "boolean") {
        throw Error(
          `Unable to encode ${value} as a boolean. Got type '${typeof value}' but expected type 'boolean'.`
        );
      }
      return value ? 1 : 0;
    }
    throw Error(
      `Unable to encode ${value} as type ${column.type}. Please report this issue (https://github.com/ponder-sh/ponder/issues/new)`
    );
  }
  throw Error(
    `Unable to encode ${value} into a "${column._type === "m" ? "many" : "one"}" column. "${column._type === "m" ? "many" : "one"}" columns are virtual and therefore should not be given a value.`
  );
}
function decodeRow(data, table, encoding) {
  const instance = {};
  for (const [columnName, column] of Object.entries(table)) {
    if (isBaseColumn(column) || isEnumColumn(column)) {
      instance[columnName] = decodeValue(data[columnName], column, encoding);
    }
  }
  return instance;
}
function decodeValue(value, column, encoding) {
  if (value === null)
    return null;
  else if (column.list) {
    return column.type === "bigint" ? JSON.parse(value).map(BigInt) : JSON.parse(value);
  } else if (column.type === "boolean") {
    return value === 1 ? true : false;
  } else if (column.type === "hex") {
    return bytesToHex(value);
  } else if (column.type === "bigint" && encoding === "sqlite") {
    return decodeToBigInt(value);
  } else {
    return value;
  }
}

// src/indexing-store/utils/filter.ts
var filterValidityMap = {
  boolean: {
    singular: ["equals", "not", "in", "notIn"],
    list: ["equals", "not", "has", "notHas"]
  },
  string: {
    singular: [
      "equals",
      "not",
      "in",
      "notIn",
      "contains",
      "notContains",
      "startsWith",
      "notStartsWith",
      "endsWith",
      "notEndsWith"
    ],
    list: ["equals", "not", "has", "notHas"]
  },
  hex: {
    singular: ["equals", "not", "in", "notIn", "gt", "lt", "gte", "lte"],
    list: ["equals", "not", "has", "notHas"]
  },
  int: {
    singular: ["equals", "not", "in", "notIn", "gt", "lt", "gte", "lte"],
    list: ["equals", "not", "has", "notHas"]
  },
  bigint: {
    singular: ["equals", "not", "in", "notIn", "gt", "lt", "gte", "lte"],
    list: ["equals", "not", "has", "notHas"]
  },
  float: {
    singular: ["equals", "not", "in", "notIn", "gt", "lt", "gte", "lte"],
    list: ["equals", "not", "has", "notHas"]
  }
};
var filterEncodingMap = {
  // Universal
  equals: (value, encode) => value === null ? ["is", null] : ["=", encode(value)],
  not: (value, encode) => value === null ? ["is not", null] : ["!=", encode(value)],
  // Singular
  in: (value, encode) => ["in", value.map(encode)],
  notIn: (value, encode) => ["not in", value.map(encode)],
  // Plural/list
  has: (value, encode) => ["like", `%${encode(value)}%`],
  notHas: (value, encode) => ["not like", `%${encode(value)}%`],
  // Numeric
  gt: (value, encode) => [">", encode(value)],
  lt: (value, encode) => ["<", encode(value)],
  gte: (value, encode) => [">=", encode(value)],
  lte: (value, encode) => ["<=", encode(value)],
  // String
  contains: (value, encode) => ["like", `%${encode(value)}%`],
  notContains: (value, encode) => ["not like", `%${encode(value)}%`],
  startsWith: (value, encode) => ["like", `${encode(value)}%`],
  notStartsWith: (value, encode) => ["not like", `${encode(value)}%`],
  endsWith: (value, encode) => ["like", `%${encode(value)}`],
  notEndsWith: (value, encode) => ["not like", `%${encode(value)}`]
};
function buildWhereConditions({
  where,
  table,
  encoding
}) {
  if (where === void 0)
    return [];
  const conditions = [];
  for (const [columnName, rhs] of Object.entries(where)) {
    const column = table[columnName];
    if (!column) {
      throw Error(
        `Invalid filter. Column does not exist. Got '${columnName}', expected one of [${Object.keys(
          table
        ).filter((key) => isBaseColumn(table[key]) || isEnumColumn(table[key])).map((c) => `'${c}'`).join(", ")}]`
      );
    }
    if (column._type === "m" || column._type === "o") {
      throw Error(
        `Invalid filter. Cannot filter on virtual column '${columnName}'.`
      );
    }
    const conditionsForColumn = Array.isArray(rhs) || typeof rhs !== "object" ? { equals: rhs } : rhs;
    for (const [condition, value] of Object.entries(conditionsForColumn)) {
      const filterType = column._type === "e" ? "string" : column.type;
      const allowedConditions = filterValidityMap[filterType]?.[column.list ? "list" : "singular"];
      if (!allowedConditions.includes(condition)) {
        throw new Error(
          `Invalid filter condition for column '${columnName}'. Got '${condition}', expected one of [${allowedConditions.map((c) => `'${c}'`).join(", ")}]`
        );
      }
      const filterEncodingFn = filterEncodingMap[condition];
      const encode = column.list && (condition === "has" || condition === "notHas") ? (v) => encodeValue(v, { ...column, list: false }, encoding) : (v) => encodeValue(v, column, encoding);
      const [comparator, encodedValue] = filterEncodingFn(value, encode);
      conditions.push([
        columnName,
        comparator,
        encodedValue
      ]);
    }
  }
  return conditions;
}

// src/indexing-store/utils/sort.ts
function buildOrderByConditions({
  orderBy,
  table
}) {
  if (!orderBy) {
    return [["id", "asc"]];
  }
  const conditions = Object.entries(orderBy);
  if (conditions.length > 1)
    throw new Error("Invalid sort. Cannot sort by multiple columns.");
  const [columnName, orderDirection] = conditions[0];
  const column = table[columnName];
  if (!column) {
    throw Error(
      `Invalid sort. Column does not exist. Got '${columnName}', expected one of [${Object.keys(
        table
      ).filter((key) => isBaseColumn(table[key]) || isEnumColumn(table[key])).map((c) => `'${c}'`).join(", ")}]`
    );
  }
  if (column._type === "m" || column._type === "o") {
    throw Error(
      `Invalid sort. Cannot filter on virtual column '${columnName}'.`
    );
  }
  if (orderDirection === void 0 || !["asc", "desc"].includes(orderDirection))
    throw new Error(
      `Invalid sort direction. Got '${orderDirection}', expected 'asc' or 'desc'.`
    );
  const orderByConditions = [[columnName, orderDirection]];
  if (columnName !== "id") {
    orderByConditions.push(["id", orderDirection]);
  }
  return orderByConditions;
}

// src/indexing-store/postgres/store.ts
var MAX_BATCH_SIZE = 1e3;
var DEFAULT_LIMIT = 50;
var MAX_LIMIT = 1e3;
var scalarToSqlType = {
  boolean: "integer",
  int: "integer",
  float: "text",
  string: "text",
  bigint: "numeric(78, 0)",
  hex: "bytea"
};
var PostgresIndexingStore = class {
  kind = "postgres";
  common;
  db;
  schema;
  databaseSchemaName;
  constructor({
    common,
    pool,
    usePublic = false
  }) {
    this.databaseSchemaName = usePublic ? "public" : `ponder`;
    this.common = common;
    this.common.logger.debug({
      msg: `Using schema '${this.databaseSchemaName}'`,
      service: "indexing"
    });
    this.db = new Kysely({
      dialect: new PostgresDialect({ pool }),
      log(event) {
        if (event.level === "query")
          common.metrics.ponder_postgres_query_count?.inc({ kind: "indexing" });
      }
    }).withPlugin(new WithSchemaPlugin(this.databaseSchemaName));
  }
  async teardown() {
    if (this.databaseSchemaName === "public")
      return;
    return this.wrap({ method: "teardown" }, async () => {
      await this.db.schema.dropSchema(this.databaseSchemaName).ifExists().cascade().execute();
    });
  }
  kill = async () => {
    return this.wrap({ method: "kill" }, async () => {
      try {
        await this.db.destroy();
      } catch (e) {
        const error = e;
        if (error.message !== "Called end on pool more than once") {
          throw error;
        }
      }
    });
  };
  /**
   * Resets the database by dropping existing tables and creating new tables.
   * If no new schema is provided, the existing schema is used.
   *
   * @param options.schema New schema to be used.
   */
  reload = async ({ schema } = {}) => {
    return this.wrap({ method: "reload" }, async () => {
      if (!this.schema && !schema)
        return;
      if (schema)
        this.schema = schema;
      await this.db.transaction().execute(async (tx) => {
        await tx.schema.createSchema(this.databaseSchemaName).ifNotExists().execute();
        await Promise.all(
          Object.entries(this.schema.tables).map(
            async ([tableName, columns]) => {
              const table = `${tableName}_versioned`;
              await tx.schema.dropTable(table).ifExists().cascade().execute();
              let tableBuilder = tx.schema.createTable(table);
              Object.entries(columns).forEach(([columnName, column]) => {
                if (isOneColumn(column))
                  return;
                if (isManyColumn(column))
                  return;
                if (isEnumColumn(column)) {
                  tableBuilder = tableBuilder.addColumn(
                    columnName,
                    "text",
                    (col) => {
                      if (!column.optional)
                        col = col.notNull();
                      if (!column.list) {
                        col = col.check(
                          sql`${sql.ref(columnName)} in (${sql.join(
                            schema.enums[column.type].map((v) => sql.lit(v))
                          )})`
                        );
                      }
                      return col;
                    }
                  );
                } else if (column.list) {
                  tableBuilder = tableBuilder.addColumn(
                    columnName,
                    "text",
                    (col) => {
                      if (!column.optional)
                        col = col.notNull();
                      return col;
                    }
                  );
                } else {
                  tableBuilder = tableBuilder.addColumn(
                    columnName,
                    scalarToSqlType[column.type],
                    (col) => {
                      if (!column.optional)
                        col = col.notNull();
                      return col;
                    }
                  );
                }
              });
              tableBuilder = tableBuilder.addColumn(
                "effectiveFromCheckpoint",
                "varchar(58)",
                (col) => col.notNull()
              );
              tableBuilder = tableBuilder.addColumn(
                "effectiveToCheckpoint",
                "varchar(58)",
                (col) => col.notNull()
              );
              tableBuilder = tableBuilder.addPrimaryKeyConstraint(
                `${table}_effectiveToCheckpoint_unique`,
                ["id", "effectiveToCheckpoint"]
              );
              await tableBuilder.execute();
            }
          )
        );
      });
    });
  };
  publish = async () => {
    return this.wrap({ method: "publish" }, async () => {
      await this.db.transaction().execute(async (tx) => {
        await Promise.all(
          Object.entries(this.schema.tables).map(
            async ([tableName, columns]) => {
              await tx.schema.withSchema("public").dropView(`${tableName}_versioned`).ifExists().execute();
              await tx.schema.withSchema("public").createView(`${tableName}_versioned`).as(
                tx.withSchema(this.databaseSchemaName).selectFrom(`${tableName}_versioned`).selectAll()
              ).execute();
              const columnNames = Object.entries(columns).filter(([, c]) => !isOneColumn(c) && !isManyColumn(c)).map(([name]) => name);
              await tx.schema.withSchema("public").dropView(tableName).ifExists().execute();
              await tx.schema.withSchema("public").createView(tableName).as(
                tx.withSchema(this.databaseSchemaName).selectFrom(`${tableName}_versioned`).select(columnNames).where("effectiveToCheckpoint", "=", "latest")
              ).execute();
            }
          )
        );
      });
    });
  };
  /**
   * Revert any changes that occurred during or after the specified checkpoint.
   */
  revert = async ({ checkpoint }) => {
    return this.wrap({ method: "revert" }, async () => {
      await this.db.transaction().execute(async (tx) => {
        await Promise.all(
          Object.keys(this.schema?.tables ?? {}).map(async (tableName) => {
            const table = `${tableName}_versioned`;
            const encodedCheckpoint = encodeCheckpoint(checkpoint);
            await tx.deleteFrom(table).where("effectiveFromCheckpoint", ">=", encodedCheckpoint).execute();
            await tx.updateTable(table).where("effectiveToCheckpoint", ">=", encodedCheckpoint).set({ effectiveToCheckpoint: "latest" }).execute();
          })
        );
      });
    });
  };
  findUnique = async ({
    tableName,
    checkpoint = "latest",
    id
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "findUnique", tableName }, async () => {
      const formattedId = encodeValue(id, table.id, "postgres");
      let query2 = this.db.selectFrom(versionedTableName).selectAll().where("id", "=", formattedId);
      if (checkpoint === "latest") {
        query2 = query2.where("effectiveToCheckpoint", "=", "latest");
      } else {
        const encodedCheckpoint = encodeCheckpoint(checkpoint);
        query2 = query2.where("effectiveFromCheckpoint", "<=", encodedCheckpoint).where(
          ({ eb, or }) => or([
            eb("effectiveToCheckpoint", ">", encodedCheckpoint),
            eb("effectiveToCheckpoint", "=", "latest")
          ])
        );
      }
      const row = await query2.executeTakeFirst();
      if (row === void 0)
        return null;
      return decodeRow(row, table, "postgres");
    });
  };
  findMany = async ({
    tableName,
    checkpoint = "latest",
    where,
    orderBy,
    before = null,
    after = null,
    limit = DEFAULT_LIMIT
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "findMany", tableName }, async () => {
      let query2 = this.db.selectFrom(versionedTableName).selectAll();
      if (checkpoint === "latest") {
        query2 = query2.where("effectiveToCheckpoint", "=", "latest");
      } else {
        const encodedCheckpoint = encodeCheckpoint(checkpoint);
        query2 = query2.where("effectiveFromCheckpoint", "<=", encodedCheckpoint).where(
          ({ eb, or }) => or([
            eb("effectiveToCheckpoint", ">", encodedCheckpoint),
            eb("effectiveToCheckpoint", "=", "latest")
          ])
        );
      }
      const whereConditions = buildWhereConditions({
        where,
        table,
        encoding: "postgres"
      });
      for (const [columnName, comparator, value] of whereConditions) {
        query2 = query2.where(columnName, comparator, value);
      }
      const orderByConditions = buildOrderByConditions({ orderBy, table });
      for (const [column, direction] of orderByConditions) {
        query2 = query2.orderBy(
          column,
          direction === "asc" || direction === void 0 ? sql`asc nulls first` : sql`desc nulls last`
        );
      }
      const orderDirection = orderByConditions[0][1];
      if (limit > MAX_LIMIT) {
        throw new Error(
          `Invalid limit. Got ${limit}, expected <=${MAX_LIMIT}.`
        );
      }
      let startCursor = null;
      let endCursor = null;
      let hasPreviousPage = false;
      let hasNextPage = false;
      if (after === null && before === null) {
        query2 = query2.limit(limit + 1);
        const rows = await query2.execute();
        const records = rows.map((row) => decodeRow(row, table, "sqlite"));
        if (records.length === limit + 1) {
          records.pop();
          hasNextPage = true;
        }
        startCursor = records.length > 0 ? encodeCursor(records[0], orderByConditions) : null;
        endCursor = records.length > 0 ? encodeCursor(records[records.length - 1], orderByConditions) : null;
        return {
          items: records,
          pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
        };
      }
      if (after !== null) {
        const rawCursorValues = decodeCursor(after, orderByConditions);
        const cursorValues = rawCursorValues.map(([columnName, value]) => [
          columnName,
          encodeValue(value, table[columnName], "postgres")
        ]);
        query2 = query2.where(
          (eb) => buildCursorConditions(cursorValues, "after", orderDirection, eb)
        ).limit(limit + 2);
        const rows = await query2.execute();
        const records = rows.map((row) => decodeRow(row, table, "postgres"));
        if (records.length === 0) {
          return {
            items: records,
            pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
          };
        }
        if (encodeCursor(records[0], orderByConditions) === after) {
          records.shift();
          hasPreviousPage = true;
        } else {
          records.pop();
        }
        if (records.length === limit + 1) {
          records.pop();
          hasNextPage = true;
        }
        startCursor = records.length > 0 ? encodeCursor(records[0], orderByConditions) : null;
        endCursor = records.length > 0 ? encodeCursor(records[records.length - 1], orderByConditions) : null;
        return {
          items: records,
          pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
        };
      } else {
        const rawCursorValues = decodeCursor(before, orderByConditions);
        const cursorValues = rawCursorValues.map(([columnName, value]) => [
          columnName,
          encodeValue(value, table[columnName], "postgres")
        ]);
        query2 = query2.where(
          (eb) => buildCursorConditions(cursorValues, "before", orderDirection, eb)
        ).limit(limit + 2);
        const rows = await query2.execute();
        const records = rows.map((row) => decodeRow(row, table, "postgres"));
        if (records.length === 0) {
          return {
            items: records,
            pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
          };
        }
        if (encodeCursor(records[records.length - 1], orderByConditions) === before) {
          records.pop();
          hasNextPage = true;
        } else {
          records.shift();
        }
        if (records.length === limit + 1) {
          records.shift();
          hasPreviousPage = true;
        }
        startCursor = records.length > 0 ? encodeCursor(records[0], orderByConditions) : null;
        endCursor = records.length > 0 ? encodeCursor(records[records.length - 1], orderByConditions) : null;
        return {
          items: records,
          pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
        };
      }
    });
  };
  create = async ({
    tableName,
    checkpoint,
    id,
    data = {}
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "create", tableName }, async () => {
      const createRow = encodeRow({ id, ...data }, table, "postgres");
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const row = await this.db.insertInto(versionedTableName).values({
        ...createRow,
        effectiveFromCheckpoint: encodedCheckpoint,
        effectiveToCheckpoint: "latest"
      }).returningAll().executeTakeFirstOrThrow();
      return decodeRow(row, table, "postgres");
    });
  };
  createMany = async ({
    tableName,
    checkpoint,
    data
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "createMany", tableName }, async () => {
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const createRows = data.map((d) => ({
        ...encodeRow({ ...d }, table, "postgres"),
        effectiveFromCheckpoint: encodedCheckpoint,
        effectiveToCheckpoint: "latest"
      }));
      const chunkedRows = [];
      for (let i = 0, len = createRows.length; i < len; i += MAX_BATCH_SIZE)
        chunkedRows.push(createRows.slice(i, i + MAX_BATCH_SIZE));
      const rows = await Promise.all(
        chunkedRows.map(
          (c) => this.db.insertInto(versionedTableName).values(c).returningAll().execute()
        )
      );
      return rows.flat().map((row) => decodeRow(row, table, "postgres"));
    });
  };
  update = async ({
    tableName,
    checkpoint,
    id,
    data = {}
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "update", tableName }, async () => {
      const formattedId = encodeValue(id, table.id, "postgres");
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const row = await this.db.transaction().execute(async (tx) => {
        const latestRow = await tx.selectFrom(versionedTableName).selectAll().where("id", "=", formattedId).where("effectiveToCheckpoint", "=", "latest").executeTakeFirstOrThrow();
        let updateRow;
        if (typeof data === "function") {
          const current = decodeRow(latestRow, table, "postgres");
          const updateObject = data({ current });
          updateRow = encodeRow({ id, ...updateObject }, table, "postgres");
        } else {
          updateRow = encodeRow({ id, ...data }, table, "postgres");
        }
        if (latestRow.effectiveFromCheckpoint > encodedCheckpoint) {
          throw new Error("Cannot update a record in the past");
        }
        if (latestRow.effectiveFromCheckpoint === encodedCheckpoint) {
          return await tx.updateTable(versionedTableName).set(updateRow).where("id", "=", formattedId).where("effectiveFromCheckpoint", "=", encodedCheckpoint).returningAll().executeTakeFirstOrThrow();
        }
        await tx.updateTable(versionedTableName).where("id", "=", formattedId).where("effectiveToCheckpoint", "=", "latest").set({ effectiveToCheckpoint: encodedCheckpoint }).execute();
        const row2 = await tx.insertInto(versionedTableName).values({
          ...latestRow,
          ...updateRow,
          effectiveFromCheckpoint: encodedCheckpoint,
          effectiveToCheckpoint: "latest"
        }).returningAll().executeTakeFirstOrThrow();
        return row2;
      });
      const result = decodeRow(row, table, "postgres");
      return result;
    });
  };
  updateMany = async ({
    tableName,
    checkpoint,
    where,
    data = {}
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "updateMany", tableName }, async () => {
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const rows = await this.db.transaction().execute(async (tx) => {
        let query2 = tx.selectFrom(versionedTableName).selectAll().where("effectiveToCheckpoint", "=", "latest");
        const whereConditions = buildWhereConditions({
          where,
          table,
          encoding: "postgres"
        });
        for (const [columnName, comparator, value] of whereConditions) {
          query2 = query2.where(columnName, comparator, value);
        }
        const latestRows = await query2.execute();
        return await Promise.all(
          latestRows.map(async (latestRow) => {
            const formattedId = latestRow.id;
            let updateRow;
            if (typeof data === "function") {
              const current = decodeRow(latestRow, table, "postgres");
              const updateObject = data({ current });
              updateRow = encodeRow(updateObject, table, "postgres");
            } else {
              updateRow = encodeRow(data, table, "postgres");
            }
            if (latestRow.effectiveFromCheckpoint > encodedCheckpoint) {
              throw new Error("Cannot update a record in the past");
            }
            if (latestRow.effectiveFromCheckpoint === encodedCheckpoint) {
              return await tx.updateTable(versionedTableName).set(updateRow).where("id", "=", formattedId).where("effectiveFromCheckpoint", "=", encodedCheckpoint).returningAll().executeTakeFirstOrThrow();
            }
            await tx.updateTable(versionedTableName).where("id", "=", formattedId).where("effectiveToCheckpoint", "=", "latest").set({ effectiveToCheckpoint: encodedCheckpoint }).execute();
            const row = await tx.insertInto(versionedTableName).values({
              ...latestRow,
              ...updateRow,
              effectiveFromCheckpoint: encodedCheckpoint,
              effectiveToCheckpoint: "latest"
            }).returningAll().executeTakeFirstOrThrow();
            return row;
          })
        );
      });
      return rows.map((row) => decodeRow(row, table, "postgres"));
    });
  };
  upsert = async ({
    tableName,
    checkpoint,
    id,
    create = {},
    update = {}
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "upsert", tableName }, async () => {
      const formattedId = encodeValue(id, table.id, "postgres");
      const createRow = encodeRow({ id, ...create }, table, "postgres");
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const row = await this.db.transaction().execute(async (tx) => {
        const latestRow = await tx.selectFrom(versionedTableName).selectAll().where("id", "=", formattedId).where("effectiveToCheckpoint", "=", "latest").executeTakeFirst();
        if (latestRow === void 0) {
          return await tx.insertInto(versionedTableName).values({
            ...createRow,
            effectiveFromCheckpoint: encodedCheckpoint,
            effectiveToCheckpoint: "latest"
          }).returningAll().executeTakeFirstOrThrow();
        }
        let updateRow;
        if (typeof update === "function") {
          const current = decodeRow(latestRow, table, "postgres");
          const updateObject = update({ current });
          updateRow = encodeRow({ id, ...updateObject }, table, "postgres");
        } else {
          updateRow = encodeRow({ id, ...update }, table, "postgres");
        }
        if (latestRow.effectiveFromCheckpoint > encodedCheckpoint) {
          throw new Error("Cannot update a record in the past");
        }
        if (latestRow.effectiveFromCheckpoint === encodedCheckpoint) {
          return await tx.updateTable(versionedTableName).set(updateRow).where("id", "=", formattedId).where("effectiveFromCheckpoint", "=", encodedCheckpoint).returningAll().executeTakeFirstOrThrow();
        }
        await tx.updateTable(versionedTableName).where("id", "=", formattedId).where("effectiveToCheckpoint", "=", "latest").set({ effectiveToCheckpoint: encodedCheckpoint }).execute();
        const row2 = await tx.insertInto(versionedTableName).values({
          ...latestRow,
          ...updateRow,
          effectiveFromCheckpoint: encodedCheckpoint,
          effectiveToCheckpoint: "latest"
        }).returningAll().executeTakeFirstOrThrow();
        return row2;
      });
      return decodeRow(row, table, "postgres");
    });
  };
  delete = async ({
    tableName,
    checkpoint,
    id
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "delete", tableName }, async () => {
      const formattedId = encodeValue(id, table.id, "postgres");
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const isDeleted = await this.db.transaction().execute(async (tx) => {
        let deletedRow = await tx.deleteFrom(versionedTableName).where("id", "=", formattedId).where("effectiveFromCheckpoint", "=", encodedCheckpoint).where("effectiveToCheckpoint", "=", "latest").returning(["id"]).executeTakeFirst();
        if (!deletedRow) {
          deletedRow = await tx.updateTable(versionedTableName).set({ effectiveToCheckpoint: encodedCheckpoint }).where("id", "=", formattedId).where("effectiveToCheckpoint", "=", "latest").returning(["id"]).executeTakeFirst();
        }
        return !!deletedRow;
      });
      return isDeleted;
    });
  };
  wrap = async (options, fn) => {
    const start = performance.now();
    const result = await fn();
    this.common.metrics.ponder_indexing_store_method_duration.observe(
      { method: options.method, table: options.tableName },
      performance.now() - start
    );
    return result;
  };
};

// src/indexing-store/sqlite/store.ts
import { Kysely as Kysely2, SqliteDialect, sql as sql2 } from "kysely";
var MAX_BATCH_SIZE2 = 1e3;
var DEFAULT_LIMIT2 = 50;
var MAX_LIMIT2 = 1e3;
var scalarToSqlType2 = {
  boolean: "integer",
  int: "integer",
  float: "text",
  string: "text",
  bigint: "varchar(79)",
  hex: "blob"
};
var SqliteIndexingStore = class {
  kind = "sqlite";
  common;
  db;
  schema;
  constructor({
    common,
    database
  }) {
    this.common = common;
    this.db = new Kysely2({
      dialect: new SqliteDialect({ database }),
      log(event) {
        if (event.level === "query")
          common.metrics.ponder_sqlite_query_count?.inc({ kind: "indexing" });
      }
    });
  }
  async teardown() {
    return this.wrap({ method: "teardown" }, async () => {
      const tableNames = Object.keys(this.schema?.tables ?? {});
      if (tableNames.length > 0) {
        await this.db.transaction().execute(async (tx) => {
          await Promise.all(
            tableNames.map(async (tableName) => {
              const table = `${tableName}_versioned`;
              await tx.schema.dropTable(table).ifExists().execute();
            })
          );
        });
      }
    });
  }
  async kill() {
    return this.wrap({ method: "kill" }, async () => {
      try {
        await this.db.destroy();
      } catch (e) {
        const error = e;
        if (error.message !== "Called end on pool more than once") {
          throw error;
        }
      }
    });
  }
  /**
   * Resets the database by dropping existing tables and creating new tables.
   * If no new schema is provided, the existing schema is used.
   *
   * @param options.schema New schema to be used.
   */
  reload = async ({ schema } = {}) => {
    return this.wrap({ method: "reload" }, async () => {
      if (!this.schema && !schema)
        return;
      if (schema)
        this.schema = schema;
      await this.db.transaction().execute(async (tx) => {
        await Promise.all(
          Object.entries(this.schema.tables).map(
            async ([tableName, columns]) => {
              const table = `${tableName}_versioned`;
              await tx.schema.dropTable(table).ifExists().execute();
              let tableBuilder = tx.schema.createTable(table);
              Object.entries(columns).forEach(([columnName, column]) => {
                if (isOneColumn(column))
                  return;
                if (isManyColumn(column))
                  return;
                if (isEnumColumn(column)) {
                  tableBuilder = tableBuilder.addColumn(
                    columnName,
                    "text",
                    (col) => {
                      if (!column.optional)
                        col = col.notNull();
                      if (!column.list) {
                        col = col.check(
                          sql2`${sql2.ref(columnName)} in (${sql2.join(
                            schema.enums[column.type].map((v) => sql2.lit(v))
                          )})`
                        );
                      }
                      return col;
                    }
                  );
                } else if (column.list) {
                  tableBuilder = tableBuilder.addColumn(
                    columnName,
                    "text",
                    (col) => {
                      if (!column.optional)
                        col = col.notNull();
                      return col;
                    }
                  );
                } else {
                  tableBuilder = tableBuilder.addColumn(
                    columnName,
                    scalarToSqlType2[column.type],
                    (col) => {
                      if (!column.optional)
                        col = col.notNull();
                      return col;
                    }
                  );
                }
              });
              tableBuilder = tableBuilder.addColumn(
                "effectiveFromCheckpoint",
                "varchar(58)",
                (col) => col.notNull()
              );
              tableBuilder = tableBuilder.addColumn(
                "effectiveToCheckpoint",
                "varchar(58)",
                (col) => col.notNull()
              );
              tableBuilder = tableBuilder.addPrimaryKeyConstraint(
                `${table}_effectiveToCheckpoint_unique`,
                ["id", "effectiveToCheckpoint"]
              );
              await tableBuilder.execute();
            }
          )
        );
      });
    });
  };
  publish = async () => {
    return this.wrap({ method: "publish" }, async () => {
      await this.db.transaction().execute(async (tx) => {
        await Promise.all(
          Object.entries(this.schema.tables).map(
            async ([tableName, columns]) => {
              await tx.schema.dropView(tableName).ifExists().execute();
              const columnNames = Object.entries(columns).filter(([, c]) => !isOneColumn(c) && !isManyColumn(c)).map(([name]) => name);
              await tx.schema.createView(tableName).as(
                tx.selectFrom(`${tableName}_versioned`).select(columnNames).where("effectiveToCheckpoint", "=", "latest")
              ).execute();
            }
          )
        );
      });
    });
  };
  /**
   * Revert any changes that occurred during or after the specified checkpoint.
   */
  revert = async ({ checkpoint }) => {
    return this.wrap({ method: "revert" }, async () => {
      await this.db.transaction().execute(async (tx) => {
        await Promise.all(
          Object.keys(this.schema?.tables ?? {}).map(async (tableName) => {
            const table = `${tableName}_versioned`;
            const encodedCheckpoint = encodeCheckpoint(checkpoint);
            await tx.deleteFrom(table).where("effectiveFromCheckpoint", ">=", encodedCheckpoint).execute();
            await tx.updateTable(table).set({ effectiveToCheckpoint: "latest" }).where("effectiveToCheckpoint", ">=", encodedCheckpoint).execute();
          })
        );
      });
    });
  };
  findUnique = async ({
    tableName,
    checkpoint = "latest",
    id
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "findUnique", tableName }, async () => {
      const encodedId = encodeValue(id, table.id, "sqlite");
      let query2 = this.db.selectFrom(versionedTableName).selectAll().where("id", "=", encodedId);
      if (checkpoint === "latest") {
        query2 = query2.where("effectiveToCheckpoint", "=", "latest");
      } else {
        const encodedCheckpoint = encodeCheckpoint(checkpoint);
        query2 = query2.where("effectiveFromCheckpoint", "<=", encodedCheckpoint).where(
          ({ eb, or }) => or([
            eb("effectiveToCheckpoint", ">", encodedCheckpoint),
            eb("effectiveToCheckpoint", "=", "latest")
          ])
        );
      }
      const row = await query2.executeTakeFirst();
      if (row === void 0)
        return null;
      return decodeRow(row, table, "sqlite");
    });
  };
  findMany = async ({
    tableName,
    checkpoint = "latest",
    where,
    orderBy,
    before = null,
    after = null,
    limit = DEFAULT_LIMIT2
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "findMany", tableName }, async () => {
      let query2 = this.db.selectFrom(versionedTableName).selectAll();
      if (checkpoint === "latest") {
        query2 = query2.where("effectiveToCheckpoint", "=", "latest");
      } else {
        const encodedCheckpoint = encodeCheckpoint(checkpoint);
        query2 = query2.where("effectiveFromCheckpoint", "<=", encodedCheckpoint).where(
          ({ eb, or }) => or([
            eb("effectiveToCheckpoint", ">", encodedCheckpoint),
            eb("effectiveToCheckpoint", "=", "latest")
          ])
        );
      }
      const whereConditions = buildWhereConditions({
        where,
        table,
        encoding: "sqlite"
      });
      for (const [columnName, comparator, value] of whereConditions) {
        query2 = query2.where(columnName, comparator, value);
      }
      const orderByConditions = buildOrderByConditions({ orderBy, table });
      for (const [column, direction] of orderByConditions) {
        query2 = query2.orderBy(column, direction);
      }
      const orderDirection = orderByConditions[0][1];
      if (limit > MAX_LIMIT2) {
        throw new Error(
          `Invalid limit. Got ${limit}, expected <=${MAX_LIMIT2}.`
        );
      }
      if (after !== null && before !== null) {
        throw new Error("Cannot specify both before and after cursors.");
      }
      let startCursor = null;
      let endCursor = null;
      let hasPreviousPage = false;
      let hasNextPage = false;
      if (after === null && before === null) {
        query2 = query2.limit(limit + 1);
        const rows = await query2.execute();
        const records = rows.map((row) => decodeRow(row, table, "sqlite"));
        if (records.length === limit + 1) {
          records.pop();
          hasNextPage = true;
        }
        startCursor = records.length > 0 ? encodeCursor(records[0], orderByConditions) : null;
        endCursor = records.length > 0 ? encodeCursor(records[records.length - 1], orderByConditions) : null;
        return {
          items: records,
          pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
        };
      }
      if (after !== null) {
        const rawCursorValues = decodeCursor(after, orderByConditions);
        const cursorValues = rawCursorValues.map(([columnName, value]) => [
          columnName,
          encodeValue(value, table[columnName], "sqlite")
        ]);
        query2 = query2.where(
          (eb) => buildCursorConditions(cursorValues, "after", orderDirection, eb)
        ).limit(limit + 2);
        const rows = await query2.execute();
        const records = rows.map((row) => decodeRow(row, table, "sqlite"));
        if (records.length === 0) {
          return {
            items: records,
            pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
          };
        }
        if (encodeCursor(records[0], orderByConditions) === after) {
          records.shift();
          hasPreviousPage = true;
        } else {
          records.pop();
        }
        if (records.length === limit + 1) {
          records.pop();
          hasNextPage = true;
        }
        startCursor = records.length > 0 ? encodeCursor(records[0], orderByConditions) : null;
        endCursor = records.length > 0 ? encodeCursor(records[records.length - 1], orderByConditions) : null;
        return {
          items: records,
          pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
        };
      } else {
        const rawCursorValues = decodeCursor(before, orderByConditions);
        const cursorValues = rawCursorValues.map(([columnName, value]) => [
          columnName,
          encodeValue(value, table[columnName], "sqlite")
        ]);
        query2 = query2.where(
          (eb) => buildCursorConditions(cursorValues, "before", orderDirection, eb)
        ).limit(limit + 2);
        const rows = await query2.execute();
        const records = rows.map((row) => decodeRow(row, table, "sqlite"));
        if (records.length === 0) {
          return {
            items: records,
            pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
          };
        }
        if (encodeCursor(records[records.length - 1], orderByConditions) === before) {
          records.pop();
          hasNextPage = true;
        } else {
          records.shift();
        }
        if (records.length === limit + 1) {
          records.shift();
          hasPreviousPage = true;
        }
        startCursor = records.length > 0 ? encodeCursor(records[0], orderByConditions) : null;
        endCursor = records.length > 0 ? encodeCursor(records[records.length - 1], orderByConditions) : null;
        return {
          items: records,
          pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor }
        };
      }
    });
  };
  create = async ({
    tableName,
    checkpoint,
    id,
    data = {}
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "create", tableName }, async () => {
      const createRow = encodeRow({ id, ...data }, table, "sqlite");
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const row = await this.db.insertInto(versionedTableName).values({
        ...createRow,
        effectiveFromCheckpoint: encodedCheckpoint,
        effectiveToCheckpoint: "latest"
      }).returningAll().executeTakeFirstOrThrow();
      return decodeRow(row, this.schema.tables[tableName], "sqlite");
    });
  };
  createMany = async ({
    tableName,
    checkpoint,
    data
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "createMany", tableName }, async () => {
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const createRows = data.map((d) => ({
        ...encodeRow({ ...d }, table, "sqlite"),
        effectiveFromCheckpoint: encodedCheckpoint,
        effectiveToCheckpoint: "latest"
      }));
      const chunkedRows = [];
      for (let i = 0, len = createRows.length; i < len; i += MAX_BATCH_SIZE2)
        chunkedRows.push(createRows.slice(i, i + MAX_BATCH_SIZE2));
      const rows = await Promise.all(
        chunkedRows.map(
          (c) => this.db.insertInto(versionedTableName).values(c).returningAll().execute()
        )
      );
      return rows.flat().map((row) => decodeRow(row, this.schema.tables[tableName], "sqlite"));
    });
  };
  update = async ({
    tableName,
    checkpoint,
    id,
    data = {}
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "update", tableName }, async () => {
      const encodedId = encodeValue(id, table.id, "sqlite");
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const row = await this.db.transaction().execute(async (tx) => {
        const latestRow = await tx.selectFrom(versionedTableName).selectAll().where("id", "=", encodedId).where("effectiveToCheckpoint", "=", "latest").executeTakeFirstOrThrow();
        let updateRow;
        if (typeof data === "function") {
          const current = decodeRow(latestRow, table, "sqlite");
          const updateObject = data({ current });
          updateRow = encodeRow({ id, ...updateObject }, table, "sqlite");
        } else {
          updateRow = encodeRow({ id, ...data }, table, "sqlite");
        }
        if (latestRow.effectiveFromCheckpoint > encodedCheckpoint) {
          throw new Error("Cannot update a record in the past");
        }
        if (latestRow.effectiveFromCheckpoint === encodedCheckpoint) {
          return await tx.updateTable(versionedTableName).set(updateRow).where("id", "=", encodedId).where("effectiveFromCheckpoint", "=", encodedCheckpoint).returningAll().executeTakeFirstOrThrow();
        }
        await tx.updateTable(versionedTableName).where("id", "=", encodedId).where("effectiveToCheckpoint", "=", "latest").set({ effectiveToCheckpoint: encodedCheckpoint }).execute();
        const row2 = tx.insertInto(versionedTableName).values({
          ...latestRow,
          ...updateRow,
          effectiveFromCheckpoint: encodedCheckpoint,
          effectiveToCheckpoint: "latest"
        }).returningAll().executeTakeFirstOrThrow();
        return row2;
      });
      const result = decodeRow(row, table, "sqlite");
      return result;
    });
  };
  updateMany = async ({
    tableName,
    checkpoint,
    where,
    data = {}
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "updateMany", tableName }, async () => {
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const rows = await this.db.transaction().execute(async (tx) => {
        let query2 = tx.selectFrom(versionedTableName).selectAll().where("effectiveToCheckpoint", "=", "latest");
        const whereConditions = buildWhereConditions({
          where,
          table,
          encoding: "sqlite"
        });
        for (const [columnName, comparator, value] of whereConditions) {
          query2 = query2.where(columnName, comparator, value);
        }
        const latestRows = await query2.execute();
        return await Promise.all(
          latestRows.map(async (latestRow) => {
            const encodedId = latestRow.id;
            let updateRow;
            if (typeof data === "function") {
              const current = decodeRow(latestRow, table, "sqlite");
              const updateObject = data({ current });
              updateRow = encodeRow(updateObject, table, "sqlite");
            } else {
              updateRow = encodeRow(data, table, "sqlite");
            }
            if (latestRow.effectiveFromCheckpoint > encodedCheckpoint) {
              throw new Error("Cannot update a record in the past");
            }
            if (latestRow.effectiveFromCheckpoint === encodedCheckpoint) {
              return await tx.updateTable(versionedTableName).set(updateRow).where("id", "=", encodedId).where("effectiveFromCheckpoint", "=", encodedCheckpoint).returningAll().executeTakeFirstOrThrow();
            }
            await tx.updateTable(versionedTableName).where("id", "=", encodedId).where("effectiveToCheckpoint", "=", "latest").set({ effectiveToCheckpoint: encodedCheckpoint }).execute();
            const row = tx.insertInto(versionedTableName).values({
              ...latestRow,
              ...updateRow,
              effectiveFromCheckpoint: encodedCheckpoint,
              effectiveToCheckpoint: "latest"
            }).returningAll().executeTakeFirstOrThrow();
            return row;
          })
        );
      });
      return rows.map((row) => decodeRow(row, table, "sqlite"));
    });
  };
  upsert = async ({
    tableName,
    checkpoint,
    id,
    create = {},
    update = {}
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "upsert", tableName }, async () => {
      const encodedId = encodeValue(id, table.id, "sqlite");
      const createRow = encodeRow({ id, ...create }, table, "sqlite");
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const row = await this.db.transaction().execute(async (tx) => {
        const latestRow = await tx.selectFrom(versionedTableName).selectAll().where("id", "=", encodedId).where("effectiveToCheckpoint", "=", "latest").executeTakeFirst();
        if (latestRow === void 0) {
          return await tx.insertInto(versionedTableName).values({
            ...createRow,
            effectiveFromCheckpoint: encodedCheckpoint,
            effectiveToCheckpoint: "latest"
          }).returningAll().executeTakeFirstOrThrow();
        }
        let updateRow;
        if (typeof update === "function") {
          const current = decodeRow(latestRow, table, "sqlite");
          const updateObject = update({ current });
          updateRow = encodeRow({ id, ...updateObject }, table, "sqlite");
        } else {
          updateRow = encodeRow({ id, ...update }, table, "sqlite");
        }
        if (latestRow.effectiveFromCheckpoint > encodedCheckpoint) {
          throw new Error("Cannot update a record in the past");
        }
        if (latestRow.effectiveFromCheckpoint === encodedCheckpoint) {
          return await tx.updateTable(versionedTableName).set(updateRow).where("id", "=", encodedId).where("effectiveFromCheckpoint", "=", encodedCheckpoint).returningAll().executeTakeFirstOrThrow();
        }
        await tx.updateTable(versionedTableName).where("id", "=", encodedId).where("effectiveToCheckpoint", "=", "latest").set({ effectiveToCheckpoint: encodedCheckpoint }).execute();
        const row2 = tx.insertInto(versionedTableName).values({
          ...latestRow,
          ...updateRow,
          effectiveFromCheckpoint: encodedCheckpoint,
          effectiveToCheckpoint: "latest"
        }).returningAll().executeTakeFirstOrThrow();
        return row2;
      });
      return decodeRow(row, table, "sqlite");
    });
  };
  delete = async ({
    tableName,
    checkpoint,
    id
  }) => {
    const versionedTableName = `${tableName}_versioned`;
    const table = this.schema.tables[tableName];
    return this.wrap({ method: "delete", tableName }, async () => {
      const encodedId = encodeValue(id, table.id, "sqlite");
      const encodedCheckpoint = encodeCheckpoint(checkpoint);
      const isDeleted = await this.db.transaction().execute(async (tx) => {
        let deletedRow = await tx.deleteFrom(versionedTableName).where("id", "=", encodedId).where("effectiveFromCheckpoint", "=", encodedCheckpoint).where("effectiveToCheckpoint", "=", "latest").returning(["id"]).executeTakeFirst();
        if (!deletedRow) {
          deletedRow = await tx.updateTable(versionedTableName).set({ effectiveToCheckpoint: encodedCheckpoint }).where("id", "=", encodedId).where("effectiveToCheckpoint", "=", "latest").returning(["id"]).executeTakeFirst();
        }
        return !!deletedRow;
      });
      return isDeleted;
    });
  };
  wrap = async (options, fn) => {
    const start = performance.now();
    const result = await fn();
    this.common.metrics.ponder_indexing_store_method_duration.observe(
      { method: options.method, table: options.tableName },
      performance.now() - start
    );
    return result;
  };
};

// src/config/sources.ts
var sourceIsLogFilter = (source) => source.type === "logFilter";
var sourceIsFactory = (source) => source.type === "factory";

// src/utils/dedupe.ts
var dedupe = (arr) => {
  const seen = /* @__PURE__ */ new Set();
  return arr.filter((x) => {
    if (seen.has(x))
      return false;
    seen.add(x);
    return true;
  });
};

// src/utils/queue.ts
import PQueue from "p-queue";
function createQueue({
  worker,
  options,
  onError,
  onIdle
}) {
  const queue = new PQueue(options);
  if (onIdle) {
    queue.on("idle", () => onIdle());
  }
  queue.addTask = async (task, taskOptions) => {
    const priority = taskOptions?.priority ?? 0;
    try {
      await queue.add(
        () => {
          return worker({
            task,
            queue
          });
        },
        {
          priority
        }
      );
    } catch (error_) {
      await onError?.({ error: error_, task, queue });
    }
  };
  return queue;
}

// src/utils/wait.ts
async function wait(milliseconds) {
  return new Promise((res) => setTimeout(res, milliseconds));
}

// src/indexing/service.ts
import { E_CANCELED as E_CANCELED2, Mutex as Mutex2 } from "async-mutex";
import { decodeEventLog } from "viem";

// src/indexing/context.ts
import {
  checksumAddress,
  createClient
} from "viem";

// src/indexing/ponderActions.ts
import {
  getBalance as viemGetBalance,
  getBytecode as viemGetBytecode,
  getStorageAt as viemGetStorageAt,
  multicall as viemMulticall,
  readContract as viemReadContract
} from "viem/actions";
var ponderActions = (blockNumber) => (client) => ({
  getBalance: ({
    cache,
    ...args
  }) => viemGetBalance(client, {
    ...args,
    ...cache === "immutable" ? { blockTag: "latest" } : { blockNumber }
  }),
  getBytecode: ({
    cache,
    ...args
  }) => viemGetBytecode(client, {
    ...args,
    ...cache === "immutable" ? { blockTag: "latest" } : { blockNumber }
  }),
  getStorageAt: ({
    cache,
    ...args
  }) => viemGetStorageAt(client, {
    ...args,
    ...cache === "immutable" ? { blockTag: "latest" } : { blockNumber }
  }),
  multicall: ({
    cache,
    ...args
  }) => viemMulticall(client, {
    ...args,
    ...cache === "immutable" ? { blockTag: "latest" } : { blockNumber }
  }),
  // @ts-ignore
  readContract: ({
    cache,
    ...args
  }) => viemReadContract(client, {
    ...args,
    ...cache === "immutable" ? { blockTag: "latest" } : { blockNumber }
  })
});

// src/indexing/transport.ts
import { custom, hexToBigInt, maxUint256 } from "viem";
var cachedMethods = [
  "eth_call",
  "eth_getBalance",
  "eth_getCode",
  "eth_getStorageAt"
];
var ponderTransport = ({
  requestQueue,
  syncStore
}) => {
  return ({ chain }) => {
    const c = custom({
      async request({ method, params }) {
        const body = { method, params };
        if (cachedMethods.includes(method)) {
          let request = void 0;
          let blockNumber = void 0;
          if (method === "eth_call") {
            const [{ data, to }, _blockNumber] = params;
            request = `${method}_${toLowerCase(to)}_${toLowerCase(
              data
            )}`;
            blockNumber = _blockNumber;
          } else if (method === "eth_getBalance") {
            const [address, _blockNumber] = params;
            request = `${method}_${toLowerCase(address)}`;
            blockNumber = _blockNumber;
          } else if (method === "eth_getCode") {
            const [address, _blockNumber] = params;
            request = `${method}_${toLowerCase(address)}`;
            blockNumber = _blockNumber;
          } else if (method === "eth_getStorageAt") {
            const [address, slot, _blockNumber] = params;
            request = `${method}_${toLowerCase(
              address
            )}_${toLowerCase(slot)}`;
            blockNumber = _blockNumber;
          }
          const blockNumberBigInt = blockNumber === "latest" ? maxUint256 : hexToBigInt(blockNumber);
          const cachedResult = await syncStore.getRpcRequestResult({
            blockNumber: blockNumberBigInt,
            chainId: chain.id,
            request
          });
          if (cachedResult?.result)
            return cachedResult.result;
          else {
            const response = await requestQueue.request(body);
            await syncStore.insertRpcRequestResult({
              blockNumber: blockNumberBigInt,
              chainId: chain.id,
              request,
              result: response
            });
            return response;
          }
        } else {
          return requestQueue.request(body);
        }
      }
    });
    return c({ chain });
  };
};

// src/indexing/context.ts
var buildNetwork = ({ networks }) => {
  const _networks = {};
  for (const network of networks) {
    _networks[network.chainId] = network.name;
  }
  return (checkpoint) => ({
    chainId: checkpoint.chainId,
    name: _networks[checkpoint.chainId]
  });
};
var buildClient = ({
  networks,
  requestQueues,
  syncStore
}) => (checkpoint) => {
  const index = networks.findIndex((n) => n.chainId === checkpoint.chainId);
  return createClient({
    transport: ponderTransport({
      requestQueue: requestQueues[index],
      syncStore
    }),
    chain: networks[index].chain
  }).extend(ponderActions(BigInt(checkpoint.blockNumber)));
};
var buildDb = ({
  common,
  indexingStore,
  schema
}) => (checkpoint) => {
  return Object.keys(schema.tables).reduce((acc, tableName) => {
    acc[tableName] = {
      findUnique: async ({ id }) => {
        common.logger.trace({
          service: "store",
          msg: `${tableName}.findUnique(id=${id})`
        });
        return await indexingStore.findUnique({
          tableName,
          checkpoint,
          id
        });
      },
      findMany: async ({ where, orderBy, limit, before, after } = {}) => {
        common.logger.trace({
          service: "store",
          msg: `${tableName}.findMany`
        });
        return await indexingStore.findMany({
          tableName,
          checkpoint,
          where,
          orderBy,
          limit,
          before,
          after
        });
      },
      create: async ({ id, data }) => {
        common.logger.trace({
          service: "store",
          msg: `${tableName}.create(id=${id})`
        });
        return await indexingStore.create({
          tableName,
          checkpoint,
          id,
          data
        });
      },
      createMany: async ({ data }) => {
        common.logger.trace({
          service: "store",
          msg: `${tableName}.createMany(count=${data.length})`
        });
        return await indexingStore.createMany({
          tableName,
          checkpoint,
          data
        });
      },
      update: async ({ id, data }) => {
        common.logger.trace({
          service: "store",
          msg: `${tableName}.update(id=${id})`
        });
        return await indexingStore.update({
          tableName,
          checkpoint,
          id,
          data
        });
      },
      updateMany: async ({ where, data }) => {
        common.logger.trace({
          service: "store",
          msg: `${tableName}.updateMany`
        });
        return await indexingStore.updateMany({
          tableName,
          checkpoint,
          where,
          data
        });
      },
      upsert: async ({ id, create, update }) => {
        common.logger.trace({
          service: "store",
          msg: `${tableName}.upsert(id=${id})`
        });
        return await indexingStore.upsert({
          tableName,
          checkpoint,
          id,
          create,
          update
        });
      },
      delete: async ({ id }) => {
        common.logger.trace({
          service: "store",
          msg: `${tableName}.delete(id=${id})`
        });
        return await indexingStore.delete({
          tableName,
          checkpoint,
          id
        });
      }
    };
    return acc;
  }, {});
};
var buildContracts = ({ sources }) => {
  const contracts = {};
  for (const source of sources) {
    const address = typeof source.criteria.address === "string" ? source.criteria.address : void 0;
    if (contracts[source.chainId] === void 0) {
      contracts[source.chainId] = {};
    }
    contracts[source.chainId][source.contractName] = {
      abi: source.abi,
      address: address ? checksumAddress(address) : address,
      startBlock: source.startBlock,
      endBlock: source.endBlock,
      maxBlockRange: source.maxBlockRange
    };
  }
  return (checkpoint) => contracts[checkpoint.chainId];
};

// src/indexing/trace.ts
import { readFileSync as readFileSync2 } from "node:fs";
import { codeFrameColumns as codeFrameColumns2 } from "@babel/code-frame";
import { parse as parseStackTrace2 } from "stacktrace-parser";
var addUserStackTrace = (error, options) => {
  if (!error.stack)
    return;
  const stackTrace = parseStackTrace2(error.stack);
  let codeFrame;
  let userStackTrace;
  const firstUserFrameIndex = stackTrace.findIndex(
    (frame) => frame.file?.includes(options.srcDir)
  );
  if (firstUserFrameIndex >= 0) {
    userStackTrace = stackTrace.filter(
      (frame) => frame.file?.includes(options.srcDir)
    );
    const firstUserFrame = stackTrace[firstUserFrameIndex];
    if (firstUserFrame?.file && firstUserFrame?.lineNumber) {
      try {
        const sourceContent = readFileSync2(firstUserFrame.file, {
          encoding: "utf-8"
        });
        codeFrame = codeFrameColumns2(
          sourceContent,
          {
            start: {
              line: firstUserFrame.lineNumber,
              column: firstUserFrame.column ?? void 0
            }
          },
          { highlightCode: true }
        );
      } catch (err) {
      }
    }
  } else {
    userStackTrace = stackTrace;
  }
  const formattedStackTrace = [
    `${error.name}: ${error.message}`,
    ...userStackTrace.map(({ file, lineNumber, column, methodName }) => {
      const prefix = "    at";
      const path10 = `${file}${lineNumber !== null ? `:${lineNumber}` : ""}${column !== null ? `:${column}` : ""}`;
      if (methodName === null || methodName === "<unknown>") {
        return `${prefix} ${path10}`;
      } else {
        return `${prefix} ${methodName} (${path10})`;
      }
    }),
    codeFrame
  ].join("\n");
  error.stack = formattedStackTrace;
};

// src/indexing/service.ts
var MAX_BATCH_SIZE3 = 1e4;
var IndexingService = class extends Emittery {
  common;
  indexingStore;
  syncGatewayService;
  sources;
  networks;
  isPaused = false;
  indexingFunctions;
  schema;
  tableAccess;
  queue;
  getNetwork = void 0;
  getClient = void 0;
  getDB = void 0;
  getContracts = void 0;
  isSetupStarted;
  indexingFunctionStates = {};
  taskBatchSize = MAX_BATCH_SIZE3;
  sourceById = {};
  constructor({
    common,
    syncStore,
    indexingStore,
    syncGatewayService,
    networks,
    requestQueues,
    sources
  }) {
    super();
    this.common = common;
    this.indexingStore = indexingStore;
    this.syncGatewayService = syncGatewayService;
    this.sources = sources;
    this.networks = networks;
    this.isSetupStarted = false;
    this.buildSourceById();
    this.getNetwork = buildNetwork({
      networks
    });
    this.getClient = buildClient({
      networks,
      requestQueues,
      syncStore
    });
    this.getContracts = buildContracts({
      sources
    });
  }
  kill = () => {
    this.isPaused = true;
    this.queue?.pause();
    this.queue?.clear();
    for (const key of Object.keys(this.indexingFunctionStates)) {
      this.indexingFunctionStates[key].loadingMutex.cancel();
    }
    this.common.logger.debug({
      service: "indexing",
      msg: "Killed indexing service"
    });
  };
  onIdle = () => this.queue.onIdle();
  /**
   * Registers a new set of indexing functions, schema, or table accesss, cancels
   * the database mutexes & event queue, drops and re-creates
   * all tables from the indexing store, and rebuilds the indexing function map state.
   *
   * Note: Caller should (probably) immediately call processEvents after this method.
   */
  reset = async ({
    indexingFunctions: newIndexingFunctions,
    schema: newSchema,
    tableAccess: newTableAccess
  } = {}) => {
    if (newSchema) {
      this.schema = newSchema;
      this.getDB = buildDb({
        common: this.common,
        indexingStore: this.indexingStore,
        schema: this.schema
      });
    }
    if (newIndexingFunctions) {
      this.indexingFunctions = newIndexingFunctions;
    }
    if (newTableAccess) {
      this.tableAccess = newTableAccess;
    }
    if (this.indexingFunctions === void 0 || this.sources === void 0 || this.tableAccess === void 0)
      return;
    this.isPaused = true;
    this.queue?.pause();
    for (const state of Object.values(this.indexingFunctionStates)) {
      state.loadingMutex.cancel();
    }
    this.queue?.clear();
    await this.queue?.onIdle();
    this.isSetupStarted = false;
    this.buildIndexingFunctionStates();
    this.createEventQueue();
    this.common.logger.debug({
      service: "indexing",
      msg: "Paused event queue"
    });
    this.isPaused = false;
    this.common.metrics.ponder_indexing_has_error.set(0);
    this.common.metrics.ponder_indexing_total_seconds.reset();
    this.common.metrics.ponder_indexing_completed_seconds.reset();
    this.common.metrics.ponder_indexing_completed_events.reset();
    await this.indexingStore.reload({ schema: this.schema });
    this.common.logger.debug({
      service: "indexing",
      msg: "Reset indexing store"
    });
    this.common.metrics.ponder_indexing_completed_timestamp.set(0);
  };
  /**
   * Processes all newly available events.
   */
  processEvents = async () => {
    if (Object.keys(this.indexingFunctionStates).length === 0 || this.queue === void 0 || this.isPaused)
      return;
    if (!this.isSetupStarted) {
      this.isSetupStarted = true;
      this.enqueueSetupTasks();
    }
    this.queue.start();
    await this.queue.onIdle();
    await Promise.all(
      Object.entries(this.indexingFunctionStates).map(
        ([key, state]) => state.loadingMutex.runExclusive(
          () => this.loadIndexingFunctionTasks(key)
        )
      )
    );
    this.enqueueLogEventTasks();
    await this.queue.onIdle();
  };
  /**
   * This method is triggered by the realtime sync service detecting a reorg,
   * which can happen at any time. The event queue and the indexing store can be
   * in one of several different states that we need to keep in mind:
   *
   * 1) No events have been added to the queue yet.
   * 2) No unsafe events have been processed (checkpoint <= safeCheckpoint).
   * 3) Unsafe events may have been processed (checkpoint > safeCheckpoint).
   * 4) The queue has encountered a user error and is waiting for a reload.
   *
   * Note: It's crucial that we acquire all mutex locks while handling the reorg.
   * This will only ever run while the queue is idle, so we can be confident
   * that checkpoint matches the current state of the indexing store,
   * and that no unsafe events will get processed after handling the reorg.
   *
   * Note: Caller should (probably) immediately call processEvents after this method.
   */
  handleReorg = async (safeCheckpoint) => {
    if (this.isPaused)
      return;
    let releases = [];
    try {
      releases = await Promise.all(
        Object.values(this.indexingFunctionStates).map(
          (indexFunc) => indexFunc.loadingMutex.acquire()
        )
      );
      const hasProcessedInvalidEvents = Object.values(
        this.indexingFunctionStates
      ).some(
        (state) => isCheckpointGreaterThan(
          state.tasksProcessedToCheckpoint,
          safeCheckpoint
        )
      );
      if (!hasProcessedInvalidEvents) {
        this.common.logger.debug({
          service: "indexing",
          msg: "No unsafe events were detected while reconciling a reorg, no-op"
        });
        return;
      }
      await this.indexingStore.revert({ checkpoint: safeCheckpoint });
      this.common.metrics.ponder_indexing_completed_timestamp.set(
        safeCheckpoint.blockTimestamp
      );
      this.common.logger.debug({
        service: "indexing",
        msg: `Reverted indexing store to safe timestamp ${safeCheckpoint.blockTimestamp}`
      });
      for (const state of Object.values(this.indexingFunctionStates)) {
        if (isCheckpointGreaterThan(
          state.tasksProcessedToCheckpoint,
          safeCheckpoint
        )) {
          state.tasksProcessedToCheckpoint = safeCheckpoint;
        }
        if (isCheckpointGreaterThan(
          state.tasksLoadedFromCheckpoint,
          safeCheckpoint
        )) {
          state.tasksLoadedFromCheckpoint = safeCheckpoint;
        }
        if (isCheckpointGreaterThan(state.tasksLoadedToCheckpoint, safeCheckpoint)) {
          state.tasksLoadedToCheckpoint = safeCheckpoint;
        }
      }
    } catch (error) {
      if (error !== E_CANCELED2)
        throw error;
    } finally {
      for (const release of releases) {
        release();
      }
    }
  };
  /**
   * Adds "setup" tasks to the queue for all chains if the indexing function is defined.
   */
  enqueueSetupTasks = () => {
    for (const contractName of Object.keys(this.indexingFunctions)) {
      if (this.indexingFunctions[contractName].setup === void 0)
        continue;
      for (const network of this.networks) {
        const source = this.sources.find(
          (s) => s.contractName === contractName && s.chainId === network.chainId
        );
        const checkpoint = {
          ...zeroCheckpoint,
          chainId: network.chainId,
          blockNumber: source.startBlock
        };
        this.queue.addTask({
          kind: "SETUP",
          data: {
            networkName: network.name,
            contractName,
            checkpoint
          }
        });
      }
    }
  };
  /**
   * Implements the core concurrency engine, responsible for ordering tasks.
   * There are several cases to consider and optimize:
   *
   * 1) A task is only dependent on itself, should be run serially.
   * 2) A task is not dependent, can be run entirely concurrently.
   * 3) A task is dependent on a combination of parents and itself,
   *    should be run serially.
   * 4) A task is dependent on parents, and should onlybe run when
   *    all previous dependent tasks are complete.
   */
  enqueueLogEventTasks = () => {
    for (const key of Object.keys(this.indexingFunctionStates)) {
      const state = this.indexingFunctionStates[key];
      const tasks = state.loadedTasks;
      if (tasks.length === 0)
        continue;
      if (state.parents.length === 0 && state.isSelfDependent && isCheckpointGreaterThanOrEqualTo(
        state.tasksLoadedFromCheckpoint,
        tasks[0].data.checkpoint
      )) {
        const taskToEnqueue = tasks.shift();
        this.queue.addTask(taskToEnqueue);
      } else if (state.parents.length === 0 && !state.isSelfDependent) {
        for (const task of tasks) {
          this.queue.addTask(task);
        }
        state.loadedTasks = [];
      } else if (state.parents.length !== 0) {
        const parentLoadedFromCheckpoints = state.parents.map(
          (p) => this.indexingFunctionStates[p].tasksLoadedFromCheckpoint
        );
        if (state.isSelfDependent && isCheckpointGreaterThanOrEqualTo(
          checkpointMin(
            ...parentLoadedFromCheckpoints,
            state.tasksLoadedFromCheckpoint
          ),
          tasks[0].data.checkpoint
        )) {
          const taskToEnqueue = tasks.shift();
          this.queue.addTask(taskToEnqueue);
        } else if (!state.isSelfDependent) {
          const minParentCheckpoint = checkpointMin(
            ...parentLoadedFromCheckpoints
          );
          const maxCheckpointIndex = tasks.findIndex(
            (task) => isCheckpointGreaterThan(task.data.checkpoint, minParentCheckpoint)
          );
          if (maxCheckpointIndex === -1) {
            for (const task of tasks) {
              this.queue.addTask(task);
            }
            state.loadedTasks = [];
          } else {
            const tasksToEnqueue = tasks.splice(0, maxCheckpointIndex);
            for (const task of tasksToEnqueue) {
              this.queue.addTask(task);
            }
          }
        }
      }
    }
  };
  executeSetupTask = async (task) => {
    const data = task.data;
    const fullEventName = `${data.contractName}:setup`;
    const indexingFunction = this.indexingFunctions[data.contractName].setup;
    for (let i = 0; i < 4; i++) {
      try {
        this.common.logger.trace({
          service: "indexing",
          msg: `Started indexing function (event="${fullEventName}", block=${data.checkpoint.blockNumber})`
        });
        if (this.isPaused)
          return;
        await indexingFunction({
          context: {
            network: this.getNetwork(data.checkpoint),
            client: this.getClient(data.checkpoint),
            db: this.getDB(data.checkpoint),
            contracts: this.getContracts(data.checkpoint)
          }
        });
        this.common.logger.trace({
          service: "indexing",
          msg: `Completed indexing function (event="${fullEventName}", block=${data.checkpoint.blockNumber})`
        });
        const labels = {
          network: data.networkName,
          event: `${data.contractName}:setup`
        };
        this.common.metrics.ponder_indexing_completed_events.inc(labels);
        break;
      } catch (error_) {
        const error = error_;
        if (i === 3) {
          this.isPaused = true;
          this.queue.pause();
          this.queue.clear();
          addUserStackTrace(error, this.common.options);
          this.common.logger.error({
            service: "indexing",
            msg: `Error while processing "setup" event: ${error.message}`,
            error
          });
          this.common.metrics.ponder_indexing_has_error.set(1);
          this.emit("error", { error });
        } else {
          this.common.logger.warn({
            service: "indexing",
            msg: `Indexing function failed, retrying... (event=${fullEventName}, error=${error.name}: ${error.message})`
          });
          await this.indexingStore.revert({
            checkpoint: data.checkpoint
          });
        }
      }
    }
  };
  executeLogEventTask = async (task) => {
    const data = task.data;
    const fullEventName = `${data.contractName}:${data.eventName}`;
    const indexingFunction = this.indexingFunctions[data.contractName][data.eventName];
    for (let i = 0; i < 4; i++) {
      try {
        if (this.isPaused)
          return;
        this.common.logger.trace({
          service: "indexing",
          msg: `Started indexing function (event="${fullEventName}", block=${data.checkpoint.blockNumber})`
        });
        await indexingFunction({
          event: {
            name: data.eventName,
            ...data.event
          },
          context: {
            network: this.getNetwork(data.checkpoint),
            client: this.getClient(data.checkpoint),
            db: this.getDB(data.checkpoint),
            contracts: this.getContracts(data.checkpoint)
          }
        });
        const state = this.indexingFunctionStates[fullEventName];
        if (data.endCheckpoint === void 0) {
          state.tasksProcessedToCheckpoint = checkpointMax(
            state.tasksProcessedToCheckpoint,
            data.checkpoint
          );
        } else {
          state.tasksProcessedToCheckpoint = checkpointMax(
            state.tasksProcessedToCheckpoint,
            data.endCheckpoint
          );
          this.emitCheckpoint();
        }
        if (state.loadedTasks.length > 0) {
          state.tasksLoadedFromCheckpoint = state.loadedTasks[0].data.checkpoint;
        } else {
          state.tasksLoadedFromCheckpoint = state.tasksLoadedToCheckpoint;
        }
        if (data.eventsProcessed) {
          const num = data.eventsProcessed;
          this.common.logger.info({
            service: "indexing",
            msg: `Indexed ${num === 1 ? `1 ${fullEventName} event` : `${num} ${fullEventName} events`} (chainId=${data.checkpoint.chainId} block=${data.checkpoint.blockNumber} logIndex=${data.checkpoint.logIndex})`
          });
        }
        this.common.logger.trace({
          service: "indexing",
          msg: `Completed indexing function (event="${fullEventName}", block=${data.checkpoint.blockNumber})`
        });
        this.updateCompletedSeconds(fullEventName);
        const labels = {
          network: data.networkName,
          event: `${data.contractName}:${data.eventName}`
        };
        this.common.metrics.ponder_indexing_completed_events.inc(labels);
        break;
      } catch (error_) {
        const error = error_;
        if (i === 3) {
          this.isPaused = true;
          this.queue.pause();
          this.queue.clear();
          addUserStackTrace(error, this.common.options);
          if (error.meta) {
            error.meta += `
Event args:
${prettyPrint(data.event.args)}`;
          } else {
            error.meta = `Event args:
${prettyPrint(data.event.args)}`;
          }
          this.common.logger.error({
            service: "indexing",
            msg: `Error while processing "${fullEventName}" event at block ${data.checkpoint.blockNumber}:`,
            error
          });
          this.common.metrics.ponder_indexing_has_error.set(1);
          this.emit("error", { error });
        } else {
          this.common.logger.warn({
            service: "indexing",
            msg: `Indexing function failed, retrying... (event=${fullEventName}, block=${data.checkpoint.blockNumber}, error=${`${error.name}: ${error.message}`})`
          });
          await this.indexingStore.revert({
            checkpoint: data.checkpoint
          });
        }
      }
    }
    if (this.isPaused)
      return;
    await this.indexingFunctionStates[fullEventName].loadingMutex.runExclusive(
      () => this.loadIndexingFunctionTasks(fullEventName)
    );
    if (this.isPaused)
      return;
    this.enqueueLogEventTasks();
  };
  createEventQueue = () => {
    const indexingFunctionWorker = async ({
      task
    }) => {
      if (Math.floor(Math.random() * 100) === 69)
        await wait(0);
      switch (task.kind) {
        case "SETUP": {
          await this.executeSetupTask(task);
          break;
        }
        case "LOG": {
          await this.executeLogEventTask(task);
          break;
        }
      }
    };
    this.queue = createQueue({
      worker: indexingFunctionWorker,
      options: {
        concurrency: 10,
        autoStart: false
      }
    });
  };
  /**
   * Load a batch of indexing function tasks from the sync store into memory.
   */
  loadIndexingFunctionTasks = async (key) => {
    const state = this.indexingFunctionStates[key];
    const tasks = state.loadedTasks;
    if (tasks.length > 0 || isCheckpointEqual(
      state.tasksLoadedToCheckpoint,
      this.syncGatewayService.checkpoint
    )) {
      return;
    }
    const fromCheckpoint = state.tasksLoadedToCheckpoint;
    const toCheckpoint = this.syncGatewayService.checkpoint;
    const result = await this.syncGatewayService.getEvents({
      fromCheckpoint,
      toCheckpoint,
      limit: this.taskBatchSize,
      logFilters: state.sources.filter(sourceIsLogFilter).map((logFilter) => ({
        id: logFilter.id,
        chainId: logFilter.chainId,
        criteria: logFilter.criteria,
        fromBlock: logFilter.startBlock,
        toBlock: logFilter.endBlock,
        includeEventSelectors: [state.eventSelector]
      })),
      factories: state.sources.filter(sourceIsFactory).map((factory) => ({
        id: factory.id,
        chainId: factory.chainId,
        criteria: factory.criteria,
        fromBlock: factory.startBlock,
        toBlock: factory.endBlock,
        includeEventSelectors: [state.eventSelector]
      }))
    });
    const { events, hasNextPage, lastCheckpointInPage, lastCheckpoint } = result;
    for (const event of events) {
      try {
        const decodedLog = decodeEventLog({
          abi: [state.abiEvent],
          data: event.log.data,
          topics: event.log.topics
        });
        tasks.push({
          kind: "LOG",
          data: {
            networkName: this.sourceById[event.sourceId].networkName,
            contractName: state.contractName,
            eventName: state.eventName,
            event: {
              args: decodedLog.args ?? {},
              log: event.log,
              block: event.block,
              transaction: event.transaction
            },
            checkpoint: {
              blockNumber: Number(event.block.number),
              blockTimestamp: Number(event.block.timestamp),
              chainId: event.chainId,
              logIndex: event.log.logIndex
            }
          }
        });
      } catch (err) {
        this.common.logger.debug({
          service: "app",
          msg: `Unable to decode log, skipping it. id: ${event.log.id}, data: ${event.log.data}, topics: ${event.log.topics}`
        });
      }
    }
    state.tasksLoadedToCheckpoint = hasNextPage ? lastCheckpointInPage : toCheckpoint;
    if (tasks.length > 0) {
      state.tasksLoadedFromCheckpoint = tasks[0].data.checkpoint;
      tasks[tasks.length - 1].data.endCheckpoint = state.tasksLoadedToCheckpoint;
      tasks[tasks.length - 1].data.eventsProcessed = events.length;
    } else {
      state.tasksProcessedToCheckpoint = state.tasksLoadedToCheckpoint;
      state.tasksLoadedFromCheckpoint = state.tasksLoadedToCheckpoint;
      this.emitCheckpoint();
    }
    if (state.firstEventCheckpoint === void 0 && tasks.length > 0) {
      state.firstEventCheckpoint = tasks[0].data.checkpoint;
    }
    state.lastEventCheckpoint = lastCheckpoint ?? toCheckpoint;
    this.updateTotalSeconds(key);
  };
  emitCheckpoint = () => {
    const checkpoint = checkpointMin(
      ...Object.values(this.indexingFunctionStates).map(
        (state) => state.tasksProcessedToCheckpoint
      )
    );
    this.emit("eventsProcessed", { toCheckpoint: checkpoint });
    this.common.metrics.ponder_indexing_completed_timestamp.set(
      checkpoint.blockTimestamp
    );
  };
  buildSourceById = () => {
    for (const source of this.sources) {
      this.sourceById[source.id] = source;
    }
  };
  buildIndexingFunctionStates = () => {
    if (this.indexingFunctions === void 0 || this.sources === void 0 || this.tableAccess === void 0)
      return;
    this.indexingFunctionStates = {};
    for (const contractName of Object.keys(this.indexingFunctions)) {
      for (const eventName of Object.keys(
        this.indexingFunctions[contractName]
      )) {
        if (eventName === "setup")
          continue;
        const indexingFunctionKey = `${contractName}:${eventName}`;
        const tableReads = this.tableAccess.filter(
          (t) => t.indexingFunctionKey === indexingFunctionKey && t.access === "read"
        ).map((t) => t.table);
        const parents = this.tableAccess.filter(
          (t) => !t.indexingFunctionKey.includes(":setup") && t.access === "write" && tableReads.includes(t.table) && t.indexingFunctionKey !== indexingFunctionKey
        ).map((t) => t.indexingFunctionKey);
        const isSelfDependent = this.tableAccess.some(
          (t) => t.access === "write" && tableReads.includes(t.table) && t.indexingFunctionKey === indexingFunctionKey
        );
        const keySources = this.sources.filter(
          (s) => s.contractName === contractName
        );
        const i = this.sources.findIndex(
          (s) => s.contractName === contractName && s.abiEvents.bySafeName[eventName] !== void 0
        );
        const abiEvent = this.sources[i].abiEvents.bySafeName[eventName].item;
        const eventSelector = this.sources[i].abiEvents.bySafeName[eventName].selector;
        this.common.logger.debug({
          service: "indexing",
          msg: `Registered indexing function ${indexingFunctionKey} (selfDependent=${isSelfDependent}, parents=[${dedupe(
            parents
          ).join(", ")}])`
        });
        this.indexingFunctionStates[indexingFunctionKey] = {
          eventName,
          contractName,
          parents: dedupe(parents),
          isSelfDependent,
          sources: keySources,
          abiEvent,
          eventSelector,
          tasksProcessedToCheckpoint: zeroCheckpoint,
          tasksLoadedFromCheckpoint: zeroCheckpoint,
          tasksLoadedToCheckpoint: zeroCheckpoint,
          loadedTasks: [],
          loadingMutex: new Mutex2()
        };
      }
    }
    this.taskBatchSize = Math.floor(
      MAX_BATCH_SIZE3 / Object.keys(this.indexingFunctionStates).length
    );
  };
  updateCompletedSeconds = (key) => {
    const state = this.indexingFunctionStates[key];
    if (state.firstEventCheckpoint === void 0 || state.lastEventCheckpoint === void 0)
      return;
    this.common.metrics.ponder_indexing_completed_seconds.set(
      { event: `${state.contractName}:${state.eventName}` },
      Math.min(
        state.tasksProcessedToCheckpoint.blockTimestamp,
        state.lastEventCheckpoint.blockTimestamp
      ) - state.firstEventCheckpoint.blockTimestamp
    );
  };
  updateTotalSeconds = (key) => {
    const state = this.indexingFunctionStates[key];
    if (state.firstEventCheckpoint === void 0 || state.lastEventCheckpoint === void 0)
      return;
    this.common.metrics.ponder_indexing_total_seconds.set(
      { event: `${state.contractName}:${state.eventName}` },
      state.lastEventCheckpoint.blockTimestamp - state.firstEventCheckpoint.blockTimestamp
    );
  };
};

// src/logger/service.ts
import path7 from "node:path";
import pc from "picocolors";
import { pino } from "pino";
var timeFormatter = new Intl.DateTimeFormat(void 0, {
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
});
var LoggerService = class {
  logger;
  constructor({
    level = "info",
    dir
  } = {}) {
    const streams = [];
    if (level !== "silent") {
      streams.push({
        level,
        stream: {
          write(logString) {
            const log = JSON.parse(logString);
            const prettyLog = formatMessage(log);
            console.log(prettyLog);
            if (log.error?.stack)
              console.log(log.error.stack);
            if (log.error?.meta)
              console.log(log.error.meta);
          }
        }
      });
    }
    if (dir) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:.]/g, "_");
      const logFile = path7.join(dir, `${timestamp}.log`);
      streams.push({
        level: "trace",
        stream: pino.destination({ dest: logFile, sync: false, mkdir: true })
      });
    }
    this.logger = pino(
      {
        level: "trace",
        serializers: { error: pino.stdSerializers.errWithCause }
      },
      pino.multistream(streams)
    );
  }
  fatal = (options) => {
    this.logger.fatal(options);
  };
  error = (options) => {
    this.logger.error(options);
  };
  warn = (options) => {
    this.logger.warn(options);
  };
  info = (options) => {
    this.logger.info(options);
  };
  debug = (options) => {
    this.logger.debug(options);
  };
  trace = (options) => {
    this.logger.trace(options);
  };
};
var levels = {
  60: { label: "FATAL", colorize: (s) => pc.bgRed(s) },
  50: { label: "ERROR", colorize: (s) => pc.red(s) },
  40: { label: "WARN ", colorize: (s) => pc.yellow(s) },
  30: { label: "INFO ", colorize: (s) => pc.green(s) },
  20: { label: "DEBUG", colorize: (s) => pc.blue(s) },
  10: { label: "TRACE", colorize: (s) => pc.gray(s) }
};
var formatMessage = (log) => {
  let result = "";
  const timestamp = log.time;
  const time = timeFormatter.format(new Date(timestamp));
  const level = levels[log.level ?? 30];
  const msg = log.msg;
  const errorMessage = log.error?.message;
  const message = msg ?? errorMessage;
  const service = log.service;
  result += pc.isColorSupported ? pc.gray(`${time} `) : `${time} `;
  result += pc.isColorSupported ? level.colorize(level.label) : level.label;
  if (service)
    result += pc.isColorSupported ? ` ${pc.cyan(service.padEnd(10, " "))}` : ` ${service.padEnd(10, " ")}`;
  result += pc.reset(` ${message}`);
  return result;
};

// src/metrics/service.ts
import prometheus from "prom-client";
var httpRequestBucketsInMs = [
  0.1,
  0.25,
  0.5,
  0.75,
  1,
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1e3,
  2e3,
  4e3,
  8e3,
  16e3,
  32e3
];
var httpRequestSizeInBytes = [
  10,
  50,
  100,
  250,
  500,
  1e3,
  2500,
  5e3,
  1e4,
  5e4,
  1e5,
  25e4,
  5e5,
  1e6,
  5e6,
  1e7
];
var MetricsService = class {
  registry;
  ponder_rpc_request_duration;
  ponder_rpc_request_lag;
  ponder_historical_start_timestamp;
  ponder_historical_total_blocks;
  ponder_historical_cached_blocks;
  ponder_historical_completed_blocks;
  ponder_realtime_is_connected;
  ponder_realtime_latest_block_number;
  ponder_realtime_latest_block_timestamp;
  ponder_realtime_reorg_total;
  ponder_indexing_total_seconds;
  ponder_indexing_completed_seconds;
  ponder_indexing_completed_events;
  ponder_indexing_completed_timestamp;
  ponder_indexing_has_error;
  ponder_server_port;
  ponder_server_request_size;
  ponder_server_response_size;
  ponder_server_response_duration;
  ponder_sync_store_method_duration;
  ponder_indexing_store_method_duration;
  ponder_postgres_idle_connection_count = null;
  ponder_postgres_total_connection_count = null;
  ponder_postgres_request_queue_count = null;
  ponder_postgres_query_count = null;
  ponder_sqlite_query_count = null;
  constructor() {
    this.registry = new prometheus.Registry();
    prometheus.collectDefaultMetrics({
      register: this.registry,
      prefix: "ponder_default_"
    });
    this.ponder_rpc_request_duration = new prometheus.Histogram({
      name: "ponder_rpc_request_duration",
      help: "Duration of RPC requests",
      labelNames: ["network", "method"],
      buckets: httpRequestBucketsInMs,
      registers: [this.registry]
    });
    this.ponder_rpc_request_lag = new prometheus.Histogram({
      name: "ponder_rpc_request_lag",
      help: "Time RPC requests spend waiting in the request queue",
      labelNames: ["network", "method"],
      buckets: httpRequestBucketsInMs,
      registers: [this.registry]
    });
    this.ponder_historical_start_timestamp = new prometheus.Gauge({
      name: "ponder_historical_start_timestamp",
      help: "Unix timestamp (ms) when the historical sync service started",
      labelNames: ["network"],
      registers: [this.registry]
    });
    this.ponder_historical_total_blocks = new prometheus.Gauge({
      name: "ponder_historical_total_blocks",
      help: "Number of blocks required for the historical sync",
      labelNames: ["network", "contract"],
      registers: [this.registry]
    });
    this.ponder_historical_cached_blocks = new prometheus.Gauge({
      name: "ponder_historical_cached_blocks",
      help: "Number of blocks that were found in the cache for the historical sync",
      labelNames: ["network", "contract"],
      registers: [this.registry]
    });
    this.ponder_historical_completed_blocks = new prometheus.Gauge({
      name: "ponder_historical_completed_blocks",
      help: "Number of blocks that have been processed for the historical sync",
      labelNames: ["network", "contract"],
      registers: [this.registry]
    });
    this.ponder_realtime_is_connected = new prometheus.Gauge({
      name: "ponder_realtime_is_connected",
      help: "Boolean (0 or 1) indicating if the historical sync service is connected",
      labelNames: ["network"],
      registers: [this.registry]
    });
    this.ponder_realtime_latest_block_number = new prometheus.Gauge({
      name: "ponder_realtime_latest_block_number",
      help: "Block number of the latest synced block",
      labelNames: ["network"],
      registers: [this.registry]
    });
    this.ponder_realtime_latest_block_timestamp = new prometheus.Gauge({
      name: "ponder_realtime_latest_block_timestamp",
      help: "Block timestamp of the latest synced block",
      labelNames: ["network"],
      registers: [this.registry]
    });
    this.ponder_realtime_reorg_total = new prometheus.Counter({
      name: "ponder_realtime_reorg_total",
      help: "Count of how many re-orgs have occurred.",
      labelNames: ["network"],
      registers: [this.registry]
    });
    this.ponder_indexing_total_seconds = new prometheus.Gauge({
      name: "ponder_indexing_total_seconds",
      help: "Total number of seconds that are required",
      labelNames: ["event"],
      registers: [this.registry]
    });
    this.ponder_indexing_completed_seconds = new prometheus.Gauge({
      name: "ponder_indexing_completed_seconds",
      help: "Number of seconds that have been completed",
      labelNames: ["event"],
      registers: [this.registry]
    });
    this.ponder_indexing_completed_events = new prometheus.Gauge({
      name: "ponder_indexing_completed_events",
      help: "Number of events that have been processed",
      labelNames: ["network", "event"],
      registers: [this.registry]
    });
    this.ponder_indexing_completed_timestamp = new prometheus.Gauge({
      name: "ponder_indexing_completed_timestamp",
      help: "Timestamp through which all events have been completed",
      registers: [this.registry]
    });
    this.ponder_indexing_has_error = new prometheus.Gauge({
      name: "ponder_indexing_has_error",
      help: "Boolean (0 or 1) indicating if an error was encountered while running user code",
      registers: [this.registry]
    });
    this.ponder_server_port = new prometheus.Gauge({
      name: "ponder_server_port",
      help: "Port that the server is listening on",
      registers: [this.registry]
    });
    this.ponder_server_request_size = new prometheus.Histogram({
      name: "ponder_server_request_size",
      help: "Size of HTTP requests received by the server",
      labelNames: ["method", "path", "status"],
      buckets: httpRequestSizeInBytes,
      registers: [this.registry]
    });
    this.ponder_server_response_size = new prometheus.Histogram({
      name: "ponder_server_response_size",
      help: "Size of HTTP responses served the server",
      labelNames: ["method", "path", "status"],
      buckets: httpRequestSizeInBytes,
      registers: [this.registry]
    });
    this.ponder_server_response_duration = new prometheus.Histogram({
      name: "ponder_server_response_duration",
      help: "Duration of HTTP responses served the server",
      labelNames: ["method", "path", "status"],
      buckets: httpRequestSizeInBytes,
      registers: [this.registry]
    });
    this.ponder_sync_store_method_duration = new prometheus.Histogram({
      name: "ponder_sync_store_method_duration",
      help: "Duration of database operations in the sync store",
      labelNames: ["method"],
      buckets: httpRequestBucketsInMs,
      registers: [this.registry]
    });
    this.ponder_indexing_store_method_duration = new prometheus.Histogram({
      name: "ponder_indexing_store_method_duration",
      help: "Duration of database operations in the sync store",
      labelNames: ["table", "method"],
      buckets: httpRequestBucketsInMs,
      registers: [this.registry]
    });
  }
  registerDatabaseMetrics(database) {
    if (database.sync.kind === "postgres") {
      this.registry.removeSingleMetric("ponder_postgres_query_count");
      this.ponder_postgres_query_count = new prometheus.Counter({
        name: "ponder_postgres_query_count",
        help: "Number of queries executed by Postgres",
        labelNames: ["kind"],
        registers: [this.registry]
      });
      const pool = database.sync.pool;
      this.registry.removeSingleMetric("ponder_postgres_idle_connection_count");
      this.ponder_postgres_idle_connection_count = new prometheus.Gauge({
        name: "ponder_postgres_idle_connection_count",
        help: "Number of idle connections in the pool",
        registers: [this.registry],
        collect() {
          this.set(pool.idleCount);
        }
      });
      this.registry.removeSingleMetric(
        "ponder_postgres_total_connection_count"
      );
      this.ponder_postgres_total_connection_count = new prometheus.Gauge({
        name: "ponder_postgres_total_connection_count",
        help: "Total number of connections in the pool",
        registers: [this.registry],
        collect() {
          this.set(pool.totalCount);
        }
      });
      this.registry.removeSingleMetric("ponder_postgres_request_queue_count");
      this.ponder_postgres_request_queue_count = new prometheus.Gauge({
        name: "ponder_postgres_request_queue_count",
        help: "Number of transaction or query requests waiting for an available connection",
        registers: [this.registry],
        collect() {
          this.set(pool.waitingCount);
        }
      });
    } else {
      this.registry.removeSingleMetric("ponder_sqlite_query_count");
      this.ponder_sqlite_query_count = new prometheus.Counter({
        name: "ponder_sqlite_query_count",
        help: "Number of queries executed by SQLite",
        labelNames: ["kind"],
        registers: [this.registry]
      });
    }
  }
  /**
   * Get string representation for all metrics.
   * @returns Metrics encoded using Prometheus v0.0.4 format.
   */
  async getMetrics() {
    return await this.registry.metrics();
  }
  async resetMetrics() {
    this.registry.resetMetrics();
  }
};

// src/server/service.ts
import { createServer as createServer2 } from "node:http";
import cors from "cors";
import express from "express";
import { GraphQLError, formatError } from "graphql";
import { createHandler } from "graphql-http/lib/use/express";
import { createHttpTerminator } from "http-terminator";

// src/ui/graphiql.html.ts
var graphiQLHtml = `<!--
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
-->
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Ponder Playground</title>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }
      #graphiql {
        height: 100vh;
      }
      *::-webkit-scrollbar {
        height: 0.3rem;
        width: 0.5rem;
      }
      *::-webkit-scrollbar-track {
        -ms-overflow-style: none;
        overflow: -moz-scrollbars-none;
      }
      *::-webkit-scrollbar-thumb {
        -ms-overflow-style: none;
        overflow: -moz-scrollbars-none;
      }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
    <link rel="stylesheet" href="https://unpkg.com/@graphiql/plugin-explorer/dist/style.css" />
  </head>
  <body>
    <div id="graphiql">Loading...</div>
    <script crossorigin src="https://unpkg.com/react/umd/react.development.js"></script>1
    <script crossorigin src="https://unpkg.com/react-dom/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/graphiql/graphiql.min.js" crossorigin="anonymous"></script>
    <script src="https://unpkg.com/@graphiql/plugin-explorer/dist/index.umd.js" crossorigin="anonymous"></script>
    <script>
      const fetcher = GraphiQL.createFetcher({ url: "/" });
      const explorerPlugin = GraphiQLPluginExplorer.explorerPlugin();
      const root = ReactDOM.createRoot(document.getElementById("graphiql"));
      root.render(
        React.createElement(GraphiQL, {
          fetcher,
          plugins: [explorerPlugin],
          defaultEditorToolsVisibility: false,
        })
      );
    </script>
  </body>
</html>`;

// src/server/service.ts
var ServerService = class extends Emittery {
  app;
  common;
  indexingStore;
  port;
  terminate;
  graphqlMiddleware;
  isHistoricalIndexingComplete = false;
  constructor({
    common,
    indexingStore
  }) {
    super();
    this.common = common;
    this.indexingStore = indexingStore;
    this.app = express();
    this.port = this.common.options.port;
  }
  setup({ registerDevRoutes }) {
    this.app.use(cors({ methods: ["GET", "POST", "OPTIONS", "HEAD"] }));
    this.app.all("/metrics", this.handleMetrics());
    this.app.get("/health", this.handleHealthGet());
    this.app?.all(
      "/graphql",
      this.handleGraphql({ shouldWaitForHistoricalSync: true })
    );
    this.app?.all(
      "/",
      this.handleGraphql({ shouldWaitForHistoricalSync: false })
    );
    if (registerDevRoutes) {
      this.app.post("/admin/reload", this.handleAdminReload());
    }
  }
  async start() {
    const server = await new Promise((resolve2, reject) => {
      const server2 = createServer2(this.app).on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          this.common.logger.warn({
            service: "server",
            msg: `Port ${this.port} was in use, trying port ${this.port + 1}`
          });
          this.port += 1;
          setTimeout(() => {
            server2.close();
            server2.listen(this.port, this.common.options.hostname);
          }, 5);
        } else {
          reject(error);
        }
      }).on("listening", () => {
        this.common.metrics.ponder_server_port.set(this.port);
        resolve2(server2);
      }).listen(this.port, this.common.options.hostname);
    });
    const terminator = createHttpTerminator({ server });
    this.terminate = () => terminator.terminate();
    this.common.logger.info({
      service: "server",
      msg: `Started listening on port ${this.port}`
    });
  }
  async kill() {
    await this.terminate?.();
    this.common.logger.debug({
      service: "server",
      msg: `Killed server, stopped listening on port ${this.port}`
    });
  }
  reloadGraphqlSchema({ graphqlSchema }) {
    this.graphqlMiddleware = createHandler({
      schema: graphqlSchema,
      context: { store: this.indexingStore }
    });
  }
  setIsHistoricalIndexingComplete() {
    this.isHistoricalIndexingComplete = true;
    this.common.logger.info({
      service: "server",
      msg: "Started responding as healthy"
    });
  }
  // Route handlers.
  handleMetrics() {
    return async (req, res) => {
      if (req.method !== "GET" && req.method !== "POST") {
        res.status(404).end();
      }
      try {
        res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
        res.end(await this.common.metrics.getMetrics());
      } catch (error) {
        res.status(500).end(error);
      }
    };
  }
  handleHealthGet() {
    return (_, res) => {
      if (this.isHistoricalIndexingComplete) {
        return res.status(200).send();
      }
      const max = this.common.options.maxHealthcheckDuration;
      const elapsed = Math.floor(process.uptime());
      if (elapsed > max) {
        this.common.logger.warn({
          service: "server",
          msg: `Historical sync duration has exceeded the max healthcheck duration of ${max} seconds (current: ${elapsed}). Sevice is now responding as healthy and may serve incomplete data.`
        });
        return res.status(200).send();
      }
      return res.status(503).send();
    };
  }
  handleGraphql({
    shouldWaitForHistoricalSync
  }) {
    return (req, res, next) => {
      if (!this.graphqlMiddleware) {
        return next();
      }
      if (shouldWaitForHistoricalSync && !this.isHistoricalIndexingComplete) {
        const errors = [
          formatError(new GraphQLError("Historical indexing is not complete"))
        ];
        const result = {
          data: void 0,
          errors
        };
        return res.status(503).json(result);
      }
      switch (req.method) {
        case "POST":
          return this.graphqlMiddleware(req, res, next);
        case "GET": {
          return res.status(200).setHeader("Content-Type", "text/html").send(graphiQLHtml);
        }
        case "HEAD":
          return res.status(200).send();
        default:
          return next();
      }
    };
  }
  handleAdminReload() {
    return async (req, res) => {
      try {
        const chainId = parseInt(req.query.chainId, 10);
        if (Number.isNaN(chainId)) {
          res.status(400).end("chainId must exist and be a valid integer");
          return;
        }
        this.emit("admin:reload", { chainId });
        res.status(200).end();
      } catch (error) {
        res.status(500).end(error);
      }
    };
  }
};

// src/sync-gateway/service.ts
var SyncGateway = class extends Emittery {
  common;
  syncStore;
  networks;
  // Minimum timestamp at which events are available (across all networks).
  checkpoint;
  // Minimum finalized timestamp (across all networks).
  finalityCheckpoint;
  // Per-network event timestamp checkpoints.
  networkCheckpoints;
  // Timestamp at which the historical sync was completed (across all networks).
  historicalSyncCompletedAt;
  metrics;
  constructor({
    common,
    syncStore,
    networks
  }) {
    super();
    this.common = common;
    this.syncStore = syncStore;
    this.networks = networks;
    this.metrics = {};
    this.checkpoint = zeroCheckpoint;
    this.finalityCheckpoint = zeroCheckpoint;
    this.networkCheckpoints = {};
    this.networks.forEach((network) => {
      const { chainId } = network;
      this.networkCheckpoints[chainId] = {
        isHistoricalSyncComplete: false,
        historicalCheckpoint: zeroCheckpoint,
        realtimeCheckpoint: zeroCheckpoint,
        finalityCheckpoint: zeroCheckpoint
      };
    });
  }
  /** Fetches events for all registered log filters between the specified checkpoints.
   *
   * @param options.fromCheckpoint Checkpoint to include events from (exclusive).
   * @param options.toCheckpoint Checkpoint to include events to (inclusive).
   */
  getEvents({
    fromCheckpoint,
    toCheckpoint,
    limit,
    logFilters,
    factories
  }) {
    return this.syncStore.getLogEvents({
      fromCheckpoint,
      toCheckpoint,
      limit,
      logFilters,
      factories
    });
  }
  handleNewHistoricalCheckpoint = (checkpoint) => {
    const { blockTimestamp, chainId, blockNumber } = checkpoint;
    this.networkCheckpoints[chainId].historicalCheckpoint = checkpoint;
    this.common.logger.trace({
      service: "gateway",
      msg: `New historical checkpoint (timestamp=${blockTimestamp} chainId=${chainId} blockNumber=${blockNumber})`
    });
    this.recalculateCheckpoint();
  };
  handleHistoricalSyncComplete = ({ chainId }) => {
    this.networkCheckpoints[chainId].isHistoricalSyncComplete = true;
    this.recalculateCheckpoint();
    const networkCheckpoints = Object.values(this.networkCheckpoints);
    if (networkCheckpoints.every((n) => n.isHistoricalSyncComplete)) {
      const maxHistoricalCheckpoint = checkpointMax(
        ...networkCheckpoints.map((n) => n.historicalCheckpoint)
      );
      this.historicalSyncCompletedAt = maxHistoricalCheckpoint.blockTimestamp;
      this.common.logger.debug({
        service: "gateway",
        msg: "Completed historical sync across all networks"
      });
    }
  };
  handleNewRealtimeCheckpoint = (checkpoint) => {
    const { blockTimestamp, chainId, blockNumber } = checkpoint;
    this.networkCheckpoints[chainId].realtimeCheckpoint = checkpoint;
    this.common.logger.trace({
      service: "gateway",
      msg: `New realtime checkpoint at (timestamp=${blockTimestamp} chainId=${chainId} blockNumber=${blockNumber})`
    });
    this.recalculateCheckpoint();
  };
  handleNewFinalityCheckpoint = (checkpoint) => {
    const { chainId } = checkpoint;
    this.networkCheckpoints[chainId].finalityCheckpoint = checkpoint;
    this.recalculateFinalityCheckpoint();
  };
  handleReorg = (checkpoint) => {
    this.emit("reorg", checkpoint);
  };
  /** Resets global checkpoints as well as the network checkpoint for the specified chain ID.
   *  Keeps previous checkpoint values for other networks.
   *
   * @param options.chainId Chain ID for which to reset the checkpoint.
   */
  resetCheckpoints = ({ chainId }) => {
    this.checkpoint = zeroCheckpoint;
    this.finalityCheckpoint = zeroCheckpoint;
    this.historicalSyncCompletedAt = 0;
    this.networkCheckpoints[chainId] = {
      isHistoricalSyncComplete: false,
      historicalCheckpoint: zeroCheckpoint,
      realtimeCheckpoint: zeroCheckpoint,
      finalityCheckpoint: zeroCheckpoint
    };
  };
  recalculateCheckpoint = () => {
    const checkpoints = Object.values(this.networkCheckpoints).map(
      (n) => n.isHistoricalSyncComplete ? checkpointMax(n.historicalCheckpoint, n.realtimeCheckpoint) : n.historicalCheckpoint
    );
    const newCheckpoint = checkpointMin(...checkpoints);
    if (isCheckpointGreaterThan(newCheckpoint, this.checkpoint)) {
      this.checkpoint = newCheckpoint;
      const { chainId, blockTimestamp, blockNumber } = this.checkpoint;
      this.common.logger.trace({
        service: "gateway",
        msg: `New checkpoint (timestamp=${blockTimestamp} chainId=${chainId} blockNumber=${blockNumber})`
      });
      this.emit("newCheckpoint", this.checkpoint);
    }
  };
  recalculateFinalityCheckpoint = () => {
    const newFinalityCheckpoint = checkpointMin(
      ...Object.values(this.networkCheckpoints).map(
        (n) => n.finalityCheckpoint
      )
    );
    if (isCheckpointGreaterThan(newFinalityCheckpoint, this.finalityCheckpoint)) {
      this.finalityCheckpoint = newFinalityCheckpoint;
      const { chainId, blockTimestamp, blockNumber } = this.finalityCheckpoint;
      this.common.logger.trace({
        service: "gateway",
        msg: `New finality checkpoint (timestamp=${blockTimestamp} chainId=${chainId} blockNumber=${blockNumber})`
      });
      this.emit("newFinalityCheckpoint", this.finalityCheckpoint);
    }
  };
};

// src/metrics/utils.ts
async function getHistoricalSyncStats({
  sources,
  metrics
}) {
  const startTimestampMetric = (await metrics.ponder_historical_start_timestamp.get()).values?.[0]?.value;
  const cachedBlocksMetric = (await metrics.ponder_historical_cached_blocks.get()).values;
  const totalBlocksMetric = (await metrics.ponder_historical_total_blocks.get()).values;
  const completedBlocksMetric = (await metrics.ponder_historical_completed_blocks.get()).values;
  return sources.map((source) => {
    const { contractName, networkName } = source;
    const totalBlocks = totalBlocksMetric.find(
      ({ labels }) => labels.contract === contractName && labels.network === networkName
    )?.value;
    const cachedBlocks = cachedBlocksMetric.find(
      ({ labels }) => labels.contract === contractName && labels.network === networkName
    )?.value;
    const completedBlocks = completedBlocksMetric.find(
      ({ labels }) => labels.contract === contractName && labels.network === networkName
    )?.value ?? 0;
    if (totalBlocks === 0) {
      return {
        network: networkName,
        contract: contractName,
        rate: 1,
        eta: 0
      };
    }
    if (totalBlocks === void 0 || cachedBlocks === void 0 || !startTimestampMetric) {
      return { network: networkName, contract: contractName, rate: 0 };
    }
    const rate = (cachedBlocks + completedBlocks) / totalBlocks;
    if (completedBlocks < 3)
      return { network: networkName, contract: contractName, rate };
    if (rate === 1)
      return {
        network: networkName,
        contract: contractName,
        rate,
        eta: 0
      };
    const elapsed = Date.now() - startTimestampMetric;
    const estimatedTotalDuration = elapsed / (completedBlocks / (totalBlocks - cachedBlocks));
    const estimatedTimeRemaining = estimatedTotalDuration - elapsed;
    return {
      network: networkName,
      contract: contractName,
      rate,
      eta: estimatedTimeRemaining
    };
  });
}

// src/utils/format.ts
var formatEta = (ms) => {
  if (ms < 1e3)
    return `${Math.round(ms)}ms`;
  const seconds = Math.floor(ms / 1e3);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - h * 3600) / 60);
  const s = seconds - h * 3600 - m * 60;
  const hstr = h > 0 ? `${h}h ` : "";
  const mstr = m > 0 || h > 0 ? `${m}m ` : "";
  const sstr = s > 0 || m > 0 ? `${s}s` : "";
  return `${hstr}${mstr}${sstr}`;
};
var formatPercentage = (cacheRate) => {
  const decimal = Math.round(cacheRate * 1e3) / 10;
  return Number.isInteger(decimal) && decimal < 100 ? `${decimal}.0%` : `${decimal}%`;
};

// src/utils/interval.ts
function intervalSum(intervals) {
  let totalSum = 0;
  for (const [start, end] of intervals) {
    totalSum += end - start + 1;
  }
  return totalSum;
}
function intervalUnion(intervals) {
  if (intervals.length === 0)
    return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [];
  let currentInterval = intervals[0];
  for (let i = 1; i < intervals.length; i++) {
    const nextInterval = intervals[i];
    if (currentInterval[1] >= nextInterval[0] - 1) {
      currentInterval[1] = Math.max(currentInterval[1], nextInterval[1]);
    } else {
      result.push(currentInterval);
      currentInterval = nextInterval;
    }
  }
  result.push(currentInterval);
  return result;
}
function intervalIntersection(list1, list2) {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < list1.length && j < list2.length) {
    const [start1, end1] = list1[i];
    const [start2, end2] = list2[j];
    const intersectionStart = Math.max(start1, start2);
    const intersectionEnd = Math.min(end1, end2);
    if (intersectionStart <= intersectionEnd) {
      result.push([intersectionStart, intersectionEnd]);
    }
    if (end1 < end2) {
      i++;
    } else {
      j++;
    }
  }
  return intervalUnion(result);
}
function intervalIntersectionMany(lists) {
  if (lists.length === 0)
    return [];
  if (lists.length === 1)
    return lists[0];
  let result = lists[0];
  for (let i = 1; i < lists.length; i++) {
    result = intervalIntersection(result, lists[i]);
  }
  return intervalUnion(result);
}
function intervalDifference(initial, remove) {
  const initial_ = initial.map((interval) => [...interval]);
  const remove_ = remove.map((interval) => [...interval]);
  const result = [];
  let i = 0;
  let j = 0;
  while (i < initial.length && j < remove.length) {
    const interval1 = initial_[i];
    const interval2 = remove_[j];
    if (interval1[1] < interval2[0]) {
      result.push(interval1);
      i++;
    } else if (interval2[1] < interval1[0]) {
      j++;
    } else {
      if (interval1[0] < interval2[0]) {
        result.push([interval1[0], interval2[0] - 1]);
      }
      if (interval1[1] > interval2[1]) {
        interval1[0] = interval2[1] + 1;
        j++;
      } else {
        i++;
      }
    }
  }
  while (i < initial_.length) {
    result.push(initial_[i]);
    i++;
  }
  return result;
}
function getChunks({
  intervals,
  maxChunkSize
}) {
  const _chunks = [];
  for (const interval of intervals) {
    const [startBlock, endBlock] = interval;
    let fromBlock = startBlock;
    let toBlock = Math.min(fromBlock + maxChunkSize - 1, endBlock);
    while (fromBlock <= endBlock) {
      _chunks.push([fromBlock, toBlock]);
      fromBlock = toBlock + 1;
      toBlock = Math.min(fromBlock + maxChunkSize - 1, endBlock);
    }
  }
  return _chunks;
}
var ProgressTracker = class {
  target;
  _completed;
  _required = null;
  _checkpoint = null;
  /**
     * Constructs a new ProgressTracker object.
  
     * @throws Will throw an error if the target interval is invalid.
     */
  constructor({
    target,
    completed
  }) {
    if (target[0] > target[1])
      throw new Error(
        `Invalid interval: start (${target[0]}) is greater than end (${target[1]})`
      );
    this.target = target;
    this._completed = completed;
  }
  /**
   * Adds a completed interval.
   *
   * @throws Will throw an error if the new interval is invalid.
   */
  addCompletedInterval(interval) {
    if (interval[0] > interval[1])
      throw new Error(
        `Invalid interval: start (${interval[0]}) is greater than end (${interval[1]})`
      );
    const prevCheckpoint = this.getCheckpoint();
    this._completed = intervalUnion([...this._completed, interval]);
    this.invalidateCache();
    const newCheckpoint = this.getCheckpoint();
    return {
      isUpdated: newCheckpoint > prevCheckpoint,
      prevCheckpoint,
      newCheckpoint
    };
  }
  /**
   * Returns the remaining required intervals.
   */
  getRequired() {
    if (this._required === null) {
      this._required = intervalDifference([this.target], this._completed);
    }
    return this._required;
  }
  /**
   * Returns the checkpoint value. If no progress has been made, the checkpoint
   * is equal to the target start minus one.
   */
  getCheckpoint() {
    if (this._checkpoint !== null)
      return this._checkpoint;
    const completedIntervalIncludingTargetStart = this._completed.sort((a, b) => a[0] - b[0]).find((i) => i[0] <= this.target[0] && i[1] >= this.target[0]);
    if (completedIntervalIncludingTargetStart) {
      this._checkpoint = completedIntervalIncludingTargetStart[1];
    } else {
      this._checkpoint = this.target[0] - 1;
    }
    return this._checkpoint;
  }
  invalidateCache() {
    this._required = null;
    this._checkpoint = null;
  }
};
var BlockProgressTracker = class {
  pendingBlocks = [];
  completedBlocks = [];
  checkpoint = null;
  addPendingBlocks({ blockNumbers }) {
    if (blockNumbers.length === 0)
      return;
    const maxPendingBlock = this.pendingBlocks[this.pendingBlocks.length - 1];
    const sorted = blockNumbers.sort((a, b) => a - b);
    const minNewPendingBlock = sorted[0];
    if (this.pendingBlocks.length > 0 && minNewPendingBlock <= maxPendingBlock) {
      throw new Error(
        `New pending block number ${minNewPendingBlock} was added out of order. Already added block number ${maxPendingBlock}.`
      );
    }
    sorted.forEach((blockNumber) => {
      this.pendingBlocks.push(blockNumber);
    });
  }
  /**
   * Add a new completed block. If adding this block moves the checkpoint, returns the
   * new checkpoint. Otherwise, returns null.
   */
  addCompletedBlock({
    blockNumber,
    blockTimestamp
  }) {
    const pendingBlockIndex = this.pendingBlocks.findIndex(
      (pendingBlock) => pendingBlock === blockNumber
    );
    if (pendingBlockIndex === -1) {
      throw new Error(
        `Block number ${blockNumber} was not pending. Ensure to add blocks as pending before marking them as completed.`
      );
    }
    this.pendingBlocks.splice(pendingBlockIndex, 1);
    this.completedBlocks.push({ blockNumber, blockTimestamp });
    this.completedBlocks.sort((a, b) => a.blockNumber - b.blockNumber);
    if (this.pendingBlocks.length === 0) {
      this.checkpoint = this.completedBlocks[this.completedBlocks.length - 1];
      return this.checkpoint;
    }
    const safeCompletedBlocks = this.completedBlocks.filter(
      ({ blockNumber: blockNumber2 }) => blockNumber2 < this.pendingBlocks[0]
    );
    if (safeCompletedBlocks.length === 0)
      return null;
    const maximumSafeCompletedBlock = safeCompletedBlocks[safeCompletedBlocks.length - 1];
    this.completedBlocks = this.completedBlocks.filter(
      ({ blockNumber: blockNumber2 }) => blockNumber2 >= maximumSafeCompletedBlock.blockNumber
    );
    if (!this.checkpoint || maximumSafeCompletedBlock.blockNumber > this.checkpoint.blockNumber) {
      this.checkpoint = maximumSafeCompletedBlock;
      return this.checkpoint;
    }
    return null;
  }
};

// src/sync-historical/service.ts
import {
  BlockNotFoundError,
  hexToNumber as hexToNumber2,
  numberToHex,
  toHex as toHex2
} from "viem";

// src/sync-historical/getLogFilterRetryRanges.ts
import {
  InvalidParamsRpcError,
  LimitExceededRpcError,
  hexToNumber,
  toHex
} from "viem";
var getLogFilterRetryRanges = (error, fromBlock, toBlock) => {
  const retryRanges = [];
  if (
    // Alchemy response size error.
    error.code === InvalidParamsRpcError.code && error.details.startsWith("Log response size exceeded.")
  ) {
    const safe = error.details.split("this block range should work: ")[1];
    const safeStart = Number(safe.split(", ")[0].slice(1));
    const safeEnd = Number(safe.split(", ")[1].slice(0, -1));
    retryRanges.push([toHex(safeStart), toHex(safeEnd)]);
    retryRanges.push([toHex(safeEnd + 1), toBlock]);
  } else if (
    // Another Alchemy response size error.
    error.details?.includes("Response size is larger than 150MB limit")
  ) {
    const from = hexToNumber(fromBlock);
    const to = hexToNumber(toBlock);
    const chunks = getChunks({
      intervals: [[from, to]],
      maxChunkSize: Math.round((to - from) / 10)
    });
    retryRanges.push(
      ...chunks.map(([f, t]) => [toHex(f), toHex(t)])
    );
  } else if (
    // Infura block range limit error.
    error.code === LimitExceededRpcError.code && error.details.includes("query returned more than 10000 results")
  ) {
    const safe = error.details.split("Try with this block range ")[1];
    const safeStart = Number(safe.split(", ")[0].slice(1));
    const safeEnd = Number(safe.split(", ")[1].slice(0, -2));
    retryRanges.push([toHex(safeStart), toHex(safeEnd)]);
    retryRanges.push([toHex(safeEnd + 1), toBlock]);
  } else if (
    // Thirdweb block range limit error.
    error.code === InvalidParamsRpcError.code && error.details.includes("block range less than 20000")
  ) {
    const midpoint = Math.floor(
      (Number(toBlock) - Number(fromBlock)) / 2 + Number(fromBlock)
    );
    retryRanges.push([toHex(fromBlock), toHex(midpoint)]);
    retryRanges.push([toHex(midpoint + 1), toBlock]);
  } else if (
    // Quicknode block range limit error (should never happen).
    error.name === "HttpRequestError" && error.details.includes(
      "eth_getLogs and eth_newFilter are limited to a 10,000 blocks range"
    )
  ) {
    const midpoint = Math.floor(
      (Number(toBlock) - Number(fromBlock)) / 2 + Number(fromBlock)
    );
    retryRanges.push([fromBlock, toHex(midpoint)]);
    retryRanges.push([toHex(midpoint + 1), toBlock]);
  } else {
    throw error;
  }
  return retryRanges;
};

// src/sync-historical/validateHistoricalBlockRange.ts
function validateHistoricalBlockRange({
  startBlock,
  endBlock: userDefinedEndBlock,
  finalizedBlockNumber,
  latestBlockNumber
}) {
  if (startBlock > latestBlockNumber) {
    throw new Error(
      `Start block number (${startBlock}) cannot be greater than latest block number (${latestBlockNumber}).
         Are you sure the RPC endpoint is for the correct network?`
    );
  }
  if (startBlock > finalizedBlockNumber) {
    return {
      isHistoricalSyncRequired: false,
      startBlock,
      endBlock: userDefinedEndBlock
    };
  }
  if (userDefinedEndBlock) {
    if (userDefinedEndBlock < startBlock) {
      throw new Error(
        `End block number (${userDefinedEndBlock}) cannot be less than start block number (${startBlock}).
           Are you sure the RPC endpoint is for the correct network?`
      );
    }
    if (userDefinedEndBlock > latestBlockNumber) {
      throw new Error(
        `End block number (${userDefinedEndBlock}) cannot be greater than latest block number (${latestBlockNumber}).
           Are you sure the RPC endpoint is for the correct network?`
      );
    }
    if (userDefinedEndBlock > finalizedBlockNumber) {
      throw new Error(
        `End block number (${userDefinedEndBlock}) cannot be greater than finalized block number (${finalizedBlockNumber}).
           Are you sure the RPC endpoint is for the correct network?`
      );
    }
  }
  const resolvedEndBlock = userDefinedEndBlock ?? finalizedBlockNumber;
  return {
    isHistoricalSyncRequired: true,
    startBlock,
    endBlock: resolvedEndBlock
  };
}

// src/sync-historical/service.ts
var HistoricalSyncService = class extends Emittery {
  common;
  syncStore;
  network;
  requestQueue;
  /**
   * Service configuration. Will eventually be reloadable.
   */
  finalizedBlockNumber = null;
  sources;
  /**
   * Block progress trackers for each task type.
   */
  logFilterProgressTrackers = {};
  factoryChildAddressProgressTrackers = {};
  factoryLogFilterProgressTrackers = {};
  blockProgressTracker = new BlockProgressTracker();
  /**
   * Functions registered by log filter + child contract tasks. These functions accept
   * a raw block object, get required data from it, then insert data and cache metadata
   * into the sync store. The keys of this object are used to keep track of which blocks
   * must be fetched.
   */
  blockCallbacks = {};
  /**
   * Block tasks have been added to the queue up to and including this block number.
   * Used alongside blockCallbacks to keep track of which block tasks to add to the queue.
   */
  blockTasksEnqueuedCheckpoint = 0;
  queue;
  /** If true, failed tasks should not log errors or be retried. */
  isShuttingDown = false;
  progressLogInterval;
  constructor({
    common,
    syncStore,
    network,
    requestQueue,
    sources = []
  }) {
    super();
    this.common = common;
    this.syncStore = syncStore;
    this.network = network;
    this.requestQueue = requestQueue;
    this.sources = sources;
    this.queue = this.buildQueue();
  }
  async setup({
    latestBlockNumber,
    finalizedBlockNumber
  }) {
    this.isShuttingDown = false;
    this.blockTasksEnqueuedCheckpoint = 0;
    this.finalizedBlockNumber = finalizedBlockNumber;
    await Promise.all(
      this.sources.map(async (source) => {
        const { isHistoricalSyncRequired, startBlock, endBlock } = validateHistoricalBlockRange({
          startBlock: source.startBlock,
          endBlock: source.endBlock,
          finalizedBlockNumber,
          latestBlockNumber
        });
        if (sourceIsLogFilter(source)) {
          if (!isHistoricalSyncRequired) {
            this.logFilterProgressTrackers[source.id] = new ProgressTracker({
              target: [startBlock, finalizedBlockNumber],
              completed: [[startBlock, finalizedBlockNumber]]
            });
            this.common.metrics.ponder_historical_total_blocks.set(
              { network: this.network.name, contract: source.contractName },
              0
            );
            this.common.logger.warn({
              service: "historical",
              msg: `Start block is in unfinalized range, skipping historical sync (contract=${source.id})`
            });
            return;
          }
          const completedLogFilterIntervals = await this.syncStore.getLogFilterIntervals({
            chainId: source.chainId,
            logFilter: {
              address: source.criteria.address,
              topics: source.criteria.topics
            }
          });
          const logFilterProgressTracker = new ProgressTracker({
            target: [startBlock, endBlock],
            completed: completedLogFilterIntervals
          });
          this.logFilterProgressTrackers[source.id] = logFilterProgressTracker;
          const requiredLogFilterIntervals = logFilterProgressTracker.getRequired();
          const logFilterTaskChunks = getChunks({
            intervals: requiredLogFilterIntervals,
            maxChunkSize: source.maxBlockRange ?? this.network.defaultMaxBlockRange
          });
          for (const [fromBlock, toBlock] of logFilterTaskChunks) {
            this.queue.addTask(
              {
                kind: "LOG_FILTER",
                logFilter: source,
                fromBlock,
                toBlock
              },
              { priority: Number.MAX_SAFE_INTEGER - fromBlock }
            );
          }
          if (logFilterTaskChunks.length > 0) {
            const total = intervalSum(requiredLogFilterIntervals);
            this.common.logger.debug({
              service: "historical",
              msg: `Added LOG_FILTER tasks for ${total}-block range (contract=${source.contractName}, network=${this.network.name})`
            });
          }
          const targetBlockCount = endBlock - startBlock + 1;
          const cachedBlockCount = targetBlockCount - intervalSum(requiredLogFilterIntervals);
          this.common.metrics.ponder_historical_total_blocks.set(
            { network: this.network.name, contract: source.contractName },
            targetBlockCount
          );
          this.common.metrics.ponder_historical_cached_blocks.set(
            { network: this.network.name, contract: source.contractName },
            cachedBlockCount
          );
          this.common.logger.info({
            service: "historical",
            msg: `Started sync with ${formatPercentage(
              Math.min(1, cachedBlockCount / (targetBlockCount || 1))
            )} cached (contract=${source.contractName} network=${this.network.name})`
          });
        } else {
          if (!isHistoricalSyncRequired) {
            this.factoryChildAddressProgressTrackers[source.id] = new ProgressTracker({
              target: [startBlock, finalizedBlockNumber],
              completed: [[startBlock, finalizedBlockNumber]]
            });
            this.factoryLogFilterProgressTrackers[source.id] = new ProgressTracker({
              target: [startBlock, finalizedBlockNumber],
              completed: [[startBlock, finalizedBlockNumber]]
            });
            this.common.metrics.ponder_historical_total_blocks.set(
              { network: this.network.name, contract: source.contractName },
              0
            );
            this.common.logger.warn({
              service: "historical",
              msg: `Start block is in unfinalized range, skipping historical sync (contract=${source.contractName})`
            });
            return;
          }
          const completedFactoryChildAddressIntervals = await this.syncStore.getLogFilterIntervals({
            chainId: source.chainId,
            logFilter: {
              address: source.criteria.address,
              topics: [source.criteria.eventSelector]
            }
          });
          const factoryChildAddressProgressTracker = new ProgressTracker({
            target: [startBlock, endBlock],
            completed: completedFactoryChildAddressIntervals
          });
          this.factoryChildAddressProgressTrackers[source.id] = factoryChildAddressProgressTracker;
          const requiredFactoryChildAddressIntervals = factoryChildAddressProgressTracker.getRequired();
          const factoryChildAddressTaskChunks = getChunks({
            intervals: requiredFactoryChildAddressIntervals,
            maxChunkSize: source.maxBlockRange ?? this.network.defaultMaxBlockRange
          });
          for (const [fromBlock, toBlock] of factoryChildAddressTaskChunks) {
            this.queue.addTask(
              {
                kind: "FACTORY_CHILD_ADDRESS",
                factory: source,
                fromBlock,
                toBlock
              },
              { priority: Number.MAX_SAFE_INTEGER - fromBlock }
            );
          }
          if (factoryChildAddressTaskChunks.length > 0) {
            const total = intervalSum(requiredFactoryChildAddressIntervals);
            this.common.logger.debug({
              service: "historical",
              msg: `Added FACTORY_CHILD_ADDRESS tasks for ${total}-block range (factory=${source.id}, network=${this.network.name})`
            });
          }
          const targetFactoryChildAddressBlockCount = endBlock - startBlock + 1;
          const cachedFactoryChildAddressBlockCount = targetFactoryChildAddressBlockCount - intervalSum(requiredFactoryChildAddressIntervals);
          this.common.metrics.ponder_historical_total_blocks.set(
            {
              network: this.network.name,
              contract: `${source.contractName}_factory`
            },
            targetFactoryChildAddressBlockCount
          );
          this.common.metrics.ponder_historical_cached_blocks.set(
            {
              network: this.network.name,
              contract: `${source.contractName}_factory`
            },
            cachedFactoryChildAddressBlockCount
          );
          const completedFactoryLogFilterIntervals = await this.syncStore.getFactoryLogFilterIntervals({
            chainId: source.chainId,
            factory: source.criteria
          });
          const factoryLogFilterProgressTracker = new ProgressTracker({
            target: [startBlock, endBlock],
            completed: completedFactoryLogFilterIntervals
          });
          this.factoryLogFilterProgressTrackers[source.id] = factoryLogFilterProgressTracker;
          const requiredFactoryLogFilterIntervals = factoryLogFilterProgressTracker.getRequired();
          const missingFactoryLogFilterIntervals = intervalDifference(
            requiredFactoryLogFilterIntervals,
            requiredFactoryChildAddressIntervals
          );
          const missingFactoryLogFilterTaskChunks = getChunks({
            intervals: missingFactoryLogFilterIntervals,
            maxChunkSize: source.maxBlockRange ?? this.network.defaultMaxBlockRange
          });
          for (const [
            fromBlock,
            toBlock
          ] of missingFactoryLogFilterTaskChunks) {
            this.queue.addTask(
              {
                kind: "FACTORY_LOG_FILTER",
                factory: source,
                fromBlock,
                toBlock
              },
              { priority: Number.MAX_SAFE_INTEGER - fromBlock }
            );
          }
          if (missingFactoryLogFilterTaskChunks.length > 0) {
            const total = intervalSum(missingFactoryLogFilterIntervals);
            this.common.logger.debug({
              service: "historical",
              msg: `Added FACTORY_LOG_FILTER tasks for ${total}-block range (contract=${source.contractName}, network=${this.network.name})`
            });
          }
          const targetFactoryLogFilterBlockCount = endBlock - startBlock + 1;
          const cachedFactoryLogFilterBlockCount = targetFactoryLogFilterBlockCount - intervalSum(requiredFactoryLogFilterIntervals);
          this.common.metrics.ponder_historical_total_blocks.set(
            { network: this.network.name, contract: source.contractName },
            targetFactoryLogFilterBlockCount
          );
          this.common.metrics.ponder_historical_cached_blocks.set(
            { network: this.network.name, contract: source.contractName },
            cachedFactoryLogFilterBlockCount
          );
          const cacheRate = Math.min(
            1,
            cachedFactoryLogFilterBlockCount / (targetFactoryLogFilterBlockCount || 1)
          );
          this.common.logger.info({
            service: "historical",
            msg: `Started sync with ${formatPercentage(
              cacheRate
            )} cached (contract=${source.contractName} network=${this.network.name})`
          });
        }
      })
    );
  }
  start() {
    this.common.metrics.ponder_historical_start_timestamp.set(Date.now());
    this.progressLogInterval = setInterval(async () => {
      const completionStats = await getHistoricalSyncStats({
        metrics: this.common.metrics,
        sources: this.sources
      });
      completionStats.forEach(({ contract, rate, eta }) => {
        if (rate === 1)
          return;
        this.common.logger.info({
          service: "historical",
          msg: `Sync is ${formatPercentage(rate)} complete${eta !== void 0 ? ` with ~${formatEta(eta)} remaining` : ""} (contract=${contract})`,
          network: this.network.name
        });
      });
    }, 1e4);
    if (this.queue.size === 0) {
      this.emit("historicalCheckpoint", {
        blockTimestamp: Math.round(Date.now() / 1e3),
        chainId: this.network.chainId,
        blockNumber: this.finalizedBlockNumber
      });
      clearInterval(this.progressLogInterval);
      this.emit("syncComplete");
      this.common.logger.info({
        service: "historical",
        msg: `Completed sync (network=${this.network.name})`,
        network: this.network.name
      });
    }
    this.queue.start();
  }
  kill = () => {
    this.isShuttingDown = true;
    clearInterval(this.progressLogInterval);
    this.queue.pause();
    this.queue.clear();
    this.common.logger.debug({
      service: "historical",
      msg: `Killed historical sync service (network=${this.network.name})`
    });
  };
  onIdle = () => new Promise(
    (resolve2) => setImmediate(() => this.queue.onIdle().then(resolve2))
  );
  buildQueue = () => {
    const worker = async ({ task, queue: queue2 }) => {
      switch (task.kind) {
        case "LOG_FILTER": {
          await this.logFilterTaskWorker(task);
          break;
        }
        case "FACTORY_CHILD_ADDRESS": {
          await this.factoryChildAddressTaskWorker(task);
          break;
        }
        case "FACTORY_LOG_FILTER": {
          await this.factoryLogFilterTaskWorker(task);
          break;
        }
        case "BLOCK": {
          await this.blockTaskWorker(task);
          break;
        }
      }
      if (queue2.size > 0 || queue2.pending > 1)
        return;
      if (this.isShuttingDown)
        return;
      clearInterval(this.progressLogInterval);
      this.emit("syncComplete");
      const startTimestamp = (await this.common.metrics.ponder_historical_start_timestamp.get()).values?.[0]?.value ?? Date.now();
      const duration = Date.now() - startTimestamp;
      this.common.logger.info({
        service: "historical",
        msg: `Completed sync in ${formatEta(duration)} (network=${this.network.name})`
      });
    };
    const queue = createQueue({
      worker,
      options: {
        concurrency: this.network.maxHistoricalTaskConcurrency,
        autoStart: false
      },
      onError: ({ error, task, queue: queue2 }) => {
        if (this.isShuttingDown)
          return;
        switch (task.kind) {
          case "LOG_FILTER": {
            this.common.logger.warn({
              service: "historical",
              msg: `Log filter task failed, retrying... [${task.fromBlock}, ${task.toBlock}] (contract=${task.logFilter.contractName}, network=${this.network.name}, error=${`${error.name}: ${error.message}`})`
            });
            const priority = Number.MAX_SAFE_INTEGER - task.fromBlock;
            queue2.addTask({ ...task }, { priority });
            break;
          }
          case "FACTORY_CHILD_ADDRESS": {
            this.common.logger.warn({
              service: "historical",
              msg: `Factory child address task failed, retrying... [${task.fromBlock}, ${task.toBlock}] (contract=${task.factory.contractName}, network=${this.network.name}, error=${`${error.name}: ${error.message}`})`
            });
            const priority = Number.MAX_SAFE_INTEGER - task.fromBlock;
            queue2.addTask({ ...task }, { priority });
            break;
          }
          case "FACTORY_LOG_FILTER": {
            this.common.logger.warn({
              service: "historical",
              msg: `Factory log filter task failed, retrying... [${task.fromBlock}, ${task.toBlock}] (contract=${task.factory.contractName}, network=${this.network.name}, error=${`${error.name}: ${error.message}`})`
            });
            const priority = Number.MAX_SAFE_INTEGER - task.fromBlock;
            queue2.addTask({ ...task }, { priority });
            break;
          }
          case "BLOCK": {
            this.common.logger.warn({
              service: "historical",
              msg: `Block task failed, retrying... [${task.blockNumber}] (network=${this.network.name}, error=${`${error.name}: ${error.message}`})`
            });
            const priority = Number.MAX_SAFE_INTEGER - task.blockNumber;
            queue2.addTask({ ...task }, { priority });
            break;
          }
        }
      }
    });
    return queue;
  };
  logFilterTaskWorker = async ({
    logFilter,
    fromBlock,
    toBlock
  }) => {
    const logs = await this._eth_getLogs({
      address: logFilter.criteria.address,
      topics: logFilter.criteria.topics,
      fromBlock: toHex2(fromBlock),
      toBlock: toHex2(toBlock)
    });
    const logIntervals = this.buildLogIntervals({ fromBlock, toBlock, logs });
    for (const logInterval of logIntervals) {
      const { startBlock, endBlock } = logInterval;
      if (this.blockCallbacks[endBlock] === void 0)
        this.blockCallbacks[endBlock] = [];
      this.blockCallbacks[endBlock].push(async (block) => {
        await this._insertLogFilterInterval({
          logInterval,
          logFilter: logFilter.criteria,
          chainId: logFilter.chainId,
          block
        });
        this.common.metrics.ponder_historical_completed_blocks.inc(
          { network: this.network.name, contract: logFilter.contractName },
          endBlock - startBlock + 1
        );
      });
    }
    this.logFilterProgressTrackers[logFilter.id].addCompletedInterval([
      fromBlock,
      toBlock
    ]);
    this.enqueueBlockTasks();
    this.common.logger.trace({
      service: "historical",
      msg: `Completed LOG_FILTER task adding ${logIntervals.length} BLOCK tasks [${fromBlock}, ${toBlock}] (contract=${logFilter.contractName}, network=${this.network.name})`
    });
  };
  factoryLogFilterTaskWorker = async ({
    factory,
    fromBlock,
    toBlock
  }) => {
    const iterator = this.syncStore.getFactoryChildAddresses({
      chainId: factory.chainId,
      factory: factory.criteria,
      upToBlockNumber: BigInt(toBlock)
    });
    const logs = [];
    for await (const childContractAddressBatch of iterator) {
      const _logs = await this._eth_getLogs({
        address: childContractAddressBatch,
        topics: factory.criteria.topics,
        fromBlock: numberToHex(fromBlock),
        toBlock: numberToHex(toBlock)
      });
      logs.push(..._logs);
    }
    const logIntervals = this.buildLogIntervals({ fromBlock, toBlock, logs });
    for (const logInterval of logIntervals) {
      const { startBlock, endBlock, logs: logs2, transactionHashes } = logInterval;
      if (this.blockCallbacks[endBlock] === void 0)
        this.blockCallbacks[endBlock] = [];
      this.blockCallbacks[endBlock].push(async (block) => {
        await this.syncStore.insertFactoryLogFilterInterval({
          chainId: factory.chainId,
          factory: factory.criteria,
          block,
          transactions: block.transactions.filter(
            (tx) => transactionHashes.has(tx.hash)
          ),
          logs: logs2,
          interval: {
            startBlock: BigInt(startBlock),
            endBlock: BigInt(endBlock)
          }
        });
        this.common.metrics.ponder_historical_completed_blocks.inc(
          { network: this.network.name, contract: factory.contractName },
          endBlock - startBlock + 1
        );
      });
    }
    this.factoryLogFilterProgressTrackers[factory.id].addCompletedInterval([
      fromBlock,
      toBlock
    ]);
    this.enqueueBlockTasks();
    this.common.logger.trace({
      service: "historical",
      msg: `Completed FACTORY_LOG_FILTER task adding ${logIntervals.length} BLOCK tasks [${fromBlock}, ${toBlock}] (contract=${factory.contractName}, network=${this.network.name})`
    });
  };
  factoryChildAddressTaskWorker = async ({
    factory,
    fromBlock,
    toBlock
  }) => {
    const logs = await this._eth_getLogs({
      address: factory.criteria.address,
      topics: [factory.criteria.eventSelector],
      fromBlock: toHex2(fromBlock),
      toBlock: toHex2(toBlock)
    });
    await this.syncStore.insertFactoryChildAddressLogs({
      chainId: factory.chainId,
      logs
    });
    const logIntervals = this.buildLogIntervals({ fromBlock, toBlock, logs });
    for (const logInterval of logIntervals) {
      if (this.blockCallbacks[logInterval.endBlock] === void 0)
        this.blockCallbacks[logInterval.endBlock] = [];
      this.blockCallbacks[logInterval.endBlock].push(async (block) => {
        await this._insertLogFilterInterval({
          logInterval,
          logFilter: {
            address: factory.criteria.address,
            topics: [factory.criteria.eventSelector]
          },
          chainId: factory.chainId,
          block
        });
      });
    }
    const { isUpdated, prevCheckpoint, newCheckpoint } = this.factoryChildAddressProgressTrackers[factory.id].addCompletedInterval(
      [fromBlock, toBlock]
    );
    if (isUpdated) {
      const requiredIntervals = intervalIntersection(
        [[prevCheckpoint + 1, newCheckpoint]],
        this.factoryLogFilterProgressTrackers[factory.id].getRequired()
      );
      const factoryLogFilterChunks = getChunks({
        intervals: requiredIntervals,
        maxChunkSize: factory.maxBlockRange ?? this.network.defaultMaxBlockRange
      });
      for (const [fromBlock2, toBlock2] of factoryLogFilterChunks) {
        this.queue.addTask(
          {
            kind: "FACTORY_LOG_FILTER",
            factory,
            fromBlock: fromBlock2,
            toBlock: toBlock2
          },
          { priority: Number.MAX_SAFE_INTEGER - fromBlock2 }
        );
      }
    }
    this.common.metrics.ponder_historical_completed_blocks.inc(
      {
        network: this.network.name,
        contract: `${factory.contractName}_factory`
      },
      toBlock - fromBlock + 1
    );
    this.common.logger.trace({
      service: "historical",
      msg: `Completed FACTORY_CHILD_ADDRESS task [${fromBlock}, ${toBlock}] (contract=${factory.contractName}, network=${this.network.name})`
    });
  };
  blockTaskWorker = async ({ blockNumber, callbacks }) => {
    const block = await this._eth_getBlockByNumber({
      blockNumber
    });
    while (callbacks.length !== 0) {
      await callbacks[callbacks.length - 1](block);
      callbacks.pop();
    }
    const newBlockCheckpoint = this.blockProgressTracker.addCompletedBlock({
      blockNumber,
      blockTimestamp: hexToNumber2(block.timestamp)
    });
    if (newBlockCheckpoint) {
      this.emit("historicalCheckpoint", {
        blockTimestamp: newBlockCheckpoint.blockTimestamp,
        chainId: this.network.chainId,
        blockNumber: newBlockCheckpoint.blockNumber
      });
    }
    this.common.logger.trace({
      service: "historical",
      msg: `Completed BLOCK task ${hexToNumber2(block.number)} with ${callbacks.length} callbacks (network=${this.network.name})`
    });
  };
  buildLogIntervals = ({
    fromBlock,
    toBlock,
    logs
  }) => {
    const logsByBlockNumber = {};
    const txHashesByBlockNumber = {};
    logs.forEach((log) => {
      const blockNumber = hexToNumber2(log.blockNumber);
      (txHashesByBlockNumber[blockNumber] ||= /* @__PURE__ */ new Set()).add(
        log.transactionHash
      );
      (logsByBlockNumber[blockNumber] ||= []).push(log);
    });
    const requiredBlocks = Object.keys(txHashesByBlockNumber).map(Number).sort((a, b) => a - b);
    if (!requiredBlocks.includes(toBlock)) {
      requiredBlocks.push(toBlock);
    }
    const requiredIntervals = [];
    let prev = fromBlock;
    for (const blockNumber of requiredBlocks) {
      requiredIntervals.push({
        startBlock: prev,
        endBlock: blockNumber,
        logs: logsByBlockNumber[blockNumber] ?? [],
        transactionHashes: txHashesByBlockNumber[blockNumber] ?? /* @__PURE__ */ new Set()
      });
      prev = blockNumber + 1;
    }
    return requiredIntervals;
  };
  enqueueBlockTasks = () => {
    const blockTasksCanBeEnqueuedTo = Math.min(
      ...Object.values(this.logFilterProgressTrackers).map(
        (i) => i.getCheckpoint()
      ),
      ...Object.values(this.factoryChildAddressProgressTrackers).map(
        (i) => i.getCheckpoint()
      ),
      ...Object.values(this.factoryLogFilterProgressTrackers).map(
        (i) => i.getCheckpoint()
      )
    );
    if (blockTasksCanBeEnqueuedTo > this.blockTasksEnqueuedCheckpoint) {
      const newBlocks = Object.keys(this.blockCallbacks).map(Number).filter((blockNumber) => blockNumber <= blockTasksCanBeEnqueuedTo);
      this.blockProgressTracker.addPendingBlocks({ blockNumbers: newBlocks });
      for (const blockNumber of newBlocks) {
        this.queue.addTask(
          {
            kind: "BLOCK",
            blockNumber,
            callbacks: this.blockCallbacks[blockNumber]
          },
          { priority: Number.MAX_SAFE_INTEGER - blockNumber }
        );
        delete this.blockCallbacks[blockNumber];
      }
      this.common.logger.trace({
        service: "historical",
        msg: `Enqueued ${newBlocks.length} BLOCK tasks [${this.blockTasksEnqueuedCheckpoint + 1}, ${blockTasksCanBeEnqueuedTo}] (network=${this.network.name})`
      });
      this.blockTasksEnqueuedCheckpoint = blockTasksCanBeEnqueuedTo;
    }
  };
  /**
   * Helper function for "eth_getLogs" rpc request.
   * Handles different error types and retries the request if applicable.
   */
  _eth_getLogs = (params) => {
    try {
      return this.requestQueue.request({
        method: "eth_getLogs",
        params: [
          {
            fromBlock: params.fromBlock,
            toBlock: params.toBlock,
            topics: params.topics,
            address: params.address ? Array.isArray(params.address) ? params.address.map((a) => toLowerCase(a)) : toLowerCase(params.address) : void 0
          }
        ]
      });
    } catch (err) {
      const retryRanges = getLogFilterRetryRanges(
        err,
        params.fromBlock,
        params.toBlock
      );
      return Promise.all(
        retryRanges.map(
          ([from, to]) => this._eth_getLogs({
            fromBlock: from,
            toBlock: to,
            topics: params.topics,
            address: params.address
          })
        )
      ).then((l) => l.flat());
    }
  };
  /**
   * Helper function for "eth_getBlockByNumber" request.
   */
  _eth_getBlockByNumber = (params) => this.requestQueue.request({
    method: "eth_getBlockByNumber",
    params: [numberToHex(params.blockNumber), true]
  }).then((block) => {
    if (!block)
      throw new BlockNotFoundError({
        blockNumber: BigInt(params.blockNumber)
      });
    return block;
  });
  /**
   * Helper function for "insertLogFilterInterval"
   */
  _insertLogFilterInterval = ({
    logInterval: { transactionHashes, logs, startBlock, endBlock },
    logFilter,
    block,
    chainId
  }) => this.syncStore.insertLogFilterInterval({
    chainId,
    logFilter,
    block,
    transactions: block.transactions.filter(
      (tx) => transactionHashes.has(tx.hash)
    ),
    logs,
    interval: {
      startBlock: BigInt(startBlock),
      endBlock: BigInt(endBlock)
    }
  });
};

// src/utils/poll.ts
function poll(fn, { emitOnBegin, interval }) {
  let active = true;
  const unwatch = () => active = false;
  const watch = async () => {
    if (emitOnBegin)
      await fn({ unpoll: unwatch });
    await wait(interval);
    const poll2 = async () => {
      if (!active)
        return;
      await fn({ unpoll: unwatch });
      await wait(interval);
      poll2();
    };
    poll2();
  };
  watch();
  return unwatch;
}

// src/utils/range.ts
var range = (start, stop) => Array.from({ length: stop - start }, (_, i) => start + i);

// src/sync-realtime/service.ts
import {
  BlockNotFoundError as BlockNotFoundError2,
  hexToNumber as hexToNumber4,
  numberToHex as numberToHex2
} from "viem";

// src/sync-realtime/bloom.ts
import {
  isContractAddressInBloom,
  isTopicInBloom
} from "ethereum-bloom-filters";
function isMatchedLogInBloomFilter({
  bloom,
  logFilters
}) {
  const allAddresses = [];
  logFilters.forEach((logFilter) => {
    const address = logFilter.address === void 0 ? [] : Array.isArray(logFilter.address) ? logFilter.address : [logFilter.address];
    allAddresses.push(...address);
  });
  if (allAddresses.some((a) => isContractAddressInBloom(bloom, a))) {
    return true;
  }
  const allTopics = [];
  logFilters.forEach((logFilter) => {
    logFilter.topics?.forEach((topic) => {
      if (topic === null)
        return;
      if (Array.isArray(topic))
        allTopics.push(...topic);
      else
        allTopics.push(topic);
    });
  });
  if (allTopics.some((a) => isTopicInBloom(bloom, a))) {
    return true;
  }
  return false;
}

// src/sync-realtime/filter.ts
import "viem";
function filterLogs({
  logs,
  logFilters
}) {
  return logs.filter((log) => {
    for (const { address, topics } of logFilters) {
      if (isLogMatchedByFilter({ log, address, topics }))
        return true;
    }
    return false;
  });
}
function isLogMatchedByFilter({
  log,
  address,
  topics
}) {
  const logAddress = toLowerCase(log.address);
  if (address !== void 0 && address.length > 0) {
    if (Array.isArray(address)) {
      if (!address.includes(logAddress))
        return false;
    } else {
      if (logAddress !== address)
        return false;
    }
  }
  if (topics) {
    for (const [index, topic] of topics.entries()) {
      if (topic === null)
        continue;
      if (Array.isArray(topic)) {
        if (!topic.includes(log.topics[index]))
          return false;
      } else {
        if (log.topics[index] !== topic)
          return false;
      }
    }
  }
  return true;
}

// src/sync-realtime/format.ts
import {
  hexToNumber as hexToNumber3
} from "viem";
var realtimeBlockToLightBlock = ({
  hash,
  parentHash,
  number,
  timestamp
}) => ({
  hash,
  parentHash,
  number: hexToNumber3(number),
  timestamp: hexToNumber3(timestamp)
});
var realtimeLogToLightLog = ({
  blockHash,
  blockNumber
}) => ({
  blockHash,
  blockNumber: hexToNumber3(blockNumber)
});

// src/sync-realtime/service.ts
var RealtimeSyncService = class extends Emittery {
  common;
  syncStore;
  network;
  requestQueue;
  sources;
  /**
   * Derived source state.
   */
  hasFactorySource;
  logFilterSources;
  factorySources;
  address;
  eventSelectors;
  isProcessingBlock = false;
  isProcessBlockQueued = false;
  lastLogsPerBlock = 0;
  /** Current finalized block. */
  finalizedBlock = void 0;
  /** Local representation of the unfinalized portion of the chain. */
  blocks = [];
  logs = [];
  /** Function to stop polling for new blocks. */
  unpoll = () => {
  };
  /** If true, failed tasks should not log errors or be retried. */
  isShuttingDown = false;
  constructor({
    common,
    syncStore,
    network,
    requestQueue,
    sources = []
  }) {
    super();
    this.common = common;
    this.syncStore = syncStore;
    this.network = network;
    this.requestQueue = requestQueue;
    this.sources = sources;
    this.hasFactorySource = sources.some(sourceIsFactory);
    this.logFilterSources = sources.filter(sourceIsLogFilter);
    this.factorySources = sources.filter(sourceIsFactory);
    const isAddressDefined = this.logFilterSources.every(
      (source) => !!source.criteria.address
    );
    this.address = !this.hasFactorySource && isAddressDefined ? sources.flatMap((source) => source.criteria.address) : void 0;
    this.eventSelectors = sources.flatMap((source) => {
      const topics = [];
      if (sourceIsFactory(source)) {
        topics.push(source.criteria.eventSelector);
      }
      const topic0 = source.criteria.topics?.[0];
      if (topic0) {
        if (Array.isArray(topic0))
          topics.push(...topic0);
        else
          topics.push(topic0);
      } else {
        topics.push(...Object.keys(source.abiEvents.bySelector));
      }
      return topics;
    });
  }
  setup = async () => {
    this.blocks = [];
    this.logs = [];
    let latestBlock;
    let rpcChainId;
    try {
      [latestBlock, rpcChainId] = await Promise.all([
        this._eth_getBlockByNumber("latest"),
        this.requestQueue.request({ method: "eth_chainId" }).then((c) => hexToNumber4(c))
      ]);
    } catch (error_) {
      throw Error(
        "Failed to fetch initial realtime data. (Hint: Most likely the result of an incapable RPC provider)"
      );
    }
    if (rpcChainId !== this.network.chainId) {
      this.common.logger.warn({
        service: "realtime",
        msg: `Remote chain ID (${rpcChainId}) does not match configured chain ID (${this.network.chainId}) for network "${this.network.name}"`
      });
    }
    const latestBlockNumber = hexToNumber4(latestBlock.number);
    this.common.logger.info({
      service: "realtime",
      msg: `Fetched latest block at ${latestBlockNumber} (network=${this.network.name})`
    });
    this.common.metrics.ponder_realtime_is_connected.set(
      { network: this.network.name },
      1
    );
    const finalizedBlockNumber = Math.max(
      0,
      latestBlockNumber - this.network.finalityBlockCount
    );
    this.finalizedBlock = await this._eth_getBlockByNumber(
      finalizedBlockNumber
    ).then(realtimeBlockToLightBlock);
    return { latestBlockNumber, finalizedBlockNumber };
  };
  start = () => {
    const endBlocks = this.sources.map((f) => f.endBlock);
    if (endBlocks.every(
      (endBlock) => endBlock !== void 0 && endBlock < this.finalizedBlock.number
    )) {
      this.common.logger.warn({
        service: "realtime",
        msg: `No realtime contracts (network=${this.network.name})`
      });
      this.emit("realtimeCheckpoint", {
        ...maxCheckpoint,
        chainId: this.network.chainId
      });
      this.common.metrics.ponder_realtime_is_connected.set(
        { network: this.network.name },
        0
      );
      return;
    }
    this.unpoll = poll(
      async () => {
        await this.process();
      },
      { emitOnBegin: false, interval: this.network.pollingInterval }
    );
  };
  kill = () => {
    this.isShuttingDown = true;
    this.unpoll();
    this.common.logger.debug({
      service: "realtime",
      msg: `Killed realtime sync service (network=${this.network.name})`
    });
  };
  onIdle = () => {
    if (!this.isProcessingBlock)
      return Promise.resolve();
    return new Promise((res) => {
      this.on("idle", res);
    });
  };
  process = async () => {
    if (this.isProcessingBlock) {
      this.isProcessBlockQueued = true;
      return;
    }
    this.isProcessingBlock = true;
    for (let i = 0; i < 4; i++) {
      try {
        const block = await this._eth_getBlockByNumber("latest");
        await this.handleNewBlock(block);
        break;
      } catch (error_) {
        const error = error_;
        if (this.isShuttingDown)
          return;
        this.common.logger.warn({
          service: "realtime",
          msg: `Realtime sync task failed (network=${this.network.name}, error=${`${error.name}: ${error.message}`})`,
          network: this.network.name
        });
        if (i === 3)
          this.emit("fatal");
      }
    }
    this.isProcessingBlock = false;
    if (this.isProcessBlockQueued) {
      this.isProcessBlockQueued = false;
      await this.process();
    } else {
      this.emit("idle");
    }
  };
  /**
   * 1) Determine sync algorithm to use.
   * 2) Fetch new blocks and logs.
   * 3) Check for re-org, if occurred evict forked blocks and logs, and re-run.
   *    If not re-org, continue.
   * 4) Add blocks, logs, and tx data to store.
   * 5) Move finalized block forward if applicable, insert interval.
   *
   */
  handleNewBlock = async (newBlock) => {
    const latestLocalBlock = this.getLatestLocalBlock();
    if (latestLocalBlock.hash === newBlock.hash) {
      this.common.logger.trace({
        service: "realtime",
        msg: `Already processed block at ${hexToNumber4(
          newBlock.number
        )} (network=${this.network.name})`
      });
      return;
    }
    const sync = this.determineSyncPath(newBlock);
    const syncResult = sync === "traverse" ? await this.syncTraverse(newBlock) : await this.syncBatch(newBlock);
    if (!syncResult.reorg) {
      await this.insertRealtimeBlocks(syncResult);
      this.logs.push(...syncResult.logs.map(realtimeLogToLightLog));
      this.blocks.push(...syncResult.blocks.map(realtimeBlockToLightBlock));
    }
    const latestBlockNumber = hexToNumber4(newBlock.number);
    const blockMovesFinality = latestBlockNumber >= this.finalizedBlock.number + 2 * this.network.finalityBlockCount;
    let hasReorg = false;
    if (blockMovesFinality && !this.isChainConsistent([this.finalizedBlock, ...this.blocks]) || syncResult.reorg) {
      hasReorg = await this.reconcileReorg(latestBlockNumber);
    }
    if (hasReorg || syncResult.reorg) {
      this.common.metrics.ponder_realtime_reorg_total.inc({
        network: this.network.name
      });
      this.isProcessBlockQueued = true;
      return;
    }
    if (blockMovesFinality) {
      const newFinalizedBlock = this.blocks.findLast(
        (block) => block.number <= latestBlockNumber - this.network.finalityBlockCount
      );
      if (newFinalizedBlock) {
        this.blocks = this.blocks.filter(
          (block) => block.number > newFinalizedBlock.number
        );
        this.logs = this.logs.filter(
          (log) => log.blockNumber > newFinalizedBlock.number
        );
        await this.syncStore.insertRealtimeInterval({
          chainId: this.network.chainId,
          logFilters: this.logFilterSources.map((l) => l.criteria),
          factories: this.factorySources.map((f) => f.criteria),
          interval: {
            startBlock: BigInt(this.finalizedBlock.number + 1),
            endBlock: BigInt(newFinalizedBlock.number)
          }
        });
        this.finalizedBlock = newFinalizedBlock;
        this.emit("finalityCheckpoint", {
          blockTimestamp: newFinalizedBlock.timestamp,
          chainId: this.network.chainId,
          blockNumber: newFinalizedBlock.number
        });
        this.common.logger.debug({
          service: "realtime",
          msg: `Updated finality checkpoint to ${newFinalizedBlock.number} (network=${this.network.name})`
        });
      }
    }
    const newBlockNumber = hexToNumber4(newBlock.number);
    const newBlockTimestamp = hexToNumber4(newBlock.timestamp);
    this.emit("realtimeCheckpoint", {
      blockTimestamp: newBlockTimestamp,
      chainId: this.network.chainId,
      blockNumber: newBlockNumber
    });
    this.common.metrics.ponder_realtime_latest_block_number.set(
      { network: this.network.name },
      newBlockNumber
    );
    this.common.metrics.ponder_realtime_latest_block_timestamp.set(
      { network: this.network.name },
      newBlockTimestamp
    );
    this.common.logger.debug({
      service: "realtime",
      msg: `Finished syncing new head block ${hexToNumber4(
        newBlock.number
      )} (network=${this.network.name})`
    });
  };
  /**
   * Determine which sync algorithm to use.
   */
  determineSyncPath = (newBlock) => {
    if (this.hasFactorySource)
      return "batch";
    const latestLocalBlock = this.getLatestLocalBlock();
    const numBlocks = hexToNumber4(newBlock.number) - latestLocalBlock.number;
    const pLog = Math.min(this.lastLogsPerBlock, 1);
    const batchCost = 75 + 16 * numBlocks * pLog + 75 * Math.min(1, numBlocks / this.network.finalityBlockCount);
    const pNoLogs = (1 - pLog) ** numBlocks;
    const traverseCost = 16 * numBlocks + 75 * (1 - pNoLogs);
    return batchCost > traverseCost ? "traverse" : "batch";
  };
  syncTraverse = async (newBlock) => {
    const latestLocalBlock = this.getLatestLocalBlock();
    const latestLocalBlockNumber = latestLocalBlock.number;
    const newBlockNumber = hexToNumber4(newBlock.number);
    const missingBlockRange = range(latestLocalBlockNumber + 1, newBlockNumber);
    const newBlocks = await Promise.all(
      missingBlockRange.map(this._eth_getBlockByNumber)
    );
    newBlocks.push(newBlock);
    if (!this.isChainConsistent([latestLocalBlock, ...newBlocks])) {
      return { reorg: true };
    }
    const criteria = this.sources.map((s) => s.criteria);
    const canSkipGetLogs = !this.hasFactorySource && newBlocks.every(
      (block) => !isMatchedLogInBloomFilter({
        bloom: block.logsBloom,
        logFilters: criteria
      })
    );
    if (canSkipGetLogs)
      return { blocks: newBlocks, logs: [], reorg: false };
    const logs = await this._eth_getLogs({
      fromBlock: numberToHex2(latestLocalBlockNumber + 1),
      toBlock: numberToHex2(newBlockNumber)
    });
    const matchedLogs = await this.getMatchedLogs(
      logs,
      BigInt(newBlockNumber),
      true
    );
    return { blocks: newBlocks, logs: matchedLogs, reorg: false };
  };
  syncBatch = async (newBlock) => {
    const latestLocalBlock = this.getLatestLocalBlock();
    const latestLocalBlockNumber = latestLocalBlock.number;
    const newBlockNumber = hexToNumber4(newBlock.number);
    const logs = await this._eth_getLogs({
      fromBlock: numberToHex2(latestLocalBlockNumber + 1),
      toBlock: newBlock.number
    });
    const matchedLogs = await this.getMatchedLogs(
      logs,
      BigInt(newBlockNumber),
      true
    );
    const missingBlockNumbers = dedupe(
      matchedLogs.map((log) => log.blockNumber)
    ).filter((b) => b !== newBlock.number);
    const blocks = await Promise.all(
      missingBlockNumbers.map(this._eth_getBlockByNumber)
    );
    blocks.push(newBlock);
    return { blocks, logs: matchedLogs, reorg: false };
  };
  /**
   * Check if a re-org occurred by comparing remote logs to local.
   *
   * @returns True if a re-org has occurred.
   */
  reconcileReorg = async (latestBlockNumber) => {
    const logs = await this._eth_getLogs({
      fromBlock: numberToHex2(this.finalizedBlock.number + 1),
      toBlock: numberToHex2(latestBlockNumber)
    });
    const matchedLogs = await this.getMatchedLogs(
      logs,
      BigInt(latestBlockNumber),
      false
    );
    const localLogs = this.logs.filter(
      (log) => log.blockNumber <= latestBlockNumber
    );
    const handleReorg = async (nonMatchingIndex) => {
      if (nonMatchingIndex === 0) {
        const hasDeepReorg = await this.reconcileDeepReorg(latestBlockNumber);
        if (hasDeepReorg)
          return;
        this.blocks = [];
        this.logs = [];
        await this.syncStore.deleteRealtimeData({
          chainId: this.network.chainId,
          fromBlock: BigInt(this.finalizedBlock.number)
        });
        this.emit("shallowReorg", {
          blockTimestamp: this.finalizedBlock.timestamp,
          chainId: this.network.chainId,
          blockNumber: this.finalizedBlock.number
        });
        const depth = latestBlockNumber - this.finalizedBlock.number;
        this.common.logger.warn({
          service: "realtime",
          msg: `Detected ${depth}-block reorg with common ancestor ${this.finalizedBlock.number} (network=${this.network.name})`
        });
      } else {
        const ancestorBlockHash = localLogs[nonMatchingIndex - 1].blockHash;
        const commonAncestor = this.blocks.find(
          (block) => block.hash === ancestorBlockHash
        );
        this.blocks = this.blocks.filter(
          (block) => block.number <= commonAncestor.number
        );
        this.logs = this.logs.filter(
          (log) => log.blockNumber <= commonAncestor.number
        );
        await this.syncStore.deleteRealtimeData({
          chainId: this.network.chainId,
          fromBlock: BigInt(commonAncestor.number)
        });
        this.emit("shallowReorg", {
          blockTimestamp: commonAncestor.timestamp,
          chainId: this.network.chainId,
          blockNumber: commonAncestor.number
        });
        const depth = latestBlockNumber - commonAncestor.number;
        this.common.logger.warn({
          service: "realtime",
          msg: `Detected ${depth}-block reorg with common ancestor ${commonAncestor.number} (network=${this.network.name})`
        });
      }
    };
    let i = 0;
    for (; i < localLogs.length && i < matchedLogs.length; i++) {
      const lightMatchedLog = realtimeLogToLightLog(matchedLogs[i]);
      if (lightMatchedLog.blockHash !== localLogs[i].blockHash) {
        handleReorg(i);
        return true;
      }
    }
    if (localLogs.length !== matchedLogs.length) {
      handleReorg(i);
      return true;
    }
    if (localLogs.length === 0) {
      return await this.reconcileDeepReorg(latestBlockNumber);
    } else
      return false;
  };
  /**
   * Check if deep re-org occured by comparing remote "finalized" block to local.
   */
  reconcileDeepReorg = async (latestBlockNumber) => {
    const remoteFinalizedBlock = await this._eth_getBlockByNumber(
      this.finalizedBlock.number
    );
    if (remoteFinalizedBlock.hash !== this.finalizedBlock.hash) {
      this.emit("deepReorg", {
        detectedAtBlockNumber: latestBlockNumber,
        minimumDepth: latestBlockNumber - this.blocks[0].number
      });
      this.common.logger.warn({
        service: "realtime",
        msg: `Unable to reconcile >${latestBlockNumber - this.blocks[0].number}-block reorg (network=${this.network.name})`
      });
      this.emit("fatal");
      this.blocks = [];
      this.logs = [];
      this.finalizedBlock = realtimeBlockToLightBlock(remoteFinalizedBlock);
      return true;
    }
    return false;
  };
  /**
   * Helper function for "eth_getBlockByNumber" request.
   */
  _eth_getBlockByNumber = (block) => this.requestQueue.request({
    method: "eth_getBlockByNumber",
    params: [typeof block === "number" ? numberToHex2(block) : block, true]
  }).then((block2) => {
    if (!block2)
      throw new BlockNotFoundError2({});
    return block2;
  });
  /**
   * Helper function for "eth_getLogs" rpc request.
   *
   * Note: Consider handling different error types and retry the request if applicable.
   */
  _eth_getLogs = (params) => this.requestQueue.request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: params.fromBlock,
        toBlock: params.toBlock,
        address: this.address,
        topics: [this.eventSelectors]
      }
    ]
  });
  insertRealtimeBlocks = async ({
    logs,
    blocks
  }) => {
    for (const block of blocks) {
      const blockLogs = logs.filter((l) => l.blockNumber === block.number);
      if (blockLogs.length === 0)
        continue;
      const requiredTransactionHashes = new Set(
        blockLogs.map((l) => l.transactionHash)
      );
      const blockTransactions = block.transactions.filter(
        (t) => requiredTransactionHashes.has(t.hash)
      );
      await this.syncStore.insertRealtimeBlock({
        chainId: this.network.chainId,
        block,
        transactions: blockTransactions,
        logs: blockLogs
      });
      const matchedLogCountText = blockLogs.length === 1 ? "1 matched log" : `${blockLogs.length} matched logs`;
      this.common.logger.info({
        service: "realtime",
        msg: `Synced ${matchedLogCountText} from block ${hexToNumber4(
          block.number
        )} (network=${this.network.name})`
      });
    }
    this.lastLogsPerBlock = logs.length / blocks.length;
  };
  getMatchedLogs = async (logs, toBlockNumber, insertChildAddress) => {
    if (!this.hasFactorySource) {
      return filterLogs({
        logs,
        logFilters: this.sources.map((s) => s.criteria)
      });
    } else {
      const matchedFactoryLogs = filterLogs({
        logs,
        logFilters: this.factorySources.map((fs3) => ({
          address: fs3.criteria.address,
          topics: [fs3.criteria.eventSelector]
        }))
      });
      if (insertChildAddress) {
        await this.syncStore.insertFactoryChildAddressLogs({
          chainId: this.network.chainId,
          logs: matchedFactoryLogs
        });
      }
      const factoryLogFilters = await Promise.all(
        this.factorySources.map(async (factory) => {
          const iterator = this.syncStore.getFactoryChildAddresses({
            chainId: this.network.chainId,
            factory: factory.criteria,
            upToBlockNumber: toBlockNumber
          });
          const childContractAddresses = [];
          for await (const batch of iterator) {
            childContractAddresses.push(...batch);
          }
          return {
            address: childContractAddresses,
            topics: factory.criteria.topics
          };
        })
      );
      return filterLogs({
        logs,
        logFilters: [
          ...this.logFilterSources.map((l) => l.criteria),
          ...factoryLogFilters
        ]
      });
    }
  };
  /** Returns true if "blocks" has a valid chain of block.parentHash to block.hash. */
  isChainConsistent = (blocks) => {
    for (let i = blocks.length - 1; i > 1; i--) {
      if (blocks[i].parentHash !== blocks[i - 1].hash)
        return false;
    }
    return true;
  };
  getLatestLocalBlock = () => this.blocks[this.blocks.length - 1] ?? this.finalizedBlock;
};

// src/utils/fragments.ts
function buildLogFilterFragments({
  address,
  topics,
  chainId
}) {
  return buildFragments({
    address,
    topics,
    chainId,
    idCallback: (address_, topic0_, topic1_, topic2_, topic3_) => `${chainId}_${address_}_${topic0_}_${topic1_}_${topic2_}_${topic3_}`
  });
}
function buildFactoryFragments({
  address,
  topics,
  childAddressLocation,
  eventSelector,
  chainId
}) {
  const fragments = buildFragments({
    address,
    topics,
    chainId,
    childAddressLocation,
    eventSelector,
    idCallback: (address_, topic0_, topic1_, topic2_, topic3_) => `${chainId}_${address_}_${eventSelector}_${childAddressLocation}_${topic0_}_${topic1_}_${topic2_}_${topic3_}`
  });
  return fragments;
}
function buildFragments({
  address,
  topics,
  chainId,
  idCallback,
  ...rest
}) {
  const fragments = [];
  const { topic0, topic1, topic2, topic3 } = parseTopics(topics);
  for (const address_ of Array.isArray(address) ? address : [address ?? null]) {
    for (const topic0_ of Array.isArray(topic0) ? topic0 : [topic0]) {
      for (const topic1_ of Array.isArray(topic1) ? topic1 : [topic1]) {
        for (const topic2_ of Array.isArray(topic2) ? topic2 : [topic2]) {
          for (const topic3_ of Array.isArray(topic3) ? topic3 : [topic3]) {
            fragments.push({
              id: idCallback(address_, topic0_, topic1_, topic2_, topic3_),
              ...rest,
              chainId,
              address: address_,
              topic0: topic0_,
              topic1: topic1_,
              topic2: topic2_,
              topic3: topic3_
            });
          }
        }
      }
    }
  }
  return fragments;
}
function parseTopics(topics) {
  return {
    topic0: topics?.[0] ?? null,
    topic1: topics?.[1] ?? null,
    topic2: topics?.[2] ?? null,
    topic3: topics?.[3] ?? null
  };
}

// src/sync-store/postgres/store.ts
import {
  Kysely as Kysely3,
  Migrator,
  PostgresDialect as PostgresDialect2,
  sql as sql4
} from "kysely";
import {
  checksumAddress as checksumAddress2
} from "viem";

// src/sync-store/postgres/format.ts
import {
  hexToNumber as hexToNumber5
} from "viem";
function rpcToPostgresBlock(block) {
  return {
    baseFeePerGas: block.baseFeePerGas ? BigInt(block.baseFeePerGas) : null,
    difficulty: BigInt(block.difficulty),
    extraData: block.extraData,
    gasLimit: BigInt(block.gasLimit),
    gasUsed: BigInt(block.gasUsed),
    hash: block.hash,
    logsBloom: block.logsBloom,
    miner: toLowerCase(block.miner),
    mixHash: block.mixHash ?? null,
    nonce: block.nonce ?? null,
    number: BigInt(block.number),
    parentHash: block.parentHash,
    receiptsRoot: block.receiptsRoot,
    sha3Uncles: block.sha3Uncles,
    size: BigInt(block.size),
    stateRoot: block.stateRoot,
    timestamp: BigInt(block.timestamp),
    totalDifficulty: BigInt(block.totalDifficulty),
    transactionsRoot: block.transactionsRoot
  };
}
function rpcToPostgresTransaction(transaction) {
  return {
    accessList: transaction.accessList ? JSON.stringify(transaction.accessList) : void 0,
    blockHash: transaction.blockHash,
    blockNumber: BigInt(transaction.blockNumber),
    from: toLowerCase(transaction.from),
    gas: BigInt(transaction.gas),
    gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : null,
    hash: transaction.hash,
    input: transaction.input,
    maxFeePerGas: transaction.maxFeePerGas ? BigInt(transaction.maxFeePerGas) : null,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? BigInt(transaction.maxPriorityFeePerGas) : null,
    nonce: hexToNumber5(transaction.nonce),
    r: transaction.r,
    s: transaction.s,
    to: transaction.to ? toLowerCase(transaction.to) : null,
    transactionIndex: Number(transaction.transactionIndex),
    type: transaction.type ?? "0x0",
    value: BigInt(transaction.value),
    v: BigInt(transaction.v)
  };
}
function rpcToPostgresLog(log) {
  return {
    address: toLowerCase(log.address),
    blockHash: log.blockHash,
    blockNumber: BigInt(log.blockNumber),
    data: log.data,
    id: `${log.blockHash}-${log.logIndex}`,
    logIndex: Number(log.logIndex),
    topic0: log.topics[0] ? log.topics[0] : null,
    topic1: log.topics[1] ? log.topics[1] : null,
    topic2: log.topics[2] ? log.topics[2] : null,
    topic3: log.topics[3] ? log.topics[3] : null,
    transactionHash: log.transactionHash,
    transactionIndex: Number(log.transactionIndex)
  };
}

// src/sync-store/postgres/migrations.ts
import { sql as sql3 } from "kysely";
var migrations = {
  "2023_05_15_0_initial": {
    async up(db) {
      await db.schema.createTable("blocks").addColumn("baseFeePerGas", sql3`bytea`).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("difficulty", sql3`bytea`, (col) => col.notNull()).addColumn("extraData", "text", (col) => col.notNull()).addColumn("finalized", "integer", (col) => col.notNull()).addColumn("gasLimit", sql3`bytea`, (col) => col.notNull()).addColumn("gasUsed", sql3`bytea`, (col) => col.notNull()).addColumn("hash", "text", (col) => col.notNull().primaryKey()).addColumn("logsBloom", "text", (col) => col.notNull()).addColumn("miner", "text", (col) => col.notNull()).addColumn("mixHash", "text", (col) => col.notNull()).addColumn("nonce", "text", (col) => col.notNull()).addColumn("number", sql3`bytea`, (col) => col.notNull()).addColumn("parentHash", "text", (col) => col.notNull()).addColumn("receiptsRoot", "text", (col) => col.notNull()).addColumn("sha3Uncles", "text", (col) => col.notNull()).addColumn("size", sql3`bytea`, (col) => col.notNull()).addColumn("stateRoot", "text", (col) => col.notNull()).addColumn("timestamp", sql3`bytea`, (col) => col.notNull()).addColumn("totalDifficulty", sql3`bytea`, (col) => col.notNull()).addColumn("transactionsRoot", "text", (col) => col.notNull()).execute();
      await db.schema.createTable("transactions").addColumn("accessList", "text").addColumn("blockHash", "text", (col) => col.notNull()).addColumn("blockNumber", sql3`bytea`, (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("finalized", "integer", (col) => col.notNull()).addColumn("from", "text", (col) => col.notNull()).addColumn("gas", sql3`bytea`, (col) => col.notNull()).addColumn("gasPrice", sql3`bytea`).addColumn("hash", "text", (col) => col.notNull().primaryKey()).addColumn("input", "text", (col) => col.notNull()).addColumn("maxFeePerGas", sql3`bytea`).addColumn("maxPriorityFeePerGas", sql3`bytea`).addColumn("nonce", "integer", (col) => col.notNull()).addColumn("r", "text", (col) => col.notNull()).addColumn("s", "text", (col) => col.notNull()).addColumn("to", "text").addColumn("transactionIndex", "integer", (col) => col.notNull()).addColumn("type", "text", (col) => col.notNull()).addColumn("value", sql3`bytea`, (col) => col.notNull()).addColumn("v", sql3`bytea`, (col) => col.notNull()).execute();
      await db.schema.createTable("logs").addColumn("address", "text", (col) => col.notNull()).addColumn("blockHash", "text", (col) => col.notNull()).addColumn("blockNumber", sql3`bytea`, (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("data", "text", (col) => col.notNull()).addColumn("finalized", "integer", (col) => col.notNull()).addColumn("id", "text", (col) => col.notNull().primaryKey()).addColumn("logIndex", "integer", (col) => col.notNull()).addColumn("topic0", "text").addColumn("topic1", "text").addColumn("topic2", "text").addColumn("topic3", "text").addColumn("transactionHash", "text", (col) => col.notNull()).addColumn("transactionIndex", "integer", (col) => col.notNull()).execute();
      await db.schema.createTable("contractReadResults").addColumn("address", "text", (col) => col.notNull()).addColumn("blockNumber", sql3`bytea`, (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("data", "text", (col) => col.notNull()).addColumn("finalized", "integer", (col) => col.notNull()).addColumn("result", "text", (col) => col.notNull()).addPrimaryKeyConstraint("contractReadResultPrimaryKey", [
        "chainId",
        "blockNumber",
        "address",
        "data"
      ]).execute();
      await db.schema.createTable("logFilterCachedRanges").addColumn("endBlock", sql3`bytea`, (col) => col.notNull()).addColumn("endBlockTimestamp", sql3`bytea`, (col) => col.notNull()).addColumn("filterKey", "text", (col) => col.notNull()).addColumn("id", "serial", (col) => col.notNull().primaryKey()).addColumn("startBlock", sql3`bytea`, (col) => col.notNull()).execute();
    }
  },
  "2023_06_20_0_indices": {
    async up(db) {
      await db.schema.createIndex("log_events_index").on("logs").columns(["address", "chainId", "blockHash"]).execute();
      await db.schema.createIndex("blocks_index").on("blocks").columns(["timestamp", "number"]).execute();
      await db.schema.createIndex("logFilterCachedRanges_index").on("logFilterCachedRanges").columns(["filterKey"]).execute();
    }
  },
  "2023_07_18_0_better_indices": {
    async up(db) {
      await db.schema.dropIndex("log_events_index").execute();
      await db.schema.dropIndex("blocks_index").execute();
      await db.schema.createIndex("log_block_hash_index").on("logs").column("blockHash").execute();
      await db.schema.createIndex("log_chain_id_index").on("logs").column("chainId").execute();
      await db.schema.createIndex("log_address_index").on("logs").column("address").execute();
      await db.schema.createIndex("log_topic0_index").on("logs").column("topic0").execute();
      await db.schema.createIndex("block_timestamp_index").on("blocks").column("timestamp").execute();
      await db.schema.createIndex("block_number_index").on("blocks").column("number").execute();
    }
  },
  "2023_07_24_0_drop_finalized": {
    async up(db) {
      await db.schema.alterTable("blocks").dropColumn("finalized").execute();
      await db.schema.alterTable("transactions").dropColumn("finalized").execute();
      await db.schema.alterTable("logs").dropColumn("finalized").execute();
      await db.schema.alterTable("contractReadResults").dropColumn("finalized").execute();
    }
  },
  "2023_09_19_0_new_sync_design": {
    async up(db) {
      await db.schema.dropTable("logFilterCachedRanges").execute();
      await db.schema.dropTable("blocks").execute();
      await db.schema.createTable("blocks").addColumn("baseFeePerGas", "numeric(78, 0)").addColumn("chainId", "integer", (col) => col.notNull()).addColumn("difficulty", "numeric(78, 0)", (col) => col.notNull()).addColumn("extraData", "text", (col) => col.notNull()).addColumn("gasLimit", "numeric(78, 0)", (col) => col.notNull()).addColumn("gasUsed", "numeric(78, 0)", (col) => col.notNull()).addColumn("hash", "varchar(66)", (col) => col.notNull().primaryKey()).addColumn("logsBloom", "varchar(514)", (col) => col.notNull()).addColumn("miner", "varchar(42)", (col) => col.notNull()).addColumn("mixHash", "varchar(66)", (col) => col.notNull()).addColumn("nonce", "varchar(18)", (col) => col.notNull()).addColumn("number", "numeric(78, 0)", (col) => col.notNull()).addColumn("parentHash", "varchar(66)", (col) => col.notNull()).addColumn("receiptsRoot", "varchar(66)", (col) => col.notNull()).addColumn("sha3Uncles", "varchar(66)", (col) => col.notNull()).addColumn("size", "numeric(78, 0)", (col) => col.notNull()).addColumn("stateRoot", "varchar(66)", (col) => col.notNull()).addColumn("timestamp", "numeric(78, 0)", (col) => col.notNull()).addColumn("totalDifficulty", "numeric(78, 0)", (col) => col.notNull()).addColumn("transactionsRoot", "varchar(66)", (col) => col.notNull()).execute();
      await db.schema.createIndex("blockTimestampIndex").on("blocks").column("timestamp").execute();
      await db.schema.createIndex("blockNumberIndex").on("blocks").column("number").execute();
      await db.schema.dropTable("transactions").execute();
      await db.schema.createTable("transactions").addColumn("accessList", "text").addColumn("blockHash", "varchar(66)", (col) => col.notNull()).addColumn("blockNumber", "numeric(78, 0)", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("from", "varchar(42)", (col) => col.notNull()).addColumn("gas", "numeric(78, 0)", (col) => col.notNull()).addColumn("gasPrice", "numeric(78, 0)").addColumn("hash", "varchar(66)", (col) => col.notNull().primaryKey()).addColumn("input", "text", (col) => col.notNull()).addColumn("maxFeePerGas", "numeric(78, 0)").addColumn("maxPriorityFeePerGas", "numeric(78, 0)").addColumn("nonce", "integer", (col) => col.notNull()).addColumn("r", "varchar(66)", (col) => col.notNull()).addColumn("s", "varchar(66)", (col) => col.notNull()).addColumn("to", "varchar(42)").addColumn("transactionIndex", "integer", (col) => col.notNull()).addColumn("type", "text", (col) => col.notNull()).addColumn("value", "numeric(78, 0)", (col) => col.notNull()).addColumn("v", "numeric(78, 0)", (col) => col.notNull()).execute();
      await db.schema.dropTable("logs").execute();
      await db.schema.createTable("logs").addColumn("address", "varchar(42)", (col) => col.notNull()).addColumn("blockHash", "varchar(66)", (col) => col.notNull()).addColumn("blockNumber", "numeric(78, 0)", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("data", "text", (col) => col.notNull()).addColumn("id", "text", (col) => col.notNull().primaryKey()).addColumn("logIndex", "integer", (col) => col.notNull()).addColumn("topic0", "varchar(66)").addColumn("topic1", "varchar(66)").addColumn("topic2", "varchar(66)").addColumn("topic3", "varchar(66)").addColumn("transactionHash", "varchar(66)", (col) => col.notNull()).addColumn("transactionIndex", "integer", (col) => col.notNull()).execute();
      await db.schema.createIndex("logBlockHashIndex").on("logs").column("blockHash").execute();
      await db.schema.createIndex("logChainIdIndex").on("logs").column("chainId").execute();
      await db.schema.createIndex("logAddressIndex").on("logs").column("address").execute();
      await db.schema.createIndex("logTopic0Index").on("logs").column("topic0").execute();
      await db.schema.dropTable("contractReadResults").execute();
      await db.schema.createTable("contractReadResults").addColumn("address", "varchar(42)", (col) => col.notNull()).addColumn("blockNumber", "numeric(78, 0)", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("data", "text", (col) => col.notNull()).addColumn("result", "text", (col) => col.notNull()).addPrimaryKeyConstraint("contractReadResultPrimaryKey", [
        "chainId",
        "blockNumber",
        "address",
        "data"
      ]).execute();
      await db.schema.createTable("logFilters").addColumn("id", "text", (col) => col.notNull().primaryKey()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("address", "varchar(66)").addColumn("topic0", "varchar(66)").addColumn("topic1", "varchar(66)").addColumn("topic2", "varchar(66)").addColumn("topic3", "varchar(66)").execute();
      await db.schema.createTable("logFilterIntervals").addColumn("id", "serial", (col) => col.notNull().primaryKey()).addColumn(
        "logFilterId",
        "text",
        (col) => col.notNull().references("logFilters.id")
      ).addColumn("startBlock", "numeric(78, 0)", (col) => col.notNull()).addColumn("endBlock", "numeric(78, 0)", (col) => col.notNull()).execute();
      await db.schema.createIndex("logFilterIntervalsLogFilterId").on("logFilterIntervals").column("logFilterId").execute();
      await db.schema.createTable("factories").addColumn("id", "text", (col) => col.notNull().primaryKey()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("address", "varchar(42)", (col) => col.notNull()).addColumn("eventSelector", "varchar(66)", (col) => col.notNull()).addColumn("childAddressLocation", "text", (col) => col.notNull()).addColumn("topic0", "varchar(66)").addColumn("topic1", "varchar(66)").addColumn("topic2", "varchar(66)").addColumn("topic3", "varchar(66)").execute();
      await db.schema.createTable("factoryLogFilterIntervals").addColumn("id", "serial", (col) => col.notNull().primaryKey()).addColumn(
        "factoryId",
        "text",
        (col) => col.notNull().references("factories.id")
      ).addColumn("startBlock", "numeric(78, 0)", (col) => col.notNull()).addColumn("endBlock", "numeric(78, 0)", (col) => col.notNull()).execute();
      await db.schema.createIndex("factoryLogFilterIntervalsFactoryId").on("factoryLogFilterIntervals").column("factoryId").execute();
    }
  },
  "2023_11_06_0_new_rpc_cache_design": {
    async up(db) {
      await db.schema.dropTable("contractReadResults").execute();
      await db.schema.createTable("rpcRequestResults").addColumn("request", "text", (col) => col.notNull()).addColumn("blockNumber", "numeric(78, 0)", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("result", "text", (col) => col.notNull()).addPrimaryKeyConstraint("rpcRequestResultPrimaryKey", [
        "request",
        "chainId",
        "blockNumber"
      ]).execute();
    }
  },
  "2024_01_30_0_change_chain_id_type": {
    async up(db) {
      await db.schema.alterTable("blocks").alterColumn("chainId", (col) => col.setDataType("int8")).execute();
      await db.schema.alterTable("transactions").alterColumn("chainId", (col) => col.setDataType("int8")).execute();
      await db.schema.alterTable("logs").alterColumn("chainId", (col) => col.setDataType("int8")).execute();
      await db.schema.alterTable("logFilters").alterColumn("chainId", (col) => col.setDataType("int8")).execute();
      await db.schema.alterTable("factories").alterColumn("chainId", (col) => col.setDataType("int8")).execute();
      await db.schema.alterTable("rpcRequestResults").alterColumn("chainId", (col) => col.setDataType("int8")).execute();
    }
  },
  "2024_02_1_0_nullable_block_columns": {
    async up(db) {
      await db.schema.alterTable("blocks").alterColumn("mixHash", (col) => col.dropNotNull()).execute();
      await db.schema.alterTable("blocks").alterColumn("nonce", (col) => col.dropNotNull()).execute();
    }
  }
};
var StaticMigrationProvider = class {
  async getMigrations() {
    return migrations;
  }
};
var migrationProvider = new StaticMigrationProvider();

// src/sync-store/postgres/store.ts
var PostgresSyncStore = class {
  common;
  kind = "postgres";
  db;
  migrator;
  constructor({ common, pool }) {
    this.common = common;
    this.db = new Kysely3({
      dialect: new PostgresDialect2({ pool }),
      log(event) {
        if (event.level === "query") {
          common.metrics.ponder_postgres_query_count?.inc({ kind: "sync" });
        }
      }
    });
    this.migrator = new Migrator({
      db: this.db,
      provider: migrationProvider,
      migrationTableSchema: "public"
    });
  }
  async kill() {
    try {
      await this.db.destroy();
    } catch (e) {
      const error = e;
      if (error.message !== "Called end on pool more than once") {
        throw error;
      }
    }
  }
  migrateUp = async () => {
    const start = performance.now();
    const { error } = await this.migrator.migrateToLatest();
    if (error)
      throw error;
    this.record("migrateUp", start);
  };
  insertLogFilterInterval = async ({
    chainId,
    logFilter,
    block: rpcBlock,
    transactions: rpcTransactions,
    logs: rpcLogs,
    interval
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await tx.insertInto("blocks").values({ ...rpcToPostgresBlock(rpcBlock), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      if (rpcTransactions.length > 0) {
        await tx.insertInto("transactions").values(
          rpcTransactions.map((transaction) => ({
            ...rpcToPostgresTransaction(transaction),
            chainId
          }))
        ).onConflict((oc) => oc.column("hash").doNothing()).execute();
      }
      if (rpcLogs.length > 0) {
        await tx.insertInto("logs").values(
          rpcLogs.map((log) => ({
            ...rpcToPostgresLog(log),
            chainId
          }))
        ).onConflict((oc) => oc.column("id").doNothing()).execute();
      }
      await this._insertLogFilterInterval({
        tx,
        chainId,
        logFilters: [logFilter],
        interval
      });
    });
    this.record("insertLogFilterInterval", start);
  };
  getLogFilterIntervals = async ({
    chainId,
    logFilter
  }) => {
    const start = performance.now();
    const fragments = buildLogFilterFragments({ ...logFilter, chainId });
    await Promise.all(
      fragments.map(async (fragment) => {
        return await this.transaction(async (tx) => {
          const { id: logFilterId } = await tx.insertInto("logFilters").values(fragment).onConflict((oc) => oc.column("id").doUpdateSet(fragment)).returningAll().executeTakeFirstOrThrow();
          const existingIntervalRows = await tx.deleteFrom("logFilterIntervals").where("logFilterId", "=", logFilterId).returningAll().execute();
          const mergedIntervals = intervalUnion(
            existingIntervalRows.map((i) => [
              Number(i.startBlock),
              Number(i.endBlock)
            ])
          );
          const mergedIntervalRows = mergedIntervals.map(
            ([startBlock, endBlock]) => ({
              logFilterId,
              startBlock: BigInt(startBlock),
              endBlock: BigInt(endBlock)
            })
          );
          if (mergedIntervalRows.length > 0) {
            await tx.insertInto("logFilterIntervals").values(mergedIntervalRows).execute();
          }
          return mergedIntervals;
        });
      })
    );
    const intervals = await this.db.with(
      "logFilterFragments(fragmentId, fragmentAddress, fragmentTopic0, fragmentTopic1, fragmentTopic2, fragmentTopic3)",
      () => sql4`( values ${sql4.join(
        fragments.map(
          (f) => sql4`( ${sql4.val(f.id)}, ${sql4.val(f.address)}, ${sql4.val(
            f.topic0
          )}, ${sql4.val(f.topic1)}, ${sql4.val(f.topic2)}, ${sql4.val(
            f.topic3
          )} )`
        )
      )} )`
    ).selectFrom("logFilterIntervals").leftJoin("logFilters", "logFilterId", "logFilters.id").innerJoin("logFilterFragments", (join) => {
      let baseJoin = join.on(
        ({ or, cmpr }) => or([
          cmpr("address", "is", null),
          cmpr("fragmentAddress", "=", sql4.ref("address"))
        ])
      );
      for (const idx_ of range(0, 4)) {
        baseJoin = baseJoin.on(({ or, cmpr }) => {
          const idx = idx_;
          return or([
            cmpr(`topic${idx}`, "is", null),
            cmpr(`fragmentTopic${idx}`, "=", sql4.ref(`topic${idx}`))
          ]);
        });
      }
      return baseJoin;
    }).select(["fragmentId", "startBlock", "endBlock"]).where("chainId", "=", chainId).execute();
    const intervalsByFragment = intervals.reduce(
      (acc, cur) => {
        const { fragmentId, ...rest } = cur;
        acc[fragmentId] ||= [];
        acc[fragmentId].push(rest);
        return acc;
      },
      {}
    );
    const fragmentIntervals = fragments.map((f) => {
      return (intervalsByFragment[f.id] ?? []).map(
        (r) => [Number(r.startBlock), Number(r.endBlock)]
      );
    });
    const intersectIntervals = intervalIntersectionMany(fragmentIntervals);
    this.record("getLogFilterIntervals", start);
    return intersectIntervals;
  };
  insertFactoryChildAddressLogs = async ({
    chainId,
    logs: rpcLogs
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      if (rpcLogs.length > 0) {
        await tx.insertInto("logs").values(
          rpcLogs.map((log) => ({
            ...rpcToPostgresLog(log),
            chainId
          }))
        ).onConflict((oc) => oc.column("id").doNothing()).execute();
      }
    });
    this.record("insertFactoryChildAddressLogs", start);
  };
  async *getFactoryChildAddresses({
    chainId,
    upToBlockNumber,
    factory,
    pageSize = 500
  }) {
    const start = performance.now();
    const { address, eventSelector, childAddressLocation } = factory;
    const selectChildAddressExpression = buildFactoryChildAddressSelectExpression({ childAddressLocation });
    const baseQuery = this.db.selectFrom("logs").select([selectChildAddressExpression.as("childAddress"), "blockNumber"]).where("chainId", "=", chainId).where("address", "=", address).where("topic0", "=", eventSelector).where("blockNumber", "<=", upToBlockNumber).limit(pageSize);
    let cursor = void 0;
    while (true) {
      let query2 = baseQuery;
      if (cursor) {
        query2 = query2.where("blockNumber", ">", cursor);
      }
      const batch = await query2.execute();
      const lastRow = batch[batch.length - 1];
      if (lastRow) {
        cursor = lastRow.blockNumber;
      }
      if (batch.length > 0) {
        yield batch.map((a) => a.childAddress);
      }
      if (batch.length < pageSize)
        break;
    }
    this.record("getFactoryChildAddresses", start);
  }
  insertFactoryLogFilterInterval = async ({
    chainId,
    factory,
    block: rpcBlock,
    transactions: rpcTransactions,
    logs: rpcLogs,
    interval
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await tx.insertInto("blocks").values({ ...rpcToPostgresBlock(rpcBlock), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      for (const rpcTransaction of rpcTransactions) {
        await tx.insertInto("transactions").values({ ...rpcToPostgresTransaction(rpcTransaction), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      }
      for (const rpcLog of rpcLogs) {
        await tx.insertInto("logs").values({ ...rpcToPostgresLog(rpcLog), chainId }).onConflict((oc) => oc.column("id").doNothing()).execute();
      }
      await this._insertFactoryLogFilterInterval({
        tx,
        chainId,
        factories: [factory],
        interval
      });
    });
    this.record("insertFactoryLogFilterInterval", start);
  };
  getFactoryLogFilterIntervals = async ({
    chainId,
    factory
  }) => {
    const start = performance.now();
    const fragments = buildFactoryFragments({
      ...factory,
      chainId
    });
    await Promise.all(
      fragments.map(async (fragment) => {
        await this.transaction(async (tx) => {
          const { id: factoryId } = await tx.insertInto("factories").values(fragment).onConflict((oc) => oc.column("id").doUpdateSet(fragment)).returningAll().executeTakeFirstOrThrow();
          const existingIntervals = await tx.deleteFrom("factoryLogFilterIntervals").where("factoryId", "=", factoryId).returningAll().execute();
          const mergedIntervals = intervalUnion(
            existingIntervals.map((i) => [
              Number(i.startBlock),
              Number(i.endBlock)
            ])
          );
          const mergedIntervalRows = mergedIntervals.map(
            ([startBlock, endBlock]) => ({
              factoryId,
              startBlock: BigInt(startBlock),
              endBlock: BigInt(endBlock)
            })
          );
          if (mergedIntervalRows.length > 0) {
            await tx.insertInto("factoryLogFilterIntervals").values(mergedIntervalRows).execute();
          }
          return mergedIntervals;
        });
      })
    );
    const intervals = await this.db.with(
      "factoryFilterFragments(fragmentId, fragmentAddress, fragmentEventSelector, fragmentChildAddressLocation, fragmentTopic0, fragmentTopic1, fragmentTopic2, fragmentTopic3)",
      () => sql4`( values ${sql4.join(
        fragments.map(
          (f) => sql4`( ${sql4.val(f.id)}, ${sql4.val(f.address)}, ${sql4.val(
            f.eventSelector
          )}, ${sql4.val(f.childAddressLocation)}, ${sql4.val(
            f.topic0
          )}, ${sql4.val(f.topic1)}, ${sql4.val(f.topic2)}, ${sql4.val(
            f.topic3
          )} )`
        )
      )} )`
    ).selectFrom("factoryLogFilterIntervals").leftJoin("factories", "factoryId", "factories.id").innerJoin("factoryFilterFragments", (join) => {
      let baseJoin = join.on(
        ({ and, cmpr }) => and([
          cmpr("fragmentAddress", "=", sql4.ref("address")),
          cmpr("fragmentEventSelector", "=", sql4.ref("eventSelector")),
          cmpr(
            "fragmentChildAddressLocation",
            "=",
            sql4.ref("childAddressLocation")
          )
        ])
      );
      for (const idx_ of range(0, 4)) {
        baseJoin = baseJoin.on(({ or, cmpr }) => {
          const idx = idx_;
          return or([
            cmpr(`topic${idx}`, "is", null),
            cmpr(`fragmentTopic${idx}`, "=", sql4.ref(`topic${idx}`))
          ]);
        });
      }
      return baseJoin;
    }).select(["fragmentId", "startBlock", "endBlock"]).where("chainId", "=", chainId).execute();
    const intervalsByFragment = intervals.reduce(
      (acc, cur) => {
        const { fragmentId, ...rest } = cur;
        acc[fragmentId] ||= [];
        acc[fragmentId].push({
          startBlock: rest.startBlock,
          endBlock: rest.endBlock
        });
        return acc;
      },
      {}
    );
    const fragmentIntervals = fragments.map((f) => {
      return (intervalsByFragment[f.id] ?? []).map(
        (r) => [Number(r.startBlock), Number(r.endBlock)]
      );
    });
    const intersectIntervals = intervalIntersectionMany(fragmentIntervals);
    this.record("getFactoryLogFilterIntervals", start);
    return intersectIntervals;
  };
  insertRealtimeBlock = async ({
    chainId,
    block: rpcBlock,
    transactions: rpcTransactions,
    logs: rpcLogs
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await tx.insertInto("blocks").values({ ...rpcToPostgresBlock(rpcBlock), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      for (const rpcTransaction of rpcTransactions) {
        await tx.insertInto("transactions").values({ ...rpcToPostgresTransaction(rpcTransaction), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      }
      for (const rpcLog of rpcLogs) {
        await tx.insertInto("logs").values({ ...rpcToPostgresLog(rpcLog), chainId }).onConflict((oc) => oc.column("id").doNothing()).execute();
      }
    });
    this.record("insertRealtimeBlock", start);
  };
  insertRealtimeInterval = async ({
    chainId,
    logFilters,
    factories,
    interval
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await this._insertLogFilterInterval({
        tx,
        chainId,
        logFilters: [
          ...logFilters,
          ...factories.map((f) => ({
            address: f.address,
            topics: [f.eventSelector]
          }))
        ],
        interval
      });
      await this._insertFactoryLogFilterInterval({
        tx,
        chainId,
        factories,
        interval
      });
    });
    this.record("insertRealtimeInterval", start);
  };
  deleteRealtimeData = async ({
    chainId,
    fromBlock
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await tx.deleteFrom("blocks").where("chainId", "=", chainId).where("number", ">", fromBlock).execute();
      await tx.deleteFrom("transactions").where("chainId", "=", chainId).where("blockNumber", ">", fromBlock).execute();
      await tx.deleteFrom("logs").where("chainId", "=", chainId).where("blockNumber", ">", fromBlock).execute();
      await tx.deleteFrom("rpcRequestResults").where("chainId", "=", chainId).where("blockNumber", ">", fromBlock).execute();
      await tx.deleteFrom("logFilterIntervals").where(
        (qb) => qb.selectFrom("logFilters").select("logFilters.chainId").whereRef("logFilters.id", "=", "logFilterIntervals.logFilterId").limit(1),
        "=",
        chainId
      ).where("startBlock", ">", fromBlock).execute();
      await tx.updateTable("logFilterIntervals").set({ endBlock: fromBlock }).where(
        (qb) => qb.selectFrom("logFilters").select("logFilters.chainId").whereRef("logFilters.id", "=", "logFilterIntervals.logFilterId").limit(1),
        "=",
        chainId
      ).where("endBlock", ">", fromBlock).execute();
      await tx.deleteFrom("factoryLogFilterIntervals").where(
        (qb) => qb.selectFrom("factories").select("factories.chainId").whereRef(
          "factories.id",
          "=",
          "factoryLogFilterIntervals.factoryId"
        ).limit(1),
        "=",
        chainId
      ).where("startBlock", ">", fromBlock).execute();
      await tx.updateTable("factoryLogFilterIntervals").set({ endBlock: fromBlock }).where(
        (qb) => qb.selectFrom("factories").select("factories.chainId").whereRef(
          "factories.id",
          "=",
          "factoryLogFilterIntervals.factoryId"
        ).limit(1),
        "=",
        chainId
      ).where("endBlock", ">", fromBlock).execute();
    });
    this.record("deleteRealtimeData", start);
  };
  /** SYNC HELPER METHODS */
  _insertLogFilterInterval = async ({
    tx,
    chainId,
    logFilters,
    interval: { startBlock, endBlock }
  }) => {
    const logFilterFragments = logFilters.flatMap(
      (logFilter) => buildLogFilterFragments({ ...logFilter, chainId })
    );
    await Promise.all(
      logFilterFragments.map(async (logFilterFragment) => {
        const { id: logFilterId } = await tx.insertInto("logFilters").values(logFilterFragment).onConflict((oc) => oc.column("id").doUpdateSet(logFilterFragment)).returningAll().executeTakeFirstOrThrow();
        await tx.insertInto("logFilterIntervals").values({ logFilterId, startBlock, endBlock }).execute();
      })
    );
  };
  _insertFactoryLogFilterInterval = async ({
    tx,
    chainId,
    factories,
    interval: { startBlock, endBlock }
  }) => {
    const factoryFragments = factories.flatMap(
      (factory) => buildFactoryFragments({ ...factory, chainId })
    );
    await Promise.all(
      factoryFragments.map(async (fragment) => {
        const { id: factoryId } = await tx.insertInto("factories").values(fragment).onConflict((oc) => oc.column("id").doUpdateSet(fragment)).returningAll().executeTakeFirstOrThrow();
        await tx.insertInto("factoryLogFilterIntervals").values({ factoryId, startBlock, endBlock }).execute();
      })
    );
  };
  insertRpcRequestResult = async ({
    request,
    blockNumber,
    chainId,
    result
  }) => {
    const start = performance.now();
    await this.db.insertInto("rpcRequestResults").values({ request, blockNumber, chainId, result }).onConflict(
      (oc) => oc.constraint("rpcRequestResultPrimaryKey").doUpdateSet({ result })
    ).execute();
    this.record("insertRpcRequestResult", start);
  };
  getRpcRequestResult = async ({
    request,
    blockNumber,
    chainId
  }) => {
    const start = performance.now();
    const contractReadResult = await this.db.selectFrom("rpcRequestResults").selectAll().where("request", "=", request).where("blockNumber", "=", blockNumber).where("chainId", "=", chainId).executeTakeFirst();
    const result = contractReadResult ?? null;
    this.record("getRpcRequestResult", start);
    return result;
  };
  async getLogEvents({
    fromCheckpoint,
    toCheckpoint,
    limit,
    logFilters = [],
    factories = []
  }) {
    const start = performance.now();
    const baseQuery = this.db.with(
      "sources(source_id)",
      () => sql4`( values ${sql4.join(
        [...logFilters.map((f) => f.id), ...factories.map((f) => f.id)].map(
          (id) => sql4`( ${sql4.val(id)} )`
        )
      )} )`
    ).selectFrom("logs").leftJoin("blocks", "blocks.hash", "logs.blockHash").leftJoin("transactions", "transactions.hash", "logs.transactionHash").innerJoin("sources", (join) => join.onTrue()).where((eb) => {
      const logFilterCmprs = logFilters.map((logFilter) => {
        const exprs = this.buildLogFilterCmprs({ eb, logFilter });
        if (logFilter.includeEventSelectors) {
          exprs.push(
            eb.or(
              logFilter.includeEventSelectors.map(
                (t) => eb("logs.topic0", "=", t)
              )
            )
          );
        }
        return eb.and(exprs);
      });
      const factoryCmprs = factories.map((factory) => {
        const exprs = this.buildFactoryCmprs({ eb, factory });
        if (factory.includeEventSelectors) {
          exprs.push(
            eb.or(
              factory.includeEventSelectors.map(
                (t) => eb("logs.topic0", "=", t)
              )
            )
          );
        }
        return eb.and(exprs);
      });
      return eb.or([...logFilterCmprs, ...factoryCmprs]);
    });
    const requestedLogs = await baseQuery.select([
      "source_id",
      "logs.address as log_address",
      "logs.blockHash as log_blockHash",
      "logs.blockNumber as log_blockNumber",
      "logs.chainId as log_chainId",
      "logs.data as log_data",
      "logs.id as log_id",
      "logs.logIndex as log_logIndex",
      "logs.topic0 as log_topic0",
      "logs.topic1 as log_topic1",
      "logs.topic2 as log_topic2",
      "logs.topic3 as log_topic3",
      "logs.transactionHash as log_transactionHash",
      "logs.transactionIndex as log_transactionIndex",
      "blocks.baseFeePerGas as block_baseFeePerGas",
      "blocks.difficulty as block_difficulty",
      "blocks.extraData as block_extraData",
      "blocks.gasLimit as block_gasLimit",
      "blocks.gasUsed as block_gasUsed",
      "blocks.hash as block_hash",
      "blocks.logsBloom as block_logsBloom",
      "blocks.miner as block_miner",
      "blocks.mixHash as block_mixHash",
      "blocks.nonce as block_nonce",
      "blocks.number as block_number",
      "blocks.parentHash as block_parentHash",
      "blocks.receiptsRoot as block_receiptsRoot",
      "blocks.sha3Uncles as block_sha3Uncles",
      "blocks.size as block_size",
      "blocks.stateRoot as block_stateRoot",
      "blocks.timestamp as block_timestamp",
      "blocks.totalDifficulty as block_totalDifficulty",
      "blocks.transactionsRoot as block_transactionsRoot",
      "transactions.accessList as tx_accessList",
      "transactions.blockHash as tx_blockHash",
      "transactions.blockNumber as tx_blockNumber",
      "transactions.from as tx_from",
      "transactions.gas as tx_gas",
      "transactions.gasPrice as tx_gasPrice",
      "transactions.hash as tx_hash",
      "transactions.input as tx_input",
      "transactions.maxFeePerGas as tx_maxFeePerGas",
      "transactions.maxPriorityFeePerGas as tx_maxPriorityFeePerGas",
      "transactions.nonce as tx_nonce",
      "transactions.r as tx_r",
      "transactions.s as tx_s",
      "transactions.to as tx_to",
      "transactions.transactionIndex as tx_transactionIndex",
      "transactions.type as tx_type",
      "transactions.value as tx_value",
      "transactions.v as tx_v"
    ]).where((eb) => this.buildCheckpointCmprs(eb, ">", fromCheckpoint)).where((eb) => this.buildCheckpointCmprs(eb, "<=", toCheckpoint)).orderBy("blocks.timestamp", "asc").orderBy("logs.chainId", "asc").orderBy("blocks.number", "asc").orderBy("logs.logIndex", "asc").limit(limit + 1).execute();
    const events = requestedLogs.map((_row) => {
      const row = _row;
      return {
        sourceId: row.source_id,
        chainId: row.log_chainId,
        log: {
          address: checksumAddress2(row.log_address),
          blockHash: row.log_blockHash,
          blockNumber: row.log_blockNumber,
          data: row.log_data,
          id: row.log_id,
          logIndex: Number(row.log_logIndex),
          removed: false,
          topics: [
            row.log_topic0,
            row.log_topic1,
            row.log_topic2,
            row.log_topic3
          ].filter((t) => t !== null),
          transactionHash: row.log_transactionHash,
          transactionIndex: Number(row.log_transactionIndex)
        },
        block: {
          baseFeePerGas: row.block_baseFeePerGas,
          difficulty: row.block_difficulty,
          extraData: row.block_extraData,
          gasLimit: row.block_gasLimit,
          gasUsed: row.block_gasUsed,
          hash: row.block_hash,
          logsBloom: row.block_logsBloom,
          miner: checksumAddress2(row.block_miner),
          mixHash: row.block_mixHash,
          nonce: row.block_nonce,
          number: row.block_number,
          parentHash: row.block_parentHash,
          receiptsRoot: row.block_receiptsRoot,
          sha3Uncles: row.block_sha3Uncles,
          size: row.block_size,
          stateRoot: row.block_stateRoot,
          timestamp: row.block_timestamp,
          totalDifficulty: row.block_totalDifficulty,
          transactionsRoot: row.block_transactionsRoot
        },
        transaction: {
          blockHash: row.tx_blockHash,
          blockNumber: row.tx_blockNumber,
          from: checksumAddress2(row.tx_from),
          gas: row.tx_gas,
          hash: row.tx_hash,
          input: row.tx_input,
          nonce: Number(row.tx_nonce),
          r: row.tx_r,
          s: row.tx_s,
          to: row.tx_to ? checksumAddress2(row.tx_to) : row.tx_to,
          transactionIndex: Number(row.tx_transactionIndex),
          value: row.tx_value,
          v: row.tx_v,
          ...row.tx_type === "0x0" ? { type: "legacy", gasPrice: row.tx_gasPrice } : row.tx_type === "0x1" ? {
            type: "eip2930",
            gasPrice: row.tx_gasPrice,
            accessList: JSON.parse(row.tx_accessList)
          } : row.tx_type === "0x2" ? {
            type: "eip1559",
            maxFeePerGas: row.tx_maxFeePerGas,
            maxPriorityFeePerGas: row.tx_maxPriorityFeePerGas
          } : row.tx_type === "0x7e" ? {
            type: "deposit",
            maxFeePerGas: row.tx_maxFeePerGas ?? void 0,
            maxPriorityFeePerGas: row.tx_maxPriorityFeePerGas ?? void 0
          } : { type: row.tx_type }
        }
      };
    });
    const lastCheckpointRows = await baseQuery.select([
      "blocks.timestamp as block_timestamp",
      "logs.chainId as log_chainId",
      "blocks.number as block_number",
      "logs.logIndex as log_logIndex"
    ]).where((eb) => this.buildCheckpointCmprs(eb, "<=", toCheckpoint)).orderBy("blocks.timestamp", "desc").orderBy("logs.chainId", "desc").orderBy("blocks.number", "desc").orderBy("logs.logIndex", "desc").limit(1).execute();
    const lastCheckpointRow = lastCheckpointRows[0];
    const lastCheckpoint = lastCheckpointRow !== void 0 ? {
      blockTimestamp: Number(lastCheckpointRow.block_timestamp),
      blockNumber: Number(lastCheckpointRow.block_number),
      chainId: lastCheckpointRow.log_chainId,
      logIndex: lastCheckpointRow.log_logIndex
    } : void 0;
    this.record("getLogEvents", performance.now() - start);
    if (events.length === limit + 1) {
      events.pop();
      const lastEventInPage = events[events.length - 1];
      const lastCheckpointInPage = {
        blockTimestamp: Number(lastEventInPage.block.timestamp),
        chainId: lastEventInPage.chainId,
        blockNumber: Number(lastEventInPage.block.number),
        logIndex: lastEventInPage.log.logIndex
      };
      return {
        events,
        hasNextPage: true,
        lastCheckpointInPage,
        lastCheckpoint
      };
    } else {
      return {
        events,
        hasNextPage: false,
        lastCheckpointInPage: void 0,
        lastCheckpoint
      };
    }
  }
  /**
   * Builds an expression that filters for events that are greater or
   * less than the provided checkpoint. If the log index is not specific,
   * the expression will use a block-level granularity.
   */
  buildCheckpointCmprs = (eb, op, checkpoint) => {
    const { and, or } = eb;
    const { blockTimestamp, chainId, blockNumber, logIndex } = checkpoint;
    const operand = op.startsWith(">") ? ">" : "<";
    const operandOrEquals = `${operand}=`;
    const isInclusive = op.endsWith("=");
    if (logIndex === void 0) {
      return and([
        eb("blocks.timestamp", operandOrEquals, BigInt(blockTimestamp)),
        or([
          eb("blocks.timestamp", operand, BigInt(blockTimestamp)),
          and([
            eb("logs.chainId", operandOrEquals, chainId),
            or([
              eb("logs.chainId", operand, chainId),
              eb(
                "blocks.number",
                isInclusive ? operandOrEquals : operand,
                BigInt(blockNumber)
              )
            ])
          ])
        ])
      ]);
    }
    return and([
      eb("blocks.timestamp", operandOrEquals, BigInt(blockTimestamp)),
      or([
        eb("blocks.timestamp", operand, BigInt(blockTimestamp)),
        and([
          eb("logs.chainId", operandOrEquals, chainId),
          or([
            eb("logs.chainId", operand, chainId),
            and([
              eb("blocks.number", operandOrEquals, BigInt(blockNumber)),
              or([
                eb("blocks.number", operand, BigInt(blockNumber)),
                eb(
                  "logs.logIndex",
                  isInclusive ? operandOrEquals : operand,
                  logIndex
                )
              ])
            ])
          ])
        ])
      ])
    ]);
  };
  buildLogFilterCmprs = ({
    eb,
    logFilter
  }) => {
    const exprs = [];
    exprs.push(eb("source_id", "=", logFilter.id));
    exprs.push(
      eb(
        "logs.chainId",
        "=",
        sql4`cast (${sql4.val(logFilter.chainId)} as numeric(16, 0))`
      )
    );
    if (logFilter.criteria.address) {
      const address = Array.isArray(logFilter.criteria.address) && logFilter.criteria.address.length === 1 ? logFilter.criteria.address[0] : logFilter.criteria.address;
      if (Array.isArray(address)) {
        exprs.push(eb.or(address.map((a) => eb("logs.address", "=", a))));
      } else {
        exprs.push(eb("logs.address", "=", address));
      }
    }
    if (logFilter.criteria.topics) {
      for (const idx_ of range(0, 4)) {
        const idx = idx_;
        const raw = logFilter.criteria.topics[idx] ?? null;
        if (raw === null)
          continue;
        const topic = Array.isArray(raw) && raw.length === 1 ? raw[0] : raw;
        if (Array.isArray(topic)) {
          exprs.push(eb.or(topic.map((a) => eb(`logs.topic${idx}`, "=", a))));
        } else {
          exprs.push(eb(`logs.topic${idx}`, "=", topic));
        }
      }
    }
    if (logFilter.fromBlock)
      exprs.push(eb("blocks.number", ">=", BigInt(logFilter.fromBlock)));
    if (logFilter.toBlock)
      exprs.push(eb("blocks.number", "<=", BigInt(logFilter.toBlock)));
    return exprs;
  };
  buildFactoryCmprs = ({
    eb,
    factory
  }) => {
    const exprs = [];
    exprs.push(eb("source_id", "=", factory.id));
    exprs.push(
      eb(
        "logs.chainId",
        "=",
        sql4`cast (${sql4.val(factory.chainId)} as numeric(16, 0))`
      )
    );
    const selectChildAddressExpression = buildFactoryChildAddressSelectExpression({
      childAddressLocation: factory.criteria.childAddressLocation
    });
    exprs.push(
      eb(
        "logs.address",
        "in",
        eb.selectFrom("logs").select(selectChildAddressExpression.as("childAddress")).where("chainId", "=", factory.chainId).where("address", "=", factory.criteria.address).where("topic0", "=", factory.criteria.eventSelector)
      )
    );
    if (factory.fromBlock)
      exprs.push(eb("blocks.number", ">=", BigInt(factory.fromBlock)));
    if (factory.toBlock)
      exprs.push(eb("blocks.number", "<=", BigInt(factory.toBlock)));
    return exprs;
  };
  transaction = (callback) => this.db.transaction().execute(callback);
  record(methodName, start) {
    this.common.metrics.ponder_sync_store_method_duration.observe(
      { method: methodName },
      performance.now() - start
    );
  }
};
function buildFactoryChildAddressSelectExpression({
  childAddressLocation
}) {
  if (childAddressLocation.startsWith("offset")) {
    const childAddressOffset = Number(childAddressLocation.substring(6));
    const start = 2 + 12 * 2 + childAddressOffset * 2 + 1;
    const length = 20 * 2;
    return sql4`'0x' || substring(data from ${start}::int for ${length}::int)`;
  } else {
    const start = 2 + 12 * 2 + 1;
    const length = 20 * 2;
    return sql4`'0x' || substring(${sql4.ref(
      childAddressLocation
    )} from ${start}::integer for ${length}::integer)`;
  }
}

// src/sync-store/sqlite/store.ts
import {
  Kysely as Kysely4,
  Migrator as Migrator2,
  SqliteDialect as SqliteDialect2,
  sql as sql5
} from "kysely";
import {
  checksumAddress as checksumAddress3
} from "viem";

// src/sync-store/sqlite/format.ts
import {
  hexToNumber as hexToNumber6
} from "viem";
function rpcToSqliteBlock(block) {
  return {
    baseFeePerGas: block.baseFeePerGas ? encodeAsText(block.baseFeePerGas) : null,
    difficulty: encodeAsText(block.difficulty),
    extraData: block.extraData,
    gasLimit: encodeAsText(block.gasLimit),
    gasUsed: encodeAsText(block.gasUsed),
    hash: block.hash,
    logsBloom: block.logsBloom,
    miner: toLowerCase(block.miner),
    mixHash: block.mixHash ?? null,
    nonce: block.nonce ?? null,
    number: encodeAsText(block.number),
    parentHash: block.parentHash,
    receiptsRoot: block.receiptsRoot,
    sha3Uncles: block.sha3Uncles,
    size: encodeAsText(block.size),
    stateRoot: block.stateRoot,
    timestamp: encodeAsText(block.timestamp),
    totalDifficulty: encodeAsText(block.totalDifficulty),
    transactionsRoot: block.transactionsRoot
  };
}
function rpcToSqliteTransaction(transaction) {
  return {
    accessList: transaction.accessList ? JSON.stringify(transaction.accessList) : void 0,
    blockHash: transaction.blockHash,
    blockNumber: encodeAsText(transaction.blockNumber),
    from: toLowerCase(transaction.from),
    gas: encodeAsText(transaction.gas),
    gasPrice: transaction.gasPrice ? encodeAsText(transaction.gasPrice) : null,
    hash: transaction.hash,
    input: transaction.input,
    maxFeePerGas: transaction.maxFeePerGas ? encodeAsText(transaction.maxFeePerGas) : null,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? encodeAsText(transaction.maxPriorityFeePerGas) : null,
    nonce: hexToNumber6(transaction.nonce),
    r: transaction.r,
    s: transaction.s,
    to: transaction.to ? toLowerCase(transaction.to) : null,
    transactionIndex: Number(transaction.transactionIndex),
    type: transaction.type ?? "0x0",
    value: encodeAsText(transaction.value),
    v: encodeAsText(transaction.v)
  };
}
function rpcToSqliteLog(log) {
  return {
    address: toLowerCase(log.address),
    blockHash: log.blockHash,
    blockNumber: encodeAsText(log.blockNumber),
    data: log.data,
    id: `${log.blockHash}-${log.logIndex}`,
    logIndex: Number(log.logIndex),
    topic0: log.topics[0] ? log.topics[0] : null,
    topic1: log.topics[1] ? log.topics[1] : null,
    topic2: log.topics[2] ? log.topics[2] : null,
    topic3: log.topics[3] ? log.topics[3] : null,
    transactionHash: log.transactionHash,
    transactionIndex: Number(log.transactionIndex)
  };
}

// src/sync-store/sqlite/migrations.ts
import "kysely";
var migrations2 = {
  "2023_05_15_0_initial": {
    async up(db) {
      await db.schema.createTable("blocks").addColumn("baseFeePerGas", "blob").addColumn("chainId", "integer", (col) => col.notNull()).addColumn("difficulty", "blob", (col) => col.notNull()).addColumn("extraData", "text", (col) => col.notNull()).addColumn("finalized", "integer", (col) => col.notNull()).addColumn("gasLimit", "blob", (col) => col.notNull()).addColumn("gasUsed", "blob", (col) => col.notNull()).addColumn("hash", "text", (col) => col.notNull().primaryKey()).addColumn("logsBloom", "text", (col) => col.notNull()).addColumn("miner", "text", (col) => col.notNull()).addColumn("mixHash", "text", (col) => col.notNull()).addColumn("nonce", "text", (col) => col.notNull()).addColumn("number", "blob", (col) => col.notNull()).addColumn("parentHash", "text", (col) => col.notNull()).addColumn("receiptsRoot", "text", (col) => col.notNull()).addColumn("sha3Uncles", "text", (col) => col.notNull()).addColumn("size", "blob", (col) => col.notNull()).addColumn("stateRoot", "text", (col) => col.notNull()).addColumn("timestamp", "blob", (col) => col.notNull()).addColumn("totalDifficulty", "blob", (col) => col.notNull()).addColumn("transactionsRoot", "text", (col) => col.notNull()).execute();
      await db.schema.createTable("transactions").addColumn("accessList", "text").addColumn("blockHash", "text", (col) => col.notNull()).addColumn("blockNumber", "blob", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("finalized", "integer", (col) => col.notNull()).addColumn("from", "text", (col) => col.notNull()).addColumn("gas", "blob", (col) => col.notNull()).addColumn("gasPrice", "blob").addColumn("hash", "text", (col) => col.notNull().primaryKey()).addColumn("input", "text", (col) => col.notNull()).addColumn("maxFeePerGas", "blob").addColumn("maxPriorityFeePerGas", "blob").addColumn("nonce", "integer", (col) => col.notNull()).addColumn("r", "text", (col) => col.notNull()).addColumn("s", "text", (col) => col.notNull()).addColumn("to", "text").addColumn("transactionIndex", "integer", (col) => col.notNull()).addColumn("type", "text", (col) => col.notNull()).addColumn("value", "blob", (col) => col.notNull()).addColumn("v", "blob", (col) => col.notNull()).execute();
      await db.schema.createTable("logs").addColumn("address", "text", (col) => col.notNull()).addColumn("blockHash", "text", (col) => col.notNull()).addColumn("blockNumber", "blob", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("data", "text", (col) => col.notNull()).addColumn("finalized", "integer", (col) => col.notNull()).addColumn("id", "text", (col) => col.notNull().primaryKey()).addColumn("logIndex", "integer", (col) => col.notNull()).addColumn("topic0", "text").addColumn("topic1", "text").addColumn("topic2", "text").addColumn("topic3", "text").addColumn("transactionHash", "text", (col) => col.notNull()).addColumn("transactionIndex", "integer", (col) => col.notNull()).execute();
      await db.schema.createTable("contractReadResults").addColumn("address", "text", (col) => col.notNull()).addColumn("blockNumber", "blob", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("data", "text", (col) => col.notNull()).addColumn("finalized", "integer", (col) => col.notNull()).addColumn("result", "text", (col) => col.notNull()).addPrimaryKeyConstraint("contractReadResultPrimaryKey", [
        "chainId",
        "blockNumber",
        "address",
        "data"
      ]).execute();
      await db.schema.createTable("logFilterCachedRanges").addColumn("endBlock", "blob", (col) => col.notNull()).addColumn("endBlockTimestamp", "blob", (col) => col.notNull()).addColumn("filterKey", "text", (col) => col.notNull()).addColumn("id", "integer", (col) => col.notNull().primaryKey()).addColumn("startBlock", "blob", (col) => col.notNull()).execute();
    }
  },
  "2023_06_20_0_indices": {
    async up(db) {
      await db.schema.createIndex("log_events_index").on("logs").columns(["address", "chainId", "blockHash"]).execute();
      await db.schema.createIndex("blocks_index").on("blocks").columns(["timestamp", "number"]).execute();
      await db.schema.createIndex("logFilterCachedRanges_index").on("logFilterCachedRanges").columns(["filterKey"]).execute();
    }
  },
  "2023_07_18_0_better_indices": {
    async up(db) {
      await db.schema.dropIndex("log_events_index").execute();
      await db.schema.dropIndex("blocks_index").execute();
      await db.schema.createIndex("log_block_hash_index").on("logs").column("blockHash").execute();
      await db.schema.createIndex("log_chain_id_index").on("logs").column("chainId").execute();
      await db.schema.createIndex("log_address_index").on("logs").column("address").execute();
      await db.schema.createIndex("log_topic0_index").on("logs").column("topic0").execute();
      await db.schema.createIndex("block_timestamp_index").on("blocks").column("timestamp").execute();
      await db.schema.createIndex("block_number_index").on("blocks").column("number").execute();
    }
  },
  "2023_07_24_0_drop_finalized": {
    async up(db) {
      await db.schema.alterTable("blocks").dropColumn("finalized").execute();
      await db.schema.alterTable("transactions").dropColumn("finalized").execute();
      await db.schema.alterTable("logs").dropColumn("finalized").execute();
      await db.schema.alterTable("contractReadResults").dropColumn("finalized").execute();
    }
  },
  "2023_09_19_0_new_sync_design": {
    async up(db) {
      await db.schema.dropTable("logFilterCachedRanges").execute();
      await db.schema.dropTable("blocks").execute();
      await db.schema.createTable("blocks").addColumn("baseFeePerGas", "varchar(79)").addColumn("chainId", "integer", (col) => col.notNull()).addColumn("difficulty", "varchar(79)", (col) => col.notNull()).addColumn("extraData", "text", (col) => col.notNull()).addColumn("gasLimit", "varchar(79)", (col) => col.notNull()).addColumn("gasUsed", "varchar(79)", (col) => col.notNull()).addColumn("hash", "varchar(66)", (col) => col.notNull().primaryKey()).addColumn("logsBloom", "varchar(514)", (col) => col.notNull()).addColumn("miner", "varchar(42)", (col) => col.notNull()).addColumn("mixHash", "varchar(66)", (col) => col.notNull()).addColumn("nonce", "varchar(18)", (col) => col.notNull()).addColumn("number", "varchar(79)", (col) => col.notNull()).addColumn("parentHash", "varchar(66)", (col) => col.notNull()).addColumn("receiptsRoot", "varchar(66)", (col) => col.notNull()).addColumn("sha3Uncles", "varchar(66)", (col) => col.notNull()).addColumn("size", "varchar(79)", (col) => col.notNull()).addColumn("stateRoot", "varchar(66)", (col) => col.notNull()).addColumn("timestamp", "varchar(79)", (col) => col.notNull()).addColumn("totalDifficulty", "varchar(79)", (col) => col.notNull()).addColumn("transactionsRoot", "varchar(66)", (col) => col.notNull()).execute();
      await db.schema.createIndex("blockTimestampIndex").on("blocks").column("timestamp").execute();
      await db.schema.createIndex("blockNumberIndex").on("blocks").column("number").execute();
      await db.schema.dropTable("transactions").execute();
      await db.schema.createTable("transactions").addColumn("accessList", "text").addColumn("blockHash", "varchar(66)", (col) => col.notNull()).addColumn("blockNumber", "varchar(79)", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("from", "varchar(42)", (col) => col.notNull()).addColumn("gas", "varchar(79)", (col) => col.notNull()).addColumn("gasPrice", "varchar(79)").addColumn("hash", "varchar(66)", (col) => col.notNull().primaryKey()).addColumn("input", "text", (col) => col.notNull()).addColumn("maxFeePerGas", "varchar(79)").addColumn("maxPriorityFeePerGas", "varchar(79)").addColumn("nonce", "integer", (col) => col.notNull()).addColumn("r", "varchar(66)", (col) => col.notNull()).addColumn("s", "varchar(66)", (col) => col.notNull()).addColumn("to", "varchar(42)").addColumn("transactionIndex", "integer", (col) => col.notNull()).addColumn("type", "text", (col) => col.notNull()).addColumn("value", "varchar(79)", (col) => col.notNull()).addColumn("v", "varchar(79)", (col) => col.notNull()).execute();
      await db.schema.dropTable("logs").execute();
      await db.schema.createTable("logs").addColumn("address", "varchar(42)", (col) => col.notNull()).addColumn("blockHash", "varchar(66)", (col) => col.notNull()).addColumn("blockNumber", "varchar(79)", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("data", "text", (col) => col.notNull()).addColumn("id", "text", (col) => col.notNull().primaryKey()).addColumn("logIndex", "integer", (col) => col.notNull()).addColumn("topic0", "varchar(66)").addColumn("topic1", "varchar(66)").addColumn("topic2", "varchar(66)").addColumn("topic3", "varchar(66)").addColumn("transactionHash", "varchar(66)", (col) => col.notNull()).addColumn("transactionIndex", "integer", (col) => col.notNull()).execute();
      await db.schema.createIndex("logBlockHashIndex").on("logs").column("blockHash").execute();
      await db.schema.createIndex("logChainIdIndex").on("logs").column("chainId").execute();
      await db.schema.createIndex("logAddressIndex").on("logs").column("address").execute();
      await db.schema.createIndex("logTopic0Index").on("logs").column("topic0").execute();
      await db.schema.dropTable("contractReadResults").execute();
      await db.schema.createTable("contractReadResults").addColumn("address", "varchar(42)", (col) => col.notNull()).addColumn("blockNumber", "varchar(79)", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("data", "text", (col) => col.notNull()).addColumn("result", "text", (col) => col.notNull()).addPrimaryKeyConstraint("contractReadResultPrimaryKey", [
        "chainId",
        "blockNumber",
        "address",
        "data"
      ]).execute();
      await db.schema.createTable("logFilters").addColumn("id", "text", (col) => col.notNull().primaryKey()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("address", "varchar(66)").addColumn("topic0", "varchar(66)").addColumn("topic1", "varchar(66)").addColumn("topic2", "varchar(66)").addColumn("topic3", "varchar(66)").execute();
      await db.schema.createTable("logFilterIntervals").addColumn("id", "integer", (col) => col.notNull().primaryKey()).addColumn(
        "logFilterId",
        "text",
        (col) => col.notNull().references("logFilters.id")
      ).addColumn("startBlock", "varchar(79)", (col) => col.notNull()).addColumn("endBlock", "varchar(79)", (col) => col.notNull()).execute();
      await db.schema.createIndex("logFilterIntervalsLogFilterId").on("logFilterIntervals").column("logFilterId").execute();
      await db.schema.createTable("factories").addColumn("id", "text", (col) => col.notNull().primaryKey()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("address", "varchar(42)", (col) => col.notNull()).addColumn("eventSelector", "varchar(66)", (col) => col.notNull()).addColumn("childAddressLocation", "text", (col) => col.notNull()).addColumn("topic0", "varchar(66)").addColumn("topic1", "varchar(66)").addColumn("topic2", "varchar(66)").addColumn("topic3", "varchar(66)").execute();
      await db.schema.createTable("factoryLogFilterIntervals").addColumn("id", "integer", (col) => col.notNull().primaryKey()).addColumn(
        "factoryId",
        "text",
        (col) => col.notNull().references("factories.id")
      ).addColumn("startBlock", "varchar(79)", (col) => col.notNull()).addColumn("endBlock", "varchar(79)", (col) => col.notNull()).execute();
      await db.schema.createIndex("factoryLogFilterIntervalsFactoryId").on("factoryLogFilterIntervals").column("factoryId").execute();
    }
  },
  "2023_11_06_0_new_rpc_cache_design": {
    async up(db) {
      await db.schema.dropTable("contractReadResults").execute();
      await db.schema.createTable("rpcRequestResults").addColumn("request", "text", (col) => col.notNull()).addColumn("blockNumber", "varchar(79)", (col) => col.notNull()).addColumn("chainId", "integer", (col) => col.notNull()).addColumn("result", "text", (col) => col.notNull()).addPrimaryKeyConstraint("rpcRequestResultPrimaryKey", [
        "request",
        "chainId",
        "blockNumber"
      ]).execute();
    }
  },
  "2024_02_1_0_nullable_block_columns": {
    async up(db) {
      await db.schema.alterTable("blocks").addColumn("mixHash_temp_null", "varchar(66)").execute();
      await db.updateTable("blocks").set((eb) => ({
        mixHash_temp_null: eb.selectFrom("blocks").select("mixHash")
      })).execute();
      await db.schema.alterTable("blocks").dropColumn("mixHash").execute();
      await db.schema.alterTable("blocks").renameColumn("mixHash_temp_null", "mixHash").execute();
      await db.schema.alterTable("blocks").addColumn("nonce_temp_null", "varchar(18)").execute();
      await db.updateTable("blocks").set((eb) => ({
        nonce_temp_null: eb.selectFrom("blocks").select("nonce")
      })).execute();
      await db.schema.alterTable("blocks").dropColumn("nonce").execute();
      await db.schema.alterTable("blocks").renameColumn("nonce_temp_null", "nonce").execute();
    }
  }
};
var StaticMigrationProvider2 = class {
  async getMigrations() {
    return migrations2;
  }
};
var migrationProvider2 = new StaticMigrationProvider2();

// src/sync-store/sqlite/store.ts
var SqliteSyncStore = class {
  kind = "sqlite";
  common;
  db;
  migrator;
  constructor({
    common,
    database
  }) {
    this.common = common;
    this.db = new Kysely4({
      dialect: new SqliteDialect2({ database }),
      log(event) {
        if (event.level === "query")
          common.metrics.ponder_sqlite_query_count?.inc({ kind: "sync" });
      }
    });
    this.migrator = new Migrator2({
      db: this.db,
      provider: migrationProvider2
    });
  }
  async kill() {
    try {
      await this.db.destroy();
    } catch (e) {
      const error = e;
      if (error.message !== "Called end on pool more than once") {
        throw error;
      }
    }
  }
  migrateUp = async () => {
    const start = performance.now();
    const { error } = await this.migrator.migrateToLatest();
    if (error)
      throw error;
    this.record("migrateUp", performance.now() - start);
  };
  insertLogFilterInterval = async ({
    chainId,
    logFilter,
    block: rpcBlock,
    transactions: rpcTransactions,
    logs: rpcLogs,
    interval
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await tx.insertInto("blocks").values({ ...rpcToSqliteBlock(rpcBlock), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      for (const rpcTransaction of rpcTransactions) {
        await tx.insertInto("transactions").values({ ...rpcToSqliteTransaction(rpcTransaction), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      }
      for (const rpcLog of rpcLogs) {
        await tx.insertInto("logs").values({ ...rpcToSqliteLog(rpcLog), chainId }).onConflict((oc) => oc.column("id").doNothing()).execute();
      }
      await this._insertLogFilterInterval({
        tx,
        chainId,
        logFilters: [logFilter],
        interval
      });
    });
    this.record("insertLogFilterInterval", performance.now() - start);
  };
  getLogFilterIntervals = async ({
    chainId,
    logFilter
  }) => {
    const start = performance.now();
    const fragments = buildLogFilterFragments({ ...logFilter, chainId });
    await Promise.all(
      fragments.map(async (fragment) => {
        return await this.transaction(async (tx) => {
          const { id: logFilterId } = await tx.insertInto("logFilters").values(fragment).onConflict((oc) => oc.doUpdateSet(fragment)).returningAll().executeTakeFirstOrThrow();
          const existingIntervalRows = await tx.deleteFrom("logFilterIntervals").where("logFilterId", "=", logFilterId).returningAll().execute();
          const mergedIntervals = intervalUnion(
            existingIntervalRows.map((i) => [
              Number(decodeToBigInt(i.startBlock)),
              Number(decodeToBigInt(i.endBlock))
            ])
          );
          const mergedIntervalRows = mergedIntervals.map(
            ([startBlock, endBlock]) => ({
              logFilterId,
              startBlock: encodeAsText(startBlock),
              endBlock: encodeAsText(endBlock)
            })
          );
          if (mergedIntervalRows.length > 0) {
            await tx.insertInto("logFilterIntervals").values(mergedIntervalRows).execute();
          }
          return mergedIntervals;
        });
      })
    );
    const intervals = await this.db.with(
      "logFilterFragments(fragmentId, fragmentAddress, fragmentTopic0, fragmentTopic1, fragmentTopic2, fragmentTopic3)",
      () => sql5`( values ${sql5.join(
        fragments.map(
          (f) => sql5`( ${sql5.val(f.id)}, ${sql5.val(f.address)}, ${sql5.val(
            f.topic0
          )}, ${sql5.val(f.topic1)}, ${sql5.val(f.topic2)}, ${sql5.val(
            f.topic3
          )} )`
        )
      )} )`
    ).selectFrom("logFilterIntervals").leftJoin("logFilters", "logFilterId", "logFilters.id").innerJoin("logFilterFragments", (join) => {
      let baseJoin = join.on(
        ({ or, cmpr }) => or([
          cmpr("address", "is", null),
          cmpr("fragmentAddress", "=", sql5.ref("address"))
        ])
      );
      for (const idx_ of range(0, 4)) {
        baseJoin = baseJoin.on(({ or, cmpr }) => {
          const idx = idx_;
          return or([
            cmpr(`topic${idx}`, "is", null),
            cmpr(`fragmentTopic${idx}`, "=", sql5.ref(`topic${idx}`))
          ]);
        });
      }
      return baseJoin;
    }).select(["fragmentId", "startBlock", "endBlock"]).where("chainId", "=", chainId).execute();
    const intervalsByFragment = intervals.reduce(
      (acc, cur) => {
        const { fragmentId, ...rest } = cur;
        acc[fragmentId] ||= [];
        acc[fragmentId].push({
          startBlock: decodeToBigInt(rest.startBlock),
          endBlock: decodeToBigInt(rest.endBlock)
        });
        return acc;
      },
      {}
    );
    const fragmentIntervals = fragments.map((f) => {
      return (intervalsByFragment[f.id] ?? []).map(
        (r) => [Number(r.startBlock), Number(r.endBlock)]
      );
    });
    const intersectionIntervals = intervalIntersectionMany(fragmentIntervals);
    this.record("getLogFilterIntervals", performance.now() - start);
    return intersectionIntervals;
  };
  insertFactoryChildAddressLogs = async ({
    chainId,
    logs: rpcLogs
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      for (const rpcLog of rpcLogs) {
        await tx.insertInto("logs").values({ ...rpcToSqliteLog(rpcLog), chainId }).onConflict((oc) => oc.column("id").doNothing()).execute();
      }
    });
    this.record("insertFactoryChildAddressLogs", performance.now() - start);
  };
  async *getFactoryChildAddresses({
    chainId,
    upToBlockNumber,
    factory,
    pageSize = 500
  }) {
    let queryExecutionTime = 0;
    const { address, eventSelector, childAddressLocation } = factory;
    const selectChildAddressExpression = buildFactoryChildAddressSelectExpression2({ childAddressLocation });
    const baseQuery = this.db.selectFrom("logs").select([selectChildAddressExpression.as("childAddress"), "blockNumber"]).where("chainId", "=", chainId).where("address", "=", address).where("topic0", "=", eventSelector).where("blockNumber", "<=", encodeAsText(upToBlockNumber)).limit(pageSize);
    let cursor = void 0;
    while (true) {
      let query2 = baseQuery;
      if (cursor) {
        query2 = query2.where("blockNumber", ">", cursor);
      }
      const start = performance.now();
      const batch = await query2.execute();
      queryExecutionTime += performance.now() - start;
      const lastRow = batch[batch.length - 1];
      if (lastRow) {
        cursor = lastRow.blockNumber;
      }
      if (batch.length > 0) {
        yield batch.map((a) => a.childAddress);
      }
      if (batch.length < pageSize)
        break;
    }
    this.record("getFactoryChildAddresses", queryExecutionTime);
  }
  insertFactoryLogFilterInterval = async ({
    chainId,
    factory,
    block: rpcBlock,
    transactions: rpcTransactions,
    logs: rpcLogs,
    interval
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await tx.insertInto("blocks").values({ ...rpcToSqliteBlock(rpcBlock), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      for (const rpcTransaction of rpcTransactions) {
        await tx.insertInto("transactions").values({ ...rpcToSqliteTransaction(rpcTransaction), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      }
      for (const rpcLog of rpcLogs) {
        await tx.insertInto("logs").values({ ...rpcToSqliteLog(rpcLog), chainId }).onConflict((oc) => oc.column("id").doNothing()).execute();
      }
      await this._insertFactoryLogFilterInterval({
        tx,
        chainId,
        factories: [factory],
        interval
      });
    });
    this.record("insertFactoryLogFilterInterval", performance.now() - start);
  };
  getFactoryLogFilterIntervals = async ({
    chainId,
    factory
  }) => {
    const start = performance.now();
    const fragments = buildFactoryFragments({
      ...factory,
      chainId
    });
    await Promise.all(
      fragments.map(async (fragment) => {
        return await this.transaction(async (tx) => {
          const { id: factoryId } = await tx.insertInto("factories").values(fragment).onConflict((oc) => oc.doUpdateSet(fragment)).returningAll().executeTakeFirstOrThrow();
          const existingIntervals = await tx.deleteFrom("factoryLogFilterIntervals").where("factoryId", "=", factoryId).returningAll().execute();
          const mergedIntervals = intervalUnion(
            existingIntervals.map((i) => [
              Number(decodeToBigInt(i.startBlock)),
              Number(decodeToBigInt(i.endBlock))
            ])
          );
          const mergedIntervalRows = mergedIntervals.map(
            ([startBlock, endBlock]) => ({
              factoryId,
              startBlock: encodeAsText(startBlock),
              endBlock: encodeAsText(endBlock)
            })
          );
          if (mergedIntervalRows.length > 0) {
            await tx.insertInto("factoryLogFilterIntervals").values(mergedIntervalRows).execute();
          }
          return mergedIntervals;
        });
      })
    );
    const intervals = await this.db.with(
      "factoryFilterFragments(fragmentId, fragmentAddress, fragmentEventSelector, fragmentChildAddressLocation, fragmentTopic0, fragmentTopic1, fragmentTopic2, fragmentTopic3)",
      () => sql5`( values ${sql5.join(
        fragments.map(
          (f) => sql5`( ${sql5.val(f.id)}, ${sql5.val(f.address)}, ${sql5.val(
            f.eventSelector
          )}, ${sql5.val(f.childAddressLocation)}, ${sql5.val(
            f.topic0
          )}, ${sql5.val(f.topic1)}, ${sql5.val(f.topic2)}, ${sql5.val(
            f.topic3
          )} )`
        )
      )} )`
    ).selectFrom("factoryLogFilterIntervals").leftJoin("factories", "factoryId", "factories.id").innerJoin("factoryFilterFragments", (join) => {
      let baseJoin = join.on(
        ({ and, cmpr }) => and([
          cmpr("fragmentAddress", "=", sql5.ref("address")),
          cmpr("fragmentEventSelector", "=", sql5.ref("eventSelector")),
          cmpr(
            "fragmentChildAddressLocation",
            "=",
            sql5.ref("childAddressLocation")
          )
        ])
      );
      for (const idx_ of range(0, 4)) {
        baseJoin = baseJoin.on(({ or, cmpr }) => {
          const idx = idx_;
          return or([
            cmpr(`topic${idx}`, "is", null),
            cmpr(`fragmentTopic${idx}`, "=", sql5.ref(`topic${idx}`))
          ]);
        });
      }
      return baseJoin;
    }).select(["fragmentId", "startBlock", "endBlock"]).where("chainId", "=", chainId).execute();
    const intervalsByFragment = intervals.reduce(
      (acc, cur) => {
        const { fragmentId, ...rest } = cur;
        acc[fragmentId] ||= [];
        acc[fragmentId].push({
          startBlock: decodeToBigInt(rest.startBlock),
          endBlock: decodeToBigInt(rest.endBlock)
        });
        return acc;
      },
      {}
    );
    const fragmentIntervals = fragments.map((f) => {
      return (intervalsByFragment[f.id] ?? []).map(
        (r) => [Number(r.startBlock), Number(r.endBlock)]
      );
    });
    const intersectionIntervals = intervalIntersectionMany(fragmentIntervals);
    this.record("getFactoryLogFilterIntervals", performance.now() - start);
    return intersectionIntervals;
  };
  insertRealtimeBlock = async ({
    chainId,
    block: rpcBlock,
    transactions: rpcTransactions,
    logs: rpcLogs
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await tx.insertInto("blocks").values({ ...rpcToSqliteBlock(rpcBlock), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      for (const rpcTransaction of rpcTransactions) {
        await tx.insertInto("transactions").values({ ...rpcToSqliteTransaction(rpcTransaction), chainId }).onConflict((oc) => oc.column("hash").doNothing()).execute();
      }
      for (const rpcLog of rpcLogs) {
        await tx.insertInto("logs").values({ ...rpcToSqliteLog(rpcLog), chainId }).onConflict((oc) => oc.column("id").doNothing()).execute();
      }
    });
    this.record("insertRealtimeBlock", performance.now() - start);
  };
  insertRealtimeInterval = async ({
    chainId,
    logFilters,
    factories,
    interval
  }) => {
    const start = performance.now();
    await this.transaction(async (tx) => {
      await this._insertLogFilterInterval({
        tx,
        chainId,
        logFilters: [
          ...logFilters,
          ...factories.map((f) => ({
            address: f.address,
            topics: [f.eventSelector]
          }))
        ],
        interval
      });
      await this._insertFactoryLogFilterInterval({
        tx,
        chainId,
        factories,
        interval
      });
    });
    this.record("insertRealtimeInterval", performance.now() - start);
  };
  deleteRealtimeData = async ({
    chainId,
    fromBlock: fromBlock_
  }) => {
    const start = performance.now();
    const fromBlock = encodeAsText(fromBlock_);
    await this.transaction(async (tx) => {
      await tx.deleteFrom("blocks").where("chainId", "=", chainId).where("number", ">", fromBlock).execute();
      await tx.deleteFrom("transactions").where("chainId", "=", chainId).where("blockNumber", ">", fromBlock).execute();
      await tx.deleteFrom("logs").where("chainId", "=", chainId).where("blockNumber", ">", fromBlock).execute();
      await tx.deleteFrom("rpcRequestResults").where("chainId", "=", chainId).where("blockNumber", ">", fromBlock).execute();
      await tx.deleteFrom("logFilterIntervals").where(
        (qb) => qb.selectFrom("logFilters").select("logFilters.chainId").whereRef("logFilters.id", "=", "logFilterIntervals.logFilterId").limit(1),
        "=",
        chainId
      ).where("startBlock", ">", fromBlock).execute();
      await tx.updateTable("logFilterIntervals").set({ endBlock: fromBlock }).where(
        (qb) => qb.selectFrom("logFilters").select("logFilters.chainId").whereRef("logFilters.id", "=", "logFilterIntervals.logFilterId").limit(1),
        "=",
        chainId
      ).where("endBlock", ">", fromBlock).execute();
      await tx.deleteFrom("factoryLogFilterIntervals").where(
        (qb) => qb.selectFrom("factories").select("factories.chainId").whereRef(
          "factories.id",
          "=",
          "factoryLogFilterIntervals.factoryId"
        ).limit(1),
        "=",
        chainId
      ).where("startBlock", ">", fromBlock).execute();
      await tx.updateTable("factoryLogFilterIntervals").set({ endBlock: fromBlock }).where(
        (qb) => qb.selectFrom("factories").select("factories.chainId").whereRef(
          "factories.id",
          "=",
          "factoryLogFilterIntervals.factoryId"
        ).limit(1),
        "=",
        chainId
      ).where("endBlock", ">", fromBlock).execute();
    });
    this.record("deleteRealtimeData", performance.now() - start);
  };
  /** SYNC HELPER METHODS */
  _insertLogFilterInterval = async ({
    tx,
    chainId,
    logFilters,
    interval: { startBlock, endBlock }
  }) => {
    const logFilterFragments = logFilters.flatMap(
      (logFilter) => buildLogFilterFragments({ ...logFilter, chainId })
    );
    await Promise.all(
      logFilterFragments.map(async (logFilterFragment) => {
        const { id: logFilterId } = await tx.insertInto("logFilters").values(logFilterFragment).onConflict((oc) => oc.doUpdateSet(logFilterFragment)).returningAll().executeTakeFirstOrThrow();
        await tx.insertInto("logFilterIntervals").values({
          logFilterId,
          startBlock: encodeAsText(startBlock),
          endBlock: encodeAsText(endBlock)
        }).execute();
      })
    );
  };
  _insertFactoryLogFilterInterval = async ({
    tx,
    chainId,
    factories,
    interval: { startBlock, endBlock }
  }) => {
    const factoryFragments = factories.flatMap(
      (factory) => buildFactoryFragments({ ...factory, chainId })
    );
    await Promise.all(
      factoryFragments.map(async (fragment) => {
        const { id: factoryId } = await tx.insertInto("factories").values(fragment).onConflict((oc) => oc.doUpdateSet(fragment)).returningAll().executeTakeFirstOrThrow();
        await tx.insertInto("factoryLogFilterIntervals").values({
          factoryId,
          startBlock: encodeAsText(startBlock),
          endBlock: encodeAsText(endBlock)
        }).execute();
      })
    );
  };
  /** CONTRACT READS */
  insertRpcRequestResult = async ({
    blockNumber,
    chainId,
    request,
    result
  }) => {
    const start = performance.now();
    await this.db.insertInto("rpcRequestResults").values({
      request,
      blockNumber: encodeAsText(blockNumber),
      chainId,
      result
    }).onConflict((oc) => oc.doUpdateSet({ result })).execute();
    this.record("insertRpcRequestResult", performance.now() - start);
  };
  getRpcRequestResult = async ({
    blockNumber,
    chainId,
    request
  }) => {
    const start = performance.now();
    const rpcRequestResult = await this.db.selectFrom("rpcRequestResults").selectAll().where("blockNumber", "=", encodeAsText(blockNumber)).where("chainId", "=", chainId).where("request", "=", request).executeTakeFirst();
    const result = rpcRequestResult ? {
      ...rpcRequestResult,
      blockNumber: decodeToBigInt(rpcRequestResult.blockNumber)
    } : null;
    this.record("getRpcRequestResult", performance.now() - start);
    return result;
  };
  async getLogEvents({
    fromCheckpoint,
    toCheckpoint,
    limit,
    logFilters = [],
    factories = []
  }) {
    const start = performance.now();
    const baseQuery = this.db.with(
      "sources(source_id)",
      () => sql5`( values ${sql5.join(
        [...logFilters.map((f) => f.id), ...factories.map((f) => f.id)].map(
          (id) => sql5`( ${sql5.val(id)} )`
        )
      )} )`
    ).selectFrom("logs").leftJoin("blocks", "blocks.hash", "logs.blockHash").leftJoin("transactions", "transactions.hash", "logs.transactionHash").innerJoin("sources", (join) => join.onTrue()).where((eb) => {
      const logFilterCmprs = logFilters.map((logFilter) => {
        const exprs = this.buildLogFilterCmprs({ eb, logFilter });
        if (logFilter.includeEventSelectors) {
          exprs.push(
            eb.or(
              logFilter.includeEventSelectors.map(
                (t) => eb("logs.topic0", "=", t)
              )
            )
          );
        }
        return eb.and(exprs);
      });
      const factoryCmprs = factories.map((factory) => {
        const exprs = this.buildFactoryCmprs({ eb, factory });
        if (factory.includeEventSelectors) {
          exprs.push(
            eb.or(
              factory.includeEventSelectors.map(
                (t) => eb("logs.topic0", "=", t)
              )
            )
          );
        }
        return eb.and(exprs);
      });
      return eb.or([...logFilterCmprs, ...factoryCmprs]);
    });
    const requestedLogs = await baseQuery.select([
      "source_id",
      "logs.address as log_address",
      "logs.blockHash as log_blockHash",
      "logs.blockNumber as log_blockNumber",
      "logs.chainId as log_chainId",
      "logs.data as log_data",
      "logs.id as log_id",
      "logs.logIndex as log_logIndex",
      "logs.topic0 as log_topic0",
      "logs.topic1 as log_topic1",
      "logs.topic2 as log_topic2",
      "logs.topic3 as log_topic3",
      "logs.transactionHash as log_transactionHash",
      "logs.transactionIndex as log_transactionIndex",
      "blocks.baseFeePerGas as block_baseFeePerGas",
      "blocks.difficulty as block_difficulty",
      "blocks.extraData as block_extraData",
      "blocks.gasLimit as block_gasLimit",
      "blocks.gasUsed as block_gasUsed",
      "blocks.hash as block_hash",
      "blocks.logsBloom as block_logsBloom",
      "blocks.miner as block_miner",
      "blocks.mixHash as block_mixHash",
      "blocks.nonce as block_nonce",
      "blocks.number as block_number",
      "blocks.parentHash as block_parentHash",
      "blocks.receiptsRoot as block_receiptsRoot",
      "blocks.sha3Uncles as block_sha3Uncles",
      "blocks.size as block_size",
      "blocks.stateRoot as block_stateRoot",
      "blocks.timestamp as block_timestamp",
      "blocks.totalDifficulty as block_totalDifficulty",
      "blocks.transactionsRoot as block_transactionsRoot",
      "transactions.accessList as tx_accessList",
      "transactions.blockHash as tx_blockHash",
      "transactions.blockNumber as tx_blockNumber",
      "transactions.from as tx_from",
      "transactions.gas as tx_gas",
      "transactions.gasPrice as tx_gasPrice",
      "transactions.hash as tx_hash",
      "transactions.input as tx_input",
      "transactions.maxFeePerGas as tx_maxFeePerGas",
      "transactions.maxPriorityFeePerGas as tx_maxPriorityFeePerGas",
      "transactions.nonce as tx_nonce",
      "transactions.r as tx_r",
      "transactions.s as tx_s",
      "transactions.to as tx_to",
      "transactions.transactionIndex as tx_transactionIndex",
      "transactions.type as tx_type",
      "transactions.value as tx_value",
      "transactions.v as tx_v"
    ]).where((eb) => this.buildCheckpointCmprs(eb, ">", fromCheckpoint)).where((eb) => this.buildCheckpointCmprs(eb, "<=", toCheckpoint)).orderBy("blocks.timestamp", "asc").orderBy("logs.chainId", "asc").orderBy("blocks.number", "asc").orderBy("logs.logIndex", "asc").limit(limit + 1).execute();
    const events = requestedLogs.map((_row) => {
      const row = _row;
      return {
        sourceId: row.source_id,
        chainId: row.log_chainId,
        log: {
          address: checksumAddress3(row.log_address),
          blockHash: row.log_blockHash,
          blockNumber: decodeToBigInt(row.log_blockNumber),
          data: row.log_data,
          id: row.log_id,
          logIndex: Number(row.log_logIndex),
          removed: false,
          topics: [
            row.log_topic0,
            row.log_topic1,
            row.log_topic2,
            row.log_topic3
          ].filter((t) => t !== null),
          transactionHash: row.log_transactionHash,
          transactionIndex: Number(row.log_transactionIndex)
        },
        block: {
          baseFeePerGas: row.block_baseFeePerGas ? decodeToBigInt(row.block_baseFeePerGas) : null,
          difficulty: decodeToBigInt(row.block_difficulty),
          extraData: row.block_extraData,
          gasLimit: decodeToBigInt(row.block_gasLimit),
          gasUsed: decodeToBigInt(row.block_gasUsed),
          hash: row.block_hash,
          logsBloom: row.block_logsBloom,
          miner: checksumAddress3(row.block_miner),
          mixHash: row.block_mixHash,
          nonce: row.block_nonce,
          number: decodeToBigInt(row.block_number),
          parentHash: row.block_parentHash,
          receiptsRoot: row.block_receiptsRoot,
          sha3Uncles: row.block_sha3Uncles,
          size: decodeToBigInt(row.block_size),
          stateRoot: row.block_stateRoot,
          timestamp: decodeToBigInt(row.block_timestamp),
          totalDifficulty: decodeToBigInt(row.block_totalDifficulty),
          transactionsRoot: row.block_transactionsRoot
        },
        transaction: {
          blockHash: row.tx_blockHash,
          blockNumber: decodeToBigInt(row.tx_blockNumber),
          from: checksumAddress3(row.tx_from),
          gas: decodeToBigInt(row.tx_gas),
          hash: row.tx_hash,
          input: row.tx_input,
          nonce: Number(row.tx_nonce),
          r: row.tx_r,
          s: row.tx_s,
          to: row.tx_to ? checksumAddress3(row.tx_to) : row.tx_to,
          transactionIndex: Number(row.tx_transactionIndex),
          value: decodeToBigInt(row.tx_value),
          v: decodeToBigInt(row.tx_v),
          ...row.tx_type === "0x0" ? {
            type: "legacy",
            gasPrice: decodeToBigInt(row.tx_gasPrice)
          } : row.tx_type === "0x1" ? {
            type: "eip2930",
            gasPrice: decodeToBigInt(row.tx_gasPrice),
            accessList: JSON.parse(row.tx_accessList)
          } : row.tx_type === "0x2" ? {
            type: "eip1559",
            maxFeePerGas: decodeToBigInt(row.tx_maxFeePerGas),
            maxPriorityFeePerGas: decodeToBigInt(
              row.tx_maxPriorityFeePerGas
            )
          } : row.tx_type === "0x7e" ? {
            type: "deposit",
            maxFeePerGas: row.tx_maxFeePerGas ? decodeToBigInt(row.tx_maxFeePerGas) : void 0,
            maxPriorityFeePerGas: row.tx_maxPriorityFeePerGas ? decodeToBigInt(row.tx_maxPriorityFeePerGas) : void 0
          } : {
            type: row.tx_type
          }
        }
      };
    });
    const lastCheckpointRows = await baseQuery.select([
      "blocks.timestamp as block_timestamp",
      "logs.chainId as log_chainId",
      "blocks.number as block_number",
      "logs.logIndex as log_logIndex"
    ]).where((eb) => this.buildCheckpointCmprs(eb, "<=", toCheckpoint)).orderBy("blocks.timestamp", "desc").orderBy("logs.chainId", "desc").orderBy("blocks.number", "desc").orderBy("logs.logIndex", "desc").limit(1).execute();
    const lastCheckpointRow = lastCheckpointRows[0];
    const lastCheckpoint = lastCheckpointRow !== void 0 ? {
      blockTimestamp: Number(
        decodeToBigInt(lastCheckpointRow.block_timestamp)
      ),
      blockNumber: Number(
        decodeToBigInt(lastCheckpointRow.block_number)
      ),
      chainId: lastCheckpointRow.log_chainId,
      logIndex: lastCheckpointRow.log_logIndex
    } : void 0;
    this.record("getLogEvents", performance.now() - start);
    if (events.length === limit + 1) {
      events.pop();
      const lastEventInPage = events[events.length - 1];
      const lastCheckpointInPage = {
        blockTimestamp: Number(lastEventInPage.block.timestamp),
        chainId: lastEventInPage.chainId,
        blockNumber: Number(lastEventInPage.block.number),
        logIndex: lastEventInPage.log.logIndex
      };
      return {
        events,
        hasNextPage: true,
        lastCheckpointInPage,
        lastCheckpoint
      };
    } else {
      return {
        events,
        hasNextPage: false,
        lastCheckpointInPage: void 0,
        lastCheckpoint
      };
    }
  }
  /**
   * Builds an expression that filters for events that are greater or
   * less than the provided checkpoint. If the log index is not specific,
   * the expression will use a block-level granularity.
   */
  buildCheckpointCmprs = (eb, op, checkpoint) => {
    const { and, or } = eb;
    const { blockTimestamp, chainId, blockNumber, logIndex } = checkpoint;
    const operand = op.startsWith(">") ? ">" : "<";
    const operandOrEquals = `${operand}=`;
    const isInclusive = op.endsWith("=");
    if (logIndex === void 0) {
      return and([
        eb("blocks.timestamp", operandOrEquals, encodeAsText(blockTimestamp)),
        or([
          eb("blocks.timestamp", operand, encodeAsText(blockTimestamp)),
          and([
            eb("logs.chainId", operandOrEquals, chainId),
            or([
              eb("logs.chainId", operand, chainId),
              eb(
                "blocks.number",
                isInclusive ? operandOrEquals : operand,
                encodeAsText(blockNumber)
              )
            ])
          ])
        ])
      ]);
    }
    return and([
      eb("blocks.timestamp", operandOrEquals, encodeAsText(blockTimestamp)),
      or([
        eb("blocks.timestamp", operand, encodeAsText(blockTimestamp)),
        and([
          eb("logs.chainId", operandOrEquals, chainId),
          or([
            eb("logs.chainId", operand, chainId),
            and([
              eb("blocks.number", operandOrEquals, encodeAsText(blockNumber)),
              or([
                eb("blocks.number", operand, encodeAsText(blockNumber)),
                eb(
                  "logs.logIndex",
                  isInclusive ? operandOrEquals : operand,
                  logIndex
                )
              ])
            ])
          ])
        ])
      ])
    ]);
  };
  buildLogFilterCmprs = ({
    eb,
    logFilter
  }) => {
    const exprs = [];
    exprs.push(eb("source_id", "=", logFilter.id));
    exprs.push(eb("logs.chainId", "=", logFilter.chainId));
    if (logFilter.criteria.address) {
      const address = Array.isArray(logFilter.criteria.address) && logFilter.criteria.address.length === 1 ? logFilter.criteria.address[0] : logFilter.criteria.address;
      if (Array.isArray(address)) {
        exprs.push(eb.or(address.map((a) => eb("logs.address", "=", a))));
      } else {
        exprs.push(eb("logs.address", "=", address));
      }
    }
    if (logFilter.criteria.topics) {
      for (const idx_ of range(0, 4)) {
        const idx = idx_;
        const raw = logFilter.criteria.topics[idx] ?? null;
        if (raw === null)
          continue;
        const topic = Array.isArray(raw) && raw.length === 1 ? raw[0] : raw;
        if (Array.isArray(topic)) {
          exprs.push(eb.or(topic.map((a) => eb(`logs.topic${idx}`, "=", a))));
        } else {
          exprs.push(eb(`logs.topic${idx}`, "=", topic));
        }
      }
    }
    if (logFilter.fromBlock)
      exprs.push(eb("blocks.number", ">=", encodeAsText(logFilter.fromBlock)));
    if (logFilter.toBlock)
      exprs.push(eb("blocks.number", "<=", encodeAsText(logFilter.toBlock)));
    return exprs;
  };
  buildFactoryCmprs = ({
    eb,
    factory
  }) => {
    const exprs = [];
    exprs.push(eb("source_id", "=", factory.id));
    exprs.push(eb("logs.chainId", "=", factory.chainId));
    const selectChildAddressExpression = buildFactoryChildAddressSelectExpression2({
      childAddressLocation: factory.criteria.childAddressLocation
    });
    exprs.push(
      eb(
        "logs.address",
        "in",
        eb.selectFrom("logs").select(selectChildAddressExpression.as("childAddress")).where("chainId", "=", factory.chainId).where("address", "=", factory.criteria.address).where("topic0", "=", factory.criteria.eventSelector)
      )
    );
    if (factory.fromBlock)
      exprs.push(eb("blocks.number", ">=", encodeAsText(factory.fromBlock)));
    if (factory.toBlock)
      exprs.push(eb("blocks.number", "<=", encodeAsText(factory.toBlock)));
    return exprs;
  };
  transaction = async (callback) => {
    return await this.db.transaction().execute(async (tx) => {
      return await Promise.race([
        callback(tx),
        wait(15e3).then(() => {
          throw new Error("SQLite transaction timed out after 15 seconds.");
        })
      ]);
    });
  };
  record(methodName, duration) {
    this.common.metrics.ponder_sync_store_method_duration.observe(
      { method: methodName },
      duration
    );
  }
};
function buildFactoryChildAddressSelectExpression2({
  childAddressLocation
}) {
  if (childAddressLocation.startsWith("offset")) {
    const childAddressOffset = Number(childAddressLocation.substring(6));
    const start = 2 + 12 * 2 + childAddressOffset * 2 + 1;
    const length = 20 * 2;
    return sql5`'0x' || substring(data, ${start}, ${length})`;
  } else {
    const start = 2 + 12 * 2 + 1;
    const length = 20 * 2;
    return sql5`'0x' || substring(${sql5.ref(
      childAddressLocation
    )}, ${start}, ${length})`;
  }
}

// src/telemetry/service.ts
import { createHash } from "node:crypto";
import fs2 from "node:fs";
import { randomBytes } from "crypto";
import os from "os";
import path8 from "path";
import Conf from "conf";
import { detect, getNpmVersion } from "detect-package-manager";
import PQueue2 from "p-queue";
import pc2 from "picocolors";
import process2 from "process";

// src/telemetry/remote.ts
import { exec } from "child_process";
async function getGitRemoteUrl() {
  try {
    let resolve2;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve2 = res;
      reject = rej;
    });
    exec(
      "git config --local --get remote.origin.url",
      {
        timeout: 1e3,
        windowsHide: true
      },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve2(stdout);
      }
    );
    return String(await promise).trim();
  } catch (_) {
    return null;
  }
}

// src/telemetry/service.ts
var TelemetryService = class {
  options;
  conf;
  queue = new PQueue2({ concurrency: 1 });
  events = [];
  controller = new AbortController();
  context;
  heartbeatIntervalId;
  constructor({ options }) {
    this.options = options;
    this.conf = new Conf({ projectName: "ponder" });
    this.notify();
    this.heartbeatIntervalId = setInterval(() => {
      this.record({ event: "Heartbeat" });
    }, 6e4);
  }
  record(event) {
    if (this.disabled)
      return;
    this.events.push(event);
    this.queue.add(() => this.processEvent());
  }
  async flush() {
    await this.queue.onIdle();
  }
  processEvent = async () => {
    const event = this.events.pop();
    if (!event)
      return;
    try {
      await this.getContext();
    } catch (e) {
    }
    const serializedEvent = {
      ...event,
      anonymousId: this.anonymousId,
      context: this.context
    };
    try {
      await fetch(this.options.telemetryUrl, {
        method: "POST",
        body: JSON.stringify(serializedEvent),
        headers: { "Content-Type": "application/json" },
        signal: this.controller.signal
      });
    } catch (e) {
    }
  };
  async kill() {
    clearInterval(this.heartbeatIntervalId);
    this.queue.pause();
    this.queue.clear();
    await Promise.race([wait(500), this.queue.onIdle()]);
    if (this.queue.pending > 0) {
      this.controller.abort();
    }
  }
  notify() {
    if (this.disabled || this.conf.get("notifiedAt") || process2.env.NODE_ENV === "test") {
      return;
    }
    this.conf.set("notifiedAt", Date.now().toString());
    console.log(
      `${pc2.magenta(
        "Attention"
      )}: Ponder collects anonymous telemetry data to identify issues and prioritize features. See https://ponder.sh/advanced/telemetry for more information.`
    );
  }
  get disabled() {
    return this.options.telemetryDisabled || this.conf.has("enabled") && !this.conf.get("enabled");
  }
  get anonymousId() {
    const storedAnonymousId = this.conf.get("anonymousId");
    if (storedAnonymousId)
      return storedAnonymousId;
    const createdId = randomBytes(32).toString("hex");
    this.conf.set("anonymousId", createdId);
    return createdId;
  }
  get salt() {
    const storedSalt = this.conf.get("salt");
    if (storedSalt)
      return storedSalt;
    const createdSalt = randomBytes(32).toString("hex");
    this.conf.set("salt", createdSalt);
    return createdSalt;
  }
  oneWayHash(value) {
    const hash = createHash("sha256");
    hash.update(this.salt);
    hash.update(value);
    return hash.digest("hex");
  }
  async getContext() {
    if (this.context)
      return this.context;
    const sessionId = randomBytes(32).toString("hex");
    const projectIdRaw = await getGitRemoteUrl() ?? process2.cwd();
    const projectId = this.oneWayHash(projectIdRaw);
    let packageManager = "unknown";
    let packageManagerVersion = "unknown";
    try {
      packageManager = await detect();
      packageManagerVersion = await getNpmVersion(packageManager);
    } catch (e) {
    }
    const packageJsonCwdPath = path8.join(process2.cwd(), "package.json");
    const packageJsonRootPath = path8.join(this.options.rootDir, "package.json");
    const packageJsonPath2 = fs2.existsSync(packageJsonCwdPath) ? packageJsonCwdPath : fs2.existsSync(packageJsonRootPath) ? packageJsonRootPath : void 0;
    const packageJson2 = packageJsonPath2 ? JSON.parse(fs2.readFileSync("package.json", "utf8")) : void 0;
    const ponderVersion = packageJson2 ? packageJson2.dependencies["@ponder/core"] : "unknown";
    const cpus = os.cpus() || [];
    this.context = {
      sessionId,
      projectId,
      nodeVersion: process2.version,
      packageManager,
      packageManagerVersion,
      ponderVersion,
      systemPlatform: os.platform(),
      systemRelease: os.release(),
      systemArchitecture: os.arch(),
      cpuCount: cpus.length,
      cpuModel: cpus.length ? cpus[0].model : null,
      cpuSpeed: cpus.length ? cpus[0].speed : null,
      memoryInMb: Math.trunc(os.totalmem() / 1024 ** 2),
      isExampleProject: this.options.telemetryIsExampleProject
    };
    return this.context;
  }
};

// src/ui/app.tsx
import { Box, Text as Text2, render as inkRender } from "ink";
import React2 from "react";

// src/ui/ProgressBar.tsx
import { Text } from "ink";
import React from "react";
var ProgressBar = ({ current = 5, end = 10, width = 36 }) => {
  const maxCount = width || process.stdout.columns || 80;
  const fraction = current / end;
  const count = Math.min(Math.floor(maxCount * fraction), maxCount);
  return /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, null, "\u2588".repeat(count)), /* @__PURE__ */ React.createElement(Text, null, "\u2591".repeat(maxCount - count)));
};

// src/ui/app.tsx
var buildUiState = ({ sources }) => {
  const ui = {
    port: 0,
    historicalSyncStats: [],
    isHistoricalSyncComplete: false,
    realtimeSyncNetworks: [],
    indexingStats: [],
    indexingCompletedToTimestamp: 0,
    indexingError: false
  };
  sources.forEach((source) => {
    ui.historicalSyncStats.push({
      network: source.networkName,
      contract: source.contractName,
      rate: 0
    });
  });
  return ui;
};
var App = (ui) => {
  const {
    port,
    historicalSyncStats,
    // isHistoricalSyncComplete,
    // TODO: Consider adding realtime back into the UI in some manner.
    // realtimeSyncNetworks,
    indexingStats,
    indexingError
  } = ui;
  if (indexingError) {
    return /* @__PURE__ */ React2.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React2.createElement(Text2, null, " "), /* @__PURE__ */ React2.createElement(Text2, { color: "cyan" }, "Resolve the error and save your changes to reload the server."));
  }
  const maxWidth = process.stdout.columns || 80;
  const titleWidth = Math.max(
    ...historicalSyncStats.map((s) => s.contract.length + s.network.length + 4),
    ...indexingStats.map((s) => s.event.length + 1)
  );
  const maxEventCount = Math.max(
    ...indexingStats.map((s) => s.completedEventCount)
  );
  const metricsWidth = 15 + maxEventCount.toString().length;
  const barWidth = Math.min(
    Math.max(maxWidth - titleWidth - metricsWidth - 12, 24),
    48
  );
  return /* @__PURE__ */ React2.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React2.createElement(Text2, null, " "), /* @__PURE__ */ React2.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React2.createElement(Text2, { bold: true }, "Historical sync")), /* @__PURE__ */ React2.createElement(Box, { flexDirection: "column" }, historicalSyncStats.map(({ contract, network, rate, eta }) => {
    const etaText = eta ? ` | ~${formatEta(eta)}` : "";
    const rateText = formatPercentage(rate);
    const titleText = `${contract} (${network})`.padEnd(titleWidth, " ");
    const metricsText = rate === 1 ? /* @__PURE__ */ React2.createElement(Text2, { color: "greenBright" }, "done") : `${rateText}${etaText}`;
    return /* @__PURE__ */ React2.createElement(Box, { flexDirection: "column", key: `${contract}-${network}` }, /* @__PURE__ */ React2.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React2.createElement(Text2, null, titleText, " "), /* @__PURE__ */ React2.createElement(ProgressBar, { current: rate, end: 1, width: barWidth }), /* @__PURE__ */ React2.createElement(Text2, null, " ", metricsText)));
  })), /* @__PURE__ */ React2.createElement(Text2, null, " "), /* @__PURE__ */ React2.createElement(Text2, { bold: true }, "Indexing "), indexingStats.map(
    ({ event, totalSeconds, completedSeconds, completedEventCount }) => {
      const rate = totalSeconds === void 0 || completedSeconds === void 0 || totalSeconds === 0 ? 1 : completedSeconds / totalSeconds;
      const titleText = event.padEnd(titleWidth, " ");
      const rateText = rate === 1 ? /* @__PURE__ */ React2.createElement(Text2, { color: "greenBright" }, "done") : formatPercentage(rate);
      return /* @__PURE__ */ React2.createElement(Box, { flexDirection: "column", key: event }, /* @__PURE__ */ React2.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React2.createElement(Text2, null, titleText, " "), completedSeconds !== void 0 && totalSeconds !== void 0 ? /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(ProgressBar, { current: rate, end: 1, width: barWidth }), /* @__PURE__ */ React2.createElement(Text2, null, " ", rateText, " (", completedEventCount, " events)")) : /* @__PURE__ */ React2.createElement(Text2, null, "Waiting to start...")));
    }
  ), /* @__PURE__ */ React2.createElement(Text2, null, " "), /* @__PURE__ */ React2.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React2.createElement(Text2, { bold: true }, "GraphQL "), /* @__PURE__ */ React2.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React2.createElement(Text2, null, "Server live at http://localhost:", port))));
};
var setupInkApp = (ui) => {
  const { rerender, unmount: inkUnmount, clear } = inkRender(/* @__PURE__ */ React2.createElement(App, { ...ui }));
  const render = (ui2) => {
    rerender(/* @__PURE__ */ React2.createElement(App, { ...ui2 }));
  };
  const unmount = () => {
    clear();
    inkUnmount();
  };
  return { render, unmount };
};

// src/ui/service.ts
var UiService = class {
  common;
  sources;
  ui;
  renderInterval;
  render;
  unmount;
  constructor({ common, sources }) {
    this.common = common;
    this.sources = sources;
    this.ui = buildUiState({ sources: this.sources });
    if (this.common.options.uiEnabled) {
      const { render, unmount } = setupInkApp(this.ui);
      this.render = () => render(this.ui);
      this.unmount = unmount;
    } else {
      this.render = () => void 0;
      this.unmount = () => void 0;
    }
    this.renderInterval = setInterval(async () => {
      this.ui.historicalSyncStats = await getHistoricalSyncStats({
        metrics: this.common.metrics,
        sources: this.sources
      });
      const minRate = Math.min(
        ...this.ui.historicalSyncStats.map((s) => s.rate)
      );
      if (!this.ui.isHistoricalSyncComplete && minRate === 1) {
        this.ui.isHistoricalSyncComplete = true;
      }
      const connectedNetworks = (await this.common.metrics.ponder_realtime_is_connected.get()).values.filter((m) => m.value === 1).map((m) => m.labels.network).filter((n) => typeof n === "string");
      const allNetworks = [
        ...new Set(
          this.sources.filter((s) => s.endBlock === void 0).map((s) => s.networkName)
        )
      ];
      this.ui.realtimeSyncNetworks = allNetworks.map((networkName) => ({
        name: networkName,
        isConnected: connectedNetworks.includes(networkName)
      }));
      const totalSecondsMetric = (await this.common.metrics.ponder_indexing_total_seconds.get()).values;
      const completedSecondsMetric = (await this.common.metrics.ponder_indexing_completed_seconds.get()).values;
      const completedEventsMetric = (await this.common.metrics.ponder_indexing_completed_events.get()).values;
      const eventNames = totalSecondsMetric.map(
        (m) => m.labels.event
      );
      this.ui.indexingStats = eventNames.map((event) => {
        const totalSeconds = totalSecondsMetric.find(
          (m) => m.labels.event === event
        )?.value;
        const completedSeconds = completedSecondsMetric.find(
          (m) => m.labels.event === event
        )?.value;
        const completedEventCount = completedEventsMetric.filter((m) => m.labels.event === event).reduce((a, v) => a + v.value, 0);
        return { event, totalSeconds, completedSeconds, completedEventCount };
      });
      const indexingCompletedToTimestamp = (await this.common.metrics.ponder_indexing_completed_timestamp.get()).values[0].value ?? 0;
      this.ui.indexingCompletedToTimestamp = indexingCompletedToTimestamp;
      const port = (await this.common.metrics.ponder_server_port.get()).values[0].value;
      this.ui.port = port;
      this.render();
    }, 17);
  }
  resetHistoricalState() {
    this.ui.isHistoricalSyncComplete = false;
  }
  kill() {
    clearInterval(this.renderInterval);
    this.unmount();
  }
};

// src/utils/requestQueue.ts
import "viem";

// src/utils/timer.ts
function startClock() {
  const start = process.hrtime();
  return () => hrTimeToMs(process.hrtime(start));
}
function hrTimeToMs(diff) {
  return Math.round(diff[0] * 1e3 + diff[1] / 1e6);
}

// src/utils/requestQueue.ts
var createRequestQueue = ({
  metrics,
  network
}) => {
  let queue = new Array();
  const interval = 1e3 / network.maxRequestsPerSecond > 50 ? 1e3 / network.maxRequestsPerSecond : 50;
  const requestBatchSize = 1e3 / network.maxRequestsPerSecond > 50 ? 1 : Math.floor(network.maxRequestsPerSecond / 20);
  let lastRequestTime = 0;
  let timeout = void 0;
  const pendingRequests = /* @__PURE__ */ new Map();
  let isTimerOn = false;
  let isStarted = true;
  const processQueue = () => {
    if (!isStarted)
      return;
    if (queue.length === 0)
      return;
    const now = Date.now();
    let timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest >= interval) {
      lastRequestTime = now;
      for (let i = 0; i < requestBatchSize; i++) {
        const task = queue.shift();
        metrics.ponder_rpc_request_lag.observe(
          { method: task.params.method, network: network.name },
          task.stopClockLag()
        );
        const stopClock = startClock();
        const p = network.transport.request(task.params).then(task.resolve).catch(task.reject).finally(() => {
          pendingRequests.delete(task);
          metrics.ponder_rpc_request_duration.observe(
            { method: task.params.method, network: network.name },
            stopClock()
          );
        });
        pendingRequests.set(task, p);
        if (queue.length === 0)
          break;
      }
      timeSinceLastRequest = 0;
    }
    if (!isTimerOn) {
      isTimerOn = true;
      timeout = setTimeout(() => {
        isTimerOn = false;
        processQueue();
      }, interval - timeSinceLastRequest);
    }
  };
  return {
    request: (params) => {
      const stopClockLag = startClock();
      const p = new Promise((resolve2, reject) => {
        queue.push({
          params,
          resolve: resolve2,
          reject,
          stopClockLag
        });
      });
      processQueue();
      return p;
    },
    size: () => new Promise((res) => setImmediate(() => res(queue.length))),
    pending: () => new Promise(
      (res) => setImmediate(() => res(Object.keys(pendingRequests).length))
    ),
    start: () => {
      isStarted = true;
      processQueue();
    },
    pause: () => {
      isStarted = false;
    },
    onIdle: () => Promise.all(Object.values(pendingRequests)).then(() => {
    }),
    clear: () => {
      clearTimeout(timeout);
      queue = new Array();
      lastRequestTime = 0;
    },
    queue
  };
};

// src/Ponder.ts
var Ponder = class {
  common;
  buildService;
  // User config and build artifacts
  config = void 0;
  sources = void 0;
  networks = void 0;
  schema = void 0;
  graphqlSchema = void 0;
  indexingFunctions = void 0;
  tableAccess = void 0;
  // Sync services
  syncStore = void 0;
  syncServices = void 0;
  syncGatewayService = void 0;
  // Indexing services
  indexingStore = void 0;
  indexingService = void 0;
  // Misc services
  serverService = void 0;
  codegenService = void 0;
  uiService = void 0;
  constructor({ options }) {
    const logger = new LoggerService({
      level: options.logLevel,
      dir: options.logDir
    });
    const metrics = new MetricsService();
    const telemetry = new TelemetryService({ options });
    this.common = { options, logger, metrics, telemetry };
    this.buildService = new BuildService({ common: this.common });
  }
  async dev({
    syncStore,
    indexingStore
  } = {}) {
    const dotEnvPath = path9.join(this.common.options.rootDir, ".env.local");
    if (!existsSync2(dotEnvPath)) {
      this.common.logger.warn({
        service: "app",
        msg: "Local environment file (.env.local) not found"
      });
    }
    const success = await this.setupBuildService();
    if (!success)
      return;
    this.common.telemetry.record({
      event: "App Started",
      properties: {
        command: "ponder dev",
        contractCount: this.sources.length,
        databaseKind: this.config.database?.kind
      }
    });
    await this.setupCoreServices({ isDev: true, syncStore, indexingStore });
    this.registerCoreServiceEventListeners();
    this.registerBuildServiceEventListeners();
    await this.startSyncServices();
  }
  async start({
    syncStore,
    indexingStore
  } = {}) {
    const success = await this.setupBuildService();
    if (!success)
      return;
    this.common.telemetry.record({
      event: "App Started",
      properties: {
        command: "ponder start",
        contractCount: this.sources.length,
        databaseKind: this.config.database?.kind
      }
    });
    await this.setupCoreServices({ isDev: false, syncStore, indexingStore });
    this.registerCoreServiceEventListeners();
    await this.startSyncServices();
  }
  async serve() {
    const success = await this.setupBuildService();
    if (!success)
      return;
    this.common.telemetry.record({
      event: "App Started",
      properties: {
        command: "ponder serve",
        databaseKind: this.config.database?.kind
      }
    });
    const database = buildDatabase({
      common: this.common,
      config: this.config
    });
    if (database.indexing.kind === "sqlite") {
      throw new Error(`The 'ponder serve' command only works with Postgres.`);
    }
    this.common.metrics.registerDatabaseMetrics(database);
    this.indexingStore = new PostgresIndexingStore({
      common: this.common,
      pool: database.indexing.pool,
      usePublic: true
    });
    this.serverService = new ServerService({
      common: this.common,
      indexingStore: this.indexingStore
    });
    this.serverService.setup({ registerDevRoutes: false });
    await this.serverService.start();
    this.indexingStore.schema = this.schema;
    this.serverService.reloadGraphqlSchema({
      graphqlSchema: this.graphqlSchema
    });
  }
  async codegen() {
    const success = await this.setupBuildService();
    if (!success)
      return;
    this.codegenService = new CodegenService({ common: this.common });
    this.codegenService.generateGraphqlSchemaFile({
      graphqlSchema: this.graphqlSchema
    });
    this.codegenService.generatePonderEnv();
    this.buildService.clearListeners();
    await this.buildService.kill();
    await this.common.telemetry.kill();
  }
  async setupBuildService() {
    this.common.logger.debug({
      service: "app",
      msg: `Started using config file: ${path9.relative(
        this.common.options.rootDir,
        this.common.options.configFile
      )}`
    });
    await this.buildService.setup();
    const result = await this.buildService.initialLoad();
    if (result.error) {
      this.common.logger.error({
        service: "build",
        error: result.error
      });
      this.common.logger.fatal({
        service: "app",
        msg: "Failed intial build"
      });
      await this.buildService.kill();
      await this.common.telemetry.kill();
      return false;
    }
    this.config = result.config;
    this.sources = result.sources;
    this.networks = result.networks;
    this.schema = result.schema;
    this.graphqlSchema = result.graphqlSchema;
    this.indexingFunctions = result.indexingFunctions;
    this.tableAccess = result.tableAccess;
    return true;
  }
  async setupCoreServices({
    isDev,
    syncStore,
    indexingStore
  }) {
    const database = buildDatabase({
      common: this.common,
      config: this.config
    });
    this.common.metrics.registerDatabaseMetrics(database);
    this.syncStore = syncStore ?? (database.sync.kind === "sqlite" ? new SqliteSyncStore({
      common: this.common,
      database: database.sync.database
    }) : new PostgresSyncStore({
      common: this.common,
      pool: database.sync.pool
    }));
    this.indexingStore = indexingStore ?? (database.indexing.kind === "sqlite" ? new SqliteIndexingStore({
      common: this.common,
      database: database.indexing.database
    }) : new PostgresIndexingStore({
      common: this.common,
      pool: database.indexing.pool
    }));
    const networksToSync = this.networks.filter((network) => {
      const hasSources = this.sources.some(
        (source) => source.networkName === network.name
      );
      if (!hasSources) {
        this.common.logger.warn({
          service: "app",
          msg: `No contracts found (network=${network.name})`
        });
      }
      return hasSources;
    });
    this.syncServices = networksToSync.map((network) => {
      const sourcesForNetwork = this.sources.filter(
        (source) => source.networkName === network.name
      );
      const requestQueue = createRequestQueue({
        network,
        metrics: this.common.metrics
      });
      return {
        network,
        requestQueue,
        sources: sourcesForNetwork,
        historical: new HistoricalSyncService({
          common: this.common,
          syncStore: this.syncStore,
          network,
          requestQueue,
          sources: sourcesForNetwork
        }),
        realtime: new RealtimeSyncService({
          common: this.common,
          syncStore: this.syncStore,
          network,
          requestQueue,
          sources: sourcesForNetwork
        })
      };
    });
    this.syncGatewayService = new SyncGateway({
      common: this.common,
      syncStore: this.syncStore,
      networks: networksToSync
    });
    this.indexingService = new IndexingService({
      common: this.common,
      syncStore: this.syncStore,
      indexingStore: this.indexingStore,
      syncGatewayService: this.syncGatewayService,
      sources: this.sources,
      networks: this.syncServices.map((s) => s.network),
      requestQueues: this.syncServices.map((s) => s.requestQueue)
    });
    this.serverService = new ServerService({
      common: this.common,
      indexingStore: this.indexingStore
    });
    this.codegenService = new CodegenService({ common: this.common });
    this.uiService = new UiService({
      common: this.common,
      sources: this.sources
    });
    await this.syncStore.migrateUp();
    this.serverService.setup({ registerDevRoutes: isDev });
    await this.serverService.start();
    this.serverService.reloadGraphqlSchema({
      graphqlSchema: this.graphqlSchema
    });
    await this.indexingService.reset({
      indexingFunctions: this.indexingFunctions,
      schema: this.schema,
      tableAccess: this.tableAccess
    });
    await this.indexingService.processEvents();
    this.codegenService.generateGraphqlSchemaFile({
      graphqlSchema: this.graphqlSchema
    });
    this.codegenService.generatePonderEnv();
  }
  async startSyncServices() {
    try {
      await Promise.all(
        this.syncServices.map(async ({ historical, realtime }) => {
          const blockNumbers = await realtime.setup();
          await historical.setup(blockNumbers);
          historical.start();
          realtime.start();
        })
      );
    } catch (error_) {
      const error = error_;
      error.stack = void 0;
      this.common.logger.fatal({ service: "app", error });
      await this.kill();
    }
  }
  /**
   * Shutdown sequence.
   */
  async kill() {
    this.common.logger.info({
      service: "app",
      msg: "Shutting down..."
    });
    this.common.telemetry.record({
      event: "App Killed",
      properties: { processDuration: process3.uptime() }
    });
    this.clearBuildServiceEventListeners();
    this.clearCoreServiceEventListeners();
    await Promise.all([
      this.buildService.kill(),
      this.serverService.kill(),
      this.common.telemetry.kill()
    ]);
    this.uiService.kill();
    await this.killCoreServices();
    this.common.logger.debug({
      service: "app",
      msg: "Finished shutdown sequence"
    });
  }
  /**
   * Kill sync and indexing services and stores.
   */
  async killCoreServices() {
    const indexingStoreTeardownPromise = this.indexingStore.teardown();
    await this.serverService.kill();
    this.uiService.kill();
    this.indexingService.kill();
    this.syncServices.forEach(({ realtime, historical, requestQueue }) => {
      realtime.kill();
      historical.kill();
      requestQueue.clear();
    });
    await indexingStoreTeardownPromise;
    await Promise.all(
      this.syncServices.map(({ requestQueue }) => requestQueue.onIdle())
    );
    await this.indexingStore.kill();
    await this.syncStore.kill();
  }
  registerBuildServiceEventListeners() {
    this.buildService.onSerial(
      "newConfig",
      async ({ config, sources, networks }) => {
        this.uiService.ui.indexingError = false;
        this.clearCoreServiceEventListeners();
        await this.killCoreServices();
        await this.common.metrics.resetMetrics();
        this.config = config;
        this.sources = sources;
        this.networks = networks;
        await this.setupCoreServices({ isDev: true });
        this.registerCoreServiceEventListeners();
        await this.startSyncServices();
      }
    );
    this.buildService.onSerial(
      "newSchema",
      async ({ schema, graphqlSchema, tableAccess }) => {
        this.uiService.ui.indexingError = false;
        this.schema = schema;
        this.graphqlSchema = graphqlSchema;
        this.tableAccess = tableAccess;
        this.codegenService.generateGraphqlSchemaFile({ graphqlSchema });
        this.serverService.reloadGraphqlSchema({ graphqlSchema });
        await this.indexingService.reset({ schema, tableAccess });
        await this.indexingService.processEvents();
      }
    );
    this.buildService.onSerial(
      "newIndexingFunctions",
      async ({ indexingFunctions, tableAccess }) => {
        this.uiService.ui.indexingError = false;
        this.indexingFunctions = indexingFunctions;
        this.tableAccess = tableAccess;
        await this.indexingService.reset({ indexingFunctions, tableAccess });
        await this.indexingService.processEvents();
      }
    );
    this.buildService.onSerial("error", async () => {
      this.uiService.ui.indexingError = true;
      this.indexingService.kill();
      for (const { realtime, historical } of this.syncServices) {
        realtime.kill();
        historical.kill();
      }
    });
  }
  clearBuildServiceEventListeners() {
    this.buildService.clearListeners();
  }
  registerCoreServiceEventListeners() {
    this.syncServices.forEach(({ network, historical, realtime }) => {
      historical.on("historicalCheckpoint", (checkpoint) => {
        this.syncGatewayService.handleNewHistoricalCheckpoint(checkpoint);
      });
      historical.on("syncComplete", () => {
        this.syncGatewayService.handleHistoricalSyncComplete({
          chainId: network.chainId
        });
      });
      realtime.on("realtimeCheckpoint", (checkpoint) => {
        this.syncGatewayService.handleNewRealtimeCheckpoint(checkpoint);
      });
      realtime.on("finalityCheckpoint", (checkpoint) => {
        this.syncGatewayService.handleNewFinalityCheckpoint(checkpoint);
      });
      realtime.on("shallowReorg", (checkpoint) => {
        this.syncGatewayService.handleReorg(checkpoint);
      });
      realtime.on("fatal", async () => {
        this.common.logger.fatal({
          service: "app",
          msg: "Realtime sync service failed"
        });
        await this.kill();
      });
    });
    this.syncGatewayService.on("newCheckpoint", async () => {
      await this.indexingService.processEvents();
    });
    this.syncGatewayService.on("reorg", async (checkpoint) => {
      await this.indexingService.handleReorg(checkpoint);
      await this.indexingService.processEvents();
    });
    this.indexingService.on("eventsProcessed", async ({ toCheckpoint }) => {
      if (this.serverService.isHistoricalIndexingComplete)
        return;
      if (this.syncGatewayService.historicalSyncCompletedAt && toCheckpoint.blockTimestamp >= this.syncGatewayService.historicalSyncCompletedAt) {
        this.serverService.setIsHistoricalIndexingComplete();
        await this.indexingStore.publish();
      }
    });
    this.indexingService.on("error", async () => {
      this.uiService.ui.indexingError = true;
    });
    this.serverService.on("admin:reload", async ({ chainId }) => {
      const syncServiceForChainId = this.syncServices.find(
        ({ network }) => network.chainId === chainId
      );
      if (!syncServiceForChainId) {
        this.common.logger.warn({
          service: "server",
          msg: `No network defined for chainId: ${chainId}`
        });
        return;
      }
      await this.syncStore.deleteRealtimeData({
        chainId,
        fromBlock: BigInt(0)
      });
      this.syncGatewayService.resetCheckpoints({ chainId });
      syncServiceForChainId.sources.forEach(
        ({ networkName, contractName }) => {
          this.common.metrics.ponder_historical_total_blocks.set(
            { network: networkName, contract: contractName },
            0
          );
          this.common.metrics.ponder_historical_completed_blocks.set(
            { network: networkName, contract: contractName },
            0
          );
          this.common.metrics.ponder_historical_cached_blocks.set(
            { network: networkName, contract: contractName },
            0
          );
        }
      );
      syncServiceForChainId.realtime.kill();
      syncServiceForChainId.historical.kill();
      try {
        const blockNumbers = await syncServiceForChainId.realtime.setup();
        await syncServiceForChainId.historical.setup(blockNumbers);
      } catch (error_) {
        const error = error_;
        error.stack = void 0;
        this.common.logger.fatal({
          service: "app",
          msg: "Failed to fetch initial realtime data",
          error
        });
        await this.kill();
      }
      syncServiceForChainId.realtime.start();
      syncServiceForChainId.historical.start();
      this.uiService.resetHistoricalState();
      await this.indexingService.reset();
      await this.indexingService.processEvents();
    });
  }
  clearCoreServiceEventListeners() {
    this.syncServices.forEach(({ historical, realtime }) => {
      historical.clearListeners();
      realtime.clearListeners();
    });
    this.syncGatewayService.clearListeners();
    this.indexingService.clearListeners();
    this.serverService.clearListeners();
  }
};

// src/bin/ponder.ts
var __dirname = dirname(fileURLToPath(import.meta.url));
var packageJsonPath = resolve(__dirname, "../../package.json");
var packageJson = JSON.parse(
  readFileSync3(packageJsonPath, { encoding: "utf8" })
);
dotenv.config({ path: ".env.local" });
var cli = cac("ponder").version(packageJson.version).usage("<command> [OPTIONS]").option(
  "--root [PATH]",
  "Path to the project root directory (default: working directory)"
).option("--config [PATH]", "Path to the project config file", {
  default: "ponder.config.ts"
}).help();
cli.command("dev", "Start the app in development mode").option(
  "-p, --port [PORT]",
  "Port number for the the web server (default: 42069)"
).option(
  "-H, --hostname [HOSTNAME]",
  "Hostname for the web server (default: 0.0.0.0)"
).option(
  "-v, --debug",
  "Enable debug logs including realtime blocks, internal events, etc"
).option(
  "-vv, --trace",
  "Enable trace logs including db queries, indexing checkpoints, etc"
).action(async (cliOptions) => {
  if (cliOptions.help)
    process.exit(0);
  validateNodeVersion();
  const options = buildOptions({ cliOptions });
  const devOptions = { ...options, uiEnabled: true };
  const ponder = new Ponder({ options: devOptions });
  registerKilledProcessListener(() => ponder.kill());
  await ponder.dev();
});
cli.command("start", "Start the app in production mode").option(
  "-p, --port [PORT]",
  "Port number for the the web server (default: 42069)"
).option(
  "-H, --hostname [HOSTNAME]",
  "Hostname for the web server (default: 0.0.0.0)"
).option(
  "-v, --debug",
  "Enable debug logs including realtime blocks, internal events, etc"
).option(
  "-vv, --trace",
  "Enable trace logs including db queries, indexing checkpoints, etc"
).action(async (cliOptions) => {
  if (cliOptions.help)
    process.exit(0);
  validateNodeVersion();
  const options = buildOptions({ cliOptions });
  const startOptions = { ...options, uiEnabled: false };
  const ponder = new Ponder({ options: startOptions });
  registerKilledProcessListener(() => ponder.kill());
  await ponder.start();
});
cli.command("serve", "Start the web server (experimental)").option(
  "-p, --port [PORT]",
  "Port number for the the web server (default: 42069)"
).option(
  "-H, --hostname [HOSTNAME]",
  "Hostname for the web server (default: 0.0.0.0)"
).option(
  "-v, --debug",
  "Enable debug logs including realtime blocks, internal events, etc"
).option(
  "-vv, --trace",
  "Enable trace logs including db queries, indexing checkpoints, etc"
).action(async (cliOptions) => {
  if (cliOptions.help)
    process.exit(0);
  validateNodeVersion();
  const options = buildOptions({ cliOptions });
  const devOptions = { ...options, uiEnabled: true };
  const ponder = new Ponder({ options: devOptions });
  registerKilledProcessListener(() => ponder.kill());
  await ponder.serve();
});
cli.command("codegen", "Generate the schema.graphql file, then exit").action(async (cliOptions) => {
  if (cliOptions.help)
    process.exit(0);
  validateNodeVersion();
  const options = buildOptions({ cliOptions });
  const codegenOptions = {
    ...options,
    uiEnabled: false,
    logLevel: "error"
  };
  const ponder = new Ponder({ options: codegenOptions });
  registerKilledProcessListener(() => ponder.kill());
  await ponder.codegen();
});
cli.parse();
function registerKilledProcessListener(fn) {
  let isKillListenerInProgress = false;
  const listener = async () => {
    if (isKillListenerInProgress)
      return;
    isKillListenerInProgress = true;
    await fn();
    process.exit(0);
  };
  process.on("SIGINT", listener);
  process.on("SIGQUIT", listener);
  process.on("SIGTERM", listener);
}
function validateNodeVersion() {
  const _nodeVersion = process.version.split(".");
  const nodeVersion = [
    Number(_nodeVersion[0].slice(1)),
    Number(_nodeVersion[1]),
    Number(_nodeVersion[2])
  ];
  if (nodeVersion[0] < 18 || nodeVersion[0] === 18 && nodeVersion[1] < 14) {
    console.log(
      `Ponder requires ${pc3.cyan("Node >=18")}, detected ${process.version}.`
    );
    console.log("");
    process.exit(1);
  }
}
//# sourceMappingURL=ponder.js.map