export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const SUPABASE_URL = 'https://edvklxnzhuhmijdwyzrl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdmtseG56aHVobWlqZHd5enJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTE4MTQsImV4cCI6MjA5MzI2NzgxNH0.65Vf-XUlPZmhc-LWqzXq55bpR6RcG8iqNybf_bqyd60';
const BUCKET = 'plant-media';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { imageBase64, rid, plantName, weightG, note, uploadedBy, takenAt } = req.body;
    if (!imageBase64 || !rid) return res.status(400).json({ error: 'Missing params' });

    // 1. 轉換 base64 為 buffer
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 2. 產生檔案路徑
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${rid}/${rid}_${timestamp}_${weightG || 0}g.jpg`;

    // 3. 上傳到 Supabase Storage
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: imageBuffer
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error('Storage upload failed: ' + err);
    }

    // 4. 取得公開 URL
    const photoUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;

    // 5. 寫入 Supabase photos 表
    const photoDate = takenAt || new Date().toISOString();
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        rid,
        plant_name: plantName,
        photo_url: photoUrl,
        weight_g: weightG ? parseInt(weightG) : null,
        note: note || null,
        uploaded_by: uploadedBy || 'owner',
        approved: true,
        taken_at: photoDate
      })
    });

    if (!dbRes.ok) throw new Error('Supabase DB: ' + await dbRes.text());

    return res.status(200).json({ success: true, photoUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
