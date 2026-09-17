import { AppPageLayout } from "@/shared/ui/app-page-layout";
import { StrategyPageContent } from "@/widgets/strategy/ui/strategy-page-content";

interface StrategyPageProps {
  searchParams?: Promise<{
    team?: string;
    from?: string;
    matchId?: string;
  }>;
}

export default async function StrategyPage({
  searchParams,
}: StrategyPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <AppPageLayout>
      <StrategyPageContent
        initialTeam={resolvedSearchParams?.team}
        initialSource={resolvedSearchParams?.from}
        initialMatchId={resolvedSearchParams?.matchId}
      />
    </AppPageLayout>
  );
}
