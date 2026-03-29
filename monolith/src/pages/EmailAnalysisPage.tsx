import React, { useState, useEffect, useMemo } from 'react';
import { Mail, CheckCircle, Sparkles, Send, Loader2, Circle, CircleCheck, Edit3, Eye, Search, X, Tag, Plus, ArrowUpDown, ChevronUp, ChevronDown, TrendingUp, ThumbsUp, ThumbsDown, HelpCircle, Calendar, Clock, Copy, RefreshCcw, RefreshCw, Zap, Check, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MotionIcon } from '@/src/components/MotionIcon';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Toaster, toast } from 'sonner';
import { cn } from '@/src/lib/utils';

const emails: any[] = [];

export const EmailAnalysisPage: React.FC = () => {
  const [emails, setEmails] = useState(emails);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSentiment, setActiveSentiment] = useState<'All' | 'Positive' | 'Neutral' | 'Negative'>('All');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any>({
  id: 0,
  threadId: '',
  sender: 'System',
  subject: 'No Emails Found',
  time: '',
  sentiment: 'Neutral',
  content: 'Connect your Gmail to begin analysis.',
  read: true,
  labels: []
});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [replyTone, setReplyTone] = useState<'Empathetic' | 'Formal' | 'Direct'>('Empathetic');
  const [threadSummary, setThreadSummary] = useState<string | null>(null);
  const [urgencyScore, setUrgencyScore] = useState<number | null>(null);
  const [sentimentDrift, setSentimentDrift] = useState<number[]>([]);
  const [suggestedLabels, setSuggestedLabels] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyLength, setReplyLength] = useState<'Short' | 'Medium' | 'Detailed'>('Medium');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiConfidence, setAiConfidence] = useState<'High' | 'Medium' | 'Low'>('High');
  const [isImproving, setIsImproving] = useState(false);
  const [sortKey, setSortKey] = useState<'sender' | 'subject' | 'time' | 'sentiment' | 'read' | 'labels'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [readFilter, setReadFilter] = useState<'All' | 'Read' | 'Unread'>('All');
  const [draftFilter, setDraftFilter] = useState<'All' | 'Has Draft' | 'No Draft'>('All');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isBatchTagging, setIsBatchTagging] = useState(false);
  const [isBatchLabeling, setIsBatchLabeling] = useState(false);
  const [suggestedLabelsMap, setSuggestedLabelsMap] = useState<Record<number, string[]>>({});
  const [isSuggestingLabels, setIsSuggestingLabels] = useState<Record<number, boolean>>({});
  const [batchTagInput, setBatchTagInput] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const batchTagRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (batchTagRef.current && !batchTagRef.current.contains(event.target as Node)) {
        setIsBatchTagging(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Load draft when email changes, if it exists
    if (drafts[selectedEmail.id]) {
      setGeneratedReply(drafts[selectedEmail.id]);
    } else {
      setGeneratedReply('');
    }
    setIsPreviewMode(false);
    handleSummarizeThread();
  }, [selectedEmail.id]);

  const highlightKeywords = (text: string) => {
    const keywords = ['critical', 'ASAP', 'latency', 'severe', 'billing', 'timeouts', 'enterprise', 'urgent', 'breached', 'SLA'];
    let highlightedText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '**$1**');
    });
    return highlightedText;
  };

  const handleSummarizeThread = async () => {
    setThreadSummary(null);
    setUrgencyScore(null);
    setSentimentDrift([]);
    setSuggestedLabels([]);
    setIsSummarizing(true);
    try {
      const threadMessages = emails
        .filter(e => e.threadId === selectedEmail.threadId)
        .sort((a, b) => a.id - b.id);
      
      const threadContent = threadMessages.map(e => `From: ${e.sender}\nContent: ${e.content}`).join('\n\n');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Generate Summary, Urgency Score, Suggested Labels, and Reply Suggestions
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are Monolith AI, a premium technical assistant. Analyze this email thread and provide:
        1. A one-sentence technical, precise summary.
        2. An urgency score (0-100) based on SLA risks and business impact.
        3. A sentiment sequence (-1 to 1) for each message.
        4. 2-3 suggested labels (e.g., "Critical", "Billing", "External").
        5. 3-4 short (3-5 words) quick reply intents (e.g., "Confirm resolution", "Request debug logs").
        
        Format as JSON: { "summary": string, "urgency": number, "drift": number[], "suggestedLabels": string[], "replySuggestions": string[] }
        
        THREAD:
        ${threadContent}`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || '{}');
      setThreadSummary(data.summary || null);
      setUrgencyScore(data.urgency || null);
      setSentimentDrift(data.drift || []);
      setSuggestedLabels(data.suggestedLabels || []);
      setAiSuggestions(data.replySuggestions || []);
    } catch (error) {
      console.error('Error summarizing thread:', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const toggleThread = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const handleApplyAllSuggestions = () => {
    suggestedLabels.forEach(label => {
      if (!(selectedEmail.labels || []).includes(label)) {
        handleToggleLabel(label);
      }
    });
  };

  const handleBatchAutoLabel = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchLabeling(true);
    try {
      const selectedEmails = emails.filter(e => selectedIds.includes(e.id));
      const emailsContent = selectedEmails.map(e => `ID: ${e.id}\nFrom: ${e.sender}\nSubject: ${e.subject}\nContent: ${e.content}`).join('\n\n---\n\n');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `For each email provided, suggest 1-2 relevant short labels.
        Return a JSON object where keys are the email IDs and values are arrays of suggested labels.
        
        EMAILS:
        ${emailsContent}`,
        config: { responseMimeType: "application/json" }
      });

      const suggestions = JSON.parse(response.text || '{}');
      
      setEmails(prev => prev.map(email => {
        if (suggestions[email.id]) {
          const newLabels = Array.from(new Set([...(email.labels || []), ...suggestions[email.id]]));
          return { ...email, labels: newLabels };
        }
        return email;
      }));
      
      setSelectedIds([]);
    } catch (error) {
      console.error('Error in batch auto-labeling:', error);
    } finally {
      setIsBatchLabeling(false);
    }
  };

  const handleSuggestLabelsForEmail = async (e: React.MouseEvent, email: any) => {
    e.stopPropagation();
    if (isSuggestingLabels[email.id]) return;
    setIsSuggestingLabels(prev => ({ ...prev, [email.id]: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this email and suggest 2-3 relevant short labels (e.g., "Urgent", "Billing", "Technical").
        From: ${email.sender}
        Subject: ${email.subject}
        Content: ${email.content}
        
        Return a JSON array of strings.`,
        config: { responseMimeType: "application/json" }
      });
      const labels = JSON.parse(response.text || '[]');
      setSuggestedLabelsMap(prev => ({ ...prev, [email.id]: labels }));
      toast.success(`AI suggested ${labels.length} labels for "${email.subject}"`);
    } catch (error) {
      console.error('Error suggesting labels:', error);
      toast.error('Failed to suggest labels');
    } finally {
      setIsSuggestingLabels(prev => ({ ...prev, [email.id]: false }));
    }
  };

  const handleApplySuggestedLabel = (e: React.MouseEvent, emailId: number, label: string) => {
    e.stopPropagation();
    setEmails(prev => prev.map(email => {
      if (email.id === emailId) {
        const labels = email.labels || [];
        if (labels.includes(label)) {
          return { ...email, labels: labels.filter(l => l !== label) };
        } else {
          return { ...email, labels: [...labels, label] };
        }
      }
      return email;
    }));
    // Remove from suggestions after applying? Or keep it?
    // Let's keep it but mark as applied in UI.
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmails.map(e => e.id));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: number, threadId?: string) => {
    e.stopPropagation();
    if (threadId) {
      // Find all emails in this thread from the full list
      const threadEmails = emails.filter(email => email.threadId === threadId).map(email => email.id);
      const allSelected = threadEmails.every(tid => selectedIds.includes(tid));
      
      if (allSelected) {
        setSelectedIds(prev => prev.filter(i => !threadEmails.includes(i)));
      } else {
        setSelectedIds(prev => Array.from(new Set([...prev, ...threadEmails])));
      }
    } else {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const handleBatchAction = (action: 'read' | 'unread' | 'delete' | 'tag' | 'archive' | 'clear-tags', label?: string) => {
    if (action === 'delete') {
      const remainingEmails = emails.filter(e => !selectedIds.includes(e.id));
      setEmails(remainingEmails);
      
      // If selected email was deleted, pick the first remaining one
      if (selectedIds.includes(selectedEmail.id)) {
        if (remainingEmails.length > 0) {
          setSelectedEmail(remainingEmails[0]);
        } else {
          // If no emails left, set to a placeholder or empty state
          setSelectedEmail({
            id: 0,
            sender: 'System',
            subject: 'No Emails',
            content: 'Your inbox is empty.',
            time: '',
            read: true,
            sentiment: 'Neutral',
            threadId: '0',
            labels: []
          });
        }
      }
      setSelectedIds([]);
      return;
    }

    setEmails(prev => {
      const newList = prev.map(email => {
        if (selectedIds.includes(email.id)) {
          if (action === 'read') return { ...email, read: true };
          if (action === 'unread') return { ...email, read: false };
          if (action === 'archive') {
            const labels = email.labels || [];
            if (!labels.includes('Archive')) {
              return { ...email, labels: [...labels, 'Archive'] };
            }
          }
          if (action === 'clear-tags') {
            return { ...email, labels: [] };
          }
          if (action === 'tag' && label) {
            const labels = email.labels || [];
            if (!labels.includes(label)) {
              return { ...email, labels: [...labels, label] };
            }
          }
        }
        return email;
      });

      // Sync selectedEmail if it was part of the batch
      if (selectedIds.includes(selectedEmail.id)) {
        const updatedSelected = newList.find(e => e.id === selectedEmail.id);
        if (updatedSelected) {
          setSelectedEmail(updatedSelected);
        }
      }

      return newList;
    });
    
    if (action !== 'tag' && action !== 'clear-tags') {
      setSelectedIds([]);
    }
  };

  const toggleRead = (e: React.MouseEvent, id: number, threadId?: string) => {
    e.stopPropagation();
    if (threadId) {
      const threadEmails = emails.filter(email => email.threadId === threadId);
      const allRead = threadEmails.every(email => email.read);
      
      setEmails(prev => prev.map(email => {
        if (email.threadId === threadId) {
          return { ...email, read: !allRead };
        }
        return email;
      }));
    } else {
      setEmails(prev => prev.map(email => 
        email.id === id ? { ...email, read: !email.read } : email
      ));
    }
  };

  const handleSaveDraft = () => {
    if (!generatedReply) return;
    setSaveStatus('saving');
    setDrafts(prev => ({ ...prev, [selectedEmail.id]: generatedReply }));
    setTimeout(() => {
      setSaveStatus('saved');
      toast.success('Draft saved successfully', {
        className: 'bg-surface-container-highest border-white/10 text-white font-headline uppercase tracking-widest text-[10px]',
        icon: <MotionIcon><Check size={14} className="text-primary" /></MotionIcon>
      });
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const handleDiscardDraft = () => {
    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[selectedEmail.id];
      return newDrafts;
    });
    setGeneratedReply('');
    setIsPreviewMode(false);
  };

  const handleSendReply = () => {
    if (!generatedReply) return;
    setIsSending(true);
    
    // Simulate sending
    setTimeout(() => {
      const newMessage = {
        id: Math.max(...emails.map(e => e.id)) + 1,
        threadId: selectedEmail.threadId,
        sender: 'me',
        subject: `Re: ${selectedEmail.subject}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: 'Neutral' as const,
        content: generatedReply,
        read: true,
        labels: []
      };

      setEmails(prev => [...prev, newMessage]);
      
      // Clear draft
      setDrafts(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[selectedEmail.id];
        return newDrafts;
      });
      
      setGeneratedReply('');
      setIsPreviewMode(false);
      setIsSending(false);
      toast.success('Reply sent successfully', {
        className: 'bg-surface-container-highest border-white/10 text-white font-headline uppercase tracking-widest text-[10px]',
        icon: <MotionIcon><Send size={14} className="text-primary" /></MotionIcon>
      });
    }, 1500);
  };

  const handleGenerateReply = async (customPrompt?: string) => {
    setIsGenerating(true);
    try {
      const threadHistory = emails
        .filter(e => e.threadId === selectedEmail.threadId)
        .sort((a, b) => a.id - b.id)
        .map(e => `${e.sender}: ${e.content}`)
        .join('\n\n');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are Monolith AI, a premium technical assistant. Generate a ${replyTone.toLowerCase()} and professional ${replyLength.toLowerCase()} length reply to the following email thread.
        ${customPrompt ? `The user wants to: ${customPrompt}` : ''}
        
        GUIDELINES:
        - Avoid generic AI phrases like "I hope this email finds you well".
        - Be direct, technical, and precise.
        - Use a minimal, sophisticated tone.
        
        CONVERSATION HISTORY:
        ${threadHistory}
        
        Return only the reply text.`,
      });
      
      setGeneratedReply(response.text || '');
      setAiConfidence(Math.random() > 0.3 ? 'High' : 'Medium');
      toast.success('AI reply generated', {
        className: 'bg-surface-container-highest border-white/10 text-white font-headline uppercase tracking-widest text-[10px]',
        icon: <MotionIcon><Sparkles size={14} className="text-primary" /></MotionIcon>
      });
    } catch (error) {
      console.error('Error generating reply:', error);
      toast.error('Failed to generate reply');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImproveReply = async () => {
    if (!generatedReply) return;
    setIsImproving(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Improve the following email reply to be clearer, more concise, and more professional while maintaining its original intent and its ${replyTone.toLowerCase()} tone.
        Keep it at a ${replyLength.toLowerCase()} length.
        
        REPLY:
        ${generatedReply}
        
        Return only the improved text.`,
      });
      
      setGeneratedReply(response.text || '');
      toast.success('Reply improved', {
        className: 'bg-surface-container-highest border-white/10 text-white font-headline uppercase tracking-widest text-[10px]',
        icon: <MotionIcon><Sparkles size={14} className="text-primary" /></MotionIcon>
      });
    } catch (error) {
      console.error('Error improving reply:', error);
      toast.error('Failed to improve reply');
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedReply) return;
    navigator.clipboard.writeText(generatedReply);
    toast.success('Copied to clipboard', {
      className: 'bg-surface-container-highest border-white/10 text-white font-headline uppercase tracking-widest text-[10px]',
      icon: <MotionIcon><Copy size={14} className="text-primary" /></MotionIcon>
    });
  };

  const handleToggleLabel = (label: string) => {
    setEmails(prev => prev.map(email => {
      if (email.id === selectedEmail.id) {
        const labels = email.labels || [];
        const newLabels = labels.includes(label)
          ? labels.filter(l => l !== label)
          : [...labels, label];
        
        const updatedEmail = { ...email, labels: newLabels };
        if (selectedEmail.id === email.id) {
          setSelectedEmail(updatedEmail);
        }
        return updatedEmail;
      }
      return email;
    }));
  };

  const handleAddCustomLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelInput.trim()) return;
    handleToggleLabel(newLabelInput.trim());
    setNewLabelInput('');
  };

  const handleSort = (key: 'sender' | 'subject' | 'time' | 'sentiment' | 'read' | 'labels') => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setIsLoadingMore(false);
      const moreEmails = [
        { 
          id: Date.now(), 
          threadId: `t${Date.now()}`, 
          sender: 'system@monolith.ai', 
          subject: 'Weekly performance report', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
          sentiment: 'Positive' as const, 
          content: 'The **Monolith system** performance is up by **12.4%** this week. All nodes are operating within optimal parameters.', 
          read: true, 
          labels: ['Archive'] 
        },
      ];
      setEmails(prev => [...prev, ...moreEmails]);
      toast.success('Loaded more communications', {
        className: 'bg-surface-container-highest border-white/10 text-white font-headline uppercase tracking-widest text-[10px]',
        icon: <MotionIcon><RefreshCcw size={14} className="text-primary" /></MotionIcon>
      });
    }, 1500);
  };

  const allLabels = Array.from(new Set(emails.flatMap(e => e.labels || [])));

  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSentiment = activeSentiment === 'All' || email.sentiment === activeSentiment;
    
    const matchesLabels = selectedLabels.length === 0 || 
      selectedLabels.every(label => (email.labels || []).includes(label));

    const matchesReadStatus = 
      readFilter === 'All' || 
      (readFilter === 'Read' && email.read) || 
      (readFilter === 'Unread' && !email.read);

    const matchesDraftStatus = 
      draftFilter === 'All' || 
      (draftFilter === 'Has Draft' && !!drafts[email.id]) || 
      (draftFilter === 'No Draft' && !drafts[email.id]);
    
    return matchesSearch && matchesSentiment && matchesLabels && matchesReadStatus && matchesDraftStatus;
  });

  const groupedThreads = useMemo(() => {
    // 1. Identify threadIds that have at least one email matching the current filters
    const matchingThreadIds = new Set(filteredEmails.map(e => e.threadId));
    
    // 2. Group ALL emails from the full list by threadId, but only for matching threads
    const groups: Record<string, typeof emails> = {};
    emails.forEach(email => {
      if (matchingThreadIds.has(email.threadId)) {
        if (!groups[email.threadId]) groups[email.threadId] = [];
        groups[email.threadId].push(email);
      }
    });

    // 3. Sort messages within each thread (latest first)
    Object.values(groups).forEach(group => {
      group.sort((a, b) => b.id - a.id);
    });

    // 4. Create thread objects
    const threads = Object.entries(groups).map(([threadId, emails]) => {
      // For the main display, we use the latest email in the thread
      const latestEmail = emails[0];
      
      return {
        threadId,
        emails,
        latestEmail,
        count: emails.length,
        hasUnread: emails.some(e => !e.read),
        isNegative: emails.some(e => e.sentiment === 'Negative')
      };
    });

    // 5. Sort threads based on the latest email in each thread
    return threads.sort((a, b) => {
      let valA: any = a.latestEmail[sortKey as keyof typeof a.latestEmail];
      let valB: any = b.latestEmail[sortKey as keyof typeof b.latestEmail];

      if (sortKey === 'sentiment') {
        const sentimentOrder = { 'Positive': 3, 'Neutral': 2, 'Negative': 1 };
        valA = sentimentOrder[a.latestEmail.sentiment as keyof typeof sentimentOrder] || 0;
        valB = sentimentOrder[b.latestEmail.sentiment as keyof typeof sentimentOrder] || 0;
      }

      if (sortKey === 'labels') {
        const priorityLabels = ['Critical', 'Urgent', 'SLA', 'ASAP', 'Severe', 'Breached', 'Security', 'Incident'];
        const getPriority = (labels: string[]) => {
          if (!labels || labels.length === 0) return 0;
          // Find the highest priority label in the list
          const priorities = labels.map(l => {
            const index = priorityLabels.indexOf(l);
            return index === -1 ? 1 : priorityLabels.length - index + 2;
          });
          return Math.max(...priorities);
        };
        
        valA = getPriority(a.latestEmail.labels || []);
        valB = getPriority(b.latestEmail.labels || []);
        
        if (valA === valB) {
          // If same priority, sort by number of labels then alphabetically
          valA = (a.latestEmail.labels || []).length;
          valB = (b.latestEmail.labels || []).length;
          if (valA === valB) {
            valA = (a.latestEmail.labels || []).sort().join(',');
            valB = (b.latestEmail.labels || []).sort().join(',');
          }
        }
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [emails, filteredEmails, sortKey, sortOrder]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-4xl mx-auto px-6 space-y-24 monolith-grid relative"
    >
      <Toaster position="bottom-right" theme="dark" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
      <div className="absolute top-0 left-0 p-4 opacity-10 pointer-events-none z-0">
        <div className="text-[8px] font-mono leading-tight">
          SYS_MONOLITH_v2.4.1<br/>
          STATUS: OPERATIONAL<br/>
          CORE_TEMP: 34.2°C<br/>
          ENCRYPTION: AES-256
        </div>
      </div>
      
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/10 pb-12 pt-12"
      >
        <div>
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter mb-4">Email Analysis</h1>
          <p className="text-on-surface-variant max-w-md">Real-time processing of inbound communications using monolithic sentiment architecture.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (isConnected) return;
            setIsConnecting(true);
            setTimeout(() => {
              setIsConnecting(false);
              setIsConnected(true);
            }, 2000);
          }}
          disabled={isConnecting}
          className={cn(
            "px-8 py-3 font-medium text-sm flex items-center gap-2 transition-all rounded-sm",
            isConnected 
              ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default" 
              : "bg-primary text-on-primary hover:bg-neutral-200"
          )}
        >
          {isConnecting ? (
            <MotionIcon><Loader2 size={18} className="animate-spin" /></MotionIcon>
          ) : isConnected ? (
            <MotionIcon><CheckCircle size={18} /></MotionIcon>
          ) : (
            <MotionIcon><Mail size={18} /></MotionIcon>
          )}
          {isConnecting ? 'Connecting...' : isConnected ? 'Gmail Connected' : 'Connect Gmail'}
        </motion.button>
      </motion.section>

      <div className="relative w-full group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
        <div className="relative">
          <MotionIcon className="absolute left-6 top-1/2 -translate-y-1/2"><Search size={20} className="text-on-surface-variant/70 group-focus-within:text-primary transition-colors" /></MotionIcon>
          <input 
            type="text"
            placeholder="Search communications by sender, subject, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-white/10 pl-16 pr-16 py-6 text-lg font-headline focus:outline-none focus:border-primary/40 transition-all placeholder:text-on-surface-variant/50 shadow-2xl rounded-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-primary transition-colors"
            >
              <MotionIcon><X size={20} /></MotionIcon>
            </button>
          )}
        </div>
      </div>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="space-y-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {[
            { label: 'Positive %', value: '72.4', icon: CheckCircle },
            { label: 'Neutral %', value: '18.1', icon: CheckCircle },
            { label: 'Negative %', value: '09.5', icon: CheckCircle },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
              className="bg-surface-container p-8 border-l border-white/10 group cursor-pointer transition-all duration-500 backdrop-blur-xl bg-white/5 rounded-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs tracking-[0.2em] text-on-surface-variant/70 uppercase">{stat.label}</span>
                <MotionIcon><stat.icon size={14} className="text-primary/70 group-hover:text-primary transition-colors" /></MotionIcon>
              </div>
              <div className="text-5xl font-headline font-bold group-hover:text-primary transition-colors">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/5 gap-6">
          <div className="flex flex-wrap gap-x-12 gap-y-4 overflow-x-auto pb-4 md:pb-0 hide-scrollbar w-full md:w-auto">
            <div className="flex gap-8">
              {['All', 'Positive', 'Neutral', 'Negative'].map((sentiment) => (
                <button 
                  key={sentiment}
                  onClick={() => setActiveSentiment(sentiment as any)}
                  className={`pb-4 text-[10px] tracking-widest transition-colors uppercase whitespace-nowrap border-b-2 ${
                    activeSentiment === sentiment 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-on-surface-variant/70 hover:text-primary'
                  }`}
                >
                  {sentiment === 'All' ? 'All Mail' : sentiment}
                </button>
              ))}
            </div>
            <div className="hidden md:block w-px h-4 bg-white/10 self-center"></div>
            <div className="flex gap-8">
              {['All', 'Read', 'Unread'].map((status) => (
                <button 
                  key={status}
                  onClick={() => setReadFilter(status as any)}
                  className={`pb-4 text-[10px] tracking-widest transition-colors uppercase whitespace-nowrap border-b-2 flex items-center gap-2 ${
                    readFilter === status 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-on-surface-variant/70 hover:text-primary'
                  }`}
                >
                  {status === 'Read' && <MotionIcon><CircleCheck size={10} className={readFilter === 'Read' ? 'text-primary' : 'opacity-70'} /></MotionIcon>}
                  {status === 'Unread' && <MotionIcon><Circle size={10} className={readFilter === 'Unread' ? 'text-primary' : 'opacity-70'} /></MotionIcon>}
                  {status === 'All' && <MotionIcon><Mail size={10} className={readFilter === 'All' ? 'text-primary' : 'opacity-70'} /></MotionIcon>}
                  {status}
                </button>
              ))}
            </div>
            <div className="hidden md:block w-px h-4 bg-white/10 self-center"></div>
            <div className="flex gap-8">
              {['All', 'Has Draft', 'No Draft'].map((status) => (
                <button 
                  key={status}
                  onClick={() => setDraftFilter(status as any)}
                  className={`pb-4 text-[10px] tracking-widest transition-colors uppercase whitespace-nowrap border-b-2 flex items-center gap-2 ${
                    draftFilter === status 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-on-surface-variant/70 hover:text-primary'
                  }`}
                >
                  {status === 'Has Draft' && <MotionIcon><FileText size={10} className={draftFilter === 'Has Draft' ? 'text-primary' : 'opacity-70'} /></MotionIcon>}
                  {status === 'No Draft' && <MotionIcon><FileText size={10} className={draftFilter === 'No Draft' ? 'opacity-40' : 'opacity-40'} /></MotionIcon>}
                  {status === 'All' && <MotionIcon><Mail size={10} className={draftFilter === 'All' ? 'text-primary' : 'opacity-70'} /></MotionIcon>}
                  {status}
                </button>
              ))}
            </div>
            <div className="hidden md:block w-px h-4 bg-white/10 self-center"></div>
            <div className="flex gap-8">
              <button 
                onClick={() => setExpandedThreads(new Set(groupedThreads.map(t => t.threadId)))}
                className="pb-4 text-[10px] tracking-widest transition-colors uppercase whitespace-nowrap border-b-2 border-transparent text-on-surface-variant/70 hover:text-primary"
              >
                Expand All
              </button>
              <button 
                onClick={() => setExpandedThreads(new Set())}
                className="pb-4 text-[10px] tracking-widest transition-colors uppercase whitespace-nowrap border-b-2 border-transparent text-on-surface-variant/70 hover:text-primary"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {allLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 items-center">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 self-center mr-2">Filter Labels:</span>
            {allLabels.map((label, index) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedLabels(prev => 
                  prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
                )}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                  selectedLabels.includes(label)
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-white/5 text-on-surface-variant/80 border-white/10 hover:border-white/30'
                }`}
              >
                <MotionIcon><Tag size={10} /></MotionIcon>
                {label}
              </motion.button>
            ))}
            {(selectedLabels.length > 0 || activeSentiment !== 'All' || searchTerm !== '' || readFilter !== 'All' || draftFilter !== 'All') && (
              <button 
                onClick={() => {
                  setSelectedLabels([]);
                  setActiveSentiment('All');
                  setSearchTerm('');
                  setReadFilter('All');
                  setDraftFilter('All');
                }}
                className="text-[10px] uppercase tracking-widest text-primary hover:underline ml-4 flex items-center gap-1"
              >
                <MotionIcon><X size={10} /></MotionIcon>
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </motion.section>

      <section className="space-y-8">
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col md:flex-row items-center justify-between bg-primary/5 border border-primary/20 p-4 rounded-sm gap-4 sticky top-4 z-40 backdrop-blur-md"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{selectedIds.length} Items Selected</span>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  (Clear)
                </button>
              </div>
              <div className="hidden md:block h-4 w-px bg-primary/20"></div>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => handleBatchAction('read')} className="text-[9px] uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors">Mark Read</button>
                <button onClick={() => handleBatchAction('unread')} className="text-[9px] uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors">Mark Unread</button>
                <button onClick={() => handleBatchAutoLabel()} disabled={isBatchLabeling} className="text-[9px] uppercase tracking-widest text-primary font-black flex items-center gap-1.5 hover:opacity-80 transition-all disabled:opacity-50">
                  {isBatchLabeling ? <MotionIcon><Loader2 size={10} className="animate-spin" /></MotionIcon> : <MotionIcon><Sparkles size={10} /></MotionIcon>}
                  AI Auto-Label
                </button>
                <button onClick={() => handleBatchAction('archive')} className="text-[9px] uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors">Archive</button>
                <button onClick={() => handleBatchAction('delete')} className="text-[9px] uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors">Delete</button>
              </div>
              <div className="hidden md:block h-4 w-px bg-primary/20"></div>
              <div className="relative" ref={batchTagRef}>
                <button 
                  onClick={() => setIsBatchTagging(!isBatchTagging)}
                  className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  <MotionIcon><Tag size={12} /></MotionIcon>
                  Batch Tag
                  <MotionIcon><ChevronDown size={10} className={cn("transition-transform", isBatchTagging && "rotate-180")} /></MotionIcon>
                </button>
                
                {isBatchTagging && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-surface-container-low border border-white/10 shadow-2xl z-50 p-4 rounded-sm animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <p className="text-[8px] uppercase tracking-widest text-on-surface-variant/40 font-bold">Manage Tags</p>
                        <button onClick={() => setIsBatchTagging(false)} className="text-on-surface-variant/20 hover:text-red-500 transition-colors">
                          <MotionIcon><X size={10} /></MotionIcon>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[8px] uppercase tracking-widest text-on-surface-variant/40 font-bold mb-2">Existing Labels</p>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                          {allLabels.length > 0 ? (
                            allLabels.map(label => (
                              <button 
                                key={label}
                                onClick={() => {
                                  handleBatchAction('tag', label);
                                }}
                                className="px-2 py-0.5 border border-white/10 text-[8px] uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all rounded-sm whitespace-nowrap"
                              >
                                {label}
                              </button>
                            ))
                          ) : (
                            <p className="text-[8px] text-on-surface-variant/20 italic">No labels found</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-white/5 space-y-3">
                        <div>
                          <p className="text-[8px] uppercase tracking-widest text-on-surface-variant/40 font-bold mb-2">Create New</p>
                          <div className="flex gap-1">
                            <input 
                              type="text"
                              placeholder="New tag..."
                              value={batchTagInput}
                              onChange={(e) => setBatchTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && batchTagInput.trim()) {
                                  handleBatchAction('tag', batchTagInput.trim());
                                  setBatchTagInput('');
                                }
                              }}
                              className="flex-1 bg-white/5 border border-white/10 px-2 py-1 text-[9px] outline-none focus:border-primary/40 transition-all rounded-sm"
                            />
                            <button 
                              onClick={() => {
                                if (batchTagInput.trim()) {
                                  handleBatchAction('tag', batchTagInput.trim());
                                  setBatchTagInput('');
                                }
                              }}
                              className="bg-primary text-on-primary p-1 rounded-sm hover:bg-neutral-200 transition-colors"
                            >
                            <MotionIcon><Plus size={10} /></MotionIcon>
                            </button>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            handleBatchAction('clear-tags');
                            setIsBatchTagging(false);
                          }}
                          className="w-full py-1.5 border border-red-500/20 text-red-500/60 hover:bg-red-500/5 hover:text-red-500 text-[8px] uppercase tracking-widest transition-all rounded-sm"
                        >
                          Clear All Tags
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => {
              setSelectedIds([]);
              setIsBatchTagging(false);
            }} className="text-on-surface-variant/40 hover:text-primary transition-colors">
              <MotionIcon><X size={14} /></MotionIcon>
            </button>
          </motion.div>
        )}
        {emails.length === 0 && (
  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center mb-8">
    <p className="text-white/60 text-lg">No active email stream.</p>
    <p className="text-white/40 text-sm mt-2">Connect your Gmail to begin analysis.</p>
  </div>
)}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-6 text-[10px] tracking-[0.3em] text-on-surface-variant/60 uppercase w-12">
                  <button onClick={toggleSelectAll} className="text-on-surface-variant/50 hover:text-primary transition-colors backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200">
                    {selectedIds.length === filteredEmails.length && filteredEmails.length > 0 ? <MotionIcon><CircleCheck size={16} className="text-primary" /></MotionIcon> : <MotionIcon><Circle size={16} /></MotionIcon>}
                  </button>
                </th>
                <th className="pb-6 text-[10px] tracking-[0.3em] text-on-surface-variant/60 uppercase w-12">
                  <button onClick={() => handleSort('read')} className="flex items-center gap-1 hover:text-primary transition-colors uppercase tracking-[0.3em]">
                    <MotionIcon><ArrowUpDown size={10} className="opacity-50" /></MotionIcon>
                  </button>
                </th>
                <th className="pb-6 text-[10px] tracking-[0.3em] text-on-surface-variant/60 uppercase w-1/4">
                  <button onClick={() => handleSort('sender')} className="flex items-center gap-2 hover:text-primary transition-colors uppercase tracking-[0.3em] group/th">
                    Sender
                    <div className="flex flex-col -space-y-1 opacity-0 group-hover/th:opacity-100 transition-opacity">
                      <ChevronUp size={8} className={cn(sortKey === 'sender' && sortOrder === 'asc' ? "text-primary" : "text-white/50")} />
                      <ChevronDown size={8} className={cn(sortKey === 'sender' && sortOrder === 'desc' ? "text-primary" : "text-white/50")} />
                    </div>
                  </button>
                </th>
                <th className="pb-6 text-[10px] tracking-[0.3em] text-on-surface-variant/60 uppercase w-1/3">
                  <button onClick={() => handleSort('subject')} className="flex items-center gap-2 hover:text-primary transition-colors uppercase tracking-[0.3em] group/th">
                    Subject
                    <div className="flex flex-col -space-y-1 opacity-0 group-hover/th:opacity-100 transition-opacity">
                      <ChevronUp size={8} className={cn(sortKey === 'subject' && sortOrder === 'asc' ? "text-primary" : "text-white/50")} />
                      <ChevronDown size={8} className={cn(sortKey === 'subject' && sortOrder === 'desc' ? "text-primary" : "text-white/50")} />
                    </div>
                  </button>
                </th>
                <th className="pb-6 text-[10px] tracking-[0.3em] text-on-surface-variant/60 uppercase">
                  <button onClick={() => handleSort('labels')} className="flex items-center gap-2 hover:text-primary transition-colors uppercase tracking-[0.3em] group/th">
                    Labels
                    <div className="flex flex-col -space-y-1 opacity-0 group-hover/th:opacity-100 transition-opacity">
                      <ChevronUp size={8} className={cn(sortKey === 'labels' && sortOrder === 'asc' ? "text-primary" : "text-white/50")} />
                      <ChevronDown size={8} className={cn(sortKey === 'labels' && sortOrder === 'desc' ? "text-primary" : "text-white/50")} />
                    </div>
                  </button>
                </th>
                <th className="pb-6 text-[10px] tracking-[0.3em] text-on-surface-variant/60 uppercase w-24">
                  <button onClick={() => handleSort('time')} className="flex items-center gap-2 hover:text-primary transition-colors uppercase tracking-[0.3em] group/th">
                    Time
                    <div className="flex flex-col -space-y-1 opacity-0 group-hover/th:opacity-100 transition-opacity">
                      <ChevronUp size={8} className={cn(sortKey === 'time' && sortOrder === 'asc' ? "text-primary" : "text-white/50")} />
                      <ChevronDown size={8} className={cn(sortKey === 'time' && sortOrder === 'desc' ? "text-primary" : "text-white/50")} />
                    </div>
                  </button>
                </th>
                <th className="pb-6 text-[10px] tracking-[0.3em] text-on-surface-variant/60 uppercase text-right w-32">
                  <button onClick={() => handleSort('sentiment')} className="flex items-center gap-2 hover:text-primary transition-colors uppercase tracking-[0.3em] ml-auto group/th">
                    Sentiment
                    <div className="flex flex-col -space-y-1 opacity-0 group-hover/th:opacity-100 transition-opacity">
                      <ChevronUp size={8} className={cn(sortKey === 'sentiment' && sortOrder === 'asc' ? "text-primary" : "text-white/50")} />
                      <ChevronDown size={8} className={cn(sortKey === 'sentiment' && sortOrder === 'desc' ? "text-primary" : "text-white/50")} />
                    </div>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {groupedThreads.length > 0 ? (
                groupedThreads.map((thread, index) => {
                  const { latestEmail: email, emails, count, threadId } = thread;
                  const isExpanded = expandedThreads.has(threadId);
                  const hasMultiple = count > 1;
                  
                  return (
                    <React.Fragment key={threadId}>
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)", x: 4 }}
                        onClick={() => setSelectedEmail(email)}
                        className={cn(
                          "group transition-all cursor-pointer border-b border-white/[0.03] relative",
                          selectedEmail.id === email.id ? 'bg-white/[0.07]' : '',
                          selectedIds.includes(email.id) ? 'bg-primary/[0.03]' : '',
                          thread.isNegative ? 'after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-red-500/40' : ''
                        )}
                      >
                        <td className="py-5 px-2">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => toggleSelect(e, email.id, threadId)}
                              className="text-on-surface-variant/10 group-hover:text-on-surface-variant/30 transition-colors"
                            >
                              {emails.every(e => selectedIds.includes(e.id)) ? <MotionIcon><CircleCheck size={16} className="text-primary" /></MotionIcon> : <MotionIcon><Circle size={16} /></MotionIcon>}
                            </button>
                            {hasMultiple && (
                              <button 
                                onClick={(e) => toggleThread(e, threadId)}
                                className="text-on-surface-variant/30 hover:text-primary transition-colors flex items-center gap-1"
                              >
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <MotionIcon><ChevronDown size={14} /></MotionIcon>
                                </motion.div>
                                <span className="text-[9px] font-black opacity-30 group-hover:opacity-100">{count}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-5">
                          <button 
                            onClick={(e) => toggleRead(e, email.id, threadId)}
                            className="text-on-surface-variant/20 hover:text-primary transition-colors"
                            title={emails.every(e => e.read) ? "Mark thread as unread" : "Mark thread as read"}
                          >
                            {emails.every(e => e.read) ? <MotionIcon><CircleCheck size={16} className="opacity-40" /></MotionIcon> : <MotionIcon><Circle size={16} className="text-primary" /></MotionIcon>}
                          </button>
                        </td>
                        <td className={cn(
                          "py-5 pr-4 truncate max-w-[200px]",
                          thread.hasUnread ? 'font-bold text-on-surface' : 'font-normal text-on-surface-variant/70'
                        )}>
                          <div className="flex items-center gap-3">
                            {thread.hasUnread && <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />}
                            <span className="truncate">{email.sender}</span>
                            {drafts[email.id] && (
                              <span className="text-[7px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20 font-black uppercase tracking-widest shrink-0">Draft</span>
                            )}
                          </div>
                        </td>
                        <td className={cn(
                          "py-5 pr-4 truncate max-w-[300px]",
                          thread.hasUnread ? 'font-bold text-white' : 'font-normal text-on-surface-variant/70'
                        )}>
                          <span className="truncate">{email.subject}</span>
                        </td>
                        <td className="py-5">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {(email.labels || []).map(label => (
                              <span key={label} className="text-[8px] uppercase tracking-widest px-2 py-0.5 bg-white/5 text-on-surface-variant/80 border border-white/10 rounded-sm flex items-center gap-1 whitespace-nowrap">
                                <MotionIcon><Tag size={8} className="opacity-70" /></MotionIcon>
                                {label}
                              </span>
                            ))}
                            
                            <div className="flex items-center gap-1 ml-1">
                              {suggestedLabelsMap[email.id] ? (
                                <div className="flex gap-1 animate-in fade-in slide-in-from-left-1 duration-300">
                                  {suggestedLabelsMap[email.id].map(label => {
                                    const isApplied = (email.labels || []).includes(label);
                                    return (
                                      <button
                                        key={label}
                                        onClick={(e) => handleApplySuggestedLabel(e, email.id, label)}
                                        className={cn(
                                          "text-[7px] uppercase tracking-widest px-1.5 py-0.5 border transition-all rounded-sm",
                                          isApplied 
                                            ? "bg-primary text-on-primary border-primary" 
                                            : "border-primary/40 text-primary hover:bg-primary/10"
                                        )}
                                      >
                                        {isApplied ? '✓' : '+'} {label}
                                      </button>
                                    );
                                  })}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSuggestedLabelsMap(prev => { const next = { ...prev }; delete next[email.id]; return next; }); }}
                                    className="text-[7px] text-on-surface-variant/20 hover:text-red-500 transition-colors"
                                  >
                                    <MotionIcon><X size={10} /></MotionIcon>
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={(e) => handleSuggestLabelsForEmail(e, email)}
                                  disabled={isSuggestingLabels[email.id]}
                                  className="p-1 text-on-surface-variant/10 hover:text-primary transition-colors group/ai"
                                  title="AI Suggest Labels"
                                >
                                  {isSuggestingLabels[email.id] ? (
                                    <MotionIcon><Loader2 size={10} className="animate-spin" /></MotionIcon>
                                  ) : (
                                    <MotionIcon><Sparkles size={10} className="group-hover/ai:scale-110 transition-transform opacity-20 group-hover/ai:opacity-100" /></MotionIcon>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={cn(
                          "py-5 text-[10px] font-mono tracking-tighter",
                          thread.hasUnread ? 'text-on-surface-variant/80' : 'text-on-surface-variant/50'
                        )}>{email.time}</td>
                        <td className="py-5 text-right">
                          <div className="flex justify-end">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-sm border",
                              email.sentiment === 'Positive' ? 'bg-primary/10 text-primary border-primary/20' :
                              email.sentiment === 'Negative' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-white/5 text-on-surface-variant/70 border-white/10'
                            )}>
                              {email.sentiment}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                      <AnimatePresence initial={false}>
                        {isExpanded && emails.slice(1).map((subEmail, index) => (
                          <motion.tr 
                            layout
                            key={subEmail.id} 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ 
                              duration: 0.2, 
                              ease: "easeInOut",
                              delay: index * 0.02 
                            }}
                            onClick={() => setSelectedEmail(subEmail)}
                            className={cn(
                              "group hover:bg-white/5 transition-all cursor-pointer border-l-2 border-primary/20 bg-white/[0.02] overflow-hidden",
                              selectedEmail.id === subEmail.id ? 'bg-white/10' : '',
                              selectedIds.includes(subEmail.id) ? 'bg-primary/5' : ''
                            )}
                          >
                            <td className="py-4 pl-10">
                              <button 
                                onClick={(e) => toggleSelect(e, subEmail.id)}
                                className="text-on-surface-variant/20 group-hover:text-on-surface-variant/40 transition-colors"
                              >
                                {selectedIds.includes(subEmail.id) ? <MotionIcon><CircleCheck size={14} className="text-primary" /></MotionIcon> : <MotionIcon><Circle size={14} /></MotionIcon>}
                              </button>
                            </td>
                            <td className="py-4">
                              <button 
                                onClick={(e) => toggleRead(e, subEmail.id)}
                                className="text-on-surface-variant/40 hover:text-primary transition-colors"
                              >
                                {subEmail.read ? <MotionIcon><CircleCheck size={14} /></MotionIcon> : <MotionIcon><Circle size={14} /></MotionIcon>}
                              </button>
                            </td>
                            <td className={cn(
                              "py-4 text-xs",
                              subEmail.read ? 'font-normal text-on-surface-variant/70' : 'font-bold text-on-surface'
                            )}>
                              <div className="flex items-center gap-2">
                                {subEmail.sender}
                                {drafts[subEmail.id] && (
                                  <span className="text-[7px] bg-primary/10 text-primary px-1 py-0.5 rounded-sm border border-primary/20 font-black uppercase tracking-widest">Draft</span>
                                )}
                              </div>
                            </td>
                            <td className={cn(
                              "py-4 text-xs",
                              subEmail.read ? 'font-normal text-on-surface-variant/70' : 'font-bold text-white/80'
                            )}>
                              <span>{subEmail.subject}</span>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {(subEmail.labels || []).map(label => (
                                  <span key={label} className="text-[7px] uppercase tracking-widest px-1.5 py-0.5 bg-white/5 text-on-surface-variant/70 border border-white/5 rounded-sm flex items-center gap-1">
                                    <MotionIcon><Tag size={6} className="opacity-70" /></MotionIcon>
                                    {label}
                                  </span>
                                ))}
                                
                                <div className="flex items-center gap-1 ml-1">
                                  {suggestedLabelsMap[subEmail.id] ? (
                                    <div className="flex gap-1 animate-in fade-in slide-in-from-left-1 duration-300">
                                      {suggestedLabelsMap[subEmail.id].map(label => {
                                        const isApplied = (subEmail.labels || []).includes(label);
                                        return (
                                          <button
                                            key={label}
                                            onClick={(e) => handleApplySuggestedLabel(e, subEmail.id, label)}
                                            className={cn(
                                              "text-[6px] uppercase tracking-widest px-1 py-0.5 border transition-all",
                                              isApplied 
                                                ? "bg-primary text-on-primary border-primary" 
                                                : "border-primary/40 text-primary hover:bg-primary/10"
                                            )}
                                          >
                                            {isApplied ? '✓' : '+'} {label}
                                          </button>
                                        );
                                      })}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setSuggestedLabelsMap(prev => { const next = { ...prev }; delete next[subEmail.id]; return next; }); }}
                                        className="text-[6px] text-on-surface-variant/20 hover:text-red-500 transition-colors"
                                      >
                                        <MotionIcon><X size={8} /></MotionIcon>
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={(e) => handleSuggestLabelsForEmail(e, subEmail)}
                                      disabled={isSuggestingLabels[subEmail.id]}
                                      className="p-1 text-on-surface-variant/20 hover:text-primary transition-colors group/ai"
                                      title="AI Suggest Labels"
                                    >
                                      {isSuggestingLabels[subEmail.id] ? (
                                        <MotionIcon><Loader2 size={8} className="animate-spin" /></MotionIcon>
                                      ) : (
                                        <MotionIcon><Sparkles size={8} className="group-hover/ai:scale-110 transition-transform" /></MotionIcon>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className={cn(
                              "py-4 text-xs",
                              subEmail.read ? 'text-on-surface-variant/50' : 'text-on-surface-variant/70'
                            )}>{subEmail.time}</td>
                            <td className="py-4 text-right">
                              <span className={cn(
                                "px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-tighter",
                                subEmail.sentiment === 'Positive' ? 'text-primary' :
                                subEmail.sentiment === 'Negative' ? 'text-red-500' :
                                'text-on-surface-variant/70'
                              )}>
                                {subEmail.sentiment}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-on-surface-variant/70 italic">
                    No communications matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center py-24"
        >
          <button 
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className={cn(
              "relative group px-12 py-5 rounded-full overflow-hidden transition-all duration-500",
              "bg-gradient-to-br from-surface-container-highest/40 to-primary/5",
              "backdrop-blur-md border border-white/10 hover:border-primary/40",
              "shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]",
              "active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed",
              isLoadingMore && "cursor-wait"
            )}
          >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            <div className="relative flex items-center gap-4">
              <div className="relative">
                {isLoadingMore ? (
                  <MotionIcon><Loader2 size={18} className="animate-spin text-primary" /></MotionIcon>
                ) : (
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <MotionIcon><ChevronDown size={18} className="text-primary group-hover:text-white transition-colors" /></MotionIcon>
                  </motion.div>
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-300",
                "bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent",
                "group-hover:from-primary group-hover:to-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              )}>
                {isLoadingMore ? 'Loading more emails...' : 'Load More'}
              </span>
            </div>
            
            {/* Subtle border glow effect */}
            <div className="absolute inset-0 rounded-full border border-primary/0 group-hover:border-primary/20 transition-colors duration-500" />
          </button>
        </motion.div>
      </section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="bg-surface-container-low p-12 space-y-6 mb-24 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MotionIcon><Sparkles size={14} className="text-on-surface-variant/40" /></MotionIcon>
            <h3 className="text-xs tracking-[0.2em] text-on-surface-variant/40 uppercase">Auto Reply Feature (Negative Filter)</h3>
          </div>
          <div className="bg-black text-white px-2 py-0.5 text-[9px] font-bold uppercase">
            {selectedEmail.sentiment === 'Negative' ? 'Ready' : 'Not Applicable'}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {threadSummary && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="md:col-span-2 bg-primary/5 border-l-2 border-primary p-4 relative overflow-hidden backdrop-blur-xl border border-white/10 bg-white/5 rounded-2xl"
              >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="flex items-center gap-2 mb-1">
                  <MotionIcon><Sparkles size={10} className="text-primary" /></MotionIcon>
                  <span className="text-[8px] uppercase tracking-[0.2em] text-primary font-black">AI Executive Summary</span>
                </div>
                <p className="text-[11px] text-on-surface/80 italic leading-relaxed relative z-10">"{threadSummary}"</p>
              </motion.div>
            )}
            {urgencyScore !== null && (
              <motion.div 
                whileHover={{ y: -4, scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
                className="bg-white/5 border border-white/10 p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-300 backdrop-blur-xl rounded-2xl"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <div className="w-12 h-12 border-t border-r border-white"></div>
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold">Urgency Index</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <motion.span 
                      key={urgencyScore}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-2xl font-headline font-bold ${urgencyScore > 70 ? 'text-red-500' : 'text-primary'}`}
                    >
                      {urgencyScore}
                    </motion.span>
                    <span className="text-[10px] text-on-surface-variant/20 uppercase">/ 100</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 h-1 mt-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${urgencyScore}%` }}
                    transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                    className={`h-full ${urgencyScore > 70 ? 'bg-red-500' : 'bg-primary'}`} 
                  ></motion.div>
                </div>
              </motion.div>
            )}
          </div>

          {sentimentDrift.length > 0 && (
            <div className="bg-white/5 border border-white/10 p-6 space-y-6 backdrop-blur-xl rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MotionIcon><TrendingUp size={14} className="text-primary" /></MotionIcon>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold">Sentiment Trend Analysis</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-[8px] uppercase tracking-widest text-on-surface-variant/40">Positive</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-[8px] uppercase tracking-widest text-on-surface-variant/40">Negative</span>
                  </div>
                </div>
              </div>

              <div className="h-48 w-full relative">
                {sentimentDrift.length === 1 && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-on-surface-variant/40 bg-surface-container-low/80 px-4 py-2 border border-white/5 rounded-sm">
                      Insufficient data for trend analysis
                    </p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sentimentDrift.map((val, i) => ({
                      message: i + 1,
                      sentiment: val,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="message" 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      label={{ value: 'Message #', position: 'insideBottomRight', offset: -5, fontSize: 8, fill: 'rgba(255,255,255,0.2)' }}
                    />
                    <YAxis 
                      domain={[-1, 1]} 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      ticks={[-1, -0.5, 0, 0.5, 1]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <Area 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="var(--color-primary)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSentiment)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-widest text-on-surface-variant/20">Initial</span>
                    <span className={`text-xs font-bold ${sentimentDrift[0] > 0 ? 'text-primary' : sentimentDrift[0] < 0 ? 'text-red-500' : 'text-on-surface-variant/40'}`}>
                      {sentimentDrift[0] > 0 ? '+' : ''}{sentimentDrift[0].toFixed(2)}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/5"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-widest text-on-surface-variant/20">Current</span>
                    <span className={`text-xs font-bold ${sentimentDrift[sentimentDrift.length - 1] > 0 ? 'text-primary' : sentimentDrift[sentimentDrift.length - 1] < 0 ? 'text-red-500' : 'text-on-surface-variant/40'}`}>
                      {sentimentDrift[sentimentDrift.length - 1] > 0 ? '+' : ''}{sentimentDrift[sentimentDrift.length - 1].toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 italic">
                  {sentimentDrift.length > 1 ? (
                    sentimentDrift[sentimentDrift.length - 1] > sentimentDrift[0] 
                      ? 'Trending Positive ↑' 
                      : sentimentDrift[sentimentDrift.length - 1] < sentimentDrift[0] 
                        ? 'Trending Negative ↓' 
                        : 'Stable Trend →'
                  ) : 'No Trend Data'}
                </div>
              </div>
            </div>
          )}

          {sentimentDrift.length > 1 && (
            <div className="bg-white/5 border border-white/10 p-4 flex items-center justify-between">
              <span className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold">Sentiment Drift (Raw)</span>
              <div className="flex items-end gap-1 h-6">
                {sentimentDrift.map((val, i) => (
                  <div 
                    key={i} 
                    className={`w-1 transition-all duration-500 ${val > 0 ? 'bg-primary' : val < 0 ? 'bg-red-500' : 'bg-white/20'}`}
                    style={{ height: `${Math.max(20, Math.abs(val) * 100)}%` }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {isSummarizing && (
            <div className="bg-white/5 p-4 border-l-2 border-white/10 flex items-center gap-3">
              <MotionIcon><Loader2 size={12} className="animate-spin text-on-surface-variant/40" /></MotionIcon>
              <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 italic">Synthesizing thread context...</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 mr-2">Labels:</span>
              {(selectedEmail.labels || []).map(label => (
                <span key={label} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase tracking-widest rounded-sm">
                  <MotionIcon><Tag size={10} /></MotionIcon>
                  {label}
                  <button onClick={() => handleToggleLabel(label)} className="hover:text-red-500 transition-colors">
                    <MotionIcon><X size={10} /></MotionIcon>
                  </button>
                </span>
              ))}
              <form onSubmit={handleAddCustomLabel} className="flex items-center ml-2">
                <input 
                  type="text"
                  placeholder="Add label..."
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  className="bg-transparent border-b border-white/10 text-[10px] uppercase tracking-widest py-1 px-2 focus:outline-none focus:border-primary transition-colors w-24"
                />
                <button type="submit" className="p-1 text-on-surface-variant/40 hover:text-primary transition-colors backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200">
                  <MotionIcon><Plus size={14} /></MotionIcon>
                </button>
              </form>
              
              {suggestedLabels.length > 0 && !isSummarizing && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 ml-4 border-l border-white/10 pl-4 duration-500"
                >
                  <div className="flex items-center gap-1">
                    <MotionIcon><Sparkles size={10} className="text-primary" /></MotionIcon>
                    <span className="text-[9px] uppercase tracking-widest text-primary font-black">AI Suggestions:</span>
                  </div>
                  {suggestedLabels.map(label => {
                    const isApplied = (selectedEmail.labels || []).includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => handleToggleLabel(label)}
                        className={cn(
                          "px-2 py-0.5 border text-[9px] uppercase tracking-widest transition-all",
                          isApplied 
                            ? "bg-primary text-on-primary border-primary" 
                            : "border-primary/40 text-primary hover:bg-primary/10"
                        )}
                      >
                        {isApplied ? '✓' : '+'} {label}
                      </button>
                    );
                  })}
                  <button 
                    onClick={handleApplyAllSuggestions}
                    className="ml-2 text-[8px] uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors underline underline-offset-4 backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200"
                  >
                    Apply All
                  </button>
                </motion.div>
              )}
            </div>

            <div className="flex gap-2">
              <button className="text-[8px] uppercase tracking-[0.2em] px-3 py-1.5 border border-white/10 text-on-surface-variant/40 hover:text-primary hover:border-primary transition-all backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200">Escalate</button>
              <button className="text-[8px] uppercase tracking-[0.2em] px-3 py-1.5 border border-white/10 text-on-surface-variant/40 hover:text-primary hover:border-primary transition-all backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200">Schedule</button>
              <button className="text-[8px] uppercase tracking-[0.2em] px-3 py-1.5 border border-white/10 text-on-surface-variant/40 hover:text-primary hover:border-primary transition-all backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200">Archive</button>
            </div>
          </div>

          <div className="bg-white/5 p-3 gap-2 flex flex-col border border-white/10">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40">Conversation Thread</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">{selectedEmail.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-sm",
                      urgencyScore && urgencyScore > 70 ? "bg-red-500 text-white" : "bg-primary/20 text-primary"
                    )}>
                      Urgency: {urgencyScore && urgencyScore > 70 ? 'High' : 'Normal'}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-sm",
                      selectedEmail.sentiment === 'Negative' ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary"
                    )}>
                      Sentiment: {selectedEmail.sentiment}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
              {emails
                .filter(e => e.threadId === selectedEmail.threadId)
                .sort((a, b) => a.id - b.id)
                .map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 ${msg.sender === 'me' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'} border border-white/5 relative group/msg`}>
                      <div className="absolute -left-1 top-4 w-0.5 h-8 bg-primary/40 opacity-0 group-hover/msg:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-center mb-2 gap-4">
                        <span className="text-[9px] uppercase tracking-widest opacity-60 font-bold">{msg.sender}</span>
                        <span className="text-[9px] opacity-40">{msg.time}</span>
                      </div>
                      <div className={`text-xs leading-relaxed markdown-content ${msg.sender === 'me' ? '[&_strong]:text-inherit [&_em]:text-inherit' : ''}`}>
                        <ReactMarkdown>{msg.sender === 'me' ? msg.content : highlightKeywords(msg.content)}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group monolith-scanline"
          >
            {/* Glassmorphism Editor Container */}
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-8 shadow-[0_0_40px_rgba(255,255,255,0.02)] relative overflow-hidden">
              {/* Subtle background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Header / Controls */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6 relative z-10">
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant/20 font-black">Mode</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setIsPreviewMode(false)}
                        className={cn(
                          "text-[10px] uppercase tracking-widest transition-all flex items-center gap-2",
                          !isPreviewMode ? "text-primary font-bold" : "text-on-surface-variant/40 hover:text-on-surface-variant/60"
                        )}
                      >
                        <MotionIcon>
                          <Edit3 size={12} />
                        </MotionIcon>
                        Editor
                      </button>
                      <button 
                        onClick={() => setIsPreviewMode(true)}
                        className={cn(
                          "text-[10px] uppercase tracking-widest transition-all flex items-center gap-2",
                          isPreviewMode ? "text-primary font-bold" : "text-on-surface-variant/40 hover:text-on-surface-variant/60"
                        )}
                      >
                        <MotionIcon>
                          <Eye size={12} />
                        </MotionIcon>
                        Preview
                      </button>
                    </div>
                  </div>

                  <div className="w-px h-8 bg-white/5 hidden md:block" />

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant/20 font-black">Tone</span>
                    <div className="flex bg-white/5 p-1 rounded-sm border border-white/5">
                      {(['Empathetic', 'Formal', 'Direct'] as const).map(tone => (
                        <motion.button 
                          key={tone}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setReplyTone(tone)}
                          title={`${tone} → ${tone === 'Formal' ? 'professional' : tone === 'Direct' ? 'concise' : 'understanding'} tone`}
                          className={cn(
                            "px-3 py-1 text-[9px] uppercase tracking-widest transition-all rounded-sm",
                            replyTone === tone ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant/40 hover:text-on-surface-variant/60"
                          )}
                        >
                          <MotionIcon><Circle size={8} fill={replyTone === tone ? "currentColor" : "none"} /></MotionIcon>
                          {tone}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="w-px h-8 bg-white/5 hidden md:block" />

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant/20 font-black">Length</span>
                    <div className="flex bg-white/5 p-1 rounded-sm border border-white/5">
                      {(['Short', 'Medium', 'Detailed'] as const).map(len => (
                        <motion.button 
                          key={len}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setReplyLength(len)}
                          className={cn(
                            "px-3 py-1 text-[9px] uppercase tracking-widest transition-all rounded-sm",
                            replyLength === len ? "bg-white/10 text-white" : "text-on-surface-variant/40 hover:text-on-surface-variant/60"
                          )}
                        >
                          {len}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {generatedReply && (
                  <div className="flex items-center gap-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-end gap-1"
                    >
                      <span className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant/20 font-black">Confidence</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map(i => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className={cn("w-1 h-3 rounded-full", i <= (aiConfidence === 'High' ? 3 : 2) ? "bg-primary" : "bg-white/10")} 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] uppercase tracking-widest text-primary font-bold">{aiConfidence}</span>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Editor Area */}
              <div className="relative min-h-[240px] flex flex-col z-10">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-on-surface-variant/40"
                    >
                      <div className="relative">
                      <MotionIcon><Loader2 size={32} className="animate-spin text-primary" /></MotionIcon>
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-primary blur-xl rounded-full"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-[0.3em] font-black animate-pulse">Thinking...</span>
                        <span className="text-[10px] opacity-60 mt-2">Synthesizing professional response</span>
                      </div>
                    </motion.div>
                  ) : isPreviewMode ? (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex-1 overflow-y-auto markdown-content text-on-surface/90 leading-relaxed prose prose-invert prose-sm max-w-none"
                    >
                      <ReactMarkdown>{generatedReply || '_No content generated yet._'}</ReactMarkdown>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="editor"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex-1 flex flex-col"
                    >
                      <textarea
                        value={generatedReply}
                        onChange={(e) => setGeneratedReply(e.target.value)}
                        placeholder="Select a negative email and click generate to see a preview, or start typing your own reply..."
                        className={cn(
                          "flex-1 w-full bg-transparent border-none focus:ring-0 resize-none text-sm leading-relaxed text-on-surface/80 placeholder:text-on-surface-variant/20 transition-all",
                          !generatedReply && "italic"
                        )}
                      />
                      
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 w-full mb-1">
                          <MotionIcon><Zap size={10} className="text-primary" /></MotionIcon>
                          <span className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant/20 font-black">Quick Responses</span>
                        </div>
                        {[
                          { label: 'Acknowledge', text: 'Thank you for your message. We have received your request and are currently reviewing it. We will get back to you shortly.' },
                          { label: 'Decline', text: 'Thank you for reaching out. Unfortunately, we are unable to proceed with your request at this time. We appreciate your understanding.' },
                          { label: 'Request Info', text: 'Thank you for your inquiry. To better assist you, could you please provide more details regarding your request?' },
                          { label: 'Confirm Resolution', text: 'We are pleased to inform you that the issue has been resolved. Please let us know if you encounter any further difficulties.' },
                          { label: 'Schedule Meeting', text: 'I would like to discuss this further. Are you available for a brief meeting later this week? Please let me know your availability.' }
                        ].map((action) => (
                          <motion.button
                            key={action.label}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setGeneratedReply(action.text)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-on-surface-variant/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all rounded-sm relative group/btn overflow-hidden"
                          >
                            <span className="relative z-10">{action.label}</span>
                            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                          </motion.button>
                        ))}
                      </div>
                      {!generatedReply && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                          <motion.div 
                            initial={{ opacity: 0.03 }}
                            animate={{ opacity: [0.03, 0.06, 0.03] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-8xl font-black uppercase tracking-tighter select-none relative"
                          >
                            Monolith AI
                            <motion.div 
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                            />
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Actions / Suggestions */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-6 relative z-10">
                {!isGenerating && aiSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MotionIcon><Sparkles size={12} className="text-primary" /></MotionIcon>
                      <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-black">Smart Suggestions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.map((suggestion, idx) => (
                        <motion.button 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1, ease: [0.23, 1, 0.32, 1] }}
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleGenerateReply(suggestion)}
                          className="group relative px-4 py-2 bg-white/5 border border-white/10 hover:border-primary/40 transition-all hover:bg-primary/5 flex items-center gap-2 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                          <MotionIcon><Zap size={10} className="text-primary opacity-40 group-hover:opacity-100" /></MotionIcon>
                          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 group-hover:text-primary transition-colors">{suggestion}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    {generatedReply && (
                      <div className="flex items-center gap-2">
                        <motion.button 
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary-rgb), 1)" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleImproveReply}
                          disabled={isImproving}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50 backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200"
                        >
                          {isImproving ? <MotionIcon><Loader2 size={12} className="animate-spin" /></MotionIcon> : <MotionIcon><Sparkles size={12} /></MotionIcon>}
                          Improve
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleGenerateReply()}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-on-surface-variant/60 border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          <MotionIcon><RefreshCw size={12} /></MotionIcon>
                          Regenerate
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCopyToClipboard}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-on-surface-variant/60 border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200"
                        >
                          <MotionIcon><Copy size={12} /></MotionIcon>
                          Copy
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {generatedReply ? (
                      <>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDiscardDraft}
                          className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 hover:text-red-500 transition-colors backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200"
                        >
                          Discard
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSaveDraft}
                          className="flex items-center gap-2 px-6 py-3 border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200"
                        >
                          {saveStatus === 'saving' ? <MotionIcon><Loader2 size={12} className="animate-spin" /></MotionIcon> : 
                           saveStatus === 'saved' ? <MotionIcon><CheckCircle size={12} className="text-green-500" /></MotionIcon> : <MotionIcon><Edit3 size={12} /></MotionIcon>} 
                          {saveStatus === 'saved' ? 'Saved' : 'Save Draft'}
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05, x: 5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSendReply}
                          disabled={isSending}
                          className="flex items-center gap-2 px-10 py-3 bg-primary text-on-primary text-[10px] uppercase tracking-widest font-black hover:bg-neutral-200 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.5)] backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200"
                        >
                          {isSending ? <MotionIcon><Loader2 size={14} className="animate-spin" /></MotionIcon> : <MotionIcon><Send size={14} /></MotionIcon>}
                          Send Response
                        </motion.button>
                      </>
                    ) : (
                      <motion.button 
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGenerateReply()}
                        disabled={isGenerating || selectedEmail.sentiment !== 'Negative'}
                        className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all duration-200 rounded-full px-6 py-3 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        {isGenerating ? <MotionIcon><Loader2 size={16} className="animate-spin" /></MotionIcon> : <MotionIcon><Sparkles size={16} /></MotionIcon>}
                        Generate AI Reply
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
};
