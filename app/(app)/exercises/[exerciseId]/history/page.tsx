import { ExerciseHistoryScreen } from "@/components/workout/ExerciseHistoryScreen";

type ExerciseHistoryPageProps = {
  params: Promise<{ exerciseId: string }>;
};

export default async function ExerciseHistoryPage({
  params,
}: ExerciseHistoryPageProps) {
  const { exerciseId } = await params;
  return <ExerciseHistoryScreen exerciseId={exerciseId} />;
}
