import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import baseUrl from "@/api/baseUrl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";

const COMMANDS = [
  { command: "bold", label: "Bold", icon: Bold },
  { command: "italic", label: "Italic", icon: Italic },
  { command: "underline", label: "Underline", icon: Underline },
  { command: "insertUnorderedList", label: "Bullet list", icon: List },
  { command: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
] as const;

function NoteEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml;
  }, [initialHtml]);

  const apply = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    onChange(editorRef.current?.innerHTML || "");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        {COMMANDS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.command}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={item.label}
              title={item.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => apply(item.command)}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label="Note"
        className="min-h-[calc(100vh-6.5rem)] flex-1 overflow-auto px-4 py-3 text-sm leading-relaxed outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
      />
    </div>
  );
}

export function NotePage() {
  const { toast } = useToast();
  const [html, setHtml] = useState("");
  const [loadedHtml, setLoadedHtml] = useState("");
  const [ready, setReady] = useState(false);
  const savedRef = useRef("");
  const htmlRef = useRef("");
  const readyRef = useRef(false);
  const savingRef = useRef(false);
  const queuedRef = useRef<string | null>(null);
  const toastRef = useRef(toast);
  toastRef.current = toast;
  htmlRef.current = html;
  readyRef.current = ready;

  const persist = async (value: string) => {
    if (value === savedRef.current) return;
    if (savingRef.current) {
      queuedRef.current = value;
      return;
    }
    savingRef.current = true;
    try {
      await baseUrl.put("/note", { html: value });
      if (queuedRef.current == null) savedRef.current = value;
    } catch (error) {
      toastRef.current({
        title: "Could not save note",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      savingRef.current = false;
      const queued = queuedRef.current;
      queuedRef.current = null;
      if (queued != null && queued !== savedRef.current) {
        void persist(queued);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    baseUrl
      .get("/note")
      .then((response) => {
        if (cancelled) return;
        const next = String(response.data?.data?.html || "");
        savedRef.current = next;
        setHtml(next);
        setLoadedHtml(next);
        setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setReady(true);
        toastRef.current({
          title: "Could not load note",
          description: getApiErrorMessage(error, "Please try again."),
          variant: "destructive",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    return () => {
      const latest = htmlRef.current;
      if (readyRef.current && latest !== savedRef.current) {
        void persistRef.current(latest);
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || html === savedRef.current) return;
    const pending = html;
    const timer = window.setTimeout(() => {
      void persist(pending);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [html, ready]);

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col">
      {ready ? (
        <NoteEditor key={loadedHtml} initialHtml={loadedHtml} onChange={setHtml} />
      ) : (
        <div className="flex min-h-[calc(100vh-6.5rem)] flex-1 items-center justify-center rounded-xl border border-border/80 text-sm text-muted-foreground">
          Loading note...
        </div>
      )}
    </div>
  );
}
