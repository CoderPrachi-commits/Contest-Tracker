export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type = 'upcoming' } = req.query;
  const today = new Date().toISOString().split('T')[0];

  const username = process.env.CLIST_USERNAME;
  const apiKey = process.env.CLIST_API_KEY;

  let url = '';
  if (type === 'upcoming') {
    url = `https://clist.by/api/v1/json/contest/?username=${username}&api_key=${apiKey}&limit=100&format=json&order_by=start&start__gte=${today}`;
  } else {
    url = `https://clist.by/api/v1/json/contest/?username=${username}&api_key=${apiKey}&limit=50&format=json&order_by=-start&start__lt=${today}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
}
