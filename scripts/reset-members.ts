import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const defaultStats = {
  speed: 50,
  shooting: 50,
  passing: 50,
  dribbling: 50,
  stamina: 50,
  defense: 50,
};

const newMembers = [
  // 참석 (12명)
  { name: '양현석', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '박상역', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김준관', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '주진호', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '최지훈', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '시장혁', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김석용', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '정용준', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '권혁', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '양민철', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '민태홍', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '이병현', phone_number: '010-0000-0000', stats: defaultStats },

  // 불참 (25명)
  { name: '성명진', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '박정인', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '안효승', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김강복', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '최연길', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '배인식', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '이상준', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김승현', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '양경일', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '오민호', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김민우', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '이성태', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '최원희', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '진승식', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '홍명산', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김기창', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '정동한', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '박용진', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '황원섭', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '최재은', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '유현덕', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '조형규', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '이동형', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '정지훈', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '염준식', phone_number: '010-0000-0000', stats: defaultStats },

  // 미참여 인원 (26명)
  { name: '권기중', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김동건', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김무성', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김문식', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김민규', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김성준', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김인진', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김종익', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '김현수', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '노상철', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '박동기', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '박주혁', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '박찬수', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '백승우', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '심덕상', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '심명진', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '안성연', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '유현욱', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '이두호', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '이승은', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '이승현', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '이영건', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '장동복', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '전대웅', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '최대영', phone_number: '010-0000-0000', stats: defaultStats },
  { name: '한정복', phone_number: '010-0000-0000', stats: defaultStats },
];

async function resetMembers() {
  console.log('🔄 Starting member reset...\n');

  // Step 1: Delete all existing members
  console.log('🗑️  Deleting all existing members...');
  const { error: deleteError } = await supabase
    .from('members')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (deleteError) {
    console.error('❌ Error deleting members:', deleteError);
    throw deleteError;
  }
  console.log('✅ All existing members deleted\n');

  // Step 2: Insert new members
  console.log(`📝 Inserting ${newMembers.length} new members...`);
  const { data, error: insertError } = await supabase
    .from('members')
    .insert(newMembers)
    .select();

  if (insertError) {
    console.error('❌ Error inserting members:', insertError);
    throw insertError;
  }

  console.log(`✅ Successfully inserted ${data?.length || 0} members\n`);

  // Step 3: Verify
  const { data: allMembers, error: verifyError } = await supabase
    .from('members')
    .select('name')
    .order('name', { ascending: true });

  if (verifyError) {
    console.error('❌ Error verifying members:', verifyError);
    throw verifyError;
  }

  console.log('📋 Current members in database:');
  allMembers?.forEach((member, index) => {
    console.log(`  ${index + 1}. ${member.name}`);
  });

  console.log(`\n✨ Done! Total members: ${allMembers?.length || 0}`);
}

resetMembers()
  .then(() => {
    console.log('\n🎉 Member reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Member reset failed:', error);
    process.exit(1);
  });
