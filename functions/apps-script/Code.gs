const SHEET_ID   = '1sdVUFDIo_pBD5qxcYcibRwsyVEO0n9TylmsLmNou2XA';
const SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const attending = data.attendance === 'yes';

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Submitted at', 'Name', 'Phone', 'Attending', 'Guests', 'Message']);
    }

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.name || '',
      data.phone || '',
      attending ? 'Yes' : 'No',
      attending ? Number(data.guests || 0) : 0,
      data.message || ''
    ]);

    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err.message);
  }
}
