import type { Collection } from '@/shared/api/adapters/collection/collection';
import type { MemberRepo } from '@/shared/api/ports/member-repo';
import type { Member } from '@/shared/types/member';

/** 128비트 난수를 hex로. getRandomValues는 보안 컨텍스트가 아니어도 쓸 수 있다. */
function randomHex(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function newId(): string {
  // crypto.randomUUID는 보안 컨텍스트(https·localhost)에서만 존재한다. 폰에서 LAN IP로
  // 데모를 여는 흔한 경로(http://192.168.x.x:3000)에서는 undefined라 모든 로컬 쓰기가 죽는다.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${randomHex()}`;
}

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
