export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const SUPABASE_URL = 'https://edvklxnzhuhmijdwyzrl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdmtseG56aHVobWlqZHd5enJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTE4MTQsImV4cCI6MjA5MzI2NzgxNH0.65Vf-XUlPZmhc-LWqzXq55bpR6RcG8iqNybf_bqyd60';
const BUCKET = 'plant-media';

const AI_PROMPT = `你是一位鹿角蕨（Platycerium）植物健康評估專家。
請分析這張植物照片，給出以下評分（整數 0-100）：
- health_score：整體健康狀態（葉色飽滿度、無病蟲害、無焦邊）
- growth_score：生長活力（有無新葉、新臉、新手展開中）
- beauty_score：視覺美感與展示價值

再用繁體中文寫 1-2 句摘要，描述這株植物目前的狀態與最值得注意的特徵。

只回傳 JSON，不要有其他文字：
{"health_score":數字,"growth_score":數字,"beauty_score":數字,"summary":"摘要"}`;

// ── Gemini 分析（只針對正面照片）─────────────────────────
async function analyzeWithGemini(base64Data, photoUrl, rid, photoId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return; // 未設定 key → 靜默略過

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: AI_PROMPT },
              { inline_data: { mime_type: 'image/webp', data: base64Data } }
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
        })
      }
    );

    if (!res.ok) return;

    const data = await res.json();
    const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 從回傳文字中找 JSON（Gemini 有時會加 markdown）
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const scores = JSON.parse(jsonMatch[0]);
    const { health_score, growth_score, beauty_score, summary } = scores;

    // 寫入 ai_analysis 表
    await fetch(`${SUPABASE_URL}/rest/v1/ai_analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        rid,
        photo_url:    photoUrl,
        health_score: typeof health_score === 'number' ? Math.round(health_score) : null,
        growth_score: typeof growth_score === 'number' ? Math.round(growth_score) : null,
        beauty_score: typeof beauty_score === 'number' ? Math.round(beauty_score) : null,
        summary:      summary || null,
        analysis_date: new Date().toISOString().slice(0, 10),
        model:         'gemini-1.5-flash'
      })
    });
  } catch (_) {
    // AI 失敗不影響主流程
  }
}

// ── 主 handler ────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { imageBase64, rid, plantName, weightG, note, uploadedBy, takenAt, angle, sessionDate } = req.body;
    if (!imageBase64 || !rid) return res.status(400).json({ error: 'Missing params' });

    // 1. 轉換 base64 為 buffer
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 2. 產生檔案路徑
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const angleTag  = angle || 'front';
    const fileName  = `${rid}/${rid}_${timestamp}_${angleTag}_${weightG || 0}g.webp`;

    // 3. 上傳到 Supabase Storage
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'image/webp',
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

    // 5. 寫入 photos 表
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
        plant_name:   plantName,
        photo_url:    photoUrl,
        weight_g:     weightG ? parseInt(weightG) : null,
        note:         note || null,
        uploaded_by:  uploadedBy || 'owner',
        approved:     true,
        taken_at:     photoDate,
        angle:        angleTag,
        session_date: sessionDate || photoDate.slice(0, 10)
      })
    });

    if (!dbRes.ok) throw new Error('Supabase DB: ' + await dbRes.text());

    const [savedPhoto] = await dbRes.json();
    const photoId = savedPhoto?.id || null;

    // 6. AI 分析（只分析正面照片，非同步不阻塞回應）
    if (angleTag === 'front') {
      analyzeWithGemini(base64Data, photoUrl, rid, photoId).catch(() => {});
    }

    return res.status(200).json({ success: true, photoUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
