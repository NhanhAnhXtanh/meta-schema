export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
}

export interface Table extends Record<string, unknown> {
  id: string;
  name: string;
  columns: TableColumn[];
  groupId?: string;
  color?: string;
}

export interface Relationship extends Record<string, unknown> {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  sourceCardinality: "1" | "N";
  targetCardinality: "1" | "N";
}

export interface TableGroup extends Record<string, unknown> {
  id: string;
  name: string;
  color: string;
  tables: string[];
}

