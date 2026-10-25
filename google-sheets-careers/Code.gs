/**
 * WORTHSY Careers form -> Google Sheets
 *
 * Setup:
 * 1. Create a Google Spreadsheet and copy its ID from the URL.
 * 2. Open Extensions > Apps Script from that spreadsheet.
 * 3. Paste this file's contents into Code.gs and replace SPREADSHEET_ID.
 * 4. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 5. Copy the Web app URL ending in /exec and configure the Careers form action
 *    to that URL.
 *
 * Do not put private keys or credentials in the public website.
 */
const SPREADSHEET_ID = '1JAlshYqCvoiAabWLlRcbkUhFjzccoE0ORW70BAguBI8';
const SHEET_NAME = 'Career Applications';

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    // Honeypot spam check. Real users should leave this field blank.
    if (p._honey) {
      return page_('Thank you', 'Your response has been received.');
    }

    const required = ['name', 'email', 'role', 'resume_link', 'message'];
    const missing = required.filter(function (key) {
      return !String(p[key] || '').trim();
    });
    if (missing.length) {
      return page_('Application not submitted', 'Please return to the Careers page and complete all required fields.');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp', 'Full Name', 'Email', 'Phone', 'Location',
        'Role of Interest', 'Resume / Portfolio / LinkedIn', 'Why Join WORTHSY'
      ]);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      safeCell_(p.name),
      safeCell_(p.email),
      safeCell_(p.phone),
      safeCell_(p.location),
      safeCell_(p.role),
      safeCell_(p.resume_link),
      safeCell_(p.message)
    ]);

    return page_('Application received', 'Thank you for applying to WORTHSY. Your application has been saved successfully.');
  } catch (err) {
    console.error(err);
    return page_('Submission error', 'Your application could not be saved. Please return to the Careers page and try again.');
  }
}

function safeCell_(value) {
  const text = String(value || '').trim();
  // Prevent spreadsheet formula injection from user-supplied fields.
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

function page_(title, message) {
  const safeTitle = escapeHtml_(title);
  const safeMessage = escapeHtml_(message);
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + safeTitle + ' | WORTHSY</title><style>' +
    'body{font-family:Arial,sans-serif;background:#fff;color:#111;display:grid;place-items:center;min-height:90vh;margin:0;padding:24px}' +
    'main{max-width:620px;text-align:center;border:1px solid #ddd;padding:40px 28px}h1{font-size:24px}p{line-height:1.6;color:#444}' +
    'a{display:inline-block;margin-top:18px;color:#d71920;font-weight:bold}' +
    '</style></head><body><main><h1>' + safeTitle + '</h1><p>' + safeMessage + '</p>' +
    '<a href="https://www.worthsy.in/index.html#careers">Return to WORTHSY Careers</a></main></body></html>'
  );
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (ch) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
  });
}
