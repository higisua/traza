import { RoutinePreSummaryScreen } from "@/components/workout/RoutinePreSummaryScreen";

type TrainRoutinePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TrainRoutinePage({ params }: TrainRoutinePageProps) {
  const { slug } = await params;
  return <RoutinePreSummaryScreen slug={slug} />;
}
