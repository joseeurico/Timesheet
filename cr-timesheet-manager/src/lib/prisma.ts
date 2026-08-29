import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import Database from "better-sqlite3";

const dbPath = join(process.cwd(), "data", "cr-timesheet.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cr_records (
    id TEXT PRIMARY KEY,
    noCr TEXT UNIQUE,
    projectId TEXT,
    projectName TEXT,
    aipFitur TEXT,
    shortDescription TEXT,
    status TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS generation_history (
    id TEXT PRIMARY KEY,
    periodType TEXT,
    periodStart TEXT,
    periodEnd TEXT,
    selectedCrNumbers TEXT,
    outputVersion1 TEXT,
    outputVersion2 TEXT,
    generatedAt TEXT
  );
`);

const normalizeDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
};

function toRow<T extends Record<string, unknown>>(record: T) {
  return {
    ...record,
    createdAt: record.createdAt ? new Date(String(record.createdAt)) : undefined,
    updatedAt: record.updatedAt ? new Date(String(record.updatedAt)) : undefined,
  } as T & { createdAt?: Date; updatedAt?: Date };
}

function buildWhere(where?: Record<string, unknown>): { sql: string; params: unknown[] } {
  if (!where || Object.keys(where).length === 0) {
    return { sql: "1 = 1", params: [] };
  }

  const clauses: string[] = [];
  const params: unknown[] = [];

  const handleValue = (field: string, value: unknown) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const entries = Object.entries(value as Record<string, unknown>);

      entries.forEach(([operator, operand]) => {
        if (operator === "contains") {
          clauses.push(`${field} LIKE ?`);
          params.push(`%${String(operand)}%`);
        }

        if (operator === "gte") {
          clauses.push(`${field} >= ?`);
          params.push(normalizeDate(operand as string | Date));
        }

        if (operator === "lte") {
          clauses.push(`${field} <= ?`);
          params.push(normalizeDate(operand as string | Date));
        }

        if (operator === "in") {
          const list = Array.isArray(operand) ? operand : [operand];
          const placeholders = list.map(() => "?").join(", ");
          clauses.push(`${field} IN (${placeholders})`);
          params.push(...list);
        }
      });

      return;
    }

    clauses.push(`${field} = ?`);
    params.push(value);
  };

  Object.entries(where).forEach(([key, value]) => {
    if (key === "OR") {
      const orGroups = (value as Array<Record<string, unknown>>).map((group) => {
        const part = buildWhere(group);
        return `(${part.sql})`;
      });

      clauses.push(`(${orGroups.join(" OR ")})`);
      const nestedValues = (value as Array<Record<string, unknown>>).flatMap((group) => buildWhere(group).params);
      params.push(...nestedValues);
      return;
    }

    handleValue(key, value);
  });

  return { sql: clauses.join(" AND "), params };
}

function buildOrderBy(orderBy?: Record<string, "asc" | "desc">) {
  if (!orderBy || Object.keys(orderBy).length === 0) {
    return "";
  }

  const orderSql = Object.entries(orderBy)
    .map(([field, direction]) => `${field} ${direction.toUpperCase()}`)
    .join(", ");

  return `ORDER BY ${orderSql}`;
}

function selectColumns(select?: Record<string, boolean>) {
  if (!select || Object.keys(select).length === 0) {
    return "*";
  }

  return Object.entries(select)
    .filter(([, enabled]) => enabled)
    .map(([field]) => field)
    .join(", ");
}

type CrRecordRow = {
  id?: string;
  noCr?: string;
  projectId?: string;
  projectName?: string;
  aipFitur?: string;
  shortDescription?: string;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type GenerationHistoryRow = {
  id?: string;
  periodType?: string;
  periodStart?: string;
  periodEnd?: string;
  selectedCrNumbers?: string;
  outputVersion1?: string;
  outputVersion2?: string;
  generatedAt?: string | Date;
};

const cRRecord = {
  async count(args?: { where?: Record<string, unknown> }): Promise<number> {
    const { sql, params } = buildWhere(args?.where);
    const result = db.prepare(`SELECT COUNT(*) as count FROM cr_records WHERE ${sql}`).get(...params) as {
      count: number;
    };
    return Number(result.count ?? 0);
  },

  async findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    take?: number;
    select?: Record<string, boolean>;
  }): Promise<CrRecordRow[]> {
    const { sql, params } = buildWhere(args?.where);
    const columns = selectColumns(args?.select);
    const orderBy = buildOrderBy(args?.orderBy);
    const limit = args?.take ? `LIMIT ${args.take}` : "";

    const rows = db
      .prepare(
        `SELECT ${columns} FROM cr_records WHERE ${sql} ${orderBy} ${limit}`
      )
      .all(...params) as Record<string, unknown>[];

    return rows.map((row) => toRow(row) as CrRecordRow);
  },

  async findUnique(args: { where: Record<string, unknown> }): Promise<CrRecordRow | null> {
    const { sql, params } = buildWhere(args.where);
    const row = db.prepare(`SELECT * FROM cr_records WHERE ${sql} LIMIT 1`).get(...params) as Record<string, unknown> | undefined;
    return row ? (toRow(row) as CrRecordRow) : null;
  },

  async create(args: { data: Record<string, unknown> }): Promise<CrRecordRow> {
    const now = new Date().toISOString();
    const record: CrRecordRow = {
      ...(args.data as CrRecordRow),
      id: typeof args.data.id === "string" ? args.data.id : randomUUID(),
      status: String(args.data.status ?? "ACTIVE"),
      createdAt: normalizeDate(args.data.createdAt as string | Date | undefined),
      updatedAt: normalizeDate(args.data.updatedAt as string | Date | undefined) || now,
    };

    db.prepare(
      `INSERT INTO cr_records (id, noCr, projectId, projectName, aipFitur, shortDescription, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      record.id,
      String(record.noCr),
      String(record.projectId),
      String(record.projectName),
      String(record.aipFitur),
      String(record.shortDescription),
      String(record.status),
      normalizeDate(record.createdAt as string | Date | undefined),
      normalizeDate(record.updatedAt as string | Date | undefined)
    );

    return toRow(record as Record<string, unknown>) as CrRecordRow;
  },

  async update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<CrRecordRow> {
    const current = await this.findUnique({ where: args.where });
    if (!current) {
      throw new Error("Record not found.");
    }

    const payload: CrRecordRow = {
      ...(current as CrRecordRow),
      ...(args.data as CrRecordRow),
      updatedAt: new Date().toISOString(),
    };

    db.prepare(
      `UPDATE cr_records SET projectId = ?, projectName = ?, aipFitur = ?, shortDescription = ?, status = ?, updatedAt = ? WHERE id = ?`
    ).run(
      String(payload.projectId),
      String(payload.projectName),
      String(payload.aipFitur),
      String(payload.shortDescription),
      String(payload.status),
      payload.updatedAt,
      String(current.id)
    );

    return toRow(payload as Record<string, unknown>) as CrRecordRow;
  },

  async delete(args: { where: Record<string, unknown> }): Promise<CrRecordRow> {
    const current = await this.findUnique({ where: args.where });
    if (!current) {
      throw new Error("Record not found.");
    }

    db.prepare("DELETE FROM cr_records WHERE id = ?").run(String(current.id));
    return current;
  },

  async createMany(args: { data: Record<string, unknown>[] }): Promise<{ count: number }> {
    const transaction = db.transaction((rows: Record<string, unknown>[]) => {
      rows.forEach((row) => {
        const record: CrRecordRow = {
          id: randomUUID(),
          ...(row as CrRecordRow),
          status: String(row.status ?? "ACTIVE"),
          createdAt: normalizeDate(row.createdAt as string | Date | undefined),
          updatedAt: normalizeDate(row.updatedAt as string | Date | undefined),
        };

        db.prepare(
          `INSERT INTO cr_records (id, noCr, projectId, projectName, aipFitur, shortDescription, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          String(record.id),
          String(record.noCr),
          String(record.projectId),
          String(record.projectName),
          String(record.aipFitur),
          String(record.shortDescription),
          String(record.status),
          String(record.createdAt),
          String(record.updatedAt)
        );
      });
    });

    transaction(args.data);
    return { count: args.data.length };
  },
};

const generationHistory = {
  async findMany(args?: {
    orderBy?: Record<string, "asc" | "desc">;
  }): Promise<GenerationHistoryRow[]> {
    const orderBy = buildOrderBy(args?.orderBy);
    const rows = db.prepare(`SELECT * FROM generation_history ${orderBy}`).all() as Record<string, unknown>[];
    return rows.map((row) => toRow(row) as GenerationHistoryRow);
  },

  async findUnique(args: { where: Record<string, unknown> }): Promise<GenerationHistoryRow | null> {
    const { sql, params } = buildWhere(args.where);
    const row = db.prepare(`SELECT * FROM generation_history WHERE ${sql} LIMIT 1`).get(...params) as Record<string, unknown> | undefined;
    return row ? (toRow(row) as GenerationHistoryRow) : null;
  },

  async create(args: { data: Record<string, unknown> }): Promise<GenerationHistoryRow> {
    const entry: GenerationHistoryRow = {
      id: randomUUID(),
      ...(args.data as GenerationHistoryRow),
      generatedAt: normalizeDate(args.data.generatedAt as string | Date | undefined),
    };

    db.prepare(
      `INSERT INTO generation_history (id, periodType, periodStart, periodEnd, selectedCrNumbers, outputVersion1, outputVersion2, generatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(entry.id),
      String(entry.periodType),
      String(entry.periodStart),
      String(entry.periodEnd),
      String(entry.selectedCrNumbers),
      String(entry.outputVersion1),
      String(entry.outputVersion2),
      String(entry.generatedAt)
    );

    return toRow(entry as Record<string, unknown>) as GenerationHistoryRow;
  },
};

export const prisma = {
  cRRecord,
  generationHistory,
};
