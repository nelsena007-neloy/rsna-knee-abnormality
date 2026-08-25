import React, { useState, useRef, useEffect } from 'react';
import { StudyInstance, PredictionResult, ModelSettingsConfig } from '../types';
import { Bot, Send, Sparkles, X, User, ShieldCheck, ChevronRight, Sliders, Cpu } from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudy: StudyInstance;
  predictions: Record<string, number>;
  aiExplanation?: PredictionResult | null;
  modelSettings?: ModelSettingsConfig;
  onUpdateModelSettings?: (settings: Partial<ModelSettingsConfig>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentStudy,
  predictions,
  aiExplanation,
  modelSettings = {
    selectedModel: 'gemini-2.5-pro',
    temperature: 0.1,
    topP: 0.85,
    responseFormat: 'JSON'
  },
  onUpdateModelSettings
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `Welcome to the **RSNA MSK Radiologist Copilot**. I am configured to support clinical decision-making, triplanar anatomic correlation, and RSNA 12-target risk stratification for patient **${currentStudy.patientId}** (${currentStudy.patientAge}yo ${currentStudy.patientGender}, ${currentStudy.kneeSide} knee).\n\nModel parameters: **${modelSettings.selectedModel.includes('pro') ? 'Gemini Pro' : 'Gemini Flash'}** | Temp: **${modelSettings.temperature}** | Top_P: **${modelSettings.topP}** | Structured JSON Enabled.\n\nFeel free to query specific slice coordinates, biomechanical injury patterns, ligamentous/meniscal integrity, or surgical vs. conservative recommendations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          model: modelSettings.selectedModel,
          temperature: modelSettings.temperature,
          topP: modelSettings.topP,
          currentStudyContext: {
            patientId: currentStudy.patientId,
            age: currentStudy.patientAge,
            gender: currentStudy.patientGender,
            side: currentStudy.kneeSide,
            clinicalIndication: currentStudy.clinicalIndication,
            predictions,
            reportFindings: currentStudy.report.findings,
            reportImpression: currentStudy.report.impression,
            groundTruth: currentStudy.groundTruth
          }
        })
      });

      const data = await response.json();
      if (data.success && data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err: any) {
      console.error('Copilot chat error:', err);
      // Fallback local clinical knowledge generator if offline
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          content: `**Clinical MSK Analysis for ${currentStudy.patientId}**:\nBased on the multi-planar MRI series (Sagittal PD-FS, Coronal T2, Axial PD), the primary internal derangement reflects ${currentStudy.clinicalNotes}. Correlate with physical examination maneuvers (Lachman test, McMurray test, and joint line tenderness).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Explain the ACL injury findings on Sagittal view',
    'Why is Patellofemoral OA (PF OA) scored this way?',
    'What features differentiate bone contusion from fracture?',
    'How should we fuse 3D MRI vision features with clinical reports?'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Gemini MSK Radiologist Copilot
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-mono font-bold">
                {modelSettings.selectedModel.includes('pro') ? 'Pro 2.5' : 'Flash 2.5'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Study {currentStudy.patientId}</span>
              <span className="font-mono text-[#00E5FF] text-[10px]">T: {modelSettings.temperature} | P: {modelSettings.topP}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-cyan-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800/90 text-slate-200 rounded-tl-none space-y-1.5'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div
                className={`text-[9px] font-mono mt-1 ${
                  msg.sender === 'user' ? 'text-cyan-200' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-slate-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Analyzing MRI sequences and clinical reasoning...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 space-y-2">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Suggested Clinical Queries:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-lg text-left transition-colors flex items-center gap-1"
            >
              <span>{prompt}</span>
              <ChevronRight className="w-3 h-3 text-cyan-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
        <input
          type="text"
          id="input-copilot-query"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about MRI findings, sequences, or RSNA metrics..."
          className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
        />
        <button
          id="btn-send-copilot-query"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-md shadow-cyan-600/30 transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
