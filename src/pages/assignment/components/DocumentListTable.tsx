import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Eye, FileText, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/TablePagination";
import baseUrl from "@/api/baseUrl";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate } from "../lib/dates";

export type DocumentListRow = {
  assignmentId: string;
  containerId: string;
  docId: string;
  blNo?: string;
  containerNo?: string;
  originalName?: string;
  mimeType?: string;
  uploadedAt?: string;
};

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

function nextZoom(current: number, direction: 1 | -1) {
  if (direction > 0) {
    return ZOOM_STEPS.find((step) => step > current + 0.01) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  }
  return [...ZOOM_STEPS].reverse().find((step) => step < current - 0.01) ?? ZOOM_STEPS[0];
}

function DocumentListTable({
  rows,
  total,
  hasFilters,
  page,
  pages,
  pageSize,
  onPageChange,
}: {
  rows: DocumentListRow[];
  total: number;
  hasFilters: boolean;
  page: number;
  pages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const viewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [openingId, setOpeningId] = useState("");
  const [zoom, setZoom] = useState(1);
  const [grabbing, setGrabbing] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    mimeType: string;
    name: string;
  } | null>(null);

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

  const openDocument = async (row: DocumentListRow) => {
    if (openingId) return;
    setOpeningId(row.docId);
    try {
      const response = await baseUrl.get(
        `assignlorry/${row.assignmentId}/containers/${row.containerId}/documents/${row.docId}`,
        { responseType: "blob" }
      );
      const blob = response.data as Blob;
      if (blob.type.includes("json")) throw new Error("Could not open this file.");
      const url = URL.createObjectURL(blob);
      setZoom(1);
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return {
          url,
          mimeType: row.mimeType || blob.type,
          name: row.originalName || "Document",
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

  return (
    <>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">
            {hasFilters ? "No matching documents" : "No documents"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different BL or container number."
              : "Uploaded container files appear here."}
          </p>
        </div>
      ) : (
        <Table className="[&_th]:h-8 [&_td]:py-1.5">
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead>BL NO</TableHead>
              <TableHead>Container</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Uploaded date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={`${row.assignmentId}-${row.containerId}-${row.docId}`}
                className="cursor-pointer"
                onClick={() =>
                  navigate(`/assignment/${row.assignmentId}`, {
                    state: { from: `${location.pathname}${location.search}` },
                  })
                }
              >
                <TableCell>
                  <span className="inline-flex rounded-md border border-[hsl(var(--brand-navy))]/15 bg-[hsl(var(--brand-navy))]/8 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-[hsl(var(--brand-navy))] dark:border-white/10 dark:bg-white/10 dark:text-white">
                    {row.blNo || "—"}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold">
                  {row.containerNo || "—"}
                </TableCell>
                <TableCell className="max-w-[240px] truncate">
                  {row.originalName || "Document"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(row.uploadedAt)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 px-0"
                    aria-label="View document"
                    disabled={openingId === row.docId}
                    onClick={(event) => {
                      event.stopPropagation();
                      openDocument(row);
                    }}
                  >
                    {openingId === row.docId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <TablePagination
        page={page}
        pages={pages}
        total={total}
        limit={pageSize}
        onPageChange={onPageChange}
      />
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
          >
            {preview?.mimeType === "application/pdf" ? (
              <iframe
                title={preview.name}
                src={preview.url}
                className="border-0"
                style={{ width: `${zoom * 100}%`, height: `${70 * zoom}vh` }}
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

export default DocumentListTable;
