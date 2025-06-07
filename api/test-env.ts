export default function handler(req: any, res: any) {
  return res.status(200).json({
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ? 'OK' : 'NOT SET',
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET'
  });
}
