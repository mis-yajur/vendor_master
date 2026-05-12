/**
 * GAS Backend for Vendor Master
 * Deploy this as a Web App in Google Apps Script.
 */

const SPREADSHEET_ID = "1vF_kvyjt1hGhalmZ1V52pCvakEsFiMVZvBGyEigALAE";
const FOLDER_ID = "1a3EYnUtDSVOF-PdAxuoDcBJqtWZ9fijV";

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("Vendors");
  if (!sheet) {
    sheet = ss.insertSheet("Vendors");
    sheet.appendRow([
      "id", "name", "address", "contact", 
      "statutory", "bank", "currency", 
      "creditTerms", "documents", "createdAt", "updatedAt",
      "folderUrl", "folderId", "requestType"
    ]);
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === "add") {
    return addVendor(data.vendor);
  } else if (action === "update") {
    return updateVendor(data.vendor);
  } else if (action === "delete") {
    return deleteVendor(data.id);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === "list") {
    return ContentService.createTextOutput(JSON.stringify(listVendors()))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === "health") {
    return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function listVendors() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vendors");
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const data = values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      try {
        obj[h] = JSON.parse(row[i]);
      } catch (e) {
        obj[h] = row[i];
      }
    });
    return obj;
  });
  return data;
}

function addVendor(vendor) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vendors");
  const id = Utilities.getUuid();
  
  // Create Individual Vendor Folder
  let folderUrl = "";
  let folderId = "";
  try {
    const parentFolder = DriveApp.getFolderById(FOLDER_ID);
    const vendorFolder = parentFolder.createFolder(vendor.name + " (" + id.substring(0, 8) + ")");
    folderUrl = vendorFolder.getUrl();
    folderId = vendorFolder.getId();
    
    // Handle Document Uploads if they are base64
    const docKeys = Object.keys(vendor.documents);
    for (const key of docKeys) {
      const docData = vendor.documents[key];
      if (docData && docData.startsWith('data:')) {
        const file = saveFileToDrive(docData, key + "_" + id.substring(0, 4), vendorFolder);
        vendor.documents[key] = file.getUrl();
      }
    }
  } catch (e) {
    console.error("Folder/File operations failed: " + e.message);
  }

  sheet.appendRow([
    id,
    vendor.name,
    JSON.stringify(vendor.address),
    JSON.stringify(vendor.contact),
    JSON.stringify(vendor.statutory),
    JSON.stringify(vendor.bank),
    vendor.currency,
    vendor.creditTerms,
    JSON.stringify(vendor.documents),
    new Date(),
    new Date(),
    folderUrl,
    folderId,
    vendor.requestType
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, id, folderUrl }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveFileToDrive(base64Data, fileName, folder) {
  const parts = base64Data.split(',');
  const contentType = parts[0].split(':')[1].split(';')[0];
  const decodedData = Utilities.base64Decode(parts[1]);
  const blob = Utilities.newBlob(decodedData, contentType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file;
}

function updateVendor(vendor) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vendors");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === vendor.id) {
      sheet.getRange(i + 1, 2, 1, 10).setValues([[
        vendor.name,
        JSON.stringify(vendor.address),
        JSON.stringify(vendor.contact),
        JSON.stringify(vendor.statutory),
        JSON.stringify(vendor.bank),
        vendor.currency,
        vendor.creditTerms,
        JSON.stringify(vendor.documents),
        data[i][9],
        new Date()
      ]]);
      break;
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
