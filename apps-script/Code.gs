const SHEET_NAME = 'Registrations';

// Run this ONCE from the editor to create the sheet + headers.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, 4).setValues([['Timestamp', 'Name', 'IGN', 'Department']]);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000); // avoid collisions when several people submit at once

    const data = JSON.parse(e.postData.contents);

    // Honeypot — bots fill hidden fields; humans leave it empty. Drop silently.
    if (data.website) return json({ result: 'success' });

    const name = (data.name || '').toString().trim();
    const ign  = (data.ign  || '').toString().trim();
    const department = (data.department || '').toString().trim();

    if (!name || !ign || !department) {
      return json({ result: 'error', message: 'Name, IGN, and Department are required.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // Duplicate check — case-insensitive match against Name (column B).
    // Runs inside the lock so two near-simultaneous submissions can't both slip through.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingNames = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
      const isDuplicate = existingNames.some(
        (existing) => existing.toString().trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        return json({
          result: 'error',
          message: 'This name is already registered. Contact an organizer if you need to change your entry.',
        });
      }
    }

    sheet.appendRow([new Date(), name, ign, department]);

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
