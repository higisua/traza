import { RoutinePreviewScreen } from "@/components/routines/RoutinePreviewScreen";

type PreviewRoutinePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PreviewRoutinePage({
  params,
}: PreviewRoutinePageProps) {
  const { id } = await params;
  return <RoutinePreviewScreen routineId={id} />;
}
