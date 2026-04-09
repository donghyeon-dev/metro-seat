import type { SupabaseClient, User } from '@supabase/supabase-js';

function createFallbackNickname() {
  return `승객${Math.floor(Math.random() * 10000)}`;
}

export async function ensureProfileExists(
  supabase: SupabaseClient,
  user: User,
  preferredNickname?: string
) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profile) {
    return;
  }

  const nickname = preferredNickname?.trim() || createFallbackNickname();
  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    nickname,
  });

  if (insertError && insertError.code !== '23505') {
    throw insertError;
  }
}
