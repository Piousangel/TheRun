import { redirect } from "next/navigation";

interface TeamDetailPageProps {
  params: Promise<{
    teamName: string;
  }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamName } = await params;

  if (!["A", "B", "C", "D"].includes(teamName.toUpperCase())) {
    redirect("/strategy");
  }

  redirect(`/strategy?team=${teamName.toUpperCase()}`);
}
