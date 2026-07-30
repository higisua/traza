"use client";

import { useState } from "react";
import {
  DangerButton,
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from "@/components/forms/Button";
import { NumberInput } from "@/components/forms/NumberInput";
import { HeroCard } from "@/components/common/HeroCard";
import { MetricCard } from "@/components/common/MetricCard";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { StatChip } from "@/components/common/StatChip";
import { PageHeader } from "@/components/common/PageHeader";
import { HistoryRow } from "@/components/common/HistoryRow";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { BottomSheet } from "@/components/navigation/BottomSheet";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  HeroCardSkeleton,
  HistoryRowSkeleton,
  LoadingSkeleton,
  MetricCardSkeleton,
} from "@/components/feedback/LoadingSkeleton";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { Toast, useToast } from "@/components/feedback/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { Footprints, HeartPulse, Moon, Scale } from "lucide-react";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-8 border-b border-border-light py-10 last:border-b-0">
      <div className="mb-6">
        <h2 className="text-section font-semibold leading-title tracking-title text-text-primary">
          {title}
        </h2>
        <p className="mt-2 text-body text-text-secondary">{description}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: string }) {
  return (
    <p className="mb-3 text-label font-medium tracking-label text-text-muted uppercase">
      {children}
    </p>
  );
}

export default function ComponentsGalleryPage() {
  const { showToast } = useToast();
  const [weight, setWeight] = useState("95,45");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppShell withBottomNav={false} className="pb-16">
      <div className="px-5 pt-safe">
        <header className="border-b border-border-light py-8">
          <p className="text-label font-medium tracking-label text-text-muted uppercase">
            Solo desarrollo
          </p>
          <h1 className="mt-2 text-display font-bold leading-display tracking-display text-text-primary">
            Design System
          </h1>
          <p className="mt-3 max-w-xl text-body text-text-secondary">
            Galería visual de componentes TRAZA. Revisa variantes, estados y
            microinteracciones antes de construir pantallas de producto.
          </p>
        </header>

        <Section
          title="HeroCard"
          description="Panel compacto. Ilustración opcional. CTA al borde inferior."
        >
          <HeroCard
            eyebrow="Buenos días"
            title="Higinio"
            subtitle="Jueves · 30 de julio"
            value="Día A"
            meta={[
              { value: "52", label: "min" },
              { value: "8", label: "ejercicios" },
            ]}
            progress={0.375}
            progressLabel="3 / 8"
            actionLabel="Empezar entrenamiento"
            imageSrc="/exercises/hack-squat.png"
            imageAlt="Hack squat"
            onAction={() => showToast("Acción de ejemplo")}
          />
          <HeroCard
            eyebrow="Hoy"
            title="Sesión terminada"
            value="52 min"
            support="Buen trabajo. Nos vemos en la próxima sesión."
            imageSrc="/exercises/chest-supported-row.png"
            imageAlt="Chest supported row"
          />
        </Section>

        <Section
          title="MetricCard"
          description="Jerarquía por tamaño: featured, default y quiet. Densidad móvil."
        >
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard
              size="featured"
              label="Peso"
              value="95,45"
              unit="kg"
              trendLabel="−0,42 sem."
              trendDirection="down"
              className="col-span-2"
              onClick={() => showToast("Abrir peso")}
            />
            <MetricCard
              size="quiet"
              label="Sueño"
              value="7,3"
              unit="h"
              trendLabel="Media"
              trendDirection="flat"
            />
            <MetricCard
              size="quiet"
              label="Pasos"
              value="12.483"
              trendLabel="+1.204"
              trendDirection="up"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard label="Presión" value="112 / 71" />
            <MetricCard
              label="Cintura"
              value="86"
              unit="cm"
              trendLabel="−1,2 cm"
              trendDirection="down"
            />
          </div>
        </Section>

        <Section
          title="ModuleCard"
          description="Resumen del último estado de cada módulo. Entrada al detalle, no formulario."
        >
          <div className="grid grid-cols-2 gap-2.5">
            <ModuleCard
              icon={Scale}
              label="Peso"
              primary="95,45"
              primaryUnit="kg"
              secondary="23,2 % grasa"
              meta="Hoy · 07:08"
              onClick={() => showToast("Abrir módulo de peso")}
            />
            <ModuleCard
              icon={HeartPulse}
              label="Tensión"
              primary="112 / 71"
              secondary="63 ppm"
              meta="Hoy · 07:15"
            />
            <ModuleCard
              icon={Moon}
              label="Sueño"
              primary="7 h 21 min"
              secondary="78 puntos"
              meta="Hoy"
            />
            <ModuleCard
              icon={Footprints}
              label="Pasos"
              primary="12.483"
              meta="Hoy"
            />
          </div>
        </Section>

        <Section title="Buttons" description="Altura 56. Radio 18. Press scale 0.98.">
          <div className="flex flex-col gap-3">
            <Label>Primary</Label>
            <PrimaryButton onClick={() => showToast("Primary")}>
              Empezar entrenamiento
            </PrimaryButton>
            <PrimaryButton loading>Cargando</PrimaryButton>
            <PrimaryButton disabled>Deshabilitado</PrimaryButton>
          </div>
          <div className="flex flex-col gap-3">
            <Label>Secondary</Label>
            <SecondaryButton>Editar entrenamiento</SecondaryButton>
          </div>
          <div className="flex flex-col gap-3">
            <Label>Ghost</Label>
            <GhostButton>Seguir editando</GhostButton>
          </div>
          <div className="flex flex-col gap-3">
            <Label>Danger</Label>
            <DangerButton onClick={() => setDialogOpen(true)}>
              Eliminar
            </DangerButton>
          </div>
          <div className="flex gap-3">
            <PrimaryButton fullWidth={false} className="px-6">
              Compacto
            </PrimaryButton>
            <SecondaryButton fullWidth={false} className="px-6">
              Secundario
            </SecondaryButton>
          </div>
        </Section>

        <Section
          title="NumberInput"
          description="Teclado numérico, auto-select, unidad y limpiar."
        >
          <NumberInput
            label="Peso"
            unit="kg"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            onClear={() => setWeight("")}
            placeholder="0,00"
          />
          <NumberInput
            label="Repeticiones"
            value="10"
            hint="Rango objetivo 8–12"
            readOnly
          />
          <NumberInput label="Presión" error="Introduce un valor válido" />
          <NumberInput label="Deshabilitado" value="50" disabled unit="kg" />
        </Section>

        <Section title="StatChip" description="Máximo dos palabras. Sin párrafos.">
          <div className="flex flex-wrap gap-2">
            <StatChip>Hoy</StatChip>
            <StatChip variant="success">Completado</StatChip>
            <StatChip variant="warning">Pendiente</StatChip>
            <StatChip variant="primary">Activo</StatChip>
            <StatChip variant="muted">Opcional</StatChip>
            <StatChip variant="muted">Omitido</StatChip>
          </div>
        </Section>

        <Section title="PageHeader" description="Atrás, título, acción opcional.">
          <div className="rounded-l bg-surface px-2 shadow-xs">
            <PageHeader title="Historial de peso" onBack={() => history.back()} />
          </div>
          <div className="rounded-l bg-surface px-2 shadow-xs">
            <PageHeader
              title="Ejercicios"
              action={
                <button
                  type="button"
                  className="text-caption font-semibold text-text-primary"
                >
                  Añadir
                </button>
              }
            />
          </div>
        </Section>

        <Section title="HistoryRow" description="Fila completa pulsable. Altura 64.">
          <HistoryRow
            date="30 de julio de 2026"
            value="95,45 kg"
            onClick={() => showToast("Fila seleccionada")}
          />
          <HistoryRow date="29 de julio de 2026" value="95,80 kg" />
          <HistoryRow date="28 de julio de 2026" value="96,10 kg" />
        </Section>

        <Section
          title="BottomNavigation"
          description="Entrenar centrado y destacado. Etiquetas en español."
        >
          <div className="overflow-hidden rounded-l border border-border bg-surface-secondary pt-8">
            <BottomNavigation fixed={false} />
          </div>
          <p className="text-caption text-text-muted">
            La barra real está fija en las rutas de la app. Aquí se muestra el
            aspecto dentro de un marco.
          </p>
        </Section>

        <Section title="BottomSheet" description="Interacciones rápidas. No a pantalla completa.">
          <SecondaryButton onClick={() => setSheetOpen(true)}>
            Abrir hoja inferior
          </SecondaryButton>
          <BottomSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="Registrar peso"
          >
            <NumberInput label="Peso" unit="kg" placeholder="0,00" defaultValue="95,45" />
            <div className="mt-5">
              <PrimaryButton
                onClick={() => {
                  setSheetOpen(false);
                  showToast("Peso guardado.", "success");
                }}
              >
                Guardar
              </PrimaryButton>
            </div>
          </BottomSheet>
        </Section>

        <Section
          title="EmptyState"
          description="Ilustración + explicación + CTA. Nunca solo texto."
        >
          <div className="rounded-l bg-surface shadow-m">
            <EmptyState
              title="Aún no hay peso registrado"
              description="Empieza hoy y comenzarás a construir tu historial de progreso."
              actionLabel="Registrar peso"
              onAction={() => showToast("Registrar peso")}
            />
          </div>
        </Section>

        <Section
          title="LoadingSkeleton"
          description="Skeletons que preservan el layout. Sin spinners como estado principal."
        >
          <HeroCardSkeleton />
          <div className="grid grid-cols-2 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <HistoryRowSkeleton />
          <LoadingSkeleton className="h-12 w-full" rounded="m" />
        </Section>

        <Section title="Toast" description="3 segundos. Abajo. No bloquea.">
          <div className="flex flex-col gap-3">
            <PrimaryButton onClick={() => showToast("Peso guardado.", "success")}>
              Toast de éxito
            </PrimaryButton>
            <SecondaryButton onClick={() => showToast("No se han podido guardar los cambios.", "danger")}>
              Toast de error
            </SecondaryButton>
            <GhostButton onClick={() => showToast("Rutina actualizada.")}>
              Toast neutro
            </GhostButton>
          </div>
          <div className="relative h-24 overflow-hidden rounded-l bg-surface-secondary">
            <div className="absolute inset-x-4 bottom-4">
              <Toast message="Ejemplo estático de toast" animateEntrance={false} />
            </div>
          </div>
        </Section>

        <Section
          title="ConfirmationDialog"
          description="Solo para eliminar, descartar o cerrar sesión."
        >
          <DangerButton onClick={() => setDialogOpen(true)}>
            Abrir confirmación
          </DangerButton>
          <ConfirmationDialog
            open={dialogOpen}
            title="¿Eliminar entrenamiento?"
            description="Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            cancelLabel="Cancelar"
            onConfirm={() => {
              setDialogOpen(false);
              showToast("Entrenamiento eliminado.", "success");
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </Section>
      </div>
    </AppShell>
  );
}
