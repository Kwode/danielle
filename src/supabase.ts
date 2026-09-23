import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not configured yet.');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  { auth: { persistSession: false } }
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleSupabaseError(error: unknown, operationType: OperationType, table: string): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[Supabase Notice - ${operationType} on ${table}]:`, message);
}

export async function safeSetDoc(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const normalized = { ...data, id } as Record<string, unknown>;
    // Keep the existing UI/domain objects camelCase while persisting PostgreSQL-friendly names.
    if ('createdAt' in normalized) { normalized.created_at = normalized.createdAt; delete normalized.createdAt; }
    if ('deletedAt' in normalized) { normalized.deleted_at = normalized.deletedAt; delete normalized.deletedAt; }
    if ('youtubeId' in normalized) { normalized.youtube_id = normalized.youtubeId; delete normalized.youtubeId; }
    if ('isCustom' in normalized) { normalized.is_custom = normalized.isCustom; delete normalized.isCustom; }
    if ('fileSize' in normalized) { normalized.file_size = normalized.fileSize; delete normalized.fileSize; }
    if ('mimeType' in normalized) { normalized.mime_type = normalized.mimeType; delete normalized.mimeType; }
    if ('cloudinaryPublicId' in normalized) { normalized.cloudinary_public_id = normalized.cloudinaryPublicId; delete normalized.cloudinaryPublicId; }
    const { error } = await supabase.from(table).upsert(normalized, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, OperationType.WRITE, table);
    return false;
  }
}

export async function safeDeleteDoc(table: string, id: string): Promise<boolean> {
  // Photos and videos are permanent memories. Keep a client-side safeguard
  // in addition to the Supabase RLS policies that deny DELETE for these tables.
  if (table === 'photos' || table === 'videos') {
    console.warn(`Deletion blocked: ${table} records are permanent.`);
    return false;
  }

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, OperationType.DELETE, table);
    return false;
  }
}

export async function getTableRows<T = Record<string, any>>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (data || []) as T[];
}

/**
 * Replaces Firestore onSnapshot with a Supabase initial fetch + Realtime listener.
 * The callback receives the complete current table contents after every change.
 */
export function subscribeToTable<T = Record<string, any>>(
  table: string,
  onRows: (rows: T[]) => void,
  onError?: (error: unknown) => void
): () => void {
  let active = true;

  const refresh = async () => {
    try {
      const rows = await getTableRows<T>(table);
      if (active) onRows(rows);
    } catch (error) {
      if (active) onError?.(error);
    }
  };

  void refresh();

  const channel = supabase
    .channel(`danielle-${table}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => void refresh()
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && active) {
        onError?.(new Error(`Supabase realtime subscription failed for ${table}`));
      }
    });

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}
