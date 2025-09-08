// components/hki/edit-hki-modal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HKIForm } from "@/components/forms/hki-form";
import { JenisHKI, StatusHKI, Pengusul } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, PencilLine } from "lucide-react";
import { useHKIEntry } from "@/hooks/use-hki-entry";

interface EditHKIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hkiId: number | null;
  formOptions: {
    jenisOptions: JenisHKI[];
    statusOptions: StatusHKI[];
    tahunOptions: { tahun: number }[];
    pengusulOptions: Pengusul[];
  };
}

const FormSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);

const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <Alert variant="destructive" className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Gagal Memuat Data</AlertTitle>
    </div>
    <AlertDescription>{error}</AlertDescription>
    <Button onClick={onRetry} variant="destructive" size="sm">
      Coba Lagi
    </Button>
  </Alert>
);

export function EditHKIModal({
  isOpen,
  onClose,
  onSuccess,
  hkiId,
  formOptions,
}: EditHKIModalProps) {
  const { data, isLoading, error, refetch } = useHKIEntry(hkiId, isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center gap-3 px-6 py-4 border-b">
          <div className="bg-primary/10 p-2 rounded-md">
            <PencilLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold">
              {isLoading
                ? "Memuat Data..."
                : data
                ? "Edit Entri HKI"
                : "Gagal Memuat"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {data
                ? `Perbarui informasi untuk "${data.nama_hki}"`
                : "Silakan coba lagi memuat data."}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          {isLoading && <FormSkeleton />}
          {error && !isLoading && (
            <ErrorDisplay error={error} onRetry={refetch} />
          )}
          {!isLoading && !error && data && (
            <HKIForm
              mode="edit"
              initialData={data}
              jenisOptions={formOptions.jenisOptions}
              statusOptions={formOptions.statusOptions}
              tahunOptions={formOptions.tahunOptions}
              pengusulOptions={formOptions.pengusulOptions}
              onSuccess={onSuccess}
            />
          )}
        </div>

        {/* Footer → tombol cuma di modal */}
        <div className="flex justify-end gap-3 px-6 py-3 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="hki-form">
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
