# WORTHSY Careers → Google Sheets

The Apps Script in `Code.gs` records each careers application as a new row in a Google Sheet. It avoids the FormSubmit service that your security software blocked.

## One-time setup in your Google account

1. Create a Google Sheet named **WORTHSY Careers Applications**.
2. In the sheet URL, copy the spreadsheet ID: the text between `/d/` and `/edit`.
3. In the sheet, choose **Extensions → Apps Script**.
4. Replace the editor contents with the code in `Code.gs`, and replace `REPLACE_WITH_YOUR_GOOGLE_SHEET_ID` with your spreadsheet ID.
5. Click **Deploy → New deployment → Web app**.
6. Set **Execute as** to **Me** and **Who has access** to **Anyone**, then deploy and authorize the script.
7. Copy the web app URL ending in `/exec` and send it to the person updating the WORTHSY site so the Careers form can be pointed to it.
8. Submit a test application and confirm a new row appears in the sheet.

## Data stored

Timestamp, full name, email, phone, location, role of interest, resume/portfolio/LinkedIn URL, and application message.

**Important:** The website is not connected to this script until the web app is deployed and its `/exec` URL is configured in the Careers form. Keep the spreadsheet private; do not publish it publicly.
