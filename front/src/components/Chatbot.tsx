import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productApi } from "../utils/api";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý ảo của ShopBee. Tôi có thể giúp gì cho bạn?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener("open-chatbot", openHandler);
    return () => window.removeEventListener("open-chatbot", openHandler);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await productApi.chatbot(inputValue);

      let botReply = "Xin lỗi, tôi chưa hiểu câu hỏi của bạn";

      if (response.data.success) {
        botReply = response.data.reply;
      } else if (response.data.response) {
        botReply = response.data.response;
      } else if (typeof response.data === 'string') {
        botReply = response.data;
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: botReply,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Lỗi chatbot:", error);

      let errorText = "Xin lỗi, hiện tại tôi đang gặp chút sự cố. Vui lòng thử lại sau!";

      if (error.response?.data?.error) {
        errorText = `Lỗi: ${error.response.data.error}`;
      } else if (error.message === "Network Error") {
        errorText = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối!";
      }

      const errorMessage: Message = {
        id: Date.now() + 1,
        text: errorText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed z-50 bottom-24 left-1/2 -translate-x-1/2 md:bottom-6 md:left-auto md:right-6 md:translate-x-0">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="glass-card rounded-4xl w-[90vw] sm:w-95 h-[60vh] sm:h-137.5 flex flex-col overflow-hidden mb-4 shadow-2xl border-white/40"
          >
            {/* Header - iOS Glass Style */}
            <div className="liquid-btn p-5 flex justify-between items-center text-white shrink-0 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">
                    Hỗ Trợ ShopBee AI
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">
                      Trực tuyến
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30 dark:bg-slate-900/50">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.sender === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.sender === "user"
                        ? "bg-shopbee-blue text-white"
                        : "bg-white text-shopbee-blue dark:bg-slate-900 dark:text-slate-100"
                        }`}
                    >
                      {msg.sender === "user" ? (
                        <User size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${msg.sender === "user"
                        ? "glass text-slate-800 dark:bg-slate-900/80 dark:text-slate-100 antialiased font-semibold rounded-tr-none shadow-md"
                        : "bg-white text-gray-800 dark:bg-slate-900/80 dark:text-slate-100 rounded-tl-none shadow-sm border border-gray-100 dark:border-slate-800"
                        }`}
                    >
                      {msg.text}
                      <div
                        className={`text-[9px] mt-1.5 font-medium ${msg.sender === "user"
                          ? "text-slate-600 dark:text-slate-400 text-right"
                          : "text-slate-600 dark:text-slate-400"
                          }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-slate-800 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/50 dark:bg-slate-900/60 backdrop-blur-md border-t border-white/20 dark:border-slate-800/60">
              <div className="flex gap-2 bg-gray-100/80 dark:bg-slate-800/70 p-1.5 rounded-2xl focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-shopbee-blue/20 transition-all">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Hỏi ShopBee AI..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="liquid-btn text-white p-2 rounded-xl disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  {isTyping ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="liquid-btn text-white p-4 rounded-3xl shadow-2xl shadow-shopbee-blue/30 relative group overflow-hidden hidden md:flex"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}

        {/* Badge */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white animate-bounce"></span>
        )}
      </motion.button>
    </div>
  );
};

export default Chatbot;


