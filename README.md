# WORTHSY Website Forms → Google Sheets

Both website forms use the same spreadsheet:
https://docs.google.com/spreadsheets/d/1JAlshYqCvoiAabWLlRcbkUhFjzccoE0ORW70BAguBI8/edit

The Apps Script in `Code.gs` routes submissions to separate tabs:
- Careers form → `Career Applications`
- Private Acquisition / Inquiry form → `Private Inquiries`

## Apply the updated Apps Script

1. Open the Apps Script project attached to the WORTHSY spreadsheet.
2. Replace the editor contents with the latest code in this repository's `google-sheets-careers/Code.gs` file.
3. Save.
4. Choose **Deploy → Manage deployments**.
5. Edit the existing web app deployment, select **New version**, and click **Deploy**. Keep the existing deployment URL ending in `/exec`; the website already posts to that URL.
6. Test both forms and check the matching spreadsheet tabs.

## Fields saved

**Career Applications:** Timestamp, name, email, phone, location, role, optional resume/portfolio/LinkedIn link, optional motivation message.

**Private Inquiries:** Timestamp, full name/entity, email, selected asset/interest, private requirements.

Keep the spreadsheet private. The web app must be deployed with access settings that allow website visitors to submit; use **Execute as: Me** and **Anyone** if your account allows it.
