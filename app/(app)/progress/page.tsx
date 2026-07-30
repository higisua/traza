import { EmptyState } from "@/components/feedback/EmptyState";

export default function ProgressPage() {
  return (
    <div className="flex flex-col pt-6">
      <h1 className="text-section font-bold leading-title tracking-title text-text-primary">
        Progreso
      </h1>
      <p className="mt-2 text-caption text-text-secondary">
        Tendencias, no tablas.
      </p>
      <EmptyState
        className="mt-4"
        title="Las gráficas llegarán después"
        description="Cada métrica contará una sola historia cuando haya datos suficientes."
      />
    </div>
  );
}
