import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Database, Loader2, Mic, MicOff, Send, Sparkles, Volume2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router-dom';
import remarkGfm from 'remark-gfm';

import { base44 } from '@/api/foreform';
import SEO from '@/components/SEO';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type Message = {
    id: string;
    role: 'user' | 'ai';
    content: string;
};

export default function ReviewPage() {
    const { id: formId } = useParams();

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'ai', content: "Hi! I'm your data analyst AI. I've reviewed your form responses. What would you like to know?" }
    ]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [voiceMode, setVoiceMode] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize Web Speech API
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let fullTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    fullTranscript += event.results[i][0].transcript;
                }
                setAiPrompt(fullTranscript);
            };

            recognitionRef.current.onend = () => {
                setVoiceMode(false);
            };

            recognitionRef.current.onerror = (e: any) => {
                console.error('Speech recognition error:', e);
                setVoiceMode(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    const { data: form } = useQuery({
        queryKey: ["form", formId],
        queryFn: () => base44.entities.Form.filter({ id: formId }),
        select: (data) => data[0],
        enabled: !!formId,
    });

    const { data: responses = [], isLoading: isLoadingResponses } = useQuery({
        queryKey: ["responses", formId],
        queryFn: () => base44.entities.FormResponse.filter({ form_id: formId }),
        enabled: !!formId,
    });

    // Collect all unique questions for table columns
    const allQuestions = React.useMemo(() => {
        const questionsMap = new Map<string, { id: string, label: string }>();
        responses.forEach((r: any) => {
            if (Array.isArray(r.answers)) {
                r.answers.forEach((a: any) => {
                    if (a.question_id && !questionsMap.has(a.question_id)) {
                        questionsMap.set(a.question_id, { id: a.question_id, label: a.question_label || a.question_id });
                    }
                });
            }
        });
        return Array.from(questionsMap.values());
    }, [responses]);

    // Auto scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isAiLoading]);

    const handleAskAi = async () => {
        if (!aiPrompt.trim() || !aiEnabled) return;

        const userMsg = aiPrompt;
        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
        setMessages(prev => [...prev, newUserMsg]);
        setAiPrompt('');
        setIsAiLoading(true);

        try {
            const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'Analyst'}: ${m.content}`).join('\n');

            let result = await base44.integrations.Core.InvokeLLM({
                prompt: `Act as a helpful, conversational, and highly intelligent human data analyst. You are analyzing form responses for form "${form?.title}". 
Data (JSON snippet): ${JSON.stringify(responses.slice(0, 30))}

Previous conversation history:
${historyText}
User: "${userMsg}"

Respond clearly, accurately, and thoughtfully. Keep it concise but fully answer the question. IMPORTANT: Return your response in standard markdown format. Do NOT wrap your entire response in a markdown code block (i.e. do not start and end with \`\`\`markdown).`,
            });

            if (result) {
                // Strip outer markdown code blocks if the LLM still returns them
                result = result.replace(/^```(?:markdown)?\s*\n/, '').replace(/\n```\s*$/, '');
            }

            const aiResponseMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: result || "I couldn't process that. Could you ask differently?" };
            setMessages(prev => [...prev, aiResponseMsg]);

            if (result) {
                // Strip basic markdown syntax for speech output
                const cleanText = result.replace(/[#_*~`]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
                const utterance = new SpeechSynthesisUtterance(cleanText);
                window.speechSynthesis.cancel(); // Stop current speech
                window.speechSynthesis.speak(utterance);
            }
        } catch (e) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: "I'm sorry, I encountered an error analyzing that right now. Please try again." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const toggleVoiceMode = () => {
        if (voiceMode) {
            recognitionRef.current?.stop();
            setVoiceMode(false);
        } else {
            setAiPrompt('');
            window.speechSynthesis.cancel();
            try {
                recognitionRef.current?.start();
                setVoiceMode(true);
            } catch (e) {
                console.error("Could not start speech recognition", e);
            }
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <SEO title={`${form?.title || "Form"} Review`} path={`/forms/${formId}/review`} />

            {/* Header */}
            <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm flex-shrink-0 z-10">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to={`/forms/${formId}/responses`}><ArrowLeft className="w-4 h-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="font-semibold text-sm flex items-center gap-2">
                                {form?.title || "Form Review"}
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20">Beta</Badge>
                            </h1>
                            <p className="text-xs text-muted-foreground">Advanced Data Review & AI Analysis</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border-r border-border pr-4">
                            <span className="text-xs font-medium text-muted-foreground">AI Intelligence</span>
                            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                        </div>
                        <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                            <Link to={`/forms/${formId}/responses`}>Classic View</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">

                    {/* Left Panel: AI & Analysis */}
                    {aiEnabled && (
                        <>
                            <ResizablePanel defaultSize={30} minSize={25} maxSize={35} className="bg-card flex flex-col border-r relative transition-all duration-300">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-primary/10 rounded-md">
                                            <img src='/icons/ai.svg' className="w-4 h-4 text-primary" />
                                        </div>
                                        <h2 className="font-semibold text-sm tracking-tight">Data Analyst AI</h2>
                                    </div>
                                    {/* Stats Summary */}
                                    <div className="flex gap-3 shrink-0">
                                        <div className="px-3 py-2 flex flex-col">
                                            <p className="text-sm font-semibold tracking-tight text-primary">{responses.length} <span className="font-bold">Responses</span></p>
                                        </div>
                                        <div className="px-3 py-2 flex flex-col">
                                            <p className="text-sm font-semibold tracking-tight text-primary">{allQuestions.length} <span className="font-bold">Columns</span></p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleVoiceMode}
                                        className={`h-8 w-8 rounded-full transition-colors ${voiceMode ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-600' : 'text-muted-foreground'}`}
                                        title={voiceMode ? "Voice Mode On (Listening)" : "Voice Mode Off"}
                                    >
                                        {voiceMode ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" ref={scrollRef}>
                                    {/* Chat Messages */}
                                    <div className="flex flex-col gap-3 pb-4">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                                                <div className="flex items-end gap-1.5">
                                                    {msg.role === 'ai' && (
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1">
                                                            <img src='/icons/ai.svg' className="w-4 h-4 text-primary" />
                                                        </div>
                                                    )}
                                                    <div className={`px-4 py-3 text-sm rounded-2xl ${msg.role === 'user'
                                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                        : 'bg-transparent text-black rounded-bl-sm max-w-full overflow-hidden break-words'
                                                        }`}>
                                                        {msg.role === 'user' ? (
                                                            msg.content
                                                        ) : (
                                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {msg.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {msg.role === 'user' && (
                                                        <Avatar className="w-7 h-7 border border-border/60" >
                                                            <AvatarImage src="https://github.com/shadcn.png" />
                                                            <AvatarFallback>user</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isAiLoading && (
                                            <div className="flex self-start max-w-[85%] gap-1.5 items-end">
                                                <div className="w-6 h-6 rounded-full  flex items-center justify-center shrink-0 mb-1">
                                                    <img src='/icons/ai.svg' className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="px-4 py-3 bg-transparent text-black rounded-2xl rounded-bl-sm border border-border/50">
                                                    <div className="flex gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.4s' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chat Input */}
                                <div className="p-4 border-t z-10 shrink-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50">
                                    <div className="relative flex items-end py-1 gap-1 shadow-sm border border-border/60 rounded-xl bg-card overflow-hidden focus-within:ring-1 focus-within:border-primary transition-all">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`absolute left-1 top-3.5 h-8 w-8 shrink-0 rounded-lg transition-colors ${voiceMode ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                                            title={voiceMode ? "Stop listening" : "Start Voice Mode"}
                                            onClick={toggleVoiceMode}
                                        >
                                            <Mic className={`w-4 h-4 ${voiceMode ? 'animate-pulse' : ''}`} />
                                        </Button>
                                        <Textarea
                                            placeholder={voiceMode ? "Listening..." : "Describe your form..."}
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAskAi();
                                                }
                                            }}
                                            className={`min-h-[52px] max-h-[200px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 pl-10 pr-12 py-3.5 text-sm ${voiceMode ? 'bg-rose-50/50' : ''}`}
                                            rows={1}
                                        />
                                        <div className="absolute right-1.5 bottom-1.5 flex items-center shrink-0">
                                            <Button
                                                size="icon"
                                                className={`h-8 w-8 rounded-lg ${voiceMode && !aiPrompt ? 'bg-rose-500 hover:bg-rose-600 animate-pulse' : 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'}`}
                                                onClick={handleAskAi}
                                                disabled={isAiLoading || (!aiPrompt.trim() && !voiceMode)}
                                            >
                                                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                    (voiceMode && !aiPrompt) ? <Volume2 className="w-4 h-4" /> : <Send className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle withHandle />
                        </>
                    )}

                    {/* Middle/Right Panel: Data Table */}
                    <ResizablePanel defaultSize={aiEnabled ? 70 : 100}>
                        <div className="h-full flex flex-col bg-muted/5">
                            <div className="px-6 py-4 border-b flex items-center justify-between bg-card shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/5 rounded-lg">
                                        <Database className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-sm">Response Dataset</h2>
                                        <p className="text-[11px] text-muted-foreground  font-medium">Structured View</p>
                                    </div>
                                </div>
                                {!aiEnabled && (
                                    <Button variant="outline" size="sm" onClick={() => setAiEnabled(true)} className="gap-1.5 h-8 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Enable AI Insights
                                    </Button>
                                )}
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                {isLoadingResponses ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full rounded-md" />
                                        <Skeleton className="h-12 w-full rounded-md" />
                                        <Skeleton className="h-12 w-full rounded-md" />
                                        <Skeleton className="h-12 w-full rounded-md" />
                                    </div>
                                ) : responses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 text-muted-foreground">
                                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                            <Database className="w-10 h-10 opacity-30" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">No Dataset Available</h3>
                                        <p className="mt-2 text-sm max-w-sm">There are no responses for this form yet. Share your form to start collecting data.</p>
                                    </div>
                                ) : (
                                    <Card className="border-border/60 rounded overflow-hidden bg-card h-full flex flex-col">
                                        <div className="overflow-auto flex-1">
                                            <Table>
                                                <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="w-[180px] font-semibold text-[11px]  text-muted-foreground">Date Submitted</TableHead>
                                                        <TableHead className="w-[160px] font-semibold text-[11px]  text-muted-foreground border-l border-border/40">Participant</TableHead>
                                                        {allQuestions.map(q => (
                                                            <TableHead key={q.id} className="min-w-[200px] font-semibold text-[11px]  text-muted-foreground border-l border-border/40">
                                                                <div className="truncate max-w-[250px]" title={q.label}>{q.label}</div>
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {responses.map((response: any) => (
                                                        <TableRow key={response.id} className="group transition-colors hover:bg-muted/30">
                                                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                                                {new Date(response.created_date || response.created_at).toLocaleString(undefined, {
                                                                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-medium text-foreground border-l border-border/40">
                                                                {response.respondent_name || (response.user_id ? 'Authenticated' : 'Anonymous')}
                                                            </TableCell>
                                                            {allQuestions.map(q => {
                                                                const answerObj = Array.isArray(response.answers) ? response.answers.find((a: any) => a.question_id === q.id) : null;
                                                                let displayVal = "-";

                                                                if (answerObj) {
                                                                    if (answerObj.question_type === "file_upload" && answerObj.answer) {
                                                                        try {
                                                                            const fileData = JSON.parse(answerObj.answer);
                                                                            displayVal = fileData.file_name || "File attached";
                                                                        } catch {
                                                                            displayVal = answerObj.answer;
                                                                        }
                                                                    } else {
                                                                        displayVal = String(answerObj.answer || "-");
                                                                    }
                                                                }

                                                                return (
                                                                    <TableCell key={q.id} className="text-sm max-w-[300px] border-l border-border/40" title={displayVal}>
                                                                        <div className="truncate max-h-[3.5rem] whitespace-normal line-clamp-2 text-foreground/80">
                                                                            {displayVal}
                                                                        </div>
                                                                    </TableCell>
                                                                )
                                                            })}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
