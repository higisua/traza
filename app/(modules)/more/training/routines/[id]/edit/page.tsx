import { RoutineFormScreen } from "@/components/routines/RoutineFormScreen";

type EditRoutinePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRoutinePage({
  params,
}: EditRoutinePageProps) {
  const { id } = await params;
  return <RoutineFormScreen mode="edit" routineId={id} />;
}
