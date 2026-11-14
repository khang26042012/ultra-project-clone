'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Message } from '@/types/chat';
import CodeBlock from './CodeBlock';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  X,
  ShieldAlert,
  ShieldCheck,
  Activity,
  CheckCircle2,
  BookOpen,
  Send,
} from 'lucide-react';
import gsap from 'gsap';
import { useChat } from '@/context/ChatContext';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { fontSize = 'medium', sendMessage, activeConversation, isStreaming } = useChat();
  const [copied, setCopied] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [showThought, setShowThought] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [checkedSensoryItems, setCheckedSensoryItems] = useState<Record<string, string>>({});
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fontSizeClass =
    fontSize === 'small' ? 'text-[13px]' : fontSize === 'large' ? 'text-[17px]' : 'text-[15px]';

  // GSAP 60 FPS Message Reveal Animation (Fade & Slide In)
  useEffect(() => {
    if (messageRef.current) {
      gsap.fromTo(
        messageRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, []);

  // Keyboard shortcut (Escape, +, -) to control Lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxImageUrl) return;
      if (e.key === 'Escape') {
        setLightboxImageUrl(null);
        setLightboxZoom(1);
      } else if (e.key === '+' || e.key === '=') {
        setLightboxZoom((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === '-' || e.key === '_') {
        setLightboxZoom((prev) => Math.max(prev - 0.25, 0.5));
      }
    },
    [lightboxImageUrl]
  );

  useEffect(() => {
    if (lightboxImageUrl) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxImageUrl, handleKeyDown]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyClinicalCard = async (cardText: string) => {
    try {
      await navigator.clipboard.writeText(cardText);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    } catch {
      setCopiedCard(false);
    }
  };

  // Tactile Sensory Button Click Handler: sends farmer feedback directly to AI
  const handleSensoryAction = async (question: string, answer: 'Có' | 'Không') => {
    if (isStreaming) return;
    setCheckedSensoryItems((prev) => ({ ...prev, [question]: answer }));
    if (sendMessage) {
      try {
        const feedbackMessage = `Tôi đã kiểm tra thực địa ngoài vườn cho bài test "${question}": Kết quả là [${answer}]. Nhờ bác sĩ AgriVision chốt lại độ chắc chắn chẩn đoán và hướng dẫn phác đồ sinh học điều trị chi tiết.`;
        await sendMessage(feedbackMessage);
      } catch (err) {
        console.warn('Lỗi gửi phản hồi xúc giác:', err);
      }
    }
  };

  // Full-featured Markdown Parser: Code, Links, Bold-Italic, Bold, Italic
  const formatInlineMarkdown = (text: string): React.ReactNode => {
    const sanitizedText = text
      .replace(/\\%/g, '%')
      .replace(/\$\$+/g, '')
      .replace(/\$([^$]+)\$/g, '$1')
      .replace(/\$/g, '');

    const codeParts = sanitizedText.split(/(`[^`]+`)/g);

    return codeParts.map((part, pIdx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={`c-${pIdx}`}
            className="px-1.5 py-0.5 rounded bg-[#f0f0f0] dark:bg-[#282828] text-[#0d0d0d] dark:text-[#ececec] font-mono text-[13px] border border-[#e5e5e5] dark:border-[#383838]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Link regex: [label](url)
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      const tokens: { type: 'text' | 'link'; content: string; url?: string }[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = linkRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({ type: 'text', content: part.substring(lastIndex, match.index) });
        }
        tokens.push({ type: 'link', content: match[1], url: match[2] });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < part.length) {
        tokens.push({ type: 'text', content: part.substring(lastIndex) });
      }

      return tokens.map((token, tIdx) => {
        if (token.type === 'link') {
          return (
            <a
              key={`l-${pIdx}-${tIdx}`}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0d0d0d] dark:text-white underline decoration-[#8e8e8e] underline-offset-2 hover:decoration-[#0d0d0d] dark:hover:decoration-white font-medium inline-flex items-center gap-0.5"
            >
              <span>{token.content}</span>
            </a>
          );
        }

        // Sub-split for ***bold-italic***, **bold**, *italic*, _italic_
        const styleRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
        const subParts = token.content.split(styleRegex);

        return subParts.map((sub, sIdx) => {
          if (sub.startsWith('***') && sub.endsWith('***') && sub.length >= 6) {
            return (
              <strong key={`bi-${pIdx}-${tIdx}-${sIdx}`} className="font-semibold text-[#0d0d0d] dark:text-white">
                <em className="italic">{sub.slice(3, -3)}</em>
              </strong>
            );
          }
          if (sub.startsWith('**') && sub.endsWith('**') && sub.length >= 4) {
            const inner = sub.slice(2, -2);
            const innerParts = inner.split(/(_[^_]+_|\*[^*]+\*)/g);
            return (
              <strong key={`b-${pIdx}-${tIdx}-${sIdx}`} className="font-semibold text-[#0d0d0d] dark:text-white">
                {innerParts.map((ip, ipIdx) => {
                  if (
                    (ip.startsWith('_') && ip.endsWith('_') && ip.length >= 2) ||
                    (ip.startsWith('*') && ip.endsWith('*') && ip.length >= 2)
                  ) {
                    return (
                      <em key={ipIdx} className="italic font-medium">
                        {ip.slice(1, -1)}
                      </em>
                    );
                  }
                  return ip;
                })}
              </strong>
            );
          }
          if (
            (sub.startsWith('*') && sub.endsWith('*') && sub.length >= 2) ||
            (sub.startsWith('_') && sub.endsWith('_') && sub.length >= 2)
          ) {
            return (
              <em
                key={`i-${pIdx}-${tIdx}-${sIdx}`}
                className="italic font-medium text-[#111] dark:text-[#f0f0f0]"
              >
                {sub.slice(1, -1)}
              </em>
            );
          }
          return sub;
        });
      });
    });
  };

  // Extract Clinical Card Metadata from message content
  const clinicalCardData = React.useMemo(() => {
    if (message.role !== 'assistant' || !message.content) return null;
    const content = message.content;
    const hasCard =
      content.includes('PHIẾU KHÁM BỆNH LÂM SÀNG') ||
      content.includes('VL-PATH-2026') ||
      content.includes('BÀI TEST XÚC GIÁC THỰC ĐỊA');

    if (!hasCard) return null;

    // Extract File ID
    const idMatch = content.match(/VL-PATH-2026-([A-Z0-9]+)/i) || content.match(/VL-PATH-[A-Z0-9-]+/i);
    const fileId = idMatch ? idMatch[0] : 'VL-PATH-2026-AUTO';

    // Extract Danger Level
    let dangerLevel = 'Trung bình';
    let dangerColor = 'amber';
    if (content.includes('Hiểm nghèo') || content.includes('🔴')) {
      dangerLevel = 'Hiểm nghèo';
      dangerColor = 'red';
    } else if (content.includes('Nặng') || content.includes('🟠') || content.includes('Cao')) {
      dangerLevel = 'Nguy cơ cao';
      dangerColor = 'amber';
    } else if (content.includes('🟡') || content.includes('Trung bình')) {
      dangerLevel = 'Trung bình';
      dangerColor = 'blue';
    }

    // Extract Sensory Questions
    const sensoryQuestions: string[] = [];
    const testLines = content.split('\n');
    let inTestSection = false;

    for (const line of testLines) {
      const upper = line.toUpperCase();
      if (
        upper.includes('BÀI TEST XÚC GIÁC') ||
        upper.includes('BÀI TEST THỰC ĐỊA') ||
        upper.includes('KIỂM TRA THỰC ĐỊA') ||
        upper.includes('TEST THỰC ĐỊA') ||
        upper.includes('2 BƯỚC KIỂM TRA')
      ) {
        inTestSection = true;
        continue;
      }
      if (inTestSection && line.startsWith('###')) {
        inTestSection = false;
        break;
      }
      if (inTestSection && (/^\d+[\.\)]\s/.test(line.trim()) || /^[-*•]\s/.test(line.trim()))) {
        const cleanQ = line
          .trim()
          .replace(/^\d+[\.\)]\s*/, '')
          .replace(/^[-*•]\s*/, '')
          .replace(/\*\*\[(.*?)\]:\*\*/, '$1:')
          .replace(/->\s*\*.*?\*/, '')
          .trim();
        if (cleanQ && cleanQ.length > 5) sensoryQuestions.push(cleanQ);
      }
    }

    // Fallback default sensory checks if not parsed in bullet form
    const finalSensoryQuestions =
      sensoryQuestions.length > 0
        ? sensoryQuestions.slice(0, 3)
        : [
            'Kiểm tra độ ẩm mềm và màu sắc mạch dẫn mô bệnh tại thực địa',
            'Ngửi kiểm tra mùi chua men lên men hoặc dòng mủ vi khuẩn trào ra',
          ];

    return {
      fileId,
      dangerLevel,
      dangerColor,
      sensoryQuestions: finalSensoryQuestions,
    };
  }, [message.content, message.role]);

  // Render Markdown Table
  const renderMarkdownTable = (tableLines: string[], key: string | number) => {
    if (tableLines.length < 2) return null;
    const headerLine = tableLines[0];
    const dataLines = tableLines.slice(2);

    const parseRow = (line: string) => {
      const parts = line.split('|');
      if (parts.length > 2) {
        return parts.slice(1, -1).map((cell) => cell.trim());
      }
      return parts.map((cell) => cell.trim());
    };

    const headers = parseRow(headerLine);

    return (
      <div key={key} className="my-4 overflow-x-auto rounded-xl border border-[#e5e5e5] dark:border-[#2f2f2f] bg-[#ffffff] dark:bg-[#1a1a1a]">
        <table className="min-w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-[#2f2f2f] bg-[#f9f9f9] dark:bg-[#222222]">
              {headers.map((h, hIdx) => (
                <th key={hIdx} className="px-3.5 py-2.5 font-semibold text-[#0d0d0d] dark:text-[#ececec]">
                  {formatInlineMarkdown(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#2f2f2f]">
            {dataLines.map((rowLine, rIdx) => {
              const cells = parseRow(rowLine);
              return (
                <tr key={rIdx} className="hover:bg-[#f9f9f9] dark:hover:bg-[#202020] transition-colors">
                  {cells.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 leading-relaxed text-[#525252] dark:text-[#c4c4c4]">
                      {formatInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render content with code blocks, tables, and typography
  const renderFormattedContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const blocks: { type: 'text' | 'code'; content: string; language?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }
      blocks.push({ type: 'code', language: match[1] || 'plaintext', content: match[2].trimEnd() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      blocks.push({ type: 'text', content: content.substring(lastIndex) });
    }

    return blocks.map((block, index) => {
      if (block.type === 'code') {
        return <CodeBlock key={index} code={block.content} language={block.language || 'plaintext'} />;
      }

      const lines = block.content.split('\n');
      const elements: React.ReactNode[] = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];

        // Table detection
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const tableLines: string[] = [line];
          let j = i + 1;
          while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
            tableLines.push(lines[j]);
            j++;
          }
          if (tableLines.length >= 2) {
            elements.push(renderMarkdownTable(tableLines, i));
            i = j;
            continue;
          }
        }

        // Horizontal rules
        if (/^(\-{2,}|\*{3,})$/.test(line.trim())) {
          elements.push(<hr key={i} className="my-3.5 border-t border-[#e5e5e5] dark:border-[#2a2a2a]" />);
          i++;
          continue;
        }

        // Headings
        if (line.startsWith('# ')) {
          elements.push(
            <h1 key={i} className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d0d0d] dark:text-white mt-5 mb-2.5">
              {formatInlineMarkdown(line.replace('# ', ''))}
            </h1>
          );
          i++;
          continue;
        }
        if (line.startsWith('## ')) {
          elements.push(
            <h2 key={i} className="text-lg sm:text-xl font-bold tracking-tight text-[#0d0d0d] dark:text-white mt-4 mb-2">
              {formatInlineMarkdown(line.replace('## ', ''))}
            </h2>
          );
          i++;
          continue;
        }
        if (line.startsWith('### ')) {
          elements.push(
            <h3 key={i} className="text-base sm:text-lg font-bold text-[#0d0d0d] dark:text-white mt-3.5 mb-1.5 flex items-center gap-1.5">
              {formatInlineMarkdown(line.replace('### ', ''))}
            </h3>
          );
          i++;
          continue;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
          elements.push(
            <blockquote
              key={i}
              className="border-l-2 border-[#0d0d0d] dark:border-white pl-3.5 italic text-[#5d5d5d] dark:text-[#b4b4b4] my-2 leading-relaxed"
            >
              {formatInlineMarkdown(line.replace('> ', ''))}
            </blockquote>
          );
          i++;
          continue;
        }

        // Bullet lists
        if (/^[-*+]\s/.test(line.trim())) {
          const text = line.trim().replace(/^[-*+]\s/, '');
          elements.push(
            <div key={i} className="flex items-start gap-2.5 pl-5 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8e8e8e] dark:bg-[#737373] mt-2.5 shrink-0" />
              <span className="leading-7 flex-1">{formatInlineMarkdown(text)}</span>
            </div>
          );
          i++;
          continue;
        }

        // Numbered lists
        if (/^\d+\.\s/.test(line.trim())) {
          const match = line.trim().match(/^(\d+\.)\s(.*)/);
          if (match) {
            elements.push(
              <div key={i} className="flex items-start gap-2.5 pl-2 my-1">
                <span className="font-semibold text-[#8e8e8e] shrink-0 mt-0.5">{match[1]}</span>
                <span className="leading-7 flex-1">{formatInlineMarkdown(match[2])}</span>
              </div>
            );
            i++;
            continue;
          }
        }

        if (!line.trim()) {
          elements.push(<div key={i} className="h-1" />);
          i++;
          continue;
        }

        // Markdown image: ![alt](url)
        const mdImgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
        if (mdImgMatch) {
          const imgAlt = mdImgMatch[1];
          const imgSrc = mdImgMatch[2];
          elements.push(
            <div
              key={i}
              onClick={() => {
                setLightboxZoom(1);
                setLightboxImageUrl(imgSrc);
              }}
              className="my-3 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 max-w-lg cursor-pointer group/mdimg relative"
            >
              <img
                src={imgSrc}
                alt={imgAlt || 'Ảnh chẩn đoán'}
                className="w-full max-h-[360px] object-contain transition-transform duration-200 group-hover/mdimg:scale-[1.01]"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 opacity-80 group-hover/mdimg:opacity-100 transition-opacity">
                <ZoomIn className="w-3 h-3" strokeWidth={1.5} />
                <span>{imgAlt || 'Phóng to'}</span>
              </div>
            </div>
          );
          i++;
          continue;
        }

        // Standard paragraph
        elements.push(
          <p key={i} className="leading-7">
            {formatInlineMarkdown(line)}
          </p>
        );
        i++;
      }

      return (
        <div key={index} className="space-y-2">
          {elements}
        </div>
      );
    });
  };

  // Universal Lightbox Modal rendered via createPortal directly into document.body
  const renderLightbox = () => {
    if (!lightboxImageUrl || !mounted) return null;

    return createPortal(
      <div
        onClick={() => {
          setLightboxImageUrl(null);
          setLightboxZoom(1);
        }}
        className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150"
      >
        {/* Top Control Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-1.5 sm:gap-2 bg-black/75 p-1.5 sm:p-2 rounded-full backdrop-blur-md border border-white/20 text-white z-10 shadow-xl"
        >
          <button
            type="button"
            onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.25, 3.5))}
            title="Phóng to (+)"
            className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all cursor-pointer text-white"
          >
            <ZoomIn className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.25, 0.5))}
            title="Thu nhỏ (-)"
            className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all cursor-pointer text-white"
          >
            <ZoomOut className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setLightboxZoom(1)}
            title="Đặt lại kích thước (100%)"
            className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all cursor-pointer text-white"
          >
            <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={1.75} />
          </button>
          <div className="w-px h-5 bg-white/30 my-auto" />
          <button
            type="button"
            onClick={() => {
              setLightboxImageUrl(null);
              setLightboxZoom(1);
            }}
            title="Đóng (Esc)"
            className="p-2 rounded-full hover:bg-red-500/30 active:scale-95 transition-all text-white hover:text-red-400 cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Center Image Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl max-h-[85vh] flex items-center justify-center p-2 overflow-auto no-scrollbar"
        >
          <img
            src={lightboxImageUrl}
            alt="Chi tiết ảnh phóng to"
            style={{
              transform: `scale(${lightboxZoom})`,
              transformOrigin: 'center center',
            }}
            className="max-w-[92vw] max-h-[80vh] w-auto h-auto min-w-[260px] min-h-[260px] object-contain rounded-2xl shadow-2xl transition-transform duration-200 cursor-zoom-in select-none bg-black/40"
            onClick={() => setLightboxZoom((prev) => (prev > 1 ? 1 : 2))}
          />
        </div>

        {/* Bottom Helper Hint */}
        <div className="absolute bottom-4 sm:bottom-6 text-xs text-white/80 bg-black/70 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-sm pointer-events-none">
          Chạm vào ảnh để phóng to 2x • Nhấn X hoặc bấm ra ngoài để đóng
        </div>
      </div>,
      document.body
    );
  };

  // User Message Bubble
  if (message.role === 'user') {
    return (
      <>
        <div ref={messageRef} className="flex justify-end mb-6">
          <div
            className={`max-w-[85%] sm:max-w-[70%] bg-[#f4f4f4] dark:bg-[#262626] text-[#0d0d0d] dark:text-[#ececec] border border-[#e5e5e5] dark:border-transparent px-4 sm:px-5 py-3 rounded-[20px] ${fontSizeClass} chat-message-text leading-relaxed shadow-xs`}
          >
            {message.imageUrl && (
              <div
                onClick={() => {
                  setLightboxZoom(1);
                  setLightboxImageUrl(message.imageUrl || null);
                }}
                className="relative mb-2.5 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 max-w-[220px] max-h-[160px] cursor-pointer group/img"
              >
                <img
                  src={message.imageUrl}
                  alt="Ảnh đính kèm chẩn đoán"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105"
                />
                <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 opacity-90 group-hover/img:opacity-100 transition-opacity">
                  <ZoomIn className="w-3 h-3" strokeWidth={1.5} />
                  <span>Phóng to</span>
                </div>
              </div>
            )}
            {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
          </div>
        </div>

        {renderLightbox()}
      </>
    );
  }

  const isCurrentlyThinking = message.isThinking && message.isStreaming;
  const hasSettledThought = !isCurrentlyThinking && !!message.thought;

  // Assistant Bubble
  return (
    <>
      <div
        ref={messageRef}
        className={`w-full mb-8 text-[#0d0d0d] dark:text-[#ececec] ${fontSizeClass} chat-message-text group`}
      >
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#0d0d0d] dark:text-white">
        <span>AgriVision</span>
      </div>

      {/* 1. Live Searching & Computer Vision Indicator Badges */}
      {message.searchingQuery && (
        <div className="inline-flex items-center text-xs font-medium text-[#737373] dark:text-[#a3a3a3] animate-pulse mb-2 select-none">
          <span>🔍 Đang tra cứu dữ liệu...</span>
        </div>
      )}

      {message.visionSegmenting && (
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#00b4d8] dark:text-[#00F2FE] animate-pulse mb-2.5 select-none px-3 py-1.5 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30">
          <span className="w-2 h-2 rounded-full bg-[#00F2FE] animate-ping" />
          <span>Đang khoanh vùng tổn thương mô lá...</span>
        </div>
      )}

      {/* Khoanh vùng tổn thương & Diện tích (Không watermark) */}
      {message.annotatedImageUrl && (
        <div
          onClick={() => {
            setLightboxZoom(1);
            setLightboxImageUrl(message.annotatedImageUrl || null);
          }}
          className="my-3 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 max-w-lg cursor-pointer group/hud relative shadow-xs"
        >
          <img
            src={message.annotatedImageUrl}
            alt="Khoanh vùng tổn thương mô"
            className="w-full max-h-[380px] object-contain transition-transform duration-200 group-hover/hud:scale-[1.01]"
          />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 opacity-80 group-hover/hud:opacity-100 transition-opacity">
            <ZoomIn className="w-3 h-3" strokeWidth={1.5} />
            <span>Phóng to</span>
          </div>
        </div>
      )}

      {/* 2. Web Search Sources Dropdown Bar */}
      {message.sources && message.sources.length > 0 && (
        <div className="mb-2.5 select-none">
          <button
            type="button"
            onClick={() => setShowSources(!showSources)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#737373] hover:text-[#0d0d0d] dark:text-[#a3a3a3] dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>Đã tìm kiếm {message.sources.length} nguồn thông tin {showSources ? '▴' : '▾'}</span>
          </button>

          {showSources && (
            <div className="mt-2 pl-3.5 border-l-2 border-[#e5e5e5] dark:border-[#383838] space-y-2 py-1 max-h-60 overflow-y-auto">
              {message.sources.map((src, sIdx) => {
                let domain = '';
                try {
                  domain = new URL(src.url).hostname.replace('www.', '');
                } catch {
                  domain = 'web';
                }
                const isSafeHttp = /^https?:\/\//i.test(src.url || '');
                const safeUrl = isSafeHttp ? src.url : '#';

                return (
                  <a
                    key={sIdx}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col group/src text-left p-2 rounded-xl hover:bg-[#f4f4f4] dark:hover:bg-[#212121] transition-colors border border-transparent hover:border-[#e5e5e5] dark:hover:border-[#333]"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8e8e8e]">
                      <img
                        src={src.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                        alt="favicon"
                        className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="truncate font-mono">{domain}</span>
                      <ExternalLink className="w-3 h-3 group-hover/src:text-[#0d0d0d] dark:group-hover/src:text-white ml-auto" strokeWidth={1.5} />
                    </div>
                    <div className="text-xs font-medium text-[#0d0d0d] dark:text-[#ececec] group-hover/src:underline line-clamp-1 mt-0.5">
                      {src.title}
                    </div>
                    {src.snippet && (
                      <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] line-clamp-2 mt-0.5 leading-snug">
                        {src.snippet}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Thinking UI: Khi đang thinking thì để ra ngoài, xong thì thu gọn lại */}
      {isCurrentlyThinking && (
        <div className="my-2.5 p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-1.5 select-none animate-in fade-in duration-150">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Đang suy nghĩ...</span>
          </div>
          {message.thought && (
            <div className="border-l-2 border-emerald-500/40 pl-3 max-h-64 overflow-y-auto text-[13px] text-[#5d5d5d] dark:text-[#a3a3a3] font-sans leading-relaxed whitespace-pre-wrap">
              {message.thought}
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500/70 animate-pulse align-middle" />
            </div>
          )}
        </div>
      )}

      {hasSettledThought && (
        <div className="mb-2.5 select-none">
          <button
            type="button"
            onClick={() => setShowThought(!showThought)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#737373] hover:text-[#0d0d0d] dark:text-[#a3a3a3] dark:hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span>
              {message.thinkingSeconds
                ? `Đã suy luận trong ${message.thinkingSeconds}s`
                : 'Đã suy luận trong 1s'}{' '}
              {showThought ? '▴' : '▾'}
            </span>
          </button>

          {showThought && (
            <div className="border-l-2 border-[#e5e5e5] dark:border-[#383838] pl-3.5 my-2 max-h-72 overflow-y-auto text-[13px] text-[#5d5d5d] dark:text-[#a3a3a3] font-sans leading-relaxed whitespace-pre-wrap">
              {message.thought}
            </div>
          )}
        </div>
      )}

      {/* 4. Direct Content */}
      <div className="leading-relaxed">
        {renderFormattedContent(message.content)}
        {message.isStreaming && !isCurrentlyThinking && (
          <span className="inline-block w-2 h-4 ml-1.5 bg-[#0d0d0d] dark:bg-[#ececec] rounded-xs animate-pulse align-middle" />
        )}
      </div>

      {/* 5. Interactive Clinical Pathology Card (Trụ cột 2) */}
      {!message.isStreaming && clinicalCardData && (
        <div className="mt-4 p-4 sm:p-5 rounded-3xl bg-[#f9f9f9] dark:bg-[#191919] border border-[#e5e5e5] dark:border-[#2e2e2e] shadow-xs space-y-4 select-none">
          {/* Card Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                🩺
              </span>
              <span className="font-bold text-xs sm:text-sm tracking-tight text-[#0d0d0d] dark:text-white">
                HỒ SƠ BỆNH ÁN ĐIỆN TỬ
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#ffffff] dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#383838] text-[#525252] dark:text-[#a3a3a3]">
                {clinicalCardData.fileId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {clinicalCardData.dangerLevel === 'Hiểm nghèo' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  Hiểm nghèo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Nguy cơ cao
                </span>
              )}
            </div>
          </div>

          {/* Interactive Sensory Verification Buttons */}
          {clinicalCardData.sensoryQuestions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#ffffff] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#333] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0d0d0d] dark:text-white">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                <span>Nút kiểm tra xúc giác thực địa (Bấm để gửi phản hồi cho AI):</span>
              </div>

              <div className="space-y-2">
                {clinicalCardData.sensoryQuestions.map((q, qIdx) => {
                  const currentAnswer = checkedSensoryItems[q];
                  return (
                    <div
                      key={qIdx}
                      className="p-2.5 rounded-xl bg-[#f9f9f9] dark:bg-[#161616] border border-[#e5e5e5] dark:border-[#2b2b2b] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <span className="text-xs text-[#333] dark:text-[#d4d4d4] flex-1 leading-snug">
                        {q}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleSensoryAction(q, 'Có')}
                          className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                            currentAnswer === 'Có'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-[#ffffff] dark:bg-[#262626] text-[#333] dark:text-[#e0e0e0] border-[#d4d4d4] dark:border-[#444] hover:border-emerald-600'
                          }`}
                        >
                          ✓ Có
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSensoryAction(q, 'Không')}
                          className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                            currentAnswer === 'Không'
                              ? 'bg-red-600 text-white border-red-600 shadow-xs'
                              : 'bg-[#ffffff] dark:bg-[#262626] text-[#333] dark:text-[#e0e0e0] border-[#d4d4d4] dark:border-[#444] hover:border-red-600'
                          }`}
                        >
                          ✕ Không
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <Link
              href="/crops"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#525252] hover:text-[#0d0d0d] dark:text-[#a3a3a3] dark:hover:text-white transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Tra cứu trong Toàn Thư (1.500+ cây)</span>
            </Link>

            <button
              type="button"
              onClick={() => handleCopyClinicalCard(message.content)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-[#ffffff] hover:bg-[#f0f0f0] dark:bg-[#262626] dark:hover:bg-[#333] text-[#0d0d0d] dark:text-white border border-[#e5e5e5] dark:border-[#383838] transition-colors cursor-pointer shadow-2xs"
            >
              {copiedCard ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
                  <span>Đã sao chép bệnh án!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Xuất Phiếu Khám Bệnh</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 6. Action Bar */}
      {!message.isStreaming && message.content && (
        <div className="flex items-center gap-2 mt-2 pt-1 text-[#8e8e8e] opacity-80 group-hover:opacity-100 transition-opacity text-xs">
          <button
            onClick={handleCopy}
            title="Sao chép tin nhắn"
            className="p-1.5 rounded-md hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] hover:text-[#0d0d0d] dark:text-[#8e8e8e] dark:hover:text-[#ececec] transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#0d0d0d] dark:text-white" strokeWidth={1.5} />
            ) : (
              <Copy className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>

          <button
            onClick={() => setLiked(liked === true ? null : true)}
            title="Hữu ích"
            className={`p-1.5 rounded-md hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f] transition-colors cursor-pointer ${
              liked === true ? 'text-[#0d0d0d] dark:text-white font-bold' : 'text-[#5d5d5d] dark:text-[#8e8e8e]'
            }`}
          >
            <ThumbsUp className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setLiked(liked === false ? null : false)}
            title="Chưa chính xác"
            className={`p-1.5 rounded-md hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f] transition-colors cursor-pointer ${
              liked === false ? 'text-[#0d0d0d] dark:text-white font-bold' : 'text-[#5d5d5d] dark:text-[#8e8e8e]'
            }`}
          >
            <ThumbsDown className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <button
            onClick={async () => {
              if (isStreaming) return;
              const msgs = activeConversation?.messages || [];
              const thisIdx = msgs.findIndex((m) => m.id === message.id);
              let prevUserMsg = undefined;
              for (let i = (thisIdx >= 0 ? thisIdx : msgs.length) - 1; i >= 0; i--) {
                if (msgs[i].role === 'user') {
                  prevUserMsg = msgs[i];
                  break;
                }
              }
              if (prevUserMsg) {
                try {
                  await sendMessage(prevUserMsg.content, prevUserMsg.imageUrl);
                } catch (err) {
                  console.warn('Lỗi regenerate:', err);
                }
              }
            }}
            disabled={isStreaming}
            title="Tạo lại câu trả lời"
            className="p-1.5 rounded-md hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] hover:text-[#0d0d0d] dark:text-[#8e8e8e] dark:hover:text-[#ececec] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      )}

      </div>
      {renderLightbox()}
    </>
  );
}
