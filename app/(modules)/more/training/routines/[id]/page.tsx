import { RoutineDetailScreen } from "@/components/routines/RoutineDetailScreen";

type RoutineDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoutineDetailPage({
  params,
}: RoutineDetailPageProps) {
  const { id } = await params;
  return <RoutineDetailScreen routineId={id} />;
}
