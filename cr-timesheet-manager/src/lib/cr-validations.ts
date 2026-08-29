import { z } from "zod";

export const crSchema = z.object({
  noCr: z.string().trim().min(1, "No CR is required."),
  projectId: z.string().trim().min(1, "Project ID is required."),
  projectName: z.string().trim().min(1, "Project Name is required."),
  aipFitur: z.string().trim().min(1, "AIP Fitur is required."),
  shortDescription: z.string().trim().min(1, "Short Description is required."),
});

export const updateCrSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required."),
  projectName: z.string().trim().min(1, "Project Name is required."),
  aipFitur: z.string().trim().min(1, "AIP Fitur is required."),
  shortDescription: z.string().trim().min(1, "Short Description is required."),
  status: z.enum(["ACTIVE", "CLOSE"]),
});

export const bulkCrSchema = z.array(
  z.object({
    noCr: z.string().trim().min(1, "No CR is required."),
    projectId: z.string().trim().min(1, "Project ID is required."),
    projectName: z.string().trim().min(1, "Project Name is required."),
    aipFitur: z.string().trim().min(1, "AIP Fitur is required."),
    shortDescription: z.string().trim().min(1, "Short Description is required."),
  })
);
