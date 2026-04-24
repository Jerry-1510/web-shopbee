import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
import type { Review } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { productApi } from "../../utils/api";
import {
  Trash2,
  Star,
  Search,
  MessageSquare,
  User as UserIcon,
  Calendar,
  Video,
  Send,
  X,
} from "lucide-react";
import { GlassListSkeleton } from "../../components/GlassLoader";

const AdminReviewList = () => {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<number | "All">("All");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [previewMedia, setPreviewMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(null);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(
    null,
  );
  const [expandedCommentThreads, setExpandedCommentThreads] = useState<
    Record<string, boolean>
  >({});
  const currentUserId = String(user?.id || user?._id || "");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await productApi.getMySellerReviews(token);
      setReviews(res.data || []);
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await productApi.deleteReview(id, token);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (_err) {
      alert("Không thể xóa đánh giá. Vui lòng thử lại.");
    }
  };

  const openReplyBox = (reviewId: string, currentReply?: string) => {
    setReplyingReviewId(reviewId);
    setReplyMessage(currentReply || "");
  };

  const closeReplyBox = () => {
    setReplyingReviewId(null);
    setReplyMessage("");
  };

  const submitReply = async (reviewId: string) => {
    if (!token) return;
    const message = replyMessage.trim();
    if (!message) {
      alert("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    setSubmittingReply(true);
    try {
      const res = await productApi.replyReview(reviewId, message, token);
      const updated = res.data?.review;
      if (updated?._id) {
        setReviews((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item)),
        );
      } else {
        await load();
      }
      closeReplyBox();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Không thể phản hồi đánh giá.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const submitComment = async (reviewId: string) => {
    if (!token) return;
    const message = (commentDrafts[reviewId] || "").trim();
    if (!message) return;
    setSubmittingCommentId(reviewId);
    try {
      const res = await productApi.addReviewComment(reviewId, message, token);
      const updated = res.data?.review;
      if (updated?._id) {
        setReviews((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item)),
        );
      } else {
        await load();
      }
      setCommentDrafts((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Không thể gửi bình luận.");
    } finally {
      setSubmittingCommentId(null);
    }
  };

  const getVisibleComments = (review: Review) => {
    const all = review.comments || [];
    if (all.length <= 3 || expandedCommentThreads[review._id]) return all;
    return all.slice(-3);
  };

  const canExpandComments = (review: Review) =>
    (review.comments?.length || 0) > 3 && !expandedCommentThreads[review._id];

  const filteredReviews = useMemo(() => {
    const normalizedSearch = deferredSearchQuery.toLowerCase().trim();
    return reviews.filter((r) => {
      const matchesSearch =
        r.userName.toLowerCase().includes(normalizedSearch) ||
        r.comment.toLowerCase().includes(normalizedSearch);

      const matchesRating = filterRating === "All" || r.rating === filterRating;

      return matchesSearch && matchesRating;
    });
  }, [reviews, deferredSearchQuery, filterRating]);

  const stats = useMemo(() => {
    if (!reviews || reviews.length === 0)
      return { avg: "0.0", counts: [0, 0, 0, 0, 0, 0] };
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const counts = [0, 0, 0, 0, 0, 0]; // 0-5 stars
    reviews.forEach((r) => {
      const star = Math.floor(Number(r.rating) || 0);
      if (star >= 0 && star <= 5) counts[star]++;
    });
    return {
      avg: (sum / reviews.length).toFixed(1),
      counts,
    };
  }, [reviews]);

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý đánh giá</h1>
          <p className="text-gray-500 mt-1">
            Theo dõi và quản lý phản hồi từ khách hàng
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-800 dark:to-amber-900/10">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Đánh giá trung bình
          </p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-amber-500">{stats.avg}</p>
            <div className="flex text-amber-400 mb-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= Number(stats.avg) ? "currentColor" : "none"}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Dựa trên {reviews.length} đánh giá
          </p>
        </div>

        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-8 overflow-x-auto">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() =>
                setFilterRating(star === filterRating ? "All" : star)
              }
              className={`flex flex-col items-center min-w-[80px] p-2 rounded-2xl transition-all ${
                filterRating === star
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="font-bold text-lg">{star}</span>
                <Star size={16} className="text-amber-500 fill-current" />
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${(stats.counts[star] / reviews.length) * 100 || 0}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1">
                {stats.counts[star]} đánh giá
              </span>
            </button>
          ))}
          <button
            onClick={() => setFilterRating("All")}
            className={`flex flex-col items-center min-w-[80px] p-2 rounded-2xl transition-all ${
              filterRating === "All"
                ? "bg-shopbee-blue/10 border-shopbee-blue/20"
                : "hover:bg-gray-50"
            }`}
          >
            <span className="font-bold text-lg">Tất cả</span>
            <div className="flex text-gray-300 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={8} fill="currentColor" />
              ))}
            </div>
            <span className="text-[10px] text-gray-400 mt-1">
              {reviews.length} đánh giá
            </span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên người dùng hoặc nội dung đánh giá..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Review Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        {loading ? (
          <div className="p-6 md:p-20 text-center">
            <GlassListSkeleton
              rows={8}
              variant="full"
              className="max-w-5xl mx-auto"
              minHeight="min-h-[560px]"
            />
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((r) => (
                  <div
                    key={`mobile-${r._id}`}
                    className="rounded-2xl border border-gray-100 dark:border-gray-700 p-3 bg-white/70 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-shopbee-blue/10 flex items-center justify-center text-shopbee-blue overflow-hidden">
                        {r.userAvatar ? (
                          <img
                            src={r.userAvatar}
                            alt={r.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {r.userName}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          ID: {r._id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div className="flex text-amber-400 my-2">
                      {[1, 2, 3, 4, 5].map((s: number) => (
                        <Star
                          key={s}
                          size={12}
                          fill={s <= (r.rating || 0) ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 italic line-clamp-3">
                      "{r.comment}"
                    </div>
                    {(r.images?.length || 0) > 0 && (
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {r.images?.slice(0, 4).map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() =>
                              setPreviewMedia({ type: "image", url })
                            }
                            className="w-full h-14 rounded-md overflow-hidden border"
                          >
                            <img
                              src={url}
                              alt="Media đánh giá"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    {(r.videos?.length || 0) > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {r.videos?.slice(0, 2).map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() =>
                              setPreviewMedia({ type: "video", url })
                            }
                            className="relative w-full h-24 rounded-md overflow-hidden bg-black"
                          >
                            <video
                              src={url}
                              muted
                              preload="metadata"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Video size={16} className="text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {r.sellerReply?.message && (
                      <div className="mt-2 rounded-lg border border-shopbee-blue/20 bg-shopbee-blue/[0.04] p-2">
                        <p className="text-[11px] font-semibold text-shopbee-blue mb-1">
                          Phản hồi của shop
                        </p>
                        <p className="text-xs text-gray-700">
                          {r.sellerReply.message}
                        </p>
                      </div>
                    )}
                    {(r.comments?.length || 0) > 0 && (
                      <div className="mt-2 space-y-2">
                        {getVisibleComments(r).map((item, idx) => {
                          const isMine =
                            currentUserId &&
                            String(item.userId || "") === currentUserId;
                          return (
                            <div
                              key={item._id || `${r._id}-m-${idx}`}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[88%] rounded-lg border p-2 ${
                                  isMine
                                    ? "border-shopbee-blue/20 bg-shopbee-blue/[0.06]"
                                    : "border-gray-100 bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-5 h-5 rounded-full overflow-hidden bg-white border flex items-center justify-center">
                                    {item.userAvatar ? (
                                      <img
                                        src={item.userAvatar}
                                        alt={item.userName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <UserIcon size={10} />
                                    )}
                                  </div>
                                  <p className="text-[11px] font-semibold text-gray-700">
                                    {item.userName}
                                  </p>
                                  {isMine && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-shopbee-blue/10 text-shopbee-blue">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-700">
                                  {item.message}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {canExpandComments(r) && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCommentThreads((prev) => ({
                                ...prev,
                                [r._id]: true,
                              }))
                            }
                            className="text-[11px] text-shopbee-blue hover:underline"
                          >
                            Xem thêm {(r.comments?.length || 0) - 3} bình luận
                          </button>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={commentDrafts[r._id] || ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [r._id]: e.target.value,
                          }))
                        }
                        className="flex-1 h-8 rounded-md border px-2 text-xs"
                        placeholder="Nhắn thêm vào đánh giá..."
                      />
                      <button
                        type="button"
                        onClick={() => submitComment(r._id)}
                        disabled={submittingCommentId === r._id}
                        className="px-2.5 h-8 rounded-md bg-shopbee-blue text-white text-xs disabled:opacity-60"
                      >
                        Gửi
                      </button>
                    </div>
                    {replyingReviewId === r._id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="w-full rounded-lg border px-2 py-1.5 text-xs"
                          rows={3}
                          placeholder="Nhập phản hồi cho khách hàng..."
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => submitReply(r._id)}
                            disabled={submittingReply}
                            className="px-2.5 py-1 rounded-md bg-shopbee-blue text-white text-xs inline-flex items-center gap-1 disabled:opacity-60"
                          >
                            <Send size={12} />
                            Gửi
                          </button>
                          <button
                            type="button"
                            onClick={closeReplyBox}
                            className="px-2.5 py-1 rounded-md border text-xs"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openReplyBox(r._id, r.sellerReply?.message)
                        }
                        className="mt-2 px-2.5 py-1 rounded-md border border-shopbee-blue text-shopbee-blue text-xs"
                      >
                        {r.sellerReply?.message ? "Sửa phản hồi" : "Phản hồi"}
                      </button>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-300" />
                        {formatDateTime(r.createdAt)}
                      </div>
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center text-gray-400">
                    <MessageSquare size={36} className="mb-2 opacity-20" />
                    <p>Không tìm thấy đánh giá nào khớp với yêu cầu.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Đánh giá & Nội dung
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((r) => (
                      <tr
                        key={r._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-shopbee-blue/10 flex items-center justify-center text-shopbee-blue overflow-hidden">
                              {r.userAvatar ? (
                                <img
                                  src={r.userAvatar}
                                  alt={r.userName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserIcon size={20} />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {r.userName}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                ID: {r._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex text-amber-400 mb-1">
                            {[1, 2, 3, 4, 5].map((s: number) => (
                              <Star
                                key={s}
                                size={12}
                                fill={
                                  s <= (r.rating || 0) ? "currentColor" : "none"
                                }
                              />
                            ))}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2 max-w-md italic">
                            "{r.comment}"
                          </div>
                          <div className="mt-2 space-y-2">
                            {(r.images?.length || 0) > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {r.images?.slice(0, 4).map((url) => (
                                  <button
                                    key={url}
                                    type="button"
                                    onClick={() =>
                                      setPreviewMedia({ type: "image", url })
                                    }
                                    className="w-14 h-14 rounded-md overflow-hidden border"
                                  >
                                    <img
                                      src={url}
                                      alt="Ảnh đánh giá"
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                            {(r.videos?.length || 0) > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {r.videos?.slice(0, 2).map((url) => (
                                  <button
                                    key={url}
                                    type="button"
                                    onClick={() =>
                                      setPreviewMedia({ type: "video", url })
                                    }
                                    className="relative w-14 h-14 rounded-md overflow-hidden border bg-black"
                                  >
                                    <video
                                      src={url}
                                      muted
                                      preload="metadata"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                      <Video size={12} className="text-white" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            {r.sellerReply?.message && (
                              <div className="rounded-md border border-shopbee-blue/20 bg-shopbee-blue/[0.04] px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-shopbee-blue">
                                  Phản hồi của shop
                                </p>
                                <p className="text-xs text-gray-700 mt-0.5">
                                  {r.sellerReply.message}
                                </p>
                              </div>
                            )}
                            {(r.comments?.length || 0) > 0 && (
                              <div className="space-y-1.5">
                                {getVisibleComments(r).map((item, idx) => {
                                  const isMine =
                                    currentUserId &&
                                    String(item.userId || "") === currentUserId;
                                  return (
                                    <div
                                      key={item._id || `${r._id}-d-${idx}`}
                                      className={`flex ${
                                        isMine ? "justify-end" : "justify-start"
                                      }`}
                                    >
                                      <div
                                        className={`max-w-[90%] rounded-md border px-2 py-1.5 ${
                                          isMine
                                            ? "border-shopbee-blue/20 bg-shopbee-blue/[0.06]"
                                            : "border-gray-100 bg-gray-50"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <div className="w-5 h-5 rounded-full overflow-hidden bg-white border flex items-center justify-center">
                                            {item.userAvatar ? (
                                              <img
                                                src={item.userAvatar}
                                                alt={item.userName}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <UserIcon size={10} />
                                            )}
                                          </div>
                                          <p className="text-[11px] font-semibold text-gray-700">
                                            {item.userName}
                                          </p>
                                          {isMine && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-shopbee-blue/10 text-shopbee-blue">
                                              Bạn
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-700">
                                          {item.message}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                                {canExpandComments(r) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedCommentThreads((prev) => ({
                                        ...prev,
                                        [r._id]: true,
                                      }))
                                    }
                                    className="text-[11px] text-shopbee-blue hover:underline"
                                  >
                                    Xem thêm {(r.comments?.length || 0) - 3}{" "}
                                    bình luận
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={commentDrafts[r._id] || ""}
                                onChange={(e) =>
                                  setCommentDrafts((prev) => ({
                                    ...prev,
                                    [r._id]: e.target.value,
                                  }))
                                }
                                className="flex-1 h-8 rounded-md border px-2 text-xs"
                                placeholder="Nhắn thêm vào đánh giá..."
                              />
                              <button
                                type="button"
                                onClick={() => submitComment(r._id)}
                                disabled={submittingCommentId === r._id}
                                className="px-2.5 h-8 rounded-md bg-shopbee-blue text-white text-xs disabled:opacity-60"
                              >
                                Gửi
                              </button>
                            </div>
                            {replyingReviewId === r._id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={replyMessage}
                                  onChange={(e) =>
                                    setReplyMessage(e.target.value)
                                  }
                                  className="w-full rounded-md border px-2 py-1.5 text-xs"
                                  rows={3}
                                  placeholder="Nhập phản hồi cho khách hàng..."
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => submitReply(r._id)}
                                    disabled={submittingReply}
                                    className="px-2.5 py-1 rounded-md bg-shopbee-blue text-white text-xs inline-flex items-center gap-1 disabled:opacity-60"
                                  >
                                    <Send size={12} />
                                    Gửi phản hồi
                                  </button>
                                  <button
                                    type="button"
                                    onClick={closeReplyBox}
                                    className="px-2.5 py-1 rounded-md border text-xs"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  openReplyBox(r._id, r.sellerReply?.message)
                                }
                                className="self-start text-xs px-2.5 py-1 rounded-md border border-shopbee-blue text-shopbee-blue"
                              >
                                {r.sellerReply?.message
                                  ? "Sửa phản hồi"
                                  : "Phản hồi khách hàng"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-300" />
                            {formatDateTime(r.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(r._id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                            title="Xóa đánh giá"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center text-gray-400">
                          <MessageSquare
                            size={40}
                            className="mb-2 opacity-20"
                          />
                          <p>Không tìm thấy đánh giá nào khớp với yêu cầu.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {previewMedia && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 p-4 flex items-center justify-center"
          onClick={() => setPreviewMedia(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            onClick={() => setPreviewMedia(null)}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
          {previewMedia.type === "video" ? (
            <video
              src={previewMedia.url}
              controls
              autoPlay
              className="max-w-[95vw] max-h-[90vh] rounded-xl bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewMedia.url}
              alt="Xem media đánh giá"
              className="max-w-[95vw] max-h-[90vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviewList;



