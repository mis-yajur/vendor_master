/**
 * UPDATED CODE FOR GOOGLE APPS SCRIPT
 * Fixes: "Unknown action" error by adding "upload" support.
 */

const SPREADSHEET_ID = "1vF_kvyjt1hGhalmZ1V52pCvakEsFiMVZvBGyEigALAE";
const FOLDER_ID = "1a3EYnUtDSVOF-PdAxuoDcBJqtWZ9fijV";

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("Vendors");
  if (!sheet) {
    sheet = ss.insertSheet("Vendors");
  } else {
    sheet.clear();
  }
  
  const headers = [
    "id", "requestType", "name", 
    "addr_floor", "addr_street", "addr_city", "addr_district", "addr_pin", "addr_state", "addr_country", "addr_phone", "addr_fax", "addr_mobile", "addr_email",
    "cont_name", "cont_desig", "cont_phone", "cont_fax", "cont_email",
    "type", "establishmentYear", "constitution",
    "cin", "tradeLicense", "pan", "gstin", "lutNo", "compoundingDealer", "msmedNo", "iecNo", "pfNo", "esicNo", "labourLicense", "factoryLicense",
    "tdsExemption", "pcbConsent",
    "bank_beneficiary", "bank_name", "bank_account", "bank_branch", "bank_branchAddr", "bank_type", "bank_ifsc", "bank_swift", "bank_email",
    "currency", "creditTerms",
    "doc_gst", "doc_pan", "doc_msmed", "doc_cheque", "doc_tds", "doc_declaration",
    "createdAt", "updatedAt", "folderUrl", "folderId"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);

  // Add dummy data for first-time visibility
  const dummyRows = [
    [
      "VND-001", "New", "Alpha Systems Inc",
      "Penthouse", "Tech Road", "San Jose", "Silicon Valley", "95110", "CA", "USA", "1234567890", "", "0987654321", "contact@alpha.com",
      "John Doe", "Director", "1234567890", "", "john@alpha.com",
      "Service", "2010", "Private Limited",
      "CIN123456", "TL-999", "PAN-ALPHA", "27AAAAA0000A1Z5", "", "No", "MSME-111", "", "", "", "", "",
      "", "",
      "Alpha Systems", "Bank of America", "123456789", "Main Branch", "123 Wall St", "Current", "BOFAUS3N", "", "bank@alpha.com",
      "USD", "Net 30",
      "", "", "", "", "", "",
      new Date(), new Date(), "", ""
    ],
    [
      "VND-002", "Update", "Global Logistics Ltd",
      "Building 4", "Harbor Way", "Mumbai", "Mumbai Suburban", "400001", "Maharashtra", "India", "2223334444", "", "9876543210", "info@global.in",
      "Anita Sharma", "Operations Manager", "2223334444", "", "anita@global.in",
      "Logistics", "2005", "Partnership",
      "", "TL-888", "PAN-GLOBAL", "27BBBBB0000B1Z5", "", "Yes", "", "", "", "", "", "",
      "", "",
      "Global Logistics", "HDFC Bank", "987654321", "BKC Branch", "BKC G Block", "Current", "HDFC000123", "", "acc@global.in",
      "INR", "Net 45",
      "", "", "", "", "", "",
      new Date(), new Date(), "", ""
    ]
  ];
  sheet.getRange(2, 1, dummyRows.length, headers.length).setValues(dummyRows);
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === "list") {
    return ContentService.createTextOutput(JSON.stringify(listVendors()))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === "health") {
    return ContentService.createTextOutput(JSON.stringify({ status: "ok", db: "google_sheets" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Invalid JSON" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = data.action;
  
  // FIX: Added 'upload' handler to resolve the "Unknown action" error
  if (action === "upload") {
    try {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const decodedFile = Utilities.base64Decode(data.file);
      const blob = Utilities.newBlob(decodedFile, data.contentType || 'application/octet-stream', data.filename);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        url: file.getUrl(),
        id: file.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } else if (action === "setup") {
    try {
      setup();
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sheet initialized with dummy data" }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  if (action === "add") {
    return addVendor(data.vendor);
  } else if (action === "update") {
    return updateVendor(data.vendor);
  } else if (action === "delete") {
    return deleteVendor(data.id);
  } else if (action === "list") {
    return ContentService.createTextOutput(JSON.stringify(listVendors()))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === "health") {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", db: "connected" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action: " + action }))
    .setMimeType(ContentService.MimeType.JSON);
}

function listVendors() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vendors");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    const v = {};
    headers.forEach((h, i) => v[h] = row[i]);
    return {
      id: v.id, requestType: v.requestType, name: v.name,
      address: { floorBuilding: v.addr_floor, street: v.addr_street, city: v.addr_city, district: v.addr_district, pinCode: v.addr_pin, state: v.addr_state, country: v.addr_country, phone: v.addr_phone, fax: v.addr_fax, mobile: v.addr_mobile, email: v.addr_email },
      contact: { name: v.cont_name, designation: v.cont_desig, phone: v.cont_phone, fax: v.cont_fax, email: v.cont_email },
      statutory: { vendorType: v.type, yearOfEstablishment: v.establishmentYear, constitution: v.constitution, cin: v.cin, tradeLicense: v.tradeLicense, pan: v.pan, gstin: v.gstin, msmedRegNo: v.msmedNo, pfRegNo: v.pfNo, esicRegNo: v.esicNo, tdsExemptionDetails: v.tdsExemption },
      bank: { beneficiaryName: v.bank_beneficiary, bankName: v.bank_name, accountNumber: v.bank_account, branchName: v.bank_branch, ifscCode: v.bank_ifsc },
      currency: v.currency, creditTerms: v.creditTerms,
      documents: { gstinCopy: v.doc_gst, panCopy: v.doc_pan, msmedCopy: v.doc_msmed, cancelledChequeCopy: v.doc_cheque, tdsExemptionCopy: v.doc_tds, signedDeclaration: v.doc_declaration },
      createdAt: v.createdAt, updatedAt: v.updatedAt, folderUrl: v.folderUrl
    };
  });
}

function addVendor(vendor) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vendors");
  const id = Utilities.getUuid();
  const rowData = [
    id, vendor.requestType, vendor.name,
    vendor.address.floorBuilding, vendor.address.street, vendor.address.city, vendor.address.district, vendor.address.pinCode, vendor.address.state, vendor.address.country, vendor.address.phone, vendor.address.fax, vendor.address.mobile, vendor.address.email,
    vendor.contact.name, vendor.contact.designation, vendor.contact.phone, vendor.contact.fax, vendor.contact.email,
    vendor.statutory.vendorType, vendor.statutory.yearOfEstablishment, vendor.statutory.constitution,
    vendor.statutory.cin, vendor.statutory.tradeLicense, vendor.statutory.pan, vendor.statutory.gstin, vendor.statutory.lutNo, vendor.statutory.compoundingDealer, vendor.statutory.msmedRegNo, vendor.statutory.iecNo, vendor.statutory.pfRegNo, vendor.statutory.esicRegNo, vendor.statutory.labourLicenseNo, vendor.statutory.factoryLicense,
    vendor.statutory.tdsExemptionDetails, vendor.statutory.consentToOperate,
    vendor.bank.beneficiaryName, vendor.bank.bankName, vendor.bank.accountNumber, vendor.bank.branchName, vendor.bank.branchAddress, vendor.bank.accountType, vendor.bank.ifscCode, vendor.bank.swiftIban, vendor.bank.bankEmail,
    vendor.currency, vendor.creditTerms,
    vendor.documents.gstinCopy, vendor.documents.panCopy, vendor.documents.msmedCopy, vendor.documents.cancelledChequeCopy, vendor.documents.tdsExemptionCopy, vendor.documents.signedDeclaration,
    new Date(), new Date(), "", ""
  ];
  sheet.appendRow(rowData);
  return ContentService.createTextOutput(JSON.stringify({ success: true, id }))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateVendor(vendor) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vendors");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == vendor.id) {
      const rowNum = i + 1;
      sheet.getRange(rowNum, 3).setValue(vendor.name);
      sheet.getRange(rowNum, 51).setValue(new Date()); // updated at
      // Update other fields if needed
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Not found" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteVendor(id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vendors");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Not found" }))
    .setMimeType(ContentService.MimeType.JSON);
}
