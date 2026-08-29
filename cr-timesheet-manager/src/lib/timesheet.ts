export type TimesheetMode = "version1" | "version2";

export type CrRecordLike = {
  noCr: string;
  projectId: string;
  projectName: string;
  aipFitur: string;
  shortDescription: string;
};

export function normalizeCrNumber(value: string): string {
  return value.trim();
}

export function dedupeCrNumbers(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = normalizeCrNumber(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

export function parseCrList(raw: string): { values: string[]; missing: string[] } {
  const lines = raw
    .split(/\r?\n|\r|,/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const values = dedupeCrNumbers(lines);
  return { values, missing: values.filter((value) => !value) };
}

export function joinWithAmpersand(values: string[]): string {
  const cleanedValues = values.filter((value) => value && value.trim()).map((value) => value.trim());
  return cleanedValues.join(cleanedValues.length > 2 ? " || " : " & ");
}

function getProjectCodeValue(record: CrRecordLike, mode: TimesheetMode): string {
  if (mode === "version1") {
    return `CR ${record.noCr}`;
  }

  return record.projectId;
}

function getProjectNameValue(record: CrRecordLike, mode: TimesheetMode): string {
  if (mode === "version1") {
    return record.shortDescription;
  }

  return record.aipFitur;
}

export function buildTimesheetOutput(records: CrRecordLike[], mode: TimesheetMode, date?: string) {
  const activity = joinWithAmpersand(records.map((record) => record.projectName));
  const projectName = joinWithAmpersand(records.map((record) => getProjectNameValue(record, mode)));
  const projectCode = joinWithAmpersand(records.map((record) => getProjectCodeValue(record, mode)));
  const headers = date
    ? ["Date", "Activity / Remarks", "Project Name", "Project Code"]
    : ["Activity / Remarks", "Project Name", "Project Code"];
  const row = date
    ? { Date: date, "Activity / Remarks": activity, "Project Name": projectName, "Project Code": projectCode }
    : { "Activity / Remarks": activity, "Project Name": projectName, "Project Code": projectCode };
  const values = date ? [date, activity, projectName, projectCode] : [activity, projectName, projectCode];

  return {
    headers,
    rows: [row],
    tsv: [
      headers,
      values,
    ]
      .map((row) => row.join("\t"))
      .join("\n"),
    activity,
    projectName,
    projectCode,
  };
}

export function parseBulkPaste(raw: string): { rows: Array<Record<string, string>>; errors: string[] } {
  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split("\t"));

  const parsedRows: Array<Record<string, string>> = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const values = row.map((cell) => cell.trim());

    if (values.length !== 5) {
      errors.push(`Row ${index + 1}: expected 5 columns, found ${values.length}.`);
      return;
    }

    parsedRows.push({
      noCr: values[0],
      projectId: values[1],
      projectName: values[2],
      aipFitur: values[3],
      shortDescription: values[4],
    });
  });

  return { rows: parsedRows, errors };
}
