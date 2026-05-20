const { google } = require('googleapis');
const { Readable } = require('stream');

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const ROOT_FOLDER_ID = '1gz1yMRvB0NajSfdKAk-s7KTFLH5h3sNG';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { imageBase64, rid, plantName, weightG, note, uploadedBy } = req.body;
    if (!imageBase64 || !rid) return res.status(400).json({ error: 'Missing params' });
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] });
    const drive = google.drive({ version: 'v3', auth });
    const plantFolderId = await getOrCreateFolder(drive, rid + '_' + (plantName || rid), ROOT_FOLDER_ID);
    const imageBuffer = Buffer.from((imageBase64.split(',')[1] || imageBase64), 'base64');
    const stream = Readable.from(imageBuffer);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uploadFileName = rid + '_' + timestamp + '_' + (weightG || 0) + 'g.jpg';
    const uploadResponse = await drive.files.create({
      requestBody: { name: uploadFileName, parents: [plantFolderId] },
      media: { mimeType: 'image/jpeg', body: stream },
      fields: 'id'
    });
    await drive.permissions.create({
      fileId: uploadResponse.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });
    const photoUrl = 'https://drive.google.com/uc?id=' + uploadResponse.data.id;
    const supabaseUrl = 'https://edvklxnzhuhmijdwyzrl.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdmtseG56aHVobWlqZHd5enJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTE4MTQsImV4cCI6MjA5MzI2NzgxNH0.65Vf-XUlPZmhc-LWqzXq55bpR6RcG8iqNybf_bqyd60';
    const dbRes = await fetch(supabaseUrl + '/rest/v1/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey
      },
      body: JSON.stringify({
        rid,
        plant_name: plantName,
        photo_url: photoUrl,
        weight_g: weightG ? parseInt(weightG) : null,
        note: note || null,
        uploaded_by: uploadedBy || 'owner',
        approved: true
      })
    });
    if (!dbRes.ok) throw new Error('Supabase: ' + await dbRes.text());
    return res.status(200).json({ success: true, photoUrl, fileId: uploadResponse.data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getOrCreateFolder(drive, name, parentId) {
  const res = await drive.files.list({
    q: "name='" + name + "' and mimeType='application/vnd.google-apps.folder' and '" + parentId + "' in parents and trashed=false",
    fields: 'files(id)',
    includeItemsFromAllDrives: false,
    supportsAllDrives: false
  });
  if (res.data.files.length > 0) return res.data.files[0].id;
  const f = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id'
  });
  return f.data.id;
}
