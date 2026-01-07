import Link from "next/link";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Users, Calendar, Trophy, ClipboardList, Vote } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold">
            <span className="text-primary">The Run</span> 풋살 클럽
          </h1>
          <p className="text-lg text-muted-foreground">
            우리 동호회를 위한 통합 관리 시스템
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Link href="/members">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>멤버 관리</CardTitle>
                <CardDescription>팀 멤버 등록 및 관리</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/votes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Vote className="h-10 w-10 text-primary mb-2" />
                <CardTitle>투표 관리</CardTitle>
                <CardDescription>경기, 회식, 야유회 투표</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/team-division">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <ClipboardList className="h-10 w-10 text-primary mb-2" />
                <CardTitle>팀 나누기</CardTitle>
                <CardDescription>자동 밸런싱 및 팀 구성</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/matches">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Trophy className="h-10 w-10 text-primary mb-2" />
                <CardTitle>경기 기록</CardTitle>
                <CardDescription>경기 결과 및 개인 기록</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
