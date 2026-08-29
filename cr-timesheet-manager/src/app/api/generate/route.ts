import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { buildTimesheetOutput, dedupeCrNumbers } from "@/lib/timesheet";

export async function POST(request: Request) {
  const body = await request.json();
  const rawNumbers = Array.isArray(body?.crNumbers)
    ? body.crNumbers
    : String(body?.crNumbers ?? "")
        .split(/[\r\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);

  const selectedNumbers = dedupeCrNumbers(rawNumbers);

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
      periodType: String(body?.periodType ?? "day"),
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
