"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { bulkCrSchema, crSchema, updateCrSchema } from "@/lib/cr-validations";
import { prisma } from "@/lib/prisma";
import { parseBulkPaste } from "@/lib/timesheet";

export async function createCrAction(formData: FormData) {
  const payload = {
    noCr: String(formData.get("noCr") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    projectName: String(formData.get("projectName") ?? ""),
    aipFitur: String(formData.get("aipFitur") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
  };

  const parsed = crSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const existing = await prisma.cRRecord.findUnique({ where: { noCr: parsed.data.noCr.trim() } });
  if (existing) {
    throw new Error(`CR ${parsed.data.noCr} already exists.`);
  }

  await prisma.cRRecord.create({
    data: {
      ...parsed.data,
      noCr: parsed.data.noCr.trim(),
      projectId: parsed.data.projectId.trim(),
      projectName: parsed.data.projectName.trim(),
      aipFitur: parsed.data.aipFitur.trim(),
      shortDescription: parsed.data.shortDescription.trim(),
      status: "ACTIVE",
    },
  });

  revalidatePath("/view-data");
  revalidatePath("/dashboard");
  redirect("/view-data?success=created");
}

export async function bulkCreateCrAction(formData: FormData) {
  const raw = String(formData.get("bulkPaste") ?? "");
  const parseResult = parseBulkPaste(raw);

  if (parseResult.errors.length > 0) {
    throw new Error(parseResult.errors.join(" | "));
  }

  const validation = bulkCrSchema.safeParse(parseResult.rows);
  if (!validation.success) {
    throw new Error(validation.error.issues.map((issue) => issue.message).join("; "));
  }

  const preparedRows = validation.data.map((row) => ({
    ...row,
    noCr: row.noCr.trim(),
    projectId: row.projectId.trim(),
    projectName: row.projectName.trim(),
    aipFitur: row.aipFitur.trim(),
    shortDescription: row.shortDescription.trim(),
  }));

  const existingCrNumbers = await prisma.cRRecord.findMany({
    where: {
      noCr: { in: preparedRows.map((row) => row.noCr) },
    },
    select: { noCr: true },
  });

  const existingSet = new Set<string>(
    existingCrNumbers.map((row) => String(row.noCr ?? ""))
  );
  const uniqueRows = preparedRows.filter((row) => !existingSet.has(row.noCr));

  if (uniqueRows.length === 0) {
    throw new Error("No valid new CR rows were found to import.");
  }

  await prisma.cRRecord.createMany({
    data: uniqueRows.map((row) => ({
      ...row,
      status: "ACTIVE",
    })),
  });

  revalidatePath("/view-data");
  revalidatePath("/dashboard");
  redirect("/view-data?success=bulk-created");
}

export async function updateCrAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payload = {
    projectId: String(formData.get("projectId") ?? ""),
    projectName: String(formData.get("projectName") ?? ""),
    aipFitur: String(formData.get("aipFitur") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE"),
  };

  const parsed = updateCrSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  await prisma.cRRecord.update({
    where: { id },
    data: {
      projectId: parsed.data.projectId.trim(),
      projectName: parsed.data.projectName.trim(),
      aipFitur: parsed.data.aipFitur.trim(),
      shortDescription: parsed.data.shortDescription.trim(),
      status: parsed.data.status,
    },
  });

  revalidatePath("/view-data");
  revalidatePath("/dashboard");
  redirect("/view-data?success=updated");
}

export async function deleteCrAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("A CR record id is required for deletion.");
  }

  await prisma.cRRecord.delete({ where: { id } });
  revalidatePath("/view-data");
  revalidatePath("/dashboard");
  redirect("/view-data?success=deleted");
}
