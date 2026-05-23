export default async function handler(req, res) {
  // CORSヘッダーの設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONSリクエスト（プリフライト）の処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  // データベース環境変数が設定されていない場合は、503エラーで返す（クライアントはスタンドアロンで動く）
  if (!url || !token) {
    res.status(503).json({
      error: 'Database connection not configured. Running in local standalone mode.',
      code: 'DB_UNCONFIGURED'
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      const { code } = req.query;
      if (!code) {
        res.status(400).json({ error: 'Missing code parameter' });
        return;
      }

      // KVからカレンダーデータを取得
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', `calmcal:${code}`])
      });

      if (!response.ok) {
        throw new Error(`KV fetching failed: ${response.statusText}`);
      }

      const result = await response.json();
      const rawData = result.result;

      if (!rawData) {
        // データが存在しない場合は空の構造を返す
        res.status(200).json({ events: [], userAName: '', userBName: '' });
      } else {
        res.status(200).json(JSON.parse(rawData));
      }
    } else if (req.method === 'POST') {
      const { code, data } = req.body;
      if (!code || !data) {
        res.status(400).json({ error: 'Missing code or data in request body' });
        return;
      }

      // KVにカレンダーデータを保存 (上書き)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', `calmcal:${code}`, JSON.stringify(data)])
      });

      if (!response.ok) {
        throw new Error(`KV saving failed: ${response.statusText}`);
      }

      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
