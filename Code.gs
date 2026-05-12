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
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const v = {};
    headers.forEach((h, i) => v[h] = row[i]);
    
    // Check if it's the old JSON format or new flat format
    if (v.address && typeof v.address === 'string' && v.address.startsWith('{')) {
      // Handle legacy records if they exist
      const legacy = {};
      headers.forEach((h, i) => {
        try { legacy[h] = JSON.parse(row[i]); } catch(e) { legacy[h] = row[i]; }
      });
      return legacy;
    }

    // Reconstruct nested structure for frontend from flat columns
    return {
      id: v.id,
      requestType: v.requestType,
      name: v.name,
      address: {
        floorBuilding: v.addr_floor, street: v.addr_street, city: v.addr_city, district: v.addr_district, pinCode: v.addr_pin, state: v.addr_state, country: v.addr_country, phone: v.addr_phone, fax: v.addr_fax, mobile: v.addr_mobile, email: v.addr_email
      },
      contact: { name: v.cont_name, designation: v.cont_desig, phone: v.cont_phone, fax: v.cont_fax, email: v.cont_email },
      statutory: {
        vendorType: v.type, yearOfEstablishment: v.establishmentYear, constitution: v.constitution,
        cin: v.cin, tradeLicense: v.tradeLicense, pan: v.pan, gstin: v.gstin, lutNo: v.lutNo, compoundingDealer: v.compoundingDealer, msmedRegNo: v.msmedNo, iecNo: v.iecNo, pfRegNo: v.pfNo, esicRegNo: v.esicNo, labourLicenseNo: v.labourLicense, factoryLicense: v.factoryLicense,
        tdsExemptionDetails: v.tdsExemption, consentToOperate: v.pcbConsent
      },
      bank: {
        beneficiaryName: v.bank_beneficiary, bankName: v.bank_name, accountNumber: v.bank_account, branchName: v.bank_branch, branchAddress: v.bank_branchAddr, accountType: v.bank_type, ifscCode: v.bank_ifsc, swiftIban: v.bank_swift, bankEmail: v.bank_email
      },
      currency: v.currency,
      creditTerms: v.creditTerms,
      documents: {
        gstinCopy: v.doc_gst, panCopy: v.doc_pan, msmedCopy: v.doc_msmed, cancelledChequeCopy: v.doc_cheque, tdsExemptionCopy: v.doc_tds, signedDeclaration: v.doc_declaration
      },
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      folderUrl: v.folderUrl,
      folderId: v.folderId
    };
  });
}

function addVendor(vendor) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vendors");
  const id = Utilities.getUuid();
  
  let folderUrl = "";
  let folderId = "";
  try {
    const parentFolder = DriveApp.getFolderById(FOLDER_ID);
    const vendorFolder = parentFolder.createFolder(vendor.name + " (" + id.substring(0, 8) + ")");
    vendorFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    folderUrl = vendorFolder.getUrl();
    folderId = vendorFolder.getId();
    
    // Handle Document Uploads
    const docKeys = Object.keys(vendor.documents || {});
    for (const key of docKeys) {
      const docData = vendor.documents[key];
      if (docData && docData.startsWith('data:')) {
        const file = saveFileToDrive(docData, key + "_" + id.substring(0, 4), vendorFolder);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        vendor.documents[key] = file.getUrl();
      }
    }
  } catch (e) {
    console.error("Folder operations failed: " + e.message);
  }

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
    new Date(), new Date(), folderUrl, folderId
  ];

  sheet.appendRow(rowData);
  
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
  // Update logic to match flattened columns if needed
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
