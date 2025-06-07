export default async function handler(req: any, res: any) {
  res.status(200).json({
    apiKey: process.env.EVOLUTION_API_KEY ? 'OK' : 'NOT SET',
    apiUrl: process.env.EVOLUTION_API_URL || 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET',
    allEnv: Object.keys(process.env)
  });
}
