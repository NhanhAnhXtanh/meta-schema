import { Table, Relationship, TableGroup } from "@/types";

export const sampleTables: Table[] = [
  {
    id: "try-update-me",
    name: "TRY UPDATE ME 😊",
    color: "green",
    groupId: "order-management",
    columns: [
      { name: "id", type: "bigint", nullable: false, primaryKey: true },
      { name: "field_2", type: "bigint", nullable: true },
      { name: "field_3", type: "bigint", nullable: true },
      { name: "field_4", type: "bigint", nullable: true },
    ],
  },
  {
    id: "orders",
    name: "orders",
    color: "red",
    groupId: "order-management",
    columns: [
      { name: "order_id", type: "int", nullable: false, primaryKey: true },
      { name: "customer_id", type: "int", nullable: true },
      { name: "order_status", type: "smallint", nullable: true },
      { name: "order_date", type: "date", nullable: true },
      { name: "required_date", type: "date", nullable: true },
      { name: "shipped_date", type: "date", nullable: true },
      { name: "store_id", type: "int", nullable: true },
      { name: "staff_id", type: "int", nullable: true },
    ],
  },
  {
    id: "order_items",
    name: "order_items",
    color: "blue",
    groupId: "order-management",
    columns: [
      { name: "order_id", type: "int", nullable: false, primaryKey: true },
      { name: "item_id", type: "int", nullable: false, primaryKey: true },
      { name: "product_id", type: "int", nullable: true },
      { name: "quantity", type: "int", nullable: true },
      { name: "list_price", type: "numeric(10, 2)", nullable: true },
      { name: "discount", type: "numeric(4, 2)", nullable: true },
    ],
  },
  {
    id: "products",
    name: "products",
    color: "green",
    groupId: "product-info",
    columns: [
      { name: "product_id", type: "int", nullable: false, primaryKey: true },
      { name: "product_name", type: "varchar", nullable: true },
      { name: "brand_id", type: "int", nullable: true },
      { name: "category_id", type: "int", nullable: true },
      { name: "model_year", type: "smallint", nullable: true },
      { name: "list_price", type: "numeric(10, 2)", nullable: true },
    ],
  },
  {
    id: "categories",
    name: "categories",
    color: "purple",
    groupId: "product-info",
    columns: [
      { name: "category_id", type: "int", nullable: false, primaryKey: true },
      { name: "category_name", type: "varchar", nullable: true },
    ],
  },
  {
    id: "customers",
    name: "customers",
    color: "yellow",
    columns: [
      { name: "customer_id", type: "int", nullable: false, primaryKey: true },
      { name: "first_name", type: "varchar", nullable: true },
      { name: "last_name", type: "varchar", nullable: true },
      { name: "phone", type: "varchar", nullable: true },
      { name: "email", type: "varchar", nullable: true },
      { name: "street", type: "varchar", nullable: true },
      { name: "city", type: "varchar", nullable: true },
      { name: "state", type: "varchar", nullable: true },
      { name: "zip_code", type: "varchar", nullable: true },
    ],
  },
];

export const sampleRelationships: Relationship[] = [
  {
    id: "rel-1",
    source: "orders",
    sourceHandle: "customer_id",
    target: "customers",
    targetHandle: "customer_id",
    sourceCardinality: "N",
    targetCardinality: "1",
  },
  {
    id: "rel-2",
    source: "order_items",
    sourceHandle: "order_id",
    target: "orders",
    targetHandle: "order_id",
    sourceCardinality: "N",
    targetCardinality: "1",
  },
  {
    id: "rel-3",
    source: "order_items",
    sourceHandle: "product_id",
    target: "products",
    targetHandle: "product_id",
    sourceCardinality: "N",
    targetCardinality: "1",
  },
  {
    id: "rel-4",
    source: "products",
    sourceHandle: "category_id",
    target: "categories",
    targetHandle: "category_id",
    sourceCardinality: "N",
    targetCardinality: "1",
  },
];

export const sampleGroups: TableGroup[] = [
  {
    id: "order-management",
    name: "Order Management",
    color: "blue",
    tables: ["try-update-me", "orders", "order_items"],
  },
  {
    id: "product-info",
    name: "Product Info",
    color: "purple",
    tables: ["products", "categories"],
  },
];

