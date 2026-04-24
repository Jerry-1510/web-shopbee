import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { productApi } from "../../utils/api";
import type { ChatConversation, ChatMessage } from "../../types";
import { User as UserIcon, Send, ArrowLeft } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";
import {
  GlassListSkeleton,
  GlassProgressLoader,
} from "../../components/GlassLoader";

const AdminChat = () => {
  const { user, token, isSeller } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null,
  );
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [filter, setFilter] = useState<"all" | "customer" | "ai">("all");
  const socketRef = useRef<Socket | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const selectedPartnerIdRef = useRef<string | null>(null);
  const selectedSellerIdRef = useRef<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerRead, setPartnerRead] = useState(false);
  const [onlinePartnerIds, setOnlinePartnerIds] = useState<Set<string>>(
    new Set(),
  );
  const [animatedMessageIds, setAnimatedMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const animationTimersRef = useRef<Map<string, number>>(new Map());
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const partnerFromQuery = useMemo(
    () => new URLSearchParams(location.search).get("partnerId") || "",
    [location.search],
  );
  const sellerFromQuery = useMemo(
    () => new URLSearchParams(location.search).get("sellerId") || "",
    [location.search],
  );

  const isSupport = user && (user.role === "admin" || isSeller);
  const isAdmin = user?.role === "admin";
  const currentUserId = String(
    user?.id || ((user as { _id?: string } | null)?._id ?? ""),
  );

  useEffect(() => {
    selectedPartnerIdRef.current = selectedPartnerId;
    selectedSellerIdRef.current = selectedSellerId;
  }, [selectedPartnerId, selectedSellerId]);

  const formatChatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatConversationTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) return formatChatTime(value);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getDateKey = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const formatMessageDateLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const dateStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const dayDiff = Math.floor(
      (todayStart.getTime() - dateStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (dayDiff === 0) return "Hôm nay";
    if (dayDiff === 1) return "Hôm qua";
    return date.toLocaleDateString("vi-VN");
  };

  const markMessageAnimated = useCallback((messageId: string) => {
    if (!messageId) return;
    setAnimatedMessageIds((prev) => {
      const updated = new Set(prev);
      updated.add(messageId);
      return updated;
    });
    const existingTimer = animationTimersRef.current.get(messageId);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }
    const timer = window.setTimeout(() => {
      setAnimatedMessageIds((prev) => {
        if (!prev.has(messageId)) return prev;
        const updated = new Set(prev);
        updated.delete(messageId);
        return updated;
      });
      animationTimersRef.current.delete(messageId);
    }, 900);
    animationTimersRef.current.set(messageId, timer);
  }, []);

  const fetchConversations = useCallback(
    async (showLoader = true) => {
      if (!token || !isSupport) return;
      try {
        if (showLoader) {
          setLoadingConversations(true);
        }
        const res = await productApi.getChatConversations(token);
        setConversations(res.data);
        setChatError("");
        if (res.data.length > 0) {
          setSelectedPartnerId((prev) => prev || res.data[0].partnerId);
          setSelectedSellerId((prev) => prev || res.data[0].sellerId || null);
        }
      } catch (error) {
        console.error("Không thể tải danh sách hội thoại", error);
        setChatError("Không thể tải cuộc trò chuyện. Vui lòng thử lại.");
      } finally {
        if (showLoader) {
          setLoadingConversations(false);
        }
      }
    },
    [token, isSupport],
  );

  useEffect(() => {
    if (!token || !isSupport) return;
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.emit("chat:join", { userId: currentUserId });

    socket.on(
      "chat:newMessage",
      (payload: {
        id: string;
        text: string;
        sender: "customer" | "seller";
        createdAt: string;
        isRead?: boolean;
        isAI?: boolean;
        customerId: string;
        sellerId: string;
      }) => {
        if (
          !payload ||
          (!isAdmin && String(payload.sellerId) !== currentUserId)
        ) {
          return;
        }

        const activePartnerId = selectedPartnerIdRef.current;
        const activeSellerId = selectedSellerIdRef.current;

        setConversations((prev) => {
          const index = prev.findIndex(
            (c) =>
              c.partnerId === payload.customerId &&
              String(c.sellerId || currentUserId) === String(payload.sellerId),
          );
          if (index === -1) {
            // New conversation discovered, trigger fetch outside the render cycle
            setTimeout(() => fetchConversations(false), 0);
            return prev;
          }

          const updated = [...prev];
          const conv = { ...updated[index] };
          conv.lastMessage = payload.text;
          conv.lastSender = payload.sender;
          conv.lastAt = payload.createdAt;
          if (
            payload.sender === "customer" &&
            payload.customerId !== activePartnerId
          ) {
            conv.unreadCount += 1;
          }

          updated.splice(index, 1);
          updated.unshift(conv);
          return updated;
        });

        if (
          payload.customerId === activePartnerId &&
          String(activeSellerId || currentUserId) === String(payload.sellerId)
        ) {
          if (messageIdsRef.current.has(payload.id)) {
            return;
          }
          messageIdsRef.current.add(payload.id);
          const newMsg: ChatMessage = {
            id: payload.id,
            text: payload.text,
            sender: payload.sender,
            createdAt: payload.createdAt,
            isRead: payload.isRead ?? false,
            isAI: payload.isAI ?? false,
          };
          setMessages((prev) => [...prev, newMsg]);
          markMessageAnimated(payload.id);
        }
      },
    );

    socket.on(
      "chat:typing",
      (payload: {
        customerId: string;
        sellerId: string;
        typing: boolean;
        isFromCustomer: boolean;
      }) => {
        if (
          !payload ||
          (!isAdmin && String(payload.sellerId) !== currentUserId)
        ) {
          return;
        }
        const activePartnerId = selectedPartnerIdRef.current;
        const activeSellerId = selectedSellerIdRef.current;
        if (payload.customerId !== activePartnerId) return;
        if (
          String(activeSellerId || currentUserId) !== String(payload.sellerId)
        ) {
          return;
        }
        if (payload.isFromCustomer) {
          setPartnerTyping(!!payload.typing);
        }
      },
    );

    socket.on(
      "chat:read",
      (payload: { customerId: string; sellerId: string; reader: string }) => {
        if (
          !payload ||
          (!isAdmin && String(payload.sellerId) !== currentUserId)
        ) {
          return;
        }
        const activePartnerId = selectedPartnerIdRef.current;
        const activeSellerId = selectedSellerIdRef.current;
        if (payload.customerId !== activePartnerId) return;
        if (
          String(activeSellerId || currentUserId) !== String(payload.sellerId)
        ) {
          return;
        }
        if (payload.reader === "customer") {
          setPartnerRead(true);
        }
      },
    );

    socket.on("chat:presence:list", (payload: { userIds?: string[] }) => {
      const list = Array.isArray(payload?.userIds)
        ? payload.userIds.map((id) => String(id))
        : [];
      setOnlinePartnerIds(new Set(list));
    });

    socket.on(
      "chat:presence",
      (payload: { userId: string; isOnline: boolean }) => {
        if (!payload?.userId) return;
        setOnlinePartnerIds((prev) => {
          const updated = new Set(prev);
          if (payload.isOnline) {
            updated.add(String(payload.userId));
          } else {
            updated.delete(String(payload.userId));
          }
          return updated;
        });
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    token,
    isSupport,
    isAdmin,
    fetchConversations,
    currentUserId,
    markMessageAnimated,
  ]);

  useEffect(() => {
    if (!token || !selectedPartnerId) return;
    const timer = window.setInterval(() => {
      void fetchConversations(false);
      void productApi
        .getChatMessages(
          token,
          selectedPartnerId,
          selectedSellerId || undefined,
        )
        .then((res) => {
          setMessages(res.data);
          messageIdsRef.current = new Set(res.data.map((m) => m.id));
        })
        .catch(() => {
          // Keep quiet on polling failures, socket can still recover.
        });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [token, selectedPartnerId, selectedSellerId, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!partnerFromQuery) return;
    setSelectedPartnerId(partnerFromQuery);
    if (sellerFromQuery) {
      setSelectedSellerId(sellerFromQuery);
    }
  }, [partnerFromQuery, sellerFromQuery]);

  useEffect(() => {
    if (!token || !isSupport || !selectedPartnerId) return;
    const fetchMessages = async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoadingMessages(true);
        }
        const res = await productApi.getChatMessages(
          token,
          selectedPartnerId,
          selectedSellerId || undefined,
        );
        setMessages(res.data);
        messageIdsRef.current = new Set(res.data.map((m) => m.id));
        setChatError("");

        const lastSellerMsg = [...res.data]
          .reverse()
          .find((m) => m.sender === "seller");
        setPartnerRead(lastSellerMsg ? !!lastSellerMsg.isRead : false);
      } catch (error) {
        console.error("Không thể tải tin nhắn", error);
        setChatError("Không thể tải tin nhắn. Vui lòng thử lại.");
      } finally {
        if (showLoader) {
          setLoadingMessages(false);
        }
      }
    };
    fetchMessages(true);
    return;
  }, [token, isSupport, selectedPartnerId, selectedSellerId]);

  const handleSend = useCallback(async () => {
    if (!token || !selectedPartnerId || !messageText.trim()) return;
    try {
      setSending(true);
      const res = await productApi.sendChatMessage(
        messageText.trim(),
        token,
        selectedPartnerId,
        selectedSellerId || undefined,
      );
      const sent = res.data;
      if (!messageIdsRef.current.has(sent.id)) {
        messageIdsRef.current.add(sent.id);
        setMessages((prev) => [...prev, sent]);
        markMessageAnimated(sent.id);
      }
      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) =>
            c.partnerId === selectedPartnerId &&
            String(c.sellerId || currentUserId) ===
              String(selectedSellerId || currentUserId),
        );
        if (idx === -1) return prev;
        const updated = [...prev];
        const conv = { ...updated[idx] };
        conv.lastMessage = sent.text;
        conv.lastSender = "seller";
        conv.lastAt = sent.createdAt;
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });
      setMessageText("");
      setChatError("");
    } catch (error) {
      console.error("Không thể gửi tin nhắn", error);
      setChatError("Gửi tin nhắn thất bại. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }, [
    token,
    selectedPartnerId,
    messageText,
    selectedSellerId,
    currentUserId,
    markMessageAnimated,
  ]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      animationTimersRef.current.clear();
    };
  }, []);

  const activeConversation = conversations.find(
    (c) =>
      c.partnerId === selectedPartnerId &&
      String(c.sellerId || currentUserId) ===
        String(selectedSellerId || currentUserId),
  );

  const isSelectedPartnerOnline = useMemo(
    () =>
      !!activeConversation &&
      onlinePartnerIds.has(String(activeConversation.partnerId)),
    [activeConversation, onlinePartnerIds],
  );

  const filteredMessages = useMemo(
    () =>
      messages.filter((m) => {
        if (filter === "customer") return m.sender === "customer";
        if (filter === "ai") return m.isAI;
        return true;
      }),
    [messages, filter],
  );

  const lastSellerIndex = useMemo(
    () =>
      filteredMessages.reduce(
        (last, msg, idx) => (msg.sender === "seller" ? idx : last),
        -1,
      ),
    [filteredMessages],
  );

  const messageTimeline = useMemo(() => {
    const items: Array<
      | { type: "day"; key: string; label: string }
      | { type: "message"; message: ChatMessage; index: number }
    > = [];
    let previousDateKey = "";

    filteredMessages.forEach((message, index) => {
      const dateKey = getDateKey(message.createdAt);
      if (dateKey && dateKey !== previousDateKey) {
        items.push({
          type: "day",
          key: `day-${dateKey}`,
          label: formatMessageDateLabel(message.createdAt),
        });
        previousDateKey = dateKey;
      }
      items.push({ type: "message", message, index });
    });

    return items;
  }, [filteredMessages]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [filteredMessages, partnerTyping, selectedPartnerId]);

  const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) => {
        if (!normalizedSearch) return true;
        const name = conv.name?.toLowerCase() || "";
        const email = conv.email?.toLowerCase() || "";
        return (
          name.includes(normalizedSearch) || email.includes(normalizedSearch)
        );
      }),
    [conversations, normalizedSearch],
  );
  const isMobileShowingMessages = !!selectedPartnerId;

  if (!isSupport) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <h1 className="text-lg font-bold mb-2">Chat khách hàng</h1>
        <p className="text-sm text-gray-500">
          Chỉ tài khoản người bán mới truy cập được trang này.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px,minmax(0,1fr)] gap-4 md:gap-6">
      <aside
        className={`glass-card rounded-3xl p-4 h-[calc(100vh-9rem)] md:h-[70vh] flex flex-col ${
          isMobileShowingMessages ? "hidden md:flex" : "flex"
        }`}
      >
        <h2 className="text-sm font-bold mb-3">Khách hàng</h2>
        <div className="mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full px-3 py-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-shopbee-blue/30"
          />
        </div>
        {loadingConversations ? (
          <div className="space-y-3">
            <GlassProgressLoader
              variant="compact"
              label="Đang tải hội thoại..."
            />
            <GlassListSkeleton rows={4} variant="compact" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <p className="text-xs text-gray-500">Chưa có cuộc trò chuyện nào.</p>
        ) : (
          <div className="space-y-2 overflow-y-auto pr-1">
            {filteredConversations.map((conv) => (
              <button
                key={`${conv.partnerId}-${conv.sellerId || currentUserId}`}
                type="button"
                onClick={() => {
                  setSelectedPartnerId(conv.partnerId);
                  setSelectedSellerId(conv.sellerId || null);
                }}
                className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition-colors ${
                  conv.partnerId === selectedPartnerId &&
                  String(conv.sellerId || currentUserId) ===
                    String(selectedSellerId || currentUserId)
                    ? "bg-shopbee-blue/10 text-shopbee-blue"
                    : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-shopbee-blue/10 flex items-center justify-center overflow-hidden">
                  {conv.avatar ? (
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={18} className="text-shopbee-blue" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate">{conv.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {conv.lastSender === "seller" ? "Bạn: " : ""}
                    {conv.lastMessage}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-gray-400">
                      {formatConversationTime(conv.lastAt)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="inline-flex items-center px-2 py-[2px] rounded-full bg-red-500 text-[10px] font-semibold text-white">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount} mới
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section
        className={`glass-card rounded-3xl p-3 md:p-4 h-[calc(100vh-9rem)] md:h-[70vh] flex flex-col ${
          !isMobileShowingMessages ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          {activeConversation ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPartnerId(null);
                    setSelectedSellerId(null);
                    setMessages([]);
                  }}
                  className="md:hidden p-1.5 rounded-xl border border-gray-200 dark:border-slate-700"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="w-10 h-10 rounded-full bg-shopbee-blue/10 flex items-center justify-center overflow-hidden">
                  {activeConversation.avatar ? (
                    <img
                      src={activeConversation.avatar}
                      alt={activeConversation.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={18} className="text-shopbee-blue" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {activeConversation.name}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {activeConversation.email}
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelectedPartnerOnline
                          ? "bg-emerald-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {isSelectedPartnerOnline ? "Đang online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-2 py-1 rounded-full border text-xs ${
                    filter === "all"
                      ? "bg-shopbee-blue text-white border-shopbee-blue"
                      : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("customer")}
                  className={`px-2 py-1 rounded-full border text-xs ${
                    filter === "customer"
                      ? "bg-gray-800 text-white border-gray-800"
                      : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300"
                  }`}
                >
                  Khách
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Chọn một khách hàng để bắt đầu chat.
            </p>
          )}
        </div>

        <div
          ref={messageListRef}
          className="flex-1 overflow-y-auto py-3 space-y-3 text-sm"
        >
          {loadingMessages && activeConversation ? (
            <div className="space-y-3">
              <GlassProgressLoader
                variant="compact"
                label="Đang tải tin nhắn..."
              />
              <GlassListSkeleton rows={3} variant="compact" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <p className="text-xs text-gray-500">
              Chưa có tin nhắn trong cuộc trò chuyện này.
            </p>
          ) : (
            messageTimeline.map((item) => {
              if (item.type === "day") {
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-center py-1"
                  >
                    <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-[10px] text-gray-500">
                      {item.label}
                    </span>
                  </div>
                );
              }
              const m = item.message;
              const index = item.index;
              const fromSeller = m.sender === "seller";
              const fromAI = fromSeller && m.isAI;
              const isLastSeller = fromSeller && index === lastSellerIndex;
              const shouldAnimate = animatedMessageIds.has(m.id);
              return (
                <div
                  key={m.id}
                  className={`flex ${
                    fromSeller ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      fromSeller
                        ? fromAI
                          ? "bg-emerald-500 text-white rounded-br-none"
                          : "bg-shopbee-blue text-white rounded-br-none"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-bl-none"
                    } transition-all duration-300 ${
                      shouldAnimate
                        ? "animate-pulse ring-2 ring-shopbee-blue/25"
                        : ""
                    }`}
                  >
                    {fromAI && (
                      <span className="inline-flex items-center px-2 py-[1px] rounded-full bg-white/15 text-[10px] font-semibold mr-1">
                        AI
                      </span>
                    )}
                    {m.text}
                    <div
                      className={`mt-1 text-[9px] ${
                        fromSeller
                          ? "text-slate-200/90 text-right"
                          : "text-gray-500 dark:text-slate-400"
                      }`}
                    >
                      {formatChatTime(m.createdAt)}
                    </div>
                    {isLastSeller && (
                      <div className="mt-1 text-[9px] font-semibold text-slate-200/80">
                        {partnerRead ? "Đã xem" : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
          {chatError && (
            <p className="text-[11px] text-red-500 mb-1">{chatError}</p>
          )}
          {partnerTyping && activeConversation && (
            <p className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Khách đang nhập...
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (socketRef.current && selectedPartnerId) {
                  socketRef.current.emit("chat:typing", {
                    sellerId: currentUserId,
                    customerId: selectedPartnerId,
                    typing: e.target.value.length > 0,
                    isFromCustomer: false,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeConversation
                  ? "Nhập tin nhắn cho khách hàng..."
                  : "Chọn khách hàng để bắt đầu chat"
              }
              disabled={!activeConversation || sending}
              className="flex-1 min-w-0 px-3 py-2 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/30 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!activeConversation || !messageText.trim() || sending}
              className="liquid-btn text-white px-3 md:px-4 py-2 rounded-2xl flex items-center justify-center text-sm font-semibold disabled:opacity-50 shrink-0"
            >
              <Send size={16} className="md:mr-1" />
              <span className="hidden md:inline">Gửi</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminChat;



