import { WorkoutSessionScreen } from "@/components/workout/WorkoutSessionScreen";

type WorkoutPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { sessionId } = await params;
  return <WorkoutSessionScreen sessionId={sessionId} />;
}
