/**
 * WORTHSY website forms -> Google Sheets
 *
 * Spreadsheet: 1JAlshYqCvoiAabWLlRcbkUhFjzccoE0ORW70BAguBI8
 * Career form tab: Career Applications
 * Private inquiry form tab: Private Inquiries
 *
 * Deploy as Web app (execute as Me; access Anyone if available), then
 * update the existing deployment to a new version after changing this script.
 */
const SPREADSHEET_ID = '1JAlshYqCvoiAabWLlRcbkUhFjzccoE0ORW70BAguBI8';
const CAREERS_SHEET_NAME = 'Career Applications';
const INQUIRIES_SHEET_NAME = 'Private Inquiries';

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};

    // Hidden honeypot for spam bots.
    if (p._honey) {
      return page_('Thank you', 'Your response has been received.');
    }

    const isInquiry = String(p.form_type || '').toLowerCase() === 'inquiry';
    const required = isInquiry
      ? ['name', 'email', 'asset', 'message']
      : ['name', 'email', 'role']; // Resume link and motivation are optional.
    const missing = required.filter(function (key) {
      return !String(p[key] || '').trim();
    });
    if (missing.length) {
      return page_(
        'Submission incomplete',
        'Please return to the form and complete all required fields.'
      );
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (isInquiry) {
      const sheet = getOrCreateSheet_(spreadsheet, INQUIRIES_SHEET_NAME, [
        'Timestamp', 'Full Name / Entity', 'Email',
        'Asset / Interest of Inquiry', 'Private Requirements'
      ]);
      sheet.appendRow([
        new Date(),
        safeCell_(p.name),
        safeCell_(p.email),
        safeCell_(p.asset),
        safeCell_(p.message)
      ]);

      // Confirmation email is best-effort: an email failure must not undo
      // a successfully saved inquiry or falsely report that the row failed.
      try {
        sendApplicantConfirmation_(
          p.email,
          'Thank you for your private inquiry | WORTHSY',
          'Hello ' + String(p.name || '').trim() + ',\n\n' +
          'Thank you for contacting WORTHSY about your private acquisition or partnership inquiry. ' +
          'We have received your submission and our team will review the details. If we need more information, we will contact you.\n\n' +
          'Your inquiry: ' + String(p.asset || '').trim() + '\n\n' +
          'Thank you for considering WORTHSY.\n' +
          'Warm regards,\nWORTHSY Team\nhttps://www.worthsy.in/'
        );
      } catch (mailError) {
        console.error('Private inquiry saved, but confirmation email failed: ' + mailError);
      }

      return page_(
        'Inquiry received',
        'Thank you. Your private inquiry has been saved successfully.'
      );
    }

    const sheet = getOrCreateSheet_(spreadsheet, CAREERS_SHEET_NAME, [
      'Timestamp', 'Full Name', 'Email', 'Phone', 'Location',
      'Role of Interest', 'Resume / Portfolio / LinkedIn', 'Why Join WORTHSY'
    ]);
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

    // Send a separate confirmation tailored to job applicants.
    try {
      sendApplicantConfirmation_(
        p.email,
        'Thank you for applying to WORTHSY',
        'Hello ' + String(p.name || '').trim() + ',\n\n' +
        'Thank you for your interest in joining WORTHSY and for submitting your application for ' +
        String(p.role || '').trim() + '. We have received your application and our team will review it. ' +
        'If your profile matches our requirements, we will contact you about the next steps.\n\n' +
        'Thank you for considering a future with WORTHSY.\n' +
        'Warm regards,\nWORTHSY Careers Team\nhttps://www.worthsy.in/'
      );
    } catch (mailError) {
      console.error('Career application saved, but confirmation email failed: ' + mailError);
    }

    return page_(
      'Application received',
      'Thank you for applying to WORTHSY. Your application has been saved successfully.'
    );
  } catch (err) {
    console.error(err);
    return page_(
      'Submission error',
      'Your submission could not be saved. Please return to the form and try again.'
    );
  }
}


function sendApplicantConfirmation_(recipient, subject, body) {
  const email = String(recipient || '').trim();
  if (!email) throw new Error('Applicant email address is missing.');
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
    name: 'WORTHSY Team',
    replyTo: 'connect.worthsy@gmail.com'
  });
}

function getOrCreateSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function safeCell_(value) {
  const text = String(value || '').trim();
  // Prevent spreadsheet formula injection from user-supplied fields.
  return /^[=+@\\-]/.test(text) ? "'" + text : text;
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
    '<a href="https://www.worthsy.in/">Return to WORTHSY</a></main></body></html>'
  );
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (ch) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]);
  });
}
