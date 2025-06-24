export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  return res.status(200).json({ 
    message: 'instances-simple endpoint working',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
}
