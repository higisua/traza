import { EmptyState } from "@/components/feedback/EmptyState";

export default function CalendarPage() {
  return (
    <div className="flex flex-col pt-6">
      <h1 className="text-section font-bold leading-title tracking-title text-text-primary">
        Calendario
      </h1>
      <p className="mt-2 text-caption text-text-secondary">
        Tu memoria de entrenamiento.
      </p>
      <EmptyState
        className="mt-4"
        title="Todavía no hay historial"
        description="Cuando registres datos, este mes mostrará tu progreso de un vistazo."
      />
    </div>
  );
}
