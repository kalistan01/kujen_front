import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Eye, FileText, Loader2, Trash2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export type ContainerDocument = {
  _id?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
};

type ContainerDocumentsProps = {
  assignmentId: string;
  containerId: string;
  containerNo?: string;
  documents?: ContainerDocument[];
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

function formatSize(size?: number) {
  if (!size || size < 0) return "";
  if (size < 1024) return `${size} B`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function ContainerDocuments({
  assignmentId,
  containerId,
  containerNo,
  documents = [],
  canManage,
  onChanged,
}: ContainerDocumentsProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
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
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setZoom(1);
    setGrabbing(false);
    dragRef.current = null;
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

  const onPick = async (list: FileList | null) => {
    const file = list?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file || uploading) return;
    setUploading(true);
    try {
      const prepared = await compressUpload(file);
      await baseUrl.post(
        `assignlorry/${assignmentId}/containers/${containerId}/documents`,
        {
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
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (doc: ContainerDocument) => {
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
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return {
          url,
          mimeType: doc.mimeType || blob.type,
          name: doc.originalName || "Document",
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

  const file = documents[0];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 px-0"
        aria-label={file ? "Replace document" : "Upload document"}
        onClick={() => setOpen(true)}
      >
        <Upload className="h-3.5 w-3.5" />
      </Button>
      {file ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 px-0"
          aria-label="View document"
          disabled={openingId === file._id}
          onClick={() => openDocument(file)}
        >
          {openingId === file._id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </Button>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && preview) return;
          setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Document{containerNo ? ` · ${containerNo}` : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            One image or PDF, compressed to under 100KB. Uploading again replaces the current file.
          </p>
          {canManage ? (
            <div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(event) => onPick(event.target.files)}
              />
              <Button
                type="button"
                size="sm"
                className="h-8"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploading ? "Compressing..." : file ? "Replace file" : "Upload image or PDF"}
              </Button>
            </div>
          ) : null}
          {file ? (
            <div className="flex items-center gap-2 rounded-md border border-border/80 px-2 py-1.5">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => openDocument(file)}
                disabled={openingId === file._id}
              >
                {openingId === file._id ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {file.originalName || "Document"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {file.mimeType === "application/pdf" ? "PDF" : "Image"}
                    {file.size ? ` · ${formatSize(file.size)}` : ""}
                  </span>
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
          ) : (
            <p className="text-sm text-muted-foreground">No file yet.</p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(next) => {
          if (!next) closePreview();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <DialogTitle className="truncate">{preview?.name || "Document"}</DialogTitle>
              <div className="flex shrink-0 items-center gap-1">
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
              </div>
            </div>
          </DialogHeader>
          <div
            ref={viewRef}
            className={`max-h-[70vh] overflow-auto rounded-md border border-border bg-muted/30 ${
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
              <img
                src={preview.url}
                alt={preview.name}
                draggable={false}
                className="pointer-events-none mx-auto h-auto max-w-none select-none"
                style={{ width: `${zoom * 100}%` }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
