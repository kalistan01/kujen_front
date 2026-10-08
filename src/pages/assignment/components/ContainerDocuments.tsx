import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  FileText,
  Loader2,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import baseUrl from "@/api/baseUrl";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { compressUpload } from "../lib/compressFile";

export const DOCUMENT_SLOTS = [
  { id: "weight-sheet", label: "Weight sheet" },
  { id: "gate-pass", label: "Gate pass" },
] as const;

export type DocumentSlot = (typeof DOCUMENT_SLOTS)[number]["id"];

export function documentSlotLabel(slot?: string) {
  return DOCUMENT_SLOTS.find((item) => item.id === slot)?.label || "";
}

export type ContainerDocument = {
  _id?: string;
  slot?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
};

type ContainerDocumentsProps = {
  assignmentId: string;
  containerId: string;
  containerNo?: string;
  documents?: ContainerDocument[];
  receivedWeight?: number;
  declaredWeight?: number;
  canManage: boolean;
  onChanged?: () => void;
};

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

function nextZoom(current: number, direction: 1 | -1) {
  if (direction > 0) {
    return ZOOM_STEPS.find((step) => step > current + 0.01) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  }
  const previous = [...ZOOM_STEPS].reverse().find((step) => step < current - 0.01);
  return previous ?? ZOOM_STEPS[0];
}

const SLOT_ICONS: Record<DocumentSlot, string> = {
  "weight-sheet": "/weightsheet.png",
  "gate-pass": "/gatepass.png",
};

function SlotIcon({ slot, className }: { slot: DocumentSlot; className?: string }) {
  return <img src={SLOT_ICONS[slot]} alt="" className={className} />;
}

function slotHoverLabel(slot: DocumentSlot) {
  return slot === "weight-sheet" ? "Weight" : "Gate";
}

function slotButtonClass() {
  return "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900";
}

function formatSize(size?: number) {
  if (!size || size < 0) return "";
  if (size < 1024) return `${size} B`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function knownSlot(slot?: string): DocumentSlot | undefined {
  return DOCUMENT_SLOTS.some((item) => item.id === slot)
    ? (slot as DocumentSlot)
    : undefined;
}

function quarterOf(turns: number) {
  return ((turns % 4) + 4) % 4;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function RotatedImage({
  src,
  alt,
  turns,
  zoom,
  fitHeight,
}: {
  src: string;
  alt: string;
  turns: number;
  zoom: number;
  fitHeight?: string;
}) {
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const quarter = quarterOf(turns);
  const swapped = quarter % 2 === 1;
  const ready = natural.w > 0 && natural.h > 0;
  const baseW = swapped ? natural.h : natural.w;
  const baseH = swapped ? natural.w : natural.h;
  const frameWidth =
    ready && fitHeight
      ? `min(100%, calc(${fitHeight} * ${baseW} / ${baseH}))`
      : `${zoom * 100}%`;

  return (
    <div
      className="relative mx-auto max-w-full"
      style={
        ready
          ? { width: frameWidth, aspectRatio: `${baseW} / ${baseH}` }
          : { width: frameWidth }
      }
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={(event) => {
          const img = event.currentTarget;
          setNatural({
            w: img.naturalWidth || 1,
            h: img.naturalHeight || 1,
          });
        }}
        className="pointer-events-none max-w-none select-none"
        style={
          ready
            ? {
                position: "absolute",
                left: "50%",
                top: "50%",
                width: swapped ? `${(baseH / baseW) * 100}%` : "100%",
                height: swapped ? "auto" : "100%",
                transform: `translate(-50%, -50%) rotate(${quarter * 90}deg)`,
              }
            : { width: "100%", height: "auto" }
        }
      />
    </div>
  );
}

export default function ContainerDocuments({
  assignmentId,
  containerId,
  containerNo,
  documents = [],
  receivedWeight,
  declaredWeight,
  canManage,
  onChanged,
}: ContainerDocumentsProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<DocumentSlot | "">("");
  const viewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [openingId, setOpeningId] = useState("");
  const [preview, setPreview] = useState<{
    url: string;
    mimeType: string;
    name: string;
    slot?: string;
  } | null>(null);
  const [adjust, setAdjust] = useState<{
    file: File;
    slot: DocumentSlot;
    url: string;
    turns: number;
  } | null>(null);
  const adjustUrlRef = useRef("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [grabbing, setGrabbing] = useState(false);
  const [savingRotation, setSavingRotation] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      if (adjustUrlRef.current) URL.revokeObjectURL(adjustUrlRef.current);
    };
  }, []);

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setZoom(1);
    setRotation(0);
    setGrabbing(false);
    dragRef.current = null;
  };

  const closeAdjust = () => {
    if (adjustUrlRef.current) URL.revokeObjectURL(adjustUrlRef.current);
    adjustUrlRef.current = "";
    setAdjust(null);
  };

  const turnAdjust = (direction: 1 | -1) => {
    setAdjust((current) =>
      current ? { ...current, turns: current.turns + direction } : current
    );
  };

  const isImage = Boolean(preview && preview.mimeType !== "application/pdf");

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!isImage || event.button !== 0) return;
    const node = viewRef.current;
    if (!node) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: node.scrollLeft,
      top: node.scrollTop,
    };
    setGrabbing(true);
    node.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const node = viewRef.current;
    if (!drag || !node) return;
    node.scrollLeft = drag.left - (event.clientX - drag.x);
    node.scrollTop = drag.top - (event.clientY - drag.y);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setGrabbing(false);
    if (viewRef.current?.hasPointerCapture(event.pointerId)) {
      viewRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const uploadFile = async (file: File, slot: DocumentSlot, turns = 0) => {
    setUploading(true);
    try {
      const prepared = await compressUpload(file, turns);
      await baseUrl.post(
        `assignlorry/${assignmentId}/containers/${containerId}/documents`,
        {
          slot,
          name: prepared.name,
          mimeType: prepared.mimeType,
          data: prepared.data,
        }
      );
      toast({
        title: "Uploaded",
        description: "The file is saved on this container.",
      });
      onChanged?.();
      return true;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: getApiErrorMessage(
          error,
          error instanceof Error
            ? error.message
            : "Could not upload the file. Please try again."
        ),
        variant: "destructive",
      });
      onChanged?.();
      return false;
    } finally {
      setUploading(false);
    }
  };

  const onPick = (list: FileList | null) => {
    const file = list?.[0];
    const slot = slotRef.current;
    if (inputRef.current) inputRef.current.value = "";
    if (!file || !slot || uploading) return;
    if (!isPdfFile(file) && file.type.startsWith("image/")) {
      if (adjustUrlRef.current) URL.revokeObjectURL(adjustUrlRef.current);
      const url = URL.createObjectURL(file);
      adjustUrlRef.current = url;
      setAdjust({ file, slot, url, turns: 0 });
      return;
    }
    void uploadFile(file, slot);
  };

  const confirmAdjust = async () => {
    if (!adjust || uploading) return;
    const saved = await uploadFile(adjust.file, adjust.slot, adjust.turns);
    if (saved) closeAdjust();
  };

  const openDocument = async (doc: ContainerDocument, slot?: string) => {
    if (!doc._id || openingId) return;
    setOpeningId(doc._id);
    try {
      const response = await baseUrl.get(
        `assignlorry/${assignmentId}/containers/${containerId}/documents/${doc._id}`,
        { responseType: "blob" }
      );
      const blob = response.data as Blob;
      if (blob.type.includes("json")) {
        throw new Error("Could not open this file.");
      }
      const url = URL.createObjectURL(blob);
      setZoom(1);
      setRotation(0);
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return {
          url,
          mimeType: doc.mimeType || blob.type,
          name: doc.originalName || "Document",
          slot: slot || doc.slot,
        };
      });
    } catch (error) {
      let description = "Could not open this file. Please try again.";
      const data = (error as { response?: { data?: Blob } })?.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text()) as { message?: string };
          if (parsed.message) description = parsed.message;
        } catch {
          description = getApiErrorMessage(error, description);
        }
      } else {
        description = getApiErrorMessage(error, description);
      }
      toast({
        title: "Could not open file",
        description,
        variant: "destructive",
      });
    } finally {
      setOpeningId("");
    }
  };

  const saveRotation = async () => {
    if (!preview || savingRotation || uploading) return;
    const slot = knownSlot(preview.slot);
    const quarter = quarterOf(rotation);
    if (!slot || quarter === 0 || preview.mimeType === "application/pdf") return;
    setSavingRotation(true);
    try {
      const blob = await fetch(preview.url).then((response) => response.blob());
      const file = new File([blob], preview.name || "image.jpg", {
        type: blob.type || preview.mimeType || "image/jpeg",
      });
      const prepared = await compressUpload(file, quarter);
      await baseUrl.post(
        `assignlorry/${assignmentId}/containers/${containerId}/documents`,
        {
          slot,
          name: prepared.name,
          mimeType: prepared.mimeType,
          data: prepared.data,
        }
      );
      toast({
        title: "Saved",
        description: "The image was rotated.",
      });
      onChanged?.();
      closePreview();
    } catch (error) {
      toast({
        title: "Could not save rotation",
        description: getApiErrorMessage(
          error,
          error instanceof Error
            ? error.message
            : "Could not rotate the image. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setSavingRotation(false);
    }
  };

  const removeDocument = async (doc: ContainerDocument) => {
    if (!doc._id || removingId) return;
    setRemovingId(doc._id);
    try {
      await baseUrl.delete(
        `assignlorry/${assignmentId}/containers/${containerId}/documents/${doc._id}`
      );
      toast({
        title: "Removed",
        description: "The file was removed from this container.",
      });
      onChanged?.();
    } catch (error) {
      toast({
        title: "Could not remove file",
        description: getApiErrorMessage(
          error,
          "Could not remove the file. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setRemovingId("");
    }
  };

  const receivedShort =
    (Number(declaredWeight) || 0) > (Number(receivedWeight) || 0);
  const files = documents.filter((file) => file._id);
  const fileFor = (slot: DocumentSlot) => {
    const named = files.find((file) => file.slot === slot);
    if (named) return named;
    if (slot === "weight-sheet") return files.find((file) => !file.slot);
    return undefined;
  };
  const placed = new Set(
    DOCUMENT_SLOTS.map((slot) => fileFor(slot.id)?._id).filter(Boolean)
  );
  const otherFiles = files.filter((file) => file._id && !placed.has(file._id));
  const chooseFile = (slot: DocumentSlot) => {
    slotRef.current = slot;
    inputRef.current?.click();
  };

  return (
    <>
      {canManage ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 px-0"
          aria-label={files.length ? "Add document" : "Upload document"}
          onClick={() => setOpen(true)}
        >
          <Upload className="h-3.5 w-3.5" />
        </Button>
      ) : null}
      {DOCUMENT_SLOTS.map((slot) => {
        const file = fileFor(slot.id);
        if (!file) return null;
        return (
          <Tooltip key={slot.id} delayDuration={200}>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`h-8 w-8 px-0 ${
                    slot.id === "weight-sheet" && receivedShort
                      ? "border-red-600 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-600"
                      : slotButtonClass()
                  }`}
                  aria-label={`View ${slotHoverLabel(slot.id)}`}
                  disabled={openingId === file._id}
                  onClick={() => openDocument(file, slot.id)}
                >
                  {openingId === file._id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SlotIcon slot={slot.id} className="h-5 w-5 object-contain" />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{slotHoverLabel(slot.id)}</TooltipContent>
          </Tooltip>
        );
      })}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && (preview || adjust)) return;
          setOpen(next);
        }}
      >
        <DialogContent
          className="min-w-0 overflow-x-clip sm:max-w-xl [&>*]:min-w-0"
          onPointerDownOutside={(event) => {
            if (preview || adjust) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (preview || adjust) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Documents{containerNo ? ` · ${containerNo}` : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Each file is an image or PDF, compressed to under 100KB. Images can be rotated before they are saved.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(event) => onPick(event.target.files)}
          />
          <div className="min-w-0 space-y-2">
            {DOCUMENT_SLOTS.map((slot) => {
              const file = fileFor(slot.id);
              return (
                <div
                  key={slot.id}
                  className={`flex min-w-0 items-center gap-2 rounded-md border px-2 py-1.5 ${
                    slot.id === "weight-sheet" && receivedShort
                      ? "border-red-600 bg-red-50"
                      : "border-border/80"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{slot.label}</p>
                    {file ? (
                      <button
                        type="button"
                        className="block w-full truncate text-left text-xs text-muted-foreground"
                        onClick={() => openDocument(file, slot.id)}
                        disabled={openingId === file._id}
                      >
                        {file.originalName || (file.mimeType === "application/pdf" ? "PDF" : "Image")}
                        {file.size ? ` · ${formatSize(file.size)}` : ""}
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground">No file yet</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {file ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-8 w-8 px-0 ${
                          slot.id === "weight-sheet" && receivedShort
                            ? "border-red-600 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-600"
                            : slotButtonClass()
                        }`}
                        aria-label={`View ${slot.label}`}
                        disabled={openingId === file._id}
                        onClick={() => openDocument(file, slot.id)}
                      >
                        {openingId === file._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <SlotIcon slot={slot.id} className="h-5 w-5 object-contain" />
                        )}
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        disabled={uploading}
                        onClick={() => chooseFile(slot.id)}
                      >
                        {uploading && slotRef.current === slot.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        {file ? "Replace" : "Upload"}
                      </Button>
                    ) : null}
                    {canManage && file ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 px-0"
                        disabled={removingId === file._id}
                        onClick={() => removeDocument(file)}
                        aria-label={`Remove ${slot.label}`}
                      >
                        {removingId === file._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {otherFiles.map((file) => (
              <div
                key={file._id}
                className="flex min-w-0 items-center gap-2 rounded-md border border-border/80 px-2 py-1.5"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => openDocument(file, file.slot)}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate text-sm">
                    {file.originalName || "Document"}
                  </span>
                </button>
                {canManage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 px-0"
                    disabled={removingId === file._id}
                    onClick={() => removeDocument(file)}
                    aria-label={`Remove ${file.originalName || "document"}`}
                  >
                    {removingId === file._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(adjust)}
        onOpenChange={(next) => {
          if (!next && !uploading) closeAdjust();
        }}
      >
        <DialogContent className="max-h-[90vh] min-w-0 overflow-hidden sm:max-w-lg [&>*]:min-w-0">
          <DialogHeader>
            <DialogTitle>
              Rotate {documentSlotLabel(adjust?.slot) || "image"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Turn the photo so it is upright, then upload it.
          </p>
          <div className="flex min-w-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30 p-2">
            {adjust ? (
              <RotatedImage
                src={adjust.url}
                alt={adjust.file.name}
                turns={adjust.turns}
                zoom={1}
                fitHeight="46vh"
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 px-0"
                aria-label="Rotate left"
                disabled={uploading}
                onClick={() => turnAdjust(-1)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 px-0"
                aria-label="Rotate right"
                disabled={uploading}
                onClick={() => turnAdjust(1)}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
                {quarterOf(adjust?.turns || 0) * 90}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={closeAdjust}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={uploading || !adjust}
                onClick={() => void confirmAdjust()}
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(next) => {
          if (!next && !savingRotation) closePreview();
        }}
      >
        <DialogContent className="max-h-[90vh] min-w-0 overflow-hidden sm:max-w-3xl [&>*]:min-w-0">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle className="truncate">{preview?.name || "Document"}</DialogTitle>
              <div className="flex shrink-0 items-center gap-1">
                {isImage ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 px-0"
                      aria-label="Rotate left"
                      disabled={savingRotation}
                      onClick={() => {
                        setRotation((current) => current - 1);
                        if (viewRef.current) {
                          viewRef.current.scrollLeft = 0;
                          viewRef.current.scrollTop = 0;
                        }
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 px-0"
                      aria-label="Rotate right"
                      disabled={savingRotation}
                      onClick={() => {
                        setRotation((current) => current + 1);
                        if (viewRef.current) {
                          viewRef.current.scrollLeft = 0;
                          viewRef.current.scrollTop = 0;
                        }
                      }}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
                      {quarterOf(rotation) * 90}°
                    </span>
                  </>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0"
                  aria-label="Zoom out"
                  disabled={zoom <= ZOOM_STEPS[0]}
                  onClick={() => setZoom((current) => nextZoom(current, -1))}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0"
                  aria-label="Zoom in"
                  disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                  onClick={() => setZoom((current) => nextZoom(current, 1))}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                {isImage && canManage && knownSlot(preview?.slot) && quarterOf(rotation) !== 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    disabled={savingRotation}
                    onClick={() => void saveRotation()}
                  >
                    {savingRotation ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Save
                  </Button>
                ) : null}
              </div>
            </div>
          </DialogHeader>
          <div
            ref={viewRef}
            className={`min-w-0 max-h-[70vh] overflow-auto rounded-md border border-border bg-muted/30 ${
              isImage ? (grabbing ? "cursor-grabbing" : "cursor-grab") : ""
            }`}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onWheel={(event) => {
              if (!event.ctrlKey && !event.metaKey) return;
              event.preventDefault();
              setZoom((current) => nextZoom(current, event.deltaY < 0 ? 1 : -1));
            }}
          >
            {preview?.mimeType === "application/pdf" ? (
              <iframe
                title={preview.name}
                src={preview.url}
                className="border-0"
                style={{
                  width: `${zoom * 100}%`,
                  height: `${70 * zoom}vh`,
                }}
              />
            ) : preview ? (
              <RotatedImage
                src={preview.url}
                alt={preview.name}
                turns={rotation}
                zoom={zoom}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
