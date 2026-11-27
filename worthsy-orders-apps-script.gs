/**
 * WORTHSY Store: order recording + order tracking
 * ------------------------------------------------
 * You already have an Apps Script web app that receives your Inquiry and Careers forms.
 * Do NOT replace it. Merge the pieces below into it:
 *   1. In your existing doPost(e): add the 3 lines marked "ADD TO doPost" at the very top.
 *   2. Add the handleStoreOrder_ function and the doGet function (if you already have a doGet, merge it).
 *   3. Deploy > Manage deployments > edit your deployment > New version > Deploy.
 *
 * Orders land in a sheet called "Orders" inside the spreadsheet this script is attached to.
 * To update a customer's tracking, edit these columns in that sheet:
 *   Status (Placed / Confirmed / Shipped / Delivered / Cancelled), Courier, Tracking No, Tracking URL.
 */

const ORDER_HEADERS = ['Order ID', 'Date', 'Name', 'Email', 'Phone', 'Address', 'Items', 'Total (INR)',
  'Payment method', 'Payment status', 'Payment ref', 'Note', 'Status', 'Courier', 'Tracking No', 'Tracking URL'];

/* ADD TO doPost(e), at the very top:
  if (e && e.parameter && e.parameter.form_type === 'store_order') {
    return handleStoreOrder_(e.parameter);
  }
*/

function handleStoreOrder_(p) {
  const sheet = getOrdersSheet_();
  const id = String(p.order_id || '').trim();
  if (!id) return ContentService.createTextOutput('missing order id');
  // ignore duplicates if the browser retries
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().flat();
  if (ids.indexOf(id) === -1) {
    sheet.appendRow([id, new Date(), p.name, p.email, p.phone, p.address, p.items, Number(p.total) || 0,
      p.payment_method, p.payment_status, p.payment_ref, p.note, 'Placed', '', '', '']);
    try {
      MailApp.sendEmail({
        to: p.email,
        subject: 'WORTHSY order ' + id + ' received',
        body: 'Hi ' + p.name + ',\n\nThanks for your order. We have received it and will confirm within 24 hours.\n\n' +
              'Order ID: ' + id + '\nItems: ' + p.items + '\nTotal: Rs. ' + p.total +
              '\nPayment: ' + p.payment_method + ' (' + p.payment_status + ')\n\n' +
              'Track it any time at https://www.worthsy.in/#track\n\nWORTHSY'
      });
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'New WORTHSY order ' + id,
        p.name + ' / ' + p.phone + '\n' + p.address + '\n' + p.items + '\nTotal Rs. ' + p.total + ' (' + p.payment_method + ')');
    } catch (err) { /* email quota or permission issue: the order is still saved */ }
  }
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'track') return ContentService.createTextOutput('WORTHSY');
  const out = { found: false };
  const sheet = getOrdersSheet_();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]).toUpperCase() === String(p.id).toUpperCase() &&
        String(r[3]).toLowerCase() === String(p.email).toLowerCase()) {
      out.found = true; out.status = r[12]; out.courier = r[13]; out.awb = r[14]; out.tracking_url = r[15];
      break;
    }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function getOrdersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Orders');
  if (!sh) { sh = ss.insertSheet('Orders'); sh.appendRow(ORDER_HEADERS); sh.setFrozenRows(1); }
  return sh;
}


/* ---- Support messages from the Store's Support page ----
   ADD TO doPost(e), next to the store_order lines:
     if (e && e.parameter && e.parameter.form_type === 'store_support') {
       return handleStoreSupport_(e.parameter);
     }
*/
function handleStoreSupport_(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Support');
  if (!sh) { sh = ss.insertSheet('Support'); sh.appendRow(['Date', 'Name', 'Email', 'Topic', 'Order ID', 'Message']); sh.setFrozenRows(1); }
  sh.appendRow([new Date(), p.name, p.email, p.topic, p.order_id, p.message]);
  try {
    MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), replyTo: p.email,
      subject: 'WORTHSY support: ' + p.topic + (p.order_id ? ' (' + p.order_id + ')' : ''),
      body: p.name + ' <' + p.email + '>\n\n' + p.message });
  } catch (err) {}
  return ContentService.createTextOutput('ok');
}
