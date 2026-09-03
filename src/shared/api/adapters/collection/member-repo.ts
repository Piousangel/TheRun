import type { Collection } from '@/shared/api/adapters/collection/collection';
import type { MemberRepo } from '@/shared/api/ports/member-repo';
import { newId } from '@/shared/lib/id';
import type { Member } from '@/shared/types/member';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

export function createCollectionMemberRepo(members: Collection<Member>, now: () => Date): MemberRepo {
  return {
    async list() {
      return (await members.all()).sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    get(id) {
      return members.get(id);
    },
    async create(data) {
      const at = now().toISOString();
      return members.insert({
        id: newId(),
        name: data.name,
        phone_number: data.phone_number,
        profile_photo: data.profile_photo ?? null,
        stats: data.stats,
        created_at: at,
        updated_at: at,
      });
    },
    update(id, data) {
      return members.update(id, { ...data, updated_at: now().toISOString() });
    },
    remove(id) {
      return members.remove(id);
    },
    uploadPhoto(file) {
      return fileToDataUrl(file);
    },
  };
}
