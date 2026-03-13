import { AppPageLayout } from "@/shared/ui/app-page-layout";
import { StrategyPageContent } from "@/widgets/strategy/ui/strategy-page-content";

interface StrategyPageProps {
  searchParams?: Promise<{
    team?: string;
  }>;
}

export default async function StrategyPage({ searchParams }: StrategyPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <AppPageLayout maxWidth="7xl">
      <StrategyPageContent initialTeam={resolvedSearchParams?.team} />
    </AppPageLayout>
  );
}
