import React from "react";
import { Bold, Heading2, Heading3, List, ListOrdered, Pilcrow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FONTS = ["Inter", "Georgia", "Arial", "Verdana", "Times New Roman", "Courier New"];

type RichTextDescriptionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function RichTextDescriptionEditor({ value, onChange, placeholder }: RichTextDescriptionEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const syncValue = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  return (
    <div className="rounded border border-transparent focus-within:border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 px-0 pb-2">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Paragraph" onClick={() => runCommand("formatBlock", "p")}>
          <Pilcrow className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Heading 2" onClick={() => runCommand("formatBlock", "h2")}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Heading 3" onClick={() => runCommand("formatBlock", "h3")}>
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Bold" onClick={() => runCommand("bold")}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Bulleted list" onClick={() => runCommand("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Numbered list" onClick={() => runCommand("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Select onValueChange={(font) => runCommand("fontName", font)}>
          <SelectTrigger className="ml-1 h-8 w-44 text-xs">
            <SelectValue placeholder="Typography" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((font) => (
              <SelectItem key={font} value={font}>
                <span style={{ fontFamily: font }}>{font}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={syncValue}
        onBlur={syncValue}
        className="min-h-[5.5rem] px-0 py-3 text-sm leading-relaxed text-muted-foreground outline-none empty:before:pointer-events-none empty:before:text-muted-foreground/70 empty:before:content-[attr(data-placeholder)] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
