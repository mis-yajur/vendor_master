/**
 * GOOGLE APPS SCRIPT CODE
 * 
 * Instructions:
 * 1. Open your Google Sheet (ID: 1vF_kvyjt1hGhalmZ1V52pCvakEsFiMVZvBGyEigALAE)
 * 2. Go to Extensions > Apps Script
 * 3. Replace all code in Code.gs with the content below
 * 4. Replace FOLDER_ID with "1a3EYnUtDSVOF-PdAxuoDcBJqtWZ9fijV"
 * 5. Click "Deploy" > "New Deployment"
 * 6. Select Type: "Web App"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone" (This allows the portal to communicate with the sheet)
 * 9. Copy the Web App URL and ensure it matches what was provided.
 */

const SHEET_ID = '1vF_kvyjt1hGhalmZ1V52pCvakEsFiMVZvBGyEigALAE';
const FOLDER_ID = '1a3EYnUtDSVOF-PdAxuoDcBJqtWZ9fijV';

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Vendors') || ss.insertSheet('Vendors');
  
  if (action === 'health' || action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'live', db: 'google_sheets', timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'list') {
    try {
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
      
      const headers = data[0];
      const vendors = data.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          try {
            const val = row[i];
            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
              obj[h] = JSON.parse(val);
            } else {
              obj[h] = val;
            }
          } catch (e) {
            obj[h] = row[i];
          }
        });
        return obj;
      });
      
      return ContentService.createTextOutput(JSON.stringify(vendors)).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Vendors') || ss.insertSheet('Vendors');
    
    if (action === 'add') {
      const vendor = params.vendor;
      const headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
      
      const vendorKeys = Object.keys(vendor);
      if (headers.length === 0) {
        sheet.getRange(1, 1, 1, vendorKeys.length).setValues([vendorKeys]);
        headers.push(...vendorKeys);
      }
      
      const row = headers.map(h => {
        const val = vendor[h];
        return (val && typeof val === 'object') ? JSON.stringify(val) : (val === undefined ? '' : val);
      });
      
      sheet.appendRow(row);
      return ContentService.createTextOutput(JSON.stringify({ success: true, id: vendor.id || Utilities.getUuid() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'upload') {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const data = Utilities.base64Decode(params.file);
      const blob = Utilities.newBlob(data, params.contentType || 'application/octet-stream', params.filename);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        url: file.getUrl(),
        id: file.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
