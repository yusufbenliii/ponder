// src/config/config.ts
import "viem";
var createConfig = (config) => config;

// src/schema/columns.ts
var optional = (column) => () => {
  const newColumn = { ...column, optional: true };
  return column.list || column.references !== void 0 ? {
    " column": newColumn
  } : {
    " column": newColumn,
    list: list(newColumn),
    references: references(
      newColumn
    )
  };
};
var list = (column) => () => {
  const newColumn = { ...column, list: true };
  return column.optional ? {
    " column": newColumn
  } : {
    " column": newColumn,
    optional: optional(
      newColumn
    )
  };
};
var references = (column) => (references2) => {
  const newColumn = { ...column, references: references2 };
  return column.optional ? { " column": newColumn } : {
    " column": newColumn,
    optional: optional(
      newColumn
    )
  };
};
var emptyColumn = (scalar) => () => {
  const column = {
    _type: "b",
    type: scalar,
    references: void 0,
    optional: false,
    list: false
  };
  return {
    " column": column,
    optional: optional(column),
    list: list(column),
    references: references(column)
  };
};
var _enum = (type) => ({
  " enum": {
    _type: "e",
    type,
    optional: false,
    list: false
  },
  optional: () => ({
    " enum": {
      _type: "e",
      type,
      optional: true,
      list: false
    },
    list: () => ({
      " enum": {
        _type: "e",
        type,
        optional: true,
        list: true
      }
    })
  }),
  list: () => ({
    " enum": {
      _type: "e",
      type,
      list: true,
      optional: false
    },
    optional: () => ({
      " enum": {
        _type: "e",
        type,
        optional: true,
        list: true
      }
    })
  })
});
var string = emptyColumn("string");
var int = emptyColumn("int");
var float = emptyColumn("float");
var boolean = emptyColumn("boolean");
var hex = emptyColumn("hex");
var bigint = emptyColumn("bigint");
var one = (derivedColumn) => ({
  _type: "o",
  referenceColumn: derivedColumn
});
var many = (derived) => ({
  _type: "m",
  referenceTable: derived.split(".")[0],
  referenceColumn: derived.split(".")[1]
});

// src/schema/schema.ts
var createTable = (columns) => Object.entries(
  columns
).reduce(
  (acc, cur) => ({
    ...acc,
    [cur[0]]: " column" in cur[1] ? cur[1][" column"] : " enum" in cur[1] ? cur[1][" enum"] : cur[1]
  }),
  {}
);
var createEnum = (_enum2) => _enum2;
var P = {
  createEnum,
  createTable,
  string,
  bigint,
  int,
  float,
  hex,
  boolean,
  one,
  many,
  enum: _enum
};
var createSchema = (_schema) => {
  const schema = _schema(P);
  return Object.entries(schema).reduce(
    (acc, [name, tableOrEnum]) => Array.isArray(tableOrEnum) ? { ...acc, enums: { ...acc.enums, [name]: tableOrEnum } } : {
      ...acc,
      tables: { ...acc.tables, [name]: tableOrEnum }
    },
    { tables: {}, enums: {} }
  );
};

// src/utils/mergeAbis.ts
import { formatAbiItem } from "viem/utils";
var isAbiItemEqual = (a, b) => formatAbiItem(a) === formatAbiItem(b);
var mergeAbis = (abis) => {
  let merged = [];
  for (const abi of abis) {
    for (const item of abi) {
      if (item.type !== "constructor" && item.type !== "receive" && item.type !== "fallback" && !merged.some((m) => isAbiItemEqual(m, item))) {
        merged = [...merged, item];
      }
    }
  }
  return merged;
};
export {
  createConfig,
  createSchema,
  mergeAbis
};
//# sourceMappingURL=index.js.map