const { join } = require("node:path");
const Database = require("better-sqlite3");

const db = new Database(join(process.cwd(), "data", "cr-timesheet.db"));

const rows = [
  ["cr-10001", "10001", "P777", "Ticket tuc", "Change Request 2026", "Enhancement Feature Credit", "ACTIVE", "2026-08-01T09:10:00.000Z", "2026-08-10T15:20:00.000Z"],
  ["cr-20031", "20031", "P902", "Mundee", "Mundee Registrasi", "Master Management Internal Tools", "ACTIVE", "2026-08-02T10:15:00.000Z", "2026-08-29T14:10:00.000Z"],
  ["cr-30012", "30012", "P815", "Payment Hub", "Payment Validation", "Update payment validation", "ACTIVE", "2026-08-04T11:00:00.000Z", "2026-08-28T16:25:00.000Z"],
  ["cr-30018", "30018", "P815", "Payment Hub", "Payment Validation", "Fix payment approval flow", "CLOSE", "2026-08-05T13:20:00.000Z", "2026-08-20T17:05:00.000Z"],
  ["cr-40120", "40120", "P901", "Report Dashboard", "Reporting Enhancement", "Improve monthly report performance", "ACTIVE", "2026-08-07T09:30:00.000Z", "2026-08-27T10:10:00.000Z"],
  ["cr-40121", "40121", "P901", "Report Dashboard", "Reporting Enhancement", "Add export summary feature", "ACTIVE", "2026-08-08T10:00:00.000Z", "2026-08-29T11:25:00.000Z"],
  ["cr-50110", "50110", "P450", "User Management", "Access Control", "Add user access control", "CLOSE", "2026-08-09T14:00:00.000Z", "2026-08-21T16:30:00.000Z"],
  ["cr-50115", "50115", "P450", "User Management", "Access Control", "Update role management", "ACTIVE", "2026-08-10T08:50:00.000Z", "2026-08-29T13:00:00.000Z"],
  ["cr-60101", "60101", "P330", "Notification Center", "Notification Enhancement", "Add email notification", "ACTIVE", "2026-08-12T09:40:00.000Z", "2026-08-28T09:10:00.000Z"],
  ["cr-60102", "60102", "P330", "Notification Center", "Notification Enhancement", "Add in-app notification", "CLOSE", "2026-08-12T10:05:00.000Z", "2026-08-18T14:45:00.000Z"],
  ["cr-70110", "70110", "P610", "Data Migration", "Migration Tool", "Improve migration validation", "ACTIVE", "2026-08-14T11:30:00.000Z", "2026-08-27T16:00:00.000Z"],
  ["cr-70112", "70112", "P610", "Data Migration", "Migration Tool", "Add migration reconciliation", "ACTIVE", "2026-08-15T15:10:00.000Z", "2026-08-28T16:45:00.000Z"],
  ["cr-80101", "80101", "P720", "Customer Portal", "Portal Enhancement", "Improve customer profile page", "ACTIVE", "2026-08-18T09:00:00.000Z", "2026-08-29T09:05:00.000Z"],
  ["cr-80102", "80102", "P720", "Customer Portal", "Portal Enhancement", "Add customer document upload", "ACTIVE", "2026-08-20T10:30:00.000Z", "2026-08-29T09:30:00.000Z"],
  ["cr-90110", "90110", "P810", "Internal Tools", "Administration", "Add master data maintenance", "CLOSE", "2026-08-21T13:15:00.000Z", "2026-08-25T17:20:00.000Z"],
];

const history = [
  ["gen-0001", "WEEK", "2026-08-24", "2026-08-28", "40120,40121,50115,60101,70110", JSON.stringify({ activity: ["Report Dashboard", "Report Dashboard", "User Management", "Notification Center", "Data Migration"], projectName: ["Reporting Enhancement", "Reporting Enhancement", "Access Control", "Notification Enhancement", "Migration Tool"], projectCode: ["CR 40120", "CR 40121", "CR 50115", "CR 60101", "CR 70110"] }), JSON.stringify({ activity: ["Report Dashboard", "Report Dashboard", "User Management", "Notification Center", "Data Migration"], projectName: ["Reporting Enhancement", "Reporting Enhancement", "Access Control", "Notification Enhancement", "Migration Tool"], projectCode: ["P901", "P901", "P450", "P330", "P610"] }), "2026-08-25T16:50:00.000Z"],
  ["gen-0002", "DAY", "2026-08-28", "2026-08-28", "30012,40120,60101,70112", JSON.stringify({ activity: ["Payment Hub", "Report Dashboard", "Notification Center", "Data Migration"], projectName: ["Payment Validation", "Reporting Enhancement", "Notification Enhancement", "Migration Tool"], projectCode: ["CR 30012", "CR 40120", "CR 60101", "CR 70112"] }), JSON.stringify({ activity: ["Payment Hub", "Report Dashboard", "Notification Center", "Data Migration"], projectName: ["Payment Validation", "Reporting Enhancement", "Notification Enhancement", "Migration Tool"], projectCode: ["P815", "P901", "P330", "P610"] }), "2026-08-28T16:20:00.000Z"],
  ["gen-0003", "DAY", "2026-08-29", "2026-08-29", "10001,20031,80101", JSON.stringify({ activity: ["Ticket tuc", "Mundee", "Customer Portal"], projectName: ["Enhancement Feature Credit", "Master Management Internal Tools", "Improve customer profile page"], projectCode: ["CR 10001", "CR 20031", "CR 80101"] }), JSON.stringify({ activity: ["Ticket tuc", "Mundee", "Customer Portal"], projectName: ["Change Request 2026", "Mundee Registrasi", "Portal Enhancement"], projectCode: ["P777", "P902", "P720"] }), "2026-08-29T15:40:00.000Z"],
];

db.prepare("DELETE FROM cr_records").run();
db.prepare("DELETE FROM generation_history").run();

const insertCr = db.prepare(
  "INSERT INTO cr_records (id, noCr, projectId, projectName, aipFitur, shortDescription, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
for (const row of rows) {
  insertCr.run(...row);
}

const insertHistory = db.prepare(
  "INSERT INTO generation_history (id, periodType, periodStart, periodEnd, selectedCrNumbers, outputVersion1, outputVersion2, generatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);
for (const row of history) {
  insertHistory.run(...row);
}

const totals = {
  total: db.prepare("SELECT COUNT(*) AS count FROM cr_records").get().count,
  active: db.prepare("SELECT COUNT(*) AS count FROM cr_records WHERE status = 'ACTIVE'").get().count,
  close: db.prepare("SELECT COUNT(*) AS count FROM cr_records WHERE status = 'CLOSE'").get().count,
  history: db.prepare("SELECT COUNT(*) AS count FROM generation_history").get().count,
};

console.log(JSON.stringify(totals, null, 2));

db.close();
