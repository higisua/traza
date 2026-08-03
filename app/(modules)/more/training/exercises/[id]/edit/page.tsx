import { ExerciseFormScreen } from "@/components/exercises/ExerciseFormScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExercisePage({ params }: PageProps) {
  const { id } = await params;
  return <ExerciseFormScreen mode="edit" exerciseId={id} />;
}
