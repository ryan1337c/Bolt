import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const cookieStore = cookies();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = createServerClient(
    supabaseUrl!,
    supabaseRole!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  export default supabaseServer;
