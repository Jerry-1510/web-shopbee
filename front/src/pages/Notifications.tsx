import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import type { Notification } from "../types";
import { Bell, ChevronDown, ChevronUp, RotateCcw, Trash2 } from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  GlassListSkeleton,
  GlassProgressLoader,
} from "../components/GlassLoader";

const NotificationsPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedNotificationId =
    (location.state as { highlightId?: string } | null)?.highlightId || "";
  const initialStatusFilter =
    searchParams.get("status") === "unread" ||
    searchParams.get("status") === "read"
      ? (searchParams.get("status") as "unread" | "read")
      : "all";
  const initialTypeFilter =
    searchParams.get("type") === "chat" ||
    searchParams.get("type") === "order" ||
    searchParams.get("type") === "promotion" ||
    searchParams.get("type") === "review" ||
    searchParams.get("type") === "system"
      ? (searchParams.get("type") as
          | "chat"
          | "order"
          | "promotion"
          | "review"
          | "system")
      : "all";
  const initialSortBy =
    searchParams.get("sort") === "oldest" || searchParams.get("sort") === "type"
      ? (searchParams.get("sort") as "oldest" | "type")
      : "newest";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deletingRead, setDeletingRead] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">(
    initialStatusFilter,
  );
  const [typeFilter, setTypeFilter] = useState<
    "all" | "chat" | "order" | "promotion" | "review" | "system"
  >(initialTypeFilter);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type">(
    initialSortBy,
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isAutoLoadingMore, setIsAutoLoadingMore] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const ITEM_HEIGHT = 160;
  const OVERSCAN = 8;
  const LOAD_BATCH_SIZE = 20;

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    const res = await productApi.getNotifications(token);
    setNotifications(res.data || []);
  }, [token]);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await refreshNotifications();
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, refreshNotifications]);

  const markRead = async (id: string) => {
    if (!token) return;
    await productApi.markNotificationAsRead(id, token);
    await refreshNotifications();
  };

  const removeOneNotification = async (id: string) => {
    if (!token) return;
    await productApi.deleteNotification(id, token);
    await refreshNotifications();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const removeReadNotifications = async () => {
    if (!token) return;
    setDeletingRead(true);
    try {
      await productApi.deleteReadNotifications(token);
      await refreshNotifications();
      setExpandedIds(new Set());
    } finally {
      setDeletingRead(false);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    setMarkingAllRead(true);
    try {
      await productApi.markAllNotificationsAsRead(token);
      await refreshNotifications();
    } finally {
      setMarkingAllRead(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("newest");
    setSearchTerm("");
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenNotification = async (n: Notification) => {
    if (!token) return;
    if (!n.isRead) {
      await markRead(n._id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  useEffect(() => {
    const measure = () => {
      if (listRef.current) {
        setViewportHeight(listRef.current.clientHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!highlightedNotificationId) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(highlightedNotificationId);
      return next;
    });
  }, [highlightedNotificationId]);

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
    const filtered = notifications.filter((n) => {
      const statusMatched =
        statusFilter === "all" ||
        (statusFilter === "unread" ? !n.isRead : n.isRead);
      const typeMatched = typeFilter === "all" || n.type === typeFilter;
      const searchMatched =
        !normalizedSearch ||
        n.title.toLowerCase().includes(normalizedSearch) ||
        n.message.toLowerCase().includes(normalizedSearch);
      return statusMatched && typeMatched && searchMatched;
    });

    if (sortBy === "oldest") {
      return filtered.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
    if (sortBy === "type") {
      return filtered.sort((a, b) => {
        const typeA = a.type || "system";
        const typeB = b.type || "system";
        if (typeA === typeB) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return typeA.localeCompare(typeB);
      });
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notifications, statusFilter, typeFilter, deferredSearchTerm, sortBy]);

  useEffect(() => {
    setVisibleCount(20);
  }, [statusFilter, typeFilter, deferredSearchTerm, sortBy]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (statusFilter !== "all") next.set("status", statusFilter);
    if (typeFilter !== "all") next.set("type", typeFilter);
    if (sortBy !== "newest") next.set("sort", sortBy);
    const q = searchTerm.trim();
    if (q) next.set("q", q);
    setSearchParams(next, { replace: true });
  }, [statusFilter, typeFilter, sortBy, searchTerm, setSearchParams]);

  const shouldVirtualize =
    filteredNotifications.length > 80 && expandedIds.size === 0;
  const totalHeight = filteredNotifications.length * ITEM_HEIGHT;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN,
  );
  const endIndex = Math.min(
    filteredNotifications.length,
    Math.ceil((scrollTop + viewportHeight) / ITEM_HEIGHT) + OVERSCAN,
  );
  const visibleItems = useMemo(
    () => filteredNotifications.slice(startIndex, endIndex),
    [filteredNotifications, startIndex, endIndex],
  );
  const nonVirtualizedNotifications = useMemo(
    () => filteredNotifications.slice(0, visibleCount),
    [filteredNotifications, visibleCount],
  );
  const hasMoreNonVirtualized =
    nonVirtualizedNotifications.length < filteredNotifications.length;
  const readCount = useMemo(
    () => notifications.filter((n) => n.isRead).length,
    [notifications],
  );
  const unreadCount = useMemo(
    () => notifications.length - readCount,
    [notifications.length, readCount],
  );

  useEffect(() => {
    if (shouldVirtualize || !hasMoreNonVirtualized || loading) return;
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isAutoLoadingMore) {
          setIsAutoLoadingMore(true);
          setVisibleCount((prev) =>
            Math.min(filteredNotifications.length, prev + LOAD_BATCH_SIZE),
          );
          setTimeout(() => {
            setIsAutoLoadingMore(false);
          }, 180);
        }
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    shouldVirtualize,
    hasMoreNonVirtualized,
    filteredNotifications.length,
    loading,
    isAutoLoadingMore,
  ]);

  if (!token) {
    return (
      <div className="site-container py-10 min-h-[60vh]">
        <div className="glass-card rounded-3xl p-8 text-center">
          <Bell size={28} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Vui lòng đăng nhập để xem thông báo
          </p>
          <Link
            to="/login"
            className="liquid-btn text-white px-6 py-3 rounded-2xl font-bold"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="site-container py-6 min-h-[60vh]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell size={20} className="text-shopbee-blue" /> Thông báo
        </h1>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0 || markingAllRead}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white/70 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {markingAllRead ? "Đang đánh dấu..." : "Đánh dấu tất cả đã đọc"}
        </button>
        <button
          onClick={removeReadNotifications}
          disabled={readCount === 0 || deletingRead}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white/70 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          {deletingRead ? "Đang xóa..." : "Xóa tất cả đã đọc"}
        </button>
      </div>
      <div className="glass-card rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={resetFilters}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white/70 border-gray-200 text-gray-700 inline-flex items-center gap-1"
        >
          <RotateCcw size={12} />
          Reset
        </button>
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
            statusFilter === "all"
              ? "bg-shopbee-blue text-white border-shopbee-blue"
              : "bg-white/70 border-gray-200 text-gray-700"
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setStatusFilter("unread")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
            statusFilter === "unread"
              ? "bg-shopbee-blue text-white border-shopbee-blue"
              : "bg-white/70 border-gray-200 text-gray-700"
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
        <button
          onClick={() => setStatusFilter("read")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
            statusFilter === "read"
              ? "bg-shopbee-blue text-white border-shopbee-blue"
              : "bg-white/70 border-gray-200 text-gray-700"
          }`}
        >
          Đã đọc ({readCount})
        </button>
        <div className="ml-auto flex items-center gap-2">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tiêu đề hoặc nội dung..."
            className="w-full sm:w-64 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70"
          />
          <span className="text-xs text-gray-500">Loại:</span>
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value as
                  | "all"
                  | "chat"
                  | "order"
                  | "promotion"
                  | "review"
                  | "system",
              )
            }
            className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white/70"
          >
            <option value="all">Tất cả</option>
            <option value="chat">Chat</option>
            <option value="order">Đơn hàng</option>
            <option value="promotion">Khuyến mãi</option>
            <option value="review">Đánh giá</option>
            <option value="system">Hệ thống</option>
          </select>
          <span className="text-xs text-gray-500">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "newest" | "oldest" | "type")
            }
            className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white/70"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="type">Theo loại</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="space-y-4">
          <GlassProgressLoader
            label="Đang đồng bộ thông báo..."
            variant="full"
          />
          <GlassListSkeleton rows={5} variant="full" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center text-gray-500">
          Không có thông báo phù hợp bộ lọc
        </div>
      ) : shouldVirtualize ? (
        <div
          ref={listRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          className="glass-card rounded-3xl max-h-[70vh] overflow-y-auto"
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {visibleItems.map((n, index) => {
              const realIndex = startIndex + index;
              const isExpanded = expandedIds.has(n._id);
              const isLongMessage = n.message.length > 120;
              return (
                <div
                  key={n._id}
                  className={`p-4 flex items-start justify-between border-b border-gray-100 dark:border-slate-800 cursor-pointer ${
                    !n.isRead
                      ? "bg-shopbee-blue/[0.02]"
                      : "bg-white/60 dark:bg-transparent"
                  }`}
                  onClick={() => handleOpenNotification(n)}
                  style={{
                    position: "absolute",
                    top: realIndex * ITEM_HEIGHT,
                    left: 0,
                    right: 0,
                    height: ITEM_HEIGHT,
                  }}
                >
                  <div className="min-w-0 pr-4 w-full">
                    <p className="font-bold text-sm mb-1 truncate">{n.title}</p>
                    <p
                      className={`text-xs text-gray-500 dark:text-gray-400 ${isExpanded ? "" : "line-clamp-2"}`}
                    >
                      {n.message}
                    </p>
                    {isLongMessage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(n._id);
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-shopbee-blue"
                      >
                        {isExpanded ? (
                          <>
                            Thu gọn <ChevronUp size={12} />
                          </>
                        ) : (
                          <>
                            Xem thêm <ChevronDown size={12} />
                          </>
                        )}
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 uppercase">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {n.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (n.link) navigate(n.link);
                        }}
                        className="text-[11px] font-bold text-shopbee-blue hover:opacity-80"
                      >
                        Mở
                      </button>
                    )}
                    {!n.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void markRead(n._id);
                        }}
                        className="text-[11px] font-bold text-shopbee-blue hover:opacity-80"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeOneNotification(n._id);
                      }}
                      className="text-[11px] font-bold text-red-500 hover:opacity-80"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl divide-y divide-gray-100 dark:divide-slate-800">
          {nonVirtualizedNotifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 flex items-start justify-between cursor-pointer ${
                !n.isRead ? "bg-shopbee-blue/[0.02]" : ""
              }`}
              onClick={() => handleOpenNotification(n)}
            >
              <div className="min-w-0 pr-4 w-full">
                <p className="font-bold text-sm mb-1">{n.title}</p>
                <p
                  className={`text-xs text-gray-500 dark:text-gray-400 ${expandedIds.has(n._id) ? "" : "line-clamp-2"}`}
                >
                  {n.message}
                </p>
                {n.message.length > 120 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(n._id);
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-shopbee-blue"
                  >
                    {expandedIds.has(n._id) ? (
                      <>
                        Thu gọn <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        Xem thêm <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                )}
                <p className="text-[10px] text-gray-400 mt-1 uppercase">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {n.link && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (n.link) navigate(n.link);
                    }}
                    className="text-[11px] font-bold text-shopbee-blue hover:opacity-80"
                  >
                    Mở
                  </button>
                )}
                {!n.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void markRead(n._id);
                    }}
                    className="text-[11px] font-bold text-shopbee-blue hover:opacity-80"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void removeOneNotification(n._id);
                  }}
                  className="text-[11px] font-bold text-red-500 hover:opacity-80"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !shouldVirtualize && hasMoreNonVirtualized && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div ref={loadMoreRef} className="h-1 w-full" />
          {isAutoLoadingMore && (
            <div className="w-full max-w-2xl space-y-2 animate-pulse">
              <div className="h-2.5 rounded-full bg-gray-200/80 dark:bg-slate-700/70 w-5/6 mx-auto" />
              <div className="h-2.5 rounded-full bg-gray-200/80 dark:bg-slate-700/70 w-2/3 mx-auto" />
            </div>
          )}
          <button
            onClick={() =>
              setVisibleCount((prev) =>
                Math.min(filteredNotifications.length, prev + LOAD_BATCH_SIZE),
              )
            }
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white/70 hover:bg-gray-50"
          >
            Xem thêm thông báo
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;



