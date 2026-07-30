import Image from "next/image";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function TrainPage() {
  return (
    <div className="flex flex-col pt-6">
      <h1 className="text-section font-bold leading-title tracking-title text-text-primary">
        Entrenar
      </h1>
      <p className="mt-2 text-caption text-text-secondary">
        Una cosa cada vez.
      </p>

      <div className="relative mx-auto mt-8 h-44 w-36">
        <Image
          src="/exercises/chest-supported-row.png"
          alt="Chest supported row"
          fill
          sizes="144px"
          className="object-contain"
          priority
        />
      </div>

      <EmptyState
        className="pt-4"
        title="Tu próxima sesión empieza aquí"
        description="El modo de entrenamiento llegará en la Fase 2. Ya puedes sentir el tono: foco, precisión, calma."
      />
    </div>
  );
}
