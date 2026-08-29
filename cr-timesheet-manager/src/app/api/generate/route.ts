import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { buildTimesheetOutput, dedupeCrNumbers } from "@/lib/timesheet";

function getDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export async function POST(request: Request) {
  const body = await request.json();
  const rawNumbers = Array.isArray(body?.crNumbers)
    ? body.crNumbers
    : String(body?.crNumbers ?? "")
        .split(/[\r\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);

  const selectedNumbers = dedupeCrNumbers(rawNumbers);

  const periodType = String(body?.periodType ?? "day").toLowerCase();
  const dailyEntries = Array.isArray(body?.dailyEntries) ? body.dailyEntries : [];

  if (periodType !== "day") {
    const start = String(body?.periodStart ?? "");
    const end = String(body?.periodEnd ?? "");
    const expectedDates = getDates(start, end);
    if (expectedDates.length === 0) {
      return NextResponse.json({ error: "A valid start and end date are required." }, { status: 400 });
    }
    const entriesByDate = new Map<string, string[]>();

    dailyEntries.forEach((entry: { date?: unknown; crNumbers?: unknown }) => {
      const date = String(entry?.date ?? "").trim();
      const numbers = Array.isArray(entry?.crNumbers) ? entry.crNumbers.map(String) : [];
      if (date && !entriesByDate.has(date)) {
        entriesByDate.set(date, dedupeCrNumbers(numbers));
      }
    });

    const missingDates = expectedDates.filter((date) => {
      const numbers = entriesByDate.get(date);
      return !numbers || numbers.length === 0;
    });
    if (missingDates.length > 0) {
      return NextResponse.json(
        { error: `Add one CR entry for every day. Missing: ${missingDates.join(", ")}.` },
        { status: 400 }
      );
    }

    const allNumbers = dedupeCrNumbers(expectedDates.flatMap((date) => entriesByDate.get(date) ?? []));
    if (allNumbers.length === 0) {
      return NextResponse.json({ error: "At least one CR number is required." }, { status: 400 });
    }

    const records = await prisma.cRRecord.findMany({ where: { noCr: { in: allNumbers } } });
    const recordMap = new Map(records.filter((record) => record.noCr).map((record) => [record.noCr as string, record]));
    const missing = allNumbers.filter((number) => !recordMap.has(number));
    const outputVersion1 = expectedDates.map((date) => buildTimesheetOutput(
      (entriesByDate.get(date) ?? []).map((number) => recordMap.get(number)).filter(Boolean) as never[],
      "version1",
      date
    ));
    const outputVersion2 = expectedDates.map((date) => buildTimesheetOutput(
      (entriesByDate.get(date) ?? []).map((number) => recordMap.get(number)).filter(Boolean) as never[],
      "version2",
      date
    ));
    const combine = (outputs: typeof outputVersion1) => ({
      headers: outputs[0]?.headers ?? [],
      rows: outputs.flatMap((output) => output.rows),
      tsv: [
        (outputs[0]?.headers ?? []).join("\t"),
        ...outputs.flatMap((output) => output.rows.map((row) =>
          (outputs[0]?.headers ?? []).map((header) => String((row as Record<string, unknown>)[header] ?? "")).join("\t")
        )),
      ].join("\n"),
    });
    const combinedVersion1 = combine(outputVersion1);
    const combinedVersion2 = combine(outputVersion2);

    const history = await prisma.generationHistory.create({
      data: {
        periodType,
        periodStart: String(body?.periodStart ?? ""),
        periodEnd: String(body?.periodEnd ?? ""),
        selectedCrNumbers: JSON.stringify(allNumbers),
        outputVersion1: JSON.stringify(combinedVersion1),
        outputVersion2: JSON.stringify(combinedVersion2),
      },
    });

    return NextResponse.json({ success: true, selectedNumbers: allNumbers, missing, outputVersion1: combinedVersion1, outputVersion2: combinedVersion2, historyId: history.id });
  }

  if (selectedNumbers.length === 0) {
    return NextResponse.json(
      { error: "At least one CR number is required." },
      { status: 400 }
    );
  }

  const records = await prisma.cRRecord.findMany({
    where: {
      noCr: {
        in: selectedNumbers,
      },
    },
  });

  const recordMap = new Map<string, (typeof records)[number]>();
  records.forEach((record) => {
    if (record.noCr) {
      recordMap.set(record.noCr, record);
    }
  });
  const foundRecords = selectedNumbers
    .map((number) => recordMap.get(number))
    .filter(Boolean) as Array<{
      noCr: string;
      projectId: string;
      projectName: string;
      aipFitur: string;
      shortDescription: string;
    }>;

  const missing = selectedNumbers.filter((number) => !recordMap.has(number));
  const outputVersion1 = buildTimesheetOutput(foundRecords, "version1");
  const outputVersion2 = buildTimesheetOutput(foundRecords, "version2");

  const history = await prisma.generationHistory.create({
    data: {
      periodType,
      periodStart: String(body?.periodStart ?? ""),
      periodEnd: String(body?.periodEnd ?? ""),
      selectedCrNumbers: JSON.stringify(selectedNumbers),
      outputVersion1: JSON.stringify(outputVersion1),
      outputVersion2: JSON.stringify(outputVersion2),
    },
  });

  return NextResponse.json({
    success: true,
    selectedNumbers,
    missing,
    outputVersion1,
    outputVersion2,
    historyId: history.id,
  });
}
