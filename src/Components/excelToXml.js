import * as XLSX from 'xlsx';
import * as xmlbuilder from 'xmlbuilder';

function allowedFile(filename) {
  return filename.split('.').pop().toLowerCase() === 'xlsx';
}

function sanitizeKey(key) {
  if (typeof key === 'string') {
  return key.replace(/[\r\n]+/g, ' ').trim();
}
return '';
}

function convert(arrayBuffer, supplier, brand, buyer, season, phase, cl, gender, ST_user, ticketType, poLocation, poType, poEDI, priceTag, ls, nb, na, mf, mls,dealInfo) {
  const supplierName = supplier['value'];
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  const sheetName = workbook.SheetNames[0];
  console.log(`Sheet name: ${sheetName}`);

  let data;
  if (supplierName === "onlinetextile") {
    // Start at row 12 for the specific supplier
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, range: 11 });
  }else if (supplierName === "PVH_FINLAND_OY") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets["product info"], { header: 1 });
  }else if (supplierName === "VAGABOND_FINLAND_OY") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, range: 2 });
  }
  else if (supplierName === "testsupplier1") {
    console.log(`Sheet name: ${supplierName}`);
 
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, range: 1});
  }
  else {
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  }
  
  console.log('Raw data from sheet:', data);

  const root = xmlbuilder.create('STEP-ProductInformation', { encoding: 'UTF-8', headless: true });
  root.att('WorkspaceID', 'Main');
  root.att('ContextID', 'International');

  const Products = root.ele('Products');
  
  // Sanitize headers from the first row of data
  const arrList = data[0] ? data[0].map(field => sanitizeKey(field)) : [];
  console.log('Sanitized headers:', arrList);
  
  const finalListValue = [];

  // Start processing from row 1 (data[1]) and ignore rows with only formulas or empty cells
  for (let i = 1; i < data.length; i++) {
    const dictFinal = {};
    let hasValue = false;  // Flag to check if row has any non-empty values

    for (let j = 0; j < arrList.length; j++) {
      let cellValue = data[i][j];
      
      // Remove unwanted characters such as \r, \n and other whitespace characters
      if (typeof cellValue === 'string') {
        cellValue = cellValue.replace(/[\r\n]/g, ' ').trim();
      }

      dictFinal[arrList[j]] = cellValue == null ? "" : cellValue;
      
      if (cellValue !== undefined && cellValue !== "") {
        hasValue = true;  // Row has at least one value
      }
    }

    if (hasValue) {
      finalListValue.push(dictFinal);  // Only push rows that have some value
    }
}

  console.log('Final list value:', finalListValue);
  
  const Product1 = Products.ele('Product', { ParentID: "BuySideRoot", UserTypeID: "BuySideItem" });
  const Product2 = Product1.ele('Values');
  Product2.ele('Value', { AttributeID: "att_fields" }).txt(JSON.stringify(finalListValue));
  Product2.ele('Value', { AttributeID: "att_assignee" }).txt(ST_user);
  Product2.ele('Value', { AttributeID: "att_tool_consumerlifestage" }).txt(cl);
  Product2.ele('Value', { AttributeID: "att_tool_gender" }).txt(gender);
  Product2.ele('Value', { AttributeID: "att_tool_orderpricetags" }).txt(priceTag);
  const phaseValue = phase ? phase : "";
  Product2.ele('Value', { AttributeID: "att_tool_phase" }).txt(phaseValue);
  Product2.ele('Value', { AttributeID: "att_tool_polocation" }).txt(poLocation);
  Product2.ele('Value', { AttributeID: "att_tool_potype" }).txt(poType);
  Product2.ele('Value', { AttributeID: "att_tool_season" }).txt(season);
  Product2.ele('Value', { AttributeID: "att_tool_buyer" }).txt(buyer);
  Product2.ele('Value', { AttributeID: "att_tool_sendedi" }).txt(poEDI);
  Product2.ele('Value', { AttributeID: "att_tool_lifestyle" }).txt(ls);
  Product2.ele('Value', { AttributeID: "att_tool_mainlifestyle" }).txt(mls);
  Product2.ele('Value', { AttributeID: "att_tool_nbd" }).txt(nb);
  Product2.ele('Value', { AttributeID: "att_tool_nad" }).txt(na);
  Product2.ele('Value', { AttributeID: "att_tool_multifactor" }).txt(mf);
  Product2.ele('Value', { AttributeID: "att_tool_supplier" }).txt(supplier["value"]);
  const ticketTypeValue = ticketType ? ticketType : "";
  Product2.ele('Value', { AttributeID: "att_tool_tickettype" }).txt(ticketTypeValue);
  Product2.ele('Value', { AttributeID: "att_tool_brand" }).txt(brand ? brand.value : "");
  Product2.ele('Value', { AttributeID: "att_tool_dealinfo" }).txt(dealInfo);


  const xmlString = root.end({ pretty: true });

  return { success: true, xmlString };
}

export { convert, allowedFile };
