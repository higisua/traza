import { ExerciseDetailScreen } from "@/components/exercises/ExerciseDetailScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ExerciseDetailScreen exerciseId={id} />;
}
