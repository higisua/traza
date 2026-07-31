import { WorkoutSummaryScreen } from "@/components/workout/WorkoutSummaryScreen";

type WorkoutSummaryPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function WorkoutSummaryPage({
  params,
}: WorkoutSummaryPageProps) {
  const { sessionId } = await params;
  return <WorkoutSummaryScreen sessionId={sessionId} />;
}
