# WORTHSY Careers → Your Google Sheet

The Apps Script in `Code.gs` is already configured for your spreadsheet:
`1JAlshYqCvoiAabWLlRcbkUhFjzccoE0ORW70BAguBI8`

## Finish the one-time setup

1. Open your spreadsheet: https://docs.google.com/spreadsheets/d/1JAlshYqCvoiAabWLlRcbkUhFjzccoE0ORW70BAguBI8/edit
2. Choose **Extensions → Apps Script**.
3. In the Apps Script editor, replace the contents of `Code.gs` with the code in this repository file: https://github.com/connect-worthsy/connect.worthsy/blob/main/google-sheets-careers/Code.gs
4. Click **Deploy → New deployment**.
5. Select the gear/type menu and choose **Web app**.
6. Set **Execute as** to **Me**. Set **Who has access** to **Anyone**, if available and allowed by your Google account/organization.
7. Click **Deploy** and approve Google's authorization prompt.
8. Copy the Web app URL ending in `/exec` and send that URL to the site maintainer so the live Careers form can be connected to it.
9. Test by submitting an application through WORTHSY Careers and check that a new row appears in the spreadsheet.

## What gets saved

Timestamp, full name, email, phone, location, role of interest, resume/portfolio/LinkedIn URL, and application message.

**Important:** The spreadsheet URL alone cannot receive form submissions. The Apps Script web app must be deployed first, and its `/exec` URL must be configured as the Careers form's destination. Keep the spreadsheet private; do not publish it to the public web.
