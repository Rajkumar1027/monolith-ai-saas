import React, { useState, useEffect, useMemo } from 'react';
import { Mail, CheckCircle, Sparkles, Send, Loader2, Circle, CircleCheck, Edit3, Eye, Search, X, Tag, Plus, ArrowUpDown, ChevronUp, ChevronDown, TrendingUp, ThumbsUp, ThumbsDown, HelpCircle, Calendar, Clock, Copy, RefreshCcw, RefreshCw, Zap, Check, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MotionIcon } from '@/src/components/MotionIcon';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Toaster, toast } from 'sonner';
import { cn } from '@/src/lib/utils';

const initialEmails = [
  { id: 1, threadId: 't1', sender: 'alex.v@monolith.ai', subject: 'Quarterly growth trajectory expectations', time: '14:20', sentiment: 'Positive', content: 'The **growth trajectory** for Q3 looks *promising*. We are seeing a **15% increase** in user retention.', read: false, labels: ['Urgent'] },
  { id: 2, threadId: 't2', sender: 'support@cloud.sys', subject: 'Critical latency detected in Node-04', time: '11:05', sentiment: 'Negative', content: 'We are experiencing **severe latency issues** in Node-04. This is affecting *billing services* and causing timeouts for several enterprise clients.', read: true, labels: ['Follow-up'] },
  { id: 4, threadId: 't2', sender: 'me', subject: 'Re: Critical latency detected in Node-04', time: '11:15', sentiment: 'Neutral', content: 'Acknowledged. I am looking into the **logs** now. Is this affecting *all regions*?', read: true, labels: [] },
  { id: 5, threadId: 't2', sender: 'support@cloud.sys', subject: 'Re: Critical latency detected in Node-04', time: '11:20', sentiment: 'Negative', content: 'Yes, primarily **US-EAST-1** and **EU-WEST-1**. We need a resolution *ASAP* as SLAs are being breached.', read: false, labels: ['Urgent', 'Follow-up'] },
  { id: 3, threadId: 't3', sender: 'billing@stripe.com', subject: 'Invoice #8841 available for review', time: '09:44', sentiment: 'Neutral', content: 'Your monthly invoice for **February** is now available in your dashboard. Please review it at your *earliest convenience*.', read: false, labels: [] },
];

export const EmailAnalysisPage: React.FC = () => {
  const [emailList, setEmailList] = useState(initialEmails);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSentiment, setActiveSentiment] = useState<'All' | 'Positive' | 'Neutral' | 'Negative'>('All');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(initialEmails[3]);
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
      const threadMessages = emailList
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
      const selectedEmails = emailList.filter(e => selectedIds.includes(e.id));
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
      
      setEmailList(prev => prev.map(email => {
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
    setEmailList(prev => prev.map(email => {
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
      const threadEmails = emailList.filter(email => email.threadId === threadId).map(email => email.id);
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
      const remainingEmails = emailList.filter(e => !selectedIds.includes(e.id));
      setEmailList(remainingEmails);
      
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

    setEmailList(prev => {
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
      const threadEmails = emailList.filter(email => email.threadId === threadId);
      const allRead = threadEmails.every(email => email.read);
      
      setEmailList(prev => prev.map(email => {
        if (email.threadId === threadId) {
          return { ...email, read: !allRead };
        }
        return email;
      }));
    } else {
      setEmailList(prev => prev.map(email => 
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
        id: Math.max(...emailList.map(e => e.id)) + 1,
        threadId: selectedEmail.threadId,
        sender: 'me',
        subject: `Re: ${selectedEmail.subject}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: 'Neutral' as const,
        content: generatedReply,
        read: true,
        labels: []
      };

      setEmailList(prev => [...prev, newMessage]);
      
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
      const threadHistory = emailList
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
    setEmailList(prev => prev.map(email => {
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
      setEmailList(prev => [...prev, ...moreEmails]);
      toast.success('Loaded more communications', {
        className: 'bg-surface-container-highest border-white/10 text-white font-headline uppercase tracking-widest text-[10px]',
        icon: <MotionIcon><RefreshCcw size={14} className="text-primary" /></MotionIcon>
      });
    }, 1500);
  };

  const allLabels = Array.from(new Set(emailList.flatMap(e => e.labels || [])));

  const filteredEmails = emailList.filter(email => {
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
    const groups: Record<string, typeof emailList> = {};
    emailList.forEach(email => {
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
  }, [emailList, filteredEmails, sortKey, sortOrder]);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <Toaster position="bottom-right" theme="dark" />

      {/* Row 1 - Header + Connect Gmail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center glass-panel p-8 rounded-2xl border border-white/10 bg-white/5">
        <div>
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter mb-4 break-words whitespace-normal text-white">Email <span className="text-white/40">Analysis</span></h1>
          <p className="text-on-surface-variant max-w-md break-words whitespace-normal leading-relaxed font-light">
            Real-time processing of inbound communications using monolithic sentiment architecture.
          </p>
        </div>
        <div className="flex justify-end">
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isConnected) return;
              setIsConnecting(true);
              setTimeout(() => {
                setIsConnecting(false);
                setIsConnected(true);
                toast.success('Gmail connection verified');
              }, 2000);
            }}
            disabled={isConnecting}
            className={cn(
              "px-8 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all rounded-full border border-white/20",
              isConnected 
                ? "bg-green-500/10 text-green-400 border-green-500/20 cursor-default" 
                : "bg-white text-black hover:bg-neutral-200"
            )}
          >
            {isConnecting ? (
              <MotionIcon><Loader2 size={18} className="animate-spin" /></MotionIcon>
            ) : isConnected ? (
              <MotionIcon><CheckCircle size={18} /></MotionIcon>
            ) : (
              <MotionIcon><Mail size={18} /></MotionIcon>
            )}
            {isConnecting ? 'Connecting...' : isConnected ? 'Gmail Connected' : 'Connect Gmail Account'}
          </motion.button>
        </div>
      </div>

      {/* Row 2 - Mail List + Detail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Side: Email List */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="relative w-full group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
            <div className="relative">
              <MotionIcon className="absolute left-6 top-1/2 -translate-y-1/2"><Search size={20} className="text-on-surface-variant/70 group-focus-within:text-white transition-colors" /></MotionIcon>
              <input 
                type="text"
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full glass-panel pl-16 pr-6 py-6 text-lg font-headline focus:outline-none focus:border-white/20 transition-all placeholder:text-white/20 shadow-2xl rounded-2xl bg-white/5 border border-white/10"
              />
            </div>
          </div>

          <div className="glass-panel flex-1 flex flex-col min-h-[500px] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <span className="text-[0.65rem] uppercase tracking-widest font-black text-white/50">{filteredEmails.length} COMMUNICATIONS</span>
              <div className="flex gap-2">
                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <MotionIcon><ArrowUpDown size={14} className={cn("text-white/40", sortOrder === 'asc' ? "text-white" : "")} /></MotionIcon>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {groupedThreads.map((thread) => (
                <motion.div 
                  key={thread.threadId}
                  onClick={() => setSelectedEmail(thread.latestEmail)}
                  className={cn(
                    "p-4 rounded-xl cursor-pointer transition-all border border-transparent hover:bg-white/5 hover:border-white/10",
                    selectedEmail?.threadId === thread.threadId ? "bg-white/10 border-white/20 shadow-lg" : "bg-transparent"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[0.6rem] uppercase tracking-widest font-black text-white/80 break-words whitespace-normal">{thread.latestEmail.sender}</span>
                    <span className="text-[0.55rem] font-mono text-white/40">{thread.latestEmail.time}</span>
                  </div>
                  <h4 className="text-[0.75rem] font-bold text-white mb-2 break-words whitespace-normal leading-tight">{thread.latestEmail.subject}</h4>
                  <p className="text-[0.65rem] text-white/50 line-clamp-2 break-words whitespace-normal leading-relaxed">{thread.latestEmail.content.replace(/\*\*/g, '')}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Detail View */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="glass-panel flex-1 min-h-[500px] overflow-hidden flex flex-col rounded-2xl border border-white/10 bg-white/5 p-8">
            {selectedEmail ? (
              <>
                <div className="flex justify-between items-start border-b border-white/10 pb-8 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-2 break-words whitespace-normal">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-4 text-white/60">
                      <span className="text-[0.65rem] uppercase tracking-widest font-black">{selectedEmail.sender}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span className="text-[0.65rem] font-mono">{selectedEmail.time}</span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-4 py-1 rounded-full text-[0.65rem] uppercase tracking-widest font-black border",
                    selectedEmail.sentiment === 'Positive' ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                    selectedEmail.sentiment === 'Negative' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-white/50 border-white/10"
                  )}>
                    {selectedEmail.sentiment}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8 mb-8">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-lg text-white/90 leading-relaxed font-light break-words whitespace-normal">
                      <ReactMarkdown>
                        {selectedEmail.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                <Mail size={64} className="mb-6" />
                <p className="uppercase tracking-[0.5em] text-[0.8rem] font-black">Select Communication</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3 - AI Reply Feature Row */}
      <div className="glass-panel p-8 w-full border border-white/10 bg-white/5 rounded-2xl flex flex-col space-y-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-[0.75rem] uppercase tracking-widest font-black text-white">Synthetic Response Intelligence</h3>
              <p className="text-[0.6rem] text-white/40 uppercase tracking-[0.2em] mt-1 font-medium">Neural Generation v4.0</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex flex-col gap-2">
                <span className="text-[0.5rem] uppercase tracking-widest text-white/40 font-bold">MODE</span>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                  {['Empathetic', 'Formal', 'Direct'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setReplyTone(t as any)}
                      className={cn(
                        "px-4 py-1 text-[0.6rem] font-black uppercase tracking-widest rounded-md transition-all",
                        replyTone === t ? "bg-white text-black" : "text-white/40 hover:text-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
             </div>
             <div className="flex flex-col gap-2">
                <span className="text-[0.5rem] uppercase tracking-widest text-white/40 font-bold">LENGTH</span>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                  {['Short', 'Medium', 'Detailed'].map(l => (
                    <button 
                      key={l}
                      onClick={() => setReplyLength(l as any)}
                      className={cn(
                        "px-4 py-1 text-[0.6rem] font-black uppercase tracking-widest rounded-md transition-all",
                        replyLength === l ? "bg-white text-black" : "text-white/40 hover:text-white"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-transparent blur opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
          <textarea 
            value={generatedReply}
            onChange={(e) => setGeneratedReply(e.target.value)}
            placeholder="Neural engine ready. Generate reply or type custom instruction..."
            className="w-full min-h-[250px] bg-black/40 border border-white/10 rounded-xl p-8 focus:outline-none focus:border-white/20 text-white font-light text-lg leading-relaxed custom-scrollbar placeholder:text-white/10 transition-all resize-none italic"
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleGenerateReply()}
              disabled={isGenerating}
              className="px-10 py-4 bg-white text-black text-[0.7rem] uppercase tracking-[0.2em] font-black hover:bg-neutral-200 transition-all disabled:opacity-30 rounded-full flex items-center gap-3"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generatedReply ? "Regenerate" : "Generate Neural Reply"}
            </motion.button>
            {generatedReply && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleImproveReply}
                disabled={isImproving}
                className="px-8 py-4 border border-white/20 text-white text-[0.7rem] uppercase tracking-[0.2em] font-black hover:bg-white/5 transition-all rounded-full flex items-center gap-3"
              >
                {isImproving ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Improve
              </motion.button>
            )}
          </div>
          {generatedReply && (
            <div className="flex items-center gap-6">
              <button onClick={handleDiscardDraft} className="text-[0.6rem] uppercase tracking-widest text-white/30 hover:text-red-400 transition-colors font-bold">DISCARD DRAFT</button>
              <motion.button 
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendReply}
                disabled={isSending}
                className="px-12 py-4 bg-white/10 border border-white/20 text-white text-[0.7rem] uppercase tracking-[0.25em] font-black hover:bg-white/20 transition-all rounded-full flex items-center gap-4"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send Response
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
