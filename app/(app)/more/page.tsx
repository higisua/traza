import { EmptyState } from "@/components/feedback/EmptyState";

export default function MorePage() {
  return (
    <div className="flex flex-col pt-6">
      <h1 className="text-section font-bold leading-title tracking-title text-text-primary">
        Más
      </h1>
      <p className="mt-2 text-caption text-text-secondary">
        Ejercicios, rutinas y ajustes.
      </p>
      <EmptyState
        className="mt-4"
        title="Administración en camino"
        description="Esta sección permanecerá mínima. Solo lo necesario."
      />
    </div>
  );
}
