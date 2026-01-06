import { supabase } from './config';

export async function uploadProfilePhoto(
  file: File,
  memberId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${memberId}-${Date.now()}.${fileExt}`;
  const filePath = `profiles/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('member-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('member-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteProfilePhoto(photoUrl: string): Promise<void> {
  const path = photoUrl.split('/member-photos/')[1];
  if (!path) return;

  const { error } = await supabase.storage.from('member-photos').remove([path]);

  if (error) throw error;
}
