import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export default function AgriAIChatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' | 'te'
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [copyToast, setCopyToast] = useState('');

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load suggested questions when language changes
  useEffect(() => {
    loadSuggestedQuestions(language);
  }, [language]);

  const loadSuggestedQuestions = async (lang) => {
    try {
      const qList = await api.getAISuggestedQuestions(lang);
      setSuggestedQuestions(qList);
    } catch (err) {
      console.warn('Suggested questions load note:', err.message);
    }
  };

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome_1',
          role: 'assistant',
          content: language === 'te'
            ? '🤖 **నమస్కారం! నేను మీ AgriAI అసిస్టెంట్‌ని.**\n\nపంటల సాగు, ఎరువుల మోతాదు, నేల రకాలు, తెగుళ్ళ నివారణ మరియు మార్కెట్ ధరలపై మీ ప్రశ్నలకు సహాయపడటానికి నేను సిద్ధంగా ఉన్నాను. క్రింది సూచించిన ప్రశ్నలలో ఒకదాన్ని ఎంచుకోండి లేదా మీ ప్రశ్నను టైప్ చేయండి.'
            : '🤖 **Hello! I am your AgriAI Assistant.**\n\nI can help you with crop selection, fertilizer schedules, soil health, pest/disease identification, and live market prices.\n\nChoose a suggested question below or type your query!',
          sources: [],
          created_at: new Date().toISOString()
        }
      ]);
    }
  }, [language]);

  const handleSendMessage = async (textToSend = null) => {
    const queryText = textToSend || inputMessage;
    if (!queryText || !queryText.trim()) return;

    const userMessageContent = attachedImage 
      ? `[📷 Image Attached: ${attachedImage.name}]\n${queryText.trim()}`
      : queryText.trim();

    const userMsgObj = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setInputMessage('');
    setAttachedImage(null);
    setLoading(true);

    try {
      const res = await api.sendAIChatMessage({
        message: queryText.trim(),
        conversationId,
        language,
        farmer_id: user?.id || 1
      });

      if (res && res.answer) {
        if (res.conversationId) setConversationId(res.conversationId);

        const aiMsgObj = {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: res.answer,
          sources: res.sources || [],
          usedMarketData: res.usedMarketData,
          created_at: new Date().toISOString()
        };

        setMessages((prev) => [...prev, aiMsgObj]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Sorry, the AgriAI Assistant encountered a network timeout. Please check your internet connection and click retry.',
          isError: true,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: language === 'te'
          ? '🤖 కొత్త సంభాషణ ప్రారంభమైంది. మీకు వ్యవసాయంపై ఉన్న సందేహాన్ని అడగండి!'
          : '🤖 New consultation started. Feel free to ask any farming or crop related question!',
        sources: [],
        created_at: new Date().toISOString()
      }
    ]);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear conversation history?')) {
      await api.clearAIChatHistory(conversationId);
      handleNewChat();
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopyToast('Text copied to clipboard!');
    setTimeout(() => setCopyToast(''), 2000);
  };

  const handleTextToSpeech = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`[\]()]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice speech recognition is not supported on this browser. Please use text input.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
    recognition.interimResults = false;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedImage(file);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="agri-fab-container">
        {!isOpen && (
          <button
            className="btn btn-success rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 position-relative animate__animated animate__bounceIn agri-fab-btn"
            onClick={() => setIsOpen(true)}
            title="Open AgriAI Assistant"
          >
            <i className="bi bi-robot fs-2 text-white"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light extra-small">
              AI Live
            </span>
          </button>
        )}
      </div>

      {/* Floating Chat Drawer Container */}
      {isOpen && (
        <div 
          className="agri-chatbot-drawer card shadow-lg border-0 overflow-hidden"
        >
          {/* Header */}
          <div className="card-header bg-success text-white py-3 px-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-white text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <i className="bi bi-robot fs-5"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0 lh-1">🌱 AgriAI Assistant</h6>
                <small className="text-white-50 extra-small d-block mt-1">
                  LLM + RAG Precision Agriculture Expert
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Language Switcher Pill */}
              <div className="btn-group btn-group-sm bg-white rounded-pill p-1">
                <button
                  className={`btn btn-sm py-0 px-2 rounded-pill fw-bold extra-small ${language === 'en' ? 'btn-success text-white' : 'btn-light text-dark'}`}
                  onClick={() => setLanguage('en')}
                >
                  English
                </button>
                <button
                  className={`btn btn-sm py-0 px-2 rounded-pill fw-bold extra-small ${language === 'te' ? 'btn-success text-white' : 'btn-light text-dark'}`}
                  onClick={() => setLanguage('te')}
                >
                  తెలుగు
                </button>
              </div>

              {/* Controls */}
              <button className="btn btn-sm text-white p-1" onClick={handleNewChat} title="New Chat">
                <i className="bi bi-plus-circle fs-5"></i>
              </button>
              <button className="btn btn-sm text-white p-1" onClick={handleClearHistory} title="Clear Chat">
                <i className="bi bi-trash fs-5"></i>
              </button>
              <button className="btn btn-sm text-white p-1" onClick={() => setIsOpen(false)} title="Close Drawer">
                <i className="bi bi-x-lg fs-5"></i>
              </button>
            </div>
          </div>

          {/* Copy Toast Alert */}
          {copyToast && (
            <div className="bg-dark text-white text-center extra-small py-1 position-absolute w-100" style={{ top: '60px', zIndex: 10 }}>
              <i className="bi bi-check-circle me-1"></i> {copyToast}
            </div>
          )}

          {/* Chat Body Scroll Area */}
          <div className="card-body p-3 bg-light overflow-auto flex-grow-1" style={{ fontSize: '0.9rem' }}>
            {/* Suggested Questions Pills */}
            <div className="mb-3">
              <span className="eyebrow text-uppercase text-muted extra-small d-block mb-2">
                💡 {language === 'te' ? 'సూచించిన ప్రశ్నలు' : 'SUGGESTED FARMING QUESTIONS'}
              </span>
              <div className="d-flex flex-wrap gap-1">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="btn btn-outline-success btn-sm extra-small rounded-pill text-start bg-white shadow-xs py-1 px-2"
                    onClick={() => handleSendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Thread */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`d-flex flex-column mb-3 ${isUser ? 'align-items-end' : 'align-items-start'}`}>
                  <div 
                    className={`p-3 rounded-3 shadow-xs position-relative ${
                      isUser ? 'bg-success text-white' : 'bg-white text-dark border border-light'
                    }`}
                    style={{ maxWidth: '88%', wordBreak: 'break-word' }}
                  >
                    {!isUser && (
                      <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-light">
                        <span className="fw-bold extra-small text-success d-flex align-items-center gap-1">
                          <i className="bi bi-cpu-fill"></i> AgriAI Expert
                        </span>
                        <div className="d-flex gap-1">
                          <button className="btn btn-link btn-sm text-secondary p-0 me-2" onClick={() => handleTextToSpeech(msg.content)} title="Listen text">
                            <i className="bi bi-volume-up"></i>
                          </button>
                          <button className="btn btn-link btn-sm text-secondary p-0" onClick={() => handleCopy(msg.content)} title="Copy response">
                            <i className="bi bi-clipboard"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="chat-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>

                    {/* Verified RAG Source Citations */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-top border-light bg-light rounded p-2">
                        <span className="fw-bold extra-small text-muted d-block mb-1">
                          📚 Verified Agronomic Sources:
                        </span>
                        {msg.sources.map((src, i) => (
                          <div key={i} className="extra-small text-secondary mb-1 d-flex align-items-start gap-1">
                            <i className="bi bi-journal-bookmark text-success"></i>
                            <div>
                              <strong>{src.title}</strong>
                              <span className="d-block extra-small text-muted">{src.source}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <small className="text-muted extra-small mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="d-flex align-items-start gap-2 mb-3">
                <div className="bg-white p-3 rounded-3 border border-light shadow-xs d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                  <span className="extra-small text-muted fw-bold">
                    🤖 {language === 'te' ? 'ఆగ్రి-ఏఐ సెర్చ్ చేసి సమాధానం సిద్ధం చేస్తోంది...' : 'AgriAI is analyzing verified agricultural knowledge and market data...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Image Attachment Preview */}
          {attachedImage && (
            <div className="bg-white p-2 border-top d-flex align-items-center justify-content-between px-3">
              <span className="extra-small text-truncate text-success fw-bold">
                📷 Attached: {attachedImage.name}
              </span>
              <button className="btn-close btn-sm" onClick={() => setAttachedImage(null)}></button>
            </div>
          )}

          {/* Footer Input Area */}
          <div className="card-footer bg-white p-2 border-top">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }} 
              className="d-flex align-items-center gap-2"
            >
              {/* Image Upload Button */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="d-none" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm p-2 rounded-circle" 
                onClick={() => fileInputRef.current?.click()}
                title="Attach Crop Image"
              >
                <i className="bi bi-paperclip fs-5"></i>
              </button>

              {/* Voice Speech Button */}
              <button 
                type="button" 
                className={`btn btn-sm p-2 rounded-circle ${isListening ? 'btn-danger animate__animated animate__pulse animate__infinite' : 'btn-outline-secondary'}`}
                onClick={handleVoiceInput}
                title="Voice Input (Mic)"
              >
                <i className="bi bi-mic fs-5"></i>
              </button>

              {/* Textarea Input */}
              <input
                type="text"
                className="form-control form-control-sm rounded-pill px-3"
                placeholder={
                  isListening
                    ? (language === 'te' ? 'మాట్లాడండి... ఆలకిస్తోంది' : 'Listening... Speak now')
                    : (language === 'te' ? 'మీ వ్యవసాయ సందేహాన్ని టైప్ చేయండి...' : 'Ask AgriAI about crops, soil, pests, and markets...')
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
              />

              {/* Send Button */}
              <button 
                type="submit" 
                className="btn btn-success btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px' }}
                disabled={loading || !inputMessage.trim()}
              >
                <i className="bi bi-send-fill fs-6 text-white"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
