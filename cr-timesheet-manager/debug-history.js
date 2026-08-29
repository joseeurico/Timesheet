const Database = require('better-sqlite3');
const db = new Database('data/cr-timesheet.db');
const rows = db.prepare("SELECT id, periodType, periodStart, periodEnd, selectedCrNumbers, outputVersion1, outputVersion2, generatedAt FROM generation_history ORDER BY generatedAt DESC").all();
console.log(JSON.stringify(rows, null, 2));
db.close();
