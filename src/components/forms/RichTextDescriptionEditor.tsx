import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { quickPrompt } from "@/lib/ai_agent";
import {
  Bold,
  BotMessageSquareIcon,
  Check,
  Heading2,
  Heading3,
  Italic,
  Link2Icon,
  List,
  ListOrdered,
  Loader2,
  Pilcrow,
  RefreshCw,
  Sparkles,
  Underline as UnderlineIcon,
  Unlink,
  X,
} from "lucide-react";
import React from "react";

// ─── Font Configuration ────────────────────────────────────────────
const FONTS = [
  { name: "Inter", family: "Inter" },
  { name: "Georgia", family: "Georgia" },
  { name: "Roboto", family: "Roboto" },
  { name: "Lora", family: "Lora" },
  { name: "Playfair Display", family: "Playfair Display" },
  { name: "Merriweather", family: "Merriweather" },
  { name: "Open Sans", family: "Open Sans" },
  { name: "Arial", family: "Arial" },
  { name: "Verdana", family: "Verdana" },
  { name: "Times New Roman", family: "Times New Roman" },
  { name: "Courier New", family: "Courier New" },
];

// Load Google Fonts dynamically (skip system fonts)
const SYSTEM_FONTS = new Set(["Arial", "Verdana", "Times New Roman", "Courier New", "Georgia"]);
const GOOGLE_FONT_FAMILIES = FONTS.filter((f) => !SYSTEM_FONTS.has(f.family)).map(
  (f) => f.family.replace(/ /g, "+") + ":wght@300;400;500;600;700"
);
const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${GOOGLE_FONT_FAMILIES.map((f) => `family=${f}`).join("&")}&display=swap`;

// Inject the font stylesheet once
let _fontsInjected = false;
function injectFonts() {
  if (_fontsInjected) return;
  _fontsInjected = true;
  if (!document.querySelector(`link[href="${GOOGLE_FONTS_URL}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }
}

// ─── Types ─────────────────────────────────────────────────────────
type RichTextDescriptionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// ─── Component ─────────────────────────────────────────────────────
export default function RichTextDescriptionEditor({
  value,
  onChange,
  placeholder,
}: RichTextDescriptionEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const isInternalChange = React.useRef(false);

  // Inject Google Fonts on mount
  React.useEffect(() => {
    injectFonts();
  }, []);

  // Only sync external value changes (not our own edits)
  React.useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const syncValue = () => {
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML || "");
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  // ─── Link Insertion ────────────────────────────────────────────
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkText, setLinkText] = React.useState("");
  const [linkOpen, setLinkOpen] = React.useState(false);

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    editorRef.current?.focus();

    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;

    // Check if there's selected text
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      document.execCommand("createLink", false, url);
    } else if (linkText.trim()) {
      // Insert link with custom text
      const anchor = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: hsl(var(--primary)); text-decoration: underline;">${linkText}</a>`;
      document.execCommand("insertHTML", false, anchor);
    } else {
      // Insert URL as both text and link
      const anchor = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: hsl(var(--primary)); text-decoration: underline;">${url}</a>`;
      document.execCommand("insertHTML", false, anchor);
    }

    syncValue();
    setLinkUrl("");
    setLinkText("");
    setLinkOpen(false);
  };

  const handleRemoveLink = () => {
    editorRef.current?.focus();
    document.execCommand("unlink");
    syncValue();
  };

  // ─── AI Features ───────────────────────────────────────────────
  const [aiLoading, setAiLoading] = React.useState<"enhance" | "rephrase" | null>(null);
  const [aiPreview, setAiPreview] = React.useState<string | null>(null);

  const getEditorText = (): string => {
    return editorRef.current?.innerText?.trim() || "";
  };

  const handleAIEnhance = async () => {
    const text = getEditorText();
    if (!text) return;
    setAiLoading("enhance");
    setAiPreview(null);
    try {
      const result = await quickPrompt(
        `You are a professional editor. Enhance and improve the following form description text to be more professional, clear, and engaging. Keep the same general meaning but improve the writing quality, grammar, and flow. Add appropriate formatting if helpful. Only return the improved text, dont include any * or use of markdown feature and keep context conise,nothing else.\n\nOriginal text:\n${text}`
      );
      setAiPreview(result.trim());
    } catch (err) {
      console.error("AI enhance failed:", err);
      setAiPreview(null);
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIRephrase = async () => {
    const text = getEditorText();
    if (!text) return;
    setAiLoading("rephrase");
    setAiPreview(null);
    try {
      const result = await quickPrompt(
        `You are a professional editor. Completely rephrase and rewrite the following form description text in a different way while preserving the same meaning and intent. Use different sentence structures and vocabulary. Only return the rephrased text, nothing else.\n\nOriginal text:\n${text}`
      );
      setAiPreview(result.trim());
    } catch (err) {
      console.error("AI rephrase failed:", err);
      setAiPreview(null);
    } finally {
      setAiLoading(null);
    }
  };

  const acceptAIPreview = () => {
    if (aiPreview && editorRef.current) {
      editorRef.current.innerText = aiPreview;
      syncValue();
      setAiPreview(null);
    }
  };

  const rejectAIPreview = () => {
    setAiPreview(null);
  };

  // ─── Toolbar Button Helper ────────────────────────────────────
  const ToolbarBtn = ({
    title,
    icon: Icon,
    onClick,
    active,
    disabled,
    className,
  }: {
    title: string;
    icon: React.ElementType;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    className?: string;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="icon"
            className={`h-8 w-8 ${className || ""}`}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="rounded border border-border/40 bg-background/50 focus-within:border-primary/100 transition-all duration-200">
      {/* ─── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/40 px-2 py-1.5">
        {/* Text Format Group */}
        <div className="flex items-center gap-0.5">
          <ToolbarBtn title="Paragraph" icon={Pilcrow} onClick={() => runCommand("formatBlock", "p")} />
          <ToolbarBtn title="Heading 2" icon={Heading2} onClick={() => runCommand("formatBlock", "h2")} />
          <ToolbarBtn title="Heading 3" icon={Heading3} onClick={() => runCommand("formatBlock", "h3")} />
        </div>

        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Inline Format Group */}
        <div className="flex items-center gap-0.5">
          <ToolbarBtn title="Bold (Ctrl+B)" icon={Bold} onClick={() => runCommand("bold")} />
          <ToolbarBtn title="Italic (Ctrl+I)" icon={Italic} onClick={() => runCommand("italic")} />
          <ToolbarBtn title="Underline (Ctrl+U)" icon={UnderlineIcon} onClick={() => runCommand("underline")} />
        </div>

        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* List Group */}
        <div className="flex items-center gap-0.5">
          <ToolbarBtn title="Bulleted list" icon={List} onClick={() => runCommand("insertUnorderedList")} />
          <ToolbarBtn title="Numbered list" icon={ListOrdered} onClick={() => runCommand("insertOrderedList")} />
        </div>

        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Link Group */}
        <div className="flex items-center gap-0.5">
          <Popover open={linkOpen} onOpenChange={setLinkOpen}>
            <PopoverTrigger asChild>
              <div>
                <ToolbarBtn title="Insert link" icon={Link2Icon} onClick={() => setLinkOpen(true)} />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" side="bottom" align="start">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Insert Link</p>
                <Input
                  placeholder="Display text (optional)"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInsertLink();
                    }
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLinkOpen(false);
                      setLinkUrl("");
                      setLinkText("");
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleInsertLink}
                    disabled={!linkUrl.trim()}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Link2Icon className="h-3 w-3" />
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <ToolbarBtn title="Remove link" icon={Unlink} onClick={handleRemoveLink} />
        </div>

        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Font Selector */}
        <Select onValueChange={(font) => runCommand("fontName", font)}>
          <SelectTrigger className="h-8 w-[140px] text-xs border-border/40">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((font) => (
              <SelectItem key={font.family} value={font.family}>
                <span style={{ fontFamily: font.family }}>{font.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* AI Buttons */}
        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs px-2.5 text-violet-500 hover:text-violet-600 hover:bg-violet-500/10"
                  onClick={handleAIEnhance}
                  disabled={aiLoading !== null}
                >
                  {aiLoading === "enhance" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BotMessageSquareIcon className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span className="hidden sm:inline">Enhance</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">AI-powered text enhancement</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs px-2.5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                  onClick={handleAIRephrase}
                  disabled={aiLoading !== null}
                >
                  {aiLoading === "rephrase" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Rephrase</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">AI-powered text rephrasing</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ─── AI Preview Banner ───────────────────────────────────── */}
      {aiPreview && (
        <div className="border-b border-violet-500/20 bg-violet-500/5 px-3 py-2.5 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400">AI Suggestion</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-5.5">{aiPreview}</p>
          <div className="flex items-center gap-2 pl-5.5">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700"
              onClick={acceptAIPreview}
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1.5"
              onClick={rejectAIPreview}
            >
              <X className="h-3 w-3" />
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* ─── Editor Area ─────────────────────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={syncValue}
        onBlur={syncValue}
        className="min-h-[5.5rem] px-3 py-3 text-sm leading-relaxed text-muted-foreground outline-none empty:before:pointer-events-none empty:before:text-muted-foreground/50 empty:before:content-[attr(data-placeholder)] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
      />
    </div>
  );
}
