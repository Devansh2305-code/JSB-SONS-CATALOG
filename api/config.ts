interface ConfigRequest {
  method?: string;
}

interface ConfigResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ConfigResponse;
  json(body: unknown): void;
}

/**
 * Vercel serverless endpoint for public Supabase client configuration.
 * The anon key is intended for browser use; never expose the service-role key here.
 */
export default function handler(req: ConfigRequest, res: ConfigResponse): void {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey:
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  });
}
