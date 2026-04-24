import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  User,
  ChevronRight,
  ChevronLeft,
  ImagePlus,
  Video,
  Pencil,
  X,
} from "lucide-react";
import type { Product, Review } from "../types";
import {
  Star,
  ShieldCheck,
  Truck,
  ShoppingCart,
  MessageSquare,
  Store,
  Send,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import {
  GlassListSkeleton,
  ProductCardSkeleton,
} from "../components/GlassLoader";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [filterStar, setFilterStar] = useState<number | "All">("All");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [reviewImageFiles, setReviewImageFiles] = useState<File[]>([]);
  const [reviewVideoFiles, setReviewVideoFiles] = useState<File[]>([]);
  const thumbnailVideoRefs = useRef<Record<number, HTMLVideoElement | null>>(
    {},
  );
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editVideos, setEditVideos] = useState<string[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editVideoFiles, setEditVideoFiles] = useState<File[]>([]);
  const [previewMedia, setPreviewMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(null);
  const [reviewCommentDrafts, setReviewCommentDrafts] = useState<
    Record<string, string>
  >({});
  const [expandedCommentThreads, setExpandedCommentThreads] = useState<
    Record<string, boolean>
  >({});
  const [submittingCommentReviewId, setSubmittingCommentReviewId] = useState<
    string | null
  >(null);

  const filteredReviews = useMemo(() => {
    if (filterStar === "All") return reviews;
    return reviews.filter((r) => r.rating === filterStar);
  }, [reviews, filterStar]);

  const ratingStats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, counts: [0, 0, 0, 0, 0, 0] };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const counts = [0, 0, 0, 0, 0, 0];
    reviews.forEach((r) => counts[Math.floor(r.rating)]++);
    return {
      avg: (sum / reviews.length).toFixed(1),
      counts,
    };
  }, [reviews]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      if (!id) return;
      try {
        const [productRes, reviewsRes] = await Promise.all([
          productApi.getById(id),
          productApi.getProductReviews(id),
        ]);

        if (productRes.data) {
          const rawSellerId = productRes.data.sellerId as
            | string
            | { _id?: string; $oid?: string }
            | undefined;
          const normalizedSellerId =
            typeof rawSellerId === "string"
              ? rawSellerId
              : rawSellerId?._id || rawSellerId?.$oid || undefined;
          setProduct({
            ...productRes.data,
            id: productRes.data._id || productRes.data.id,
            sellerId: normalizedSellerId,
          });
        }
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!product) return [] as string[];
    const baseList =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.image];

    const uniqueBase = Array.from(
      new Set(baseList.filter((url): url is string => Boolean(url))),
    );

    if (uniqueBase.length > 1) return uniqueBase.slice(0, 8);

    const primary = uniqueBase[0];
    if (!primary) return [] as string[];

    if (primary.includes("picsum.photos/seed/")) {
      const seedMatch = primary.match(/\/seed\/([^/]+)\//);
      const seed = seedMatch?.[1] ?? "product";
      return Array.from({ length: 5 }, (_, i) =>
        primary.replace(`/seed/${seed}/`, `/seed/${seed}-g${i + 1}/`),
      );
    }

    return uniqueBase;
  }, [product]);

  const mediaItems = useMemo(() => {
    const imageItems = galleryImages.map((url) => ({
      type: "image" as const,
      url,
    }));
    const videoItems = (product?.videos || [])
      .filter(Boolean)
      .map((url) => ({ type: "video" as const, url }));
    return [...imageItems, ...videoItems];
  }, [galleryImages, product?.videos]);

  useEffect(() => {
    setSelectedMediaIndex(0);
  }, [mediaItems]);

  const optionGroups = useMemo(
    () =>
      Array.isArray(product?.optionGroups)
        ? product.optionGroups.filter(
            (group) =>
              typeof group?.name === "string" &&
              group.name.trim() &&
              Array.isArray(group.values) &&
              group.values.length > 0,
          )
        : [],
    [product?.optionGroups],
  );

  useEffect(() => {
    if (optionGroups.length === 0) {
      setSelectedOptions({});
      return;
    }
    setSelectedOptions((prev) => {
      const next: Record<string, string> = {};
      optionGroups.forEach((group) => {
        const groupName = group.name.trim();
        next[groupName] = prev[groupName] || group.values[0];
      });
      return next;
    });
  }, [optionGroups]);

  const handlePrevImage = () => {
    if (mediaItems.length <= 1) return;
    const prevIndex =
      selectedMediaIndex === 0 ? mediaItems.length - 1 : selectedMediaIndex - 1;
    setSelectedMediaIndex(prevIndex);
  };

  const handleNextImage = () => {
    if (mediaItems.length <= 1) return;
    const nextIndex = (selectedMediaIndex + 1) % mediaItems.length;
    setSelectedMediaIndex(nextIndex);
  };

  const handleVideoThumbnailHover = (index: number, shouldPlay: boolean) => {
    const video = thumbnailVideoRefs.current[index];
    if (!video) return;
    if (shouldPlay) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Ignore autoplay prevention for thumbnail preview.
        });
      }
      return;
    }
    video.pause();
    video.currentTime = 0;
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;

    setSubmittingReview(true);
    try {
      let uploadedImages: string[] = [];
      let uploadedVideos: string[] = [];

      if (reviewImageFiles.length > 0 || reviewVideoFiles.length > 0) {
        const mediaFormData = new FormData();
        reviewImageFiles.forEach((file) =>
          mediaFormData.append("images", file),
        );
        reviewVideoFiles.forEach((file) =>
          mediaFormData.append("videos", file),
        );
        const uploadRes = await productApi.uploadReviewMedia(
          mediaFormData,
          token,
        );
        uploadedImages = uploadRes.data.images || [];
        uploadedVideos = uploadRes.data.videos || [];
      }

      await productApi.createReview(
        {
          rating,
          comment,
          productId: id,
          images: uploadedImages,
          videos: uploadedVideos,
        },
        token,
      );
      setComment("");
      setRating(5);
      setReviewImageFiles([]);
      setReviewVideoFiles([]);
      // Refresh reviews
      const reviewsRes = await productApi.getProductReviews(id);
      setReviews(reviewsRes.data);
      alert("Cảm ơn bạn đã đánh giá!");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Lỗi khi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const currentUserId = String(
    user?.id || ((user as { _id?: string } | null)?._id ?? ""),
  );

  const startEditReview = (review: Review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditImages([...(review.images || [])]);
    setEditVideos([...(review.videos || [])]);
    setEditImageFiles([]);
    setEditVideoFiles([]);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment("");
    setEditImages([]);
    setEditVideos([]);
    setEditImageFiles([]);
    setEditVideoFiles([]);
  };

  const submitEditReview = async (reviewId: string) => {
    if (!token || !id) return;
    setSubmittingReview(true);
    try {
      let uploadedImages: string[] = [];
      let uploadedVideos: string[] = [];

      if (editImageFiles.length > 0 || editVideoFiles.length > 0) {
        const formData = new FormData();
        editImageFiles.forEach((file) => formData.append("images", file));
        editVideoFiles.forEach((file) => formData.append("videos", file));
        const uploadRes = await productApi.uploadReviewMedia(formData, token);
        uploadedImages = uploadRes.data.images || [];
        uploadedVideos = uploadRes.data.videos || [];
      }

      await productApi.updateReview(
        reviewId,
        {
          rating: editRating,
          comment: editComment,
          images: [...editImages, ...uploadedImages],
          videos: [...editVideos, ...uploadedVideos],
        },
        token,
      );
      const reviewsRes = await productApi.getProductReviews(id);
      setReviews(reviewsRes.data);
      cancelEditReview();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Không thể cập nhật đánh giá.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const openPreviewMedia = (type: "image" | "video", url: string) => {
    setPreviewMedia({ type, url });
  };

  const closePreviewMedia = () => {
    setPreviewMedia(null);
  };

  const submitReviewComment = async (reviewId: string) => {
    if (!token || !id) {
      alert("Vui lòng đăng nhập để bình luận.");
      return;
    }
    const message = (reviewCommentDrafts[reviewId] || "").trim();
    if (!message) return;

    setSubmittingCommentReviewId(reviewId);
    try {
      const res = await productApi.addReviewComment(reviewId, message, token);
      const updated = res.data?.review;
      if (updated?._id) {
        setReviews((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item)),
        );
      } else {
        const reviewsRes = await productApi.getProductReviews(id);
        setReviews(reviewsRes.data);
      }
      setReviewCommentDrafts((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Không thể gửi bình luận.");
    } finally {
      setSubmittingCommentReviewId(null);
    }
  };

  const getVisibleComments = (review: Review) => {
    const all = review.comments || [];
    if (all.length <= 3 || expandedCommentThreads[review._id]) return all;
    return all.slice(-3);
  };

  const canExpandComments = (review: Review) =>
    (review.comments?.length || 0) > 3 && !expandedCommentThreads[review._id];

  if (loading)
    return (
      <div className="site-container py-8 min-h-[80vh] space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-3xl overflow-hidden shadow-sm">
            <ProductCardSkeleton
              count={1}
              className="grid-cols-1"
              minHeight="min-h-[500px]"
            />
          </div>
          <div className="space-y-6">
            <GlassListSkeleton
              rows={8}
              variant="full"
              minHeight="min-h-[500px]"
            />
          </div>
        </div>
        <div className="mt-12">
          <GlassListSkeleton
            rows={3}
            variant="full"
            minHeight="min-h-[200px]"
          />
        </div>
      </div>
    );
  if (!product)
    return <div className="text-center py-20">Sản phẩm không tồn tại</div>;

  const optionSummary = Object.entries(selectedOptions)
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}: ${value}`)
    .join(" / ");

  const handleAddToCart = () => {
    if (!product) return;
    const stock = product.stock ?? 0;
    if (stock <= 0) {
      alert("Sản phẩm hiện đang hết hàng.");
      return;
    }
    if (quantity > stock) {
      alert(`Sản phẩm chỉ còn ${stock} trong kho.`);
      setQuantity(stock);
      return;
    }
    addToCart(
      {
        ...product,
        selectedOptions,
        variantSummary: optionSummary,
      },
      quantity,
    );
    alert(
      optionSummary
        ? `Đã thêm sản phẩm vào giỏ hàng!\nPhân loại: ${optionSummary}`
        : "Đã thêm sản phẩm vào giỏ hàng!",
    );
  };

  const handleBuyNow = () => {
    if (!product) return;
    const stock = product.stock ?? 0;
    if (stock <= 0) {
      alert("Sản phẩm hiện đang hết hàng.");
      return;
    }
    if (quantity > stock) {
      alert(`Sản phẩm chỉ còn ${stock} trong kho.`);
      setQuantity(stock);
      return;
    }
    navigate("/checkout", {
      state: {
        items: [
          {
            id: String(product.id),
            name: product.name,
            image: product.image,
            price: product.price,
            quantity,
            variantSummary: optionSummary,
            selectedOptions,
          },
        ],
      },
    });
  };

  const incrementQuantity = () => {
    const stock = product?.stock ?? 0;
    setQuantity((prev) => (prev < stock ? prev + 1 : prev));
  };
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleChatWithSeller = () => {
    if (!product?.sellerId) {
      alert("Không tìm thấy thông tin người bán");
      return;
    }
    if (!user) {
      alert("Vui lòng đăng nhập để chat với người bán");
      navigate("/login");
      return;
    }
    if (currentUserId && String(product.sellerId) === currentUserId) {
      alert("Bạn đang đăng nhập bằng chính tài khoản shop này.");
      return;
    }
    const event = new CustomEvent("open-chatbot", {
      detail: { sellerId: product.sellerId },
    });
    window.dispatchEvent(event);
  };

  const shopName = product.shopName || "Shop của người bán";
  const shopAvatar = product.shopAvatar || "";
  const selectedMedia = mediaItems[selectedMediaIndex];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 py-4 md:py-8 min-h-screen">
      <div className="site-container">
        <div className="flex items-center text-xs text-gray-500 mb-4 md:mb-6 px-1 sm:px-2 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-shopbee-blue transition-colors">
            ShopBee
          </Link>
          <ChevronRight size={12} className="mx-2" />
          <span className="hover:text-shopbee-blue cursor-pointer">
            {product.category}
          </span>
          <ChevronRight size={12} className="mx-2" />
          <span className="text-gray-400 line-clamp-1">{product.name}</span>
        </div>

        <div className="glass-card rounded-3xl md:rounded-[32px] overflow-hidden p-4 sm:p-5 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="w-full md:w-[450px] shrink-0">
            <div className="relative pt-[100%] rounded-2xl overflow-hidden bg-gray-100 group">
              {selectedMedia?.type === "video" ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="absolute top-0 left-0 w-full h-full object-cover bg-black"
                />
              ) : (
                <img
                  src={selectedMedia?.url || product.image}
                  alt={product.name}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Ảnh trước"
                    className="absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40 transition-all flex items-center justify-center"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Ảnh tiếp theo"
                    className="absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40 transition-all flex items-center justify-center"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              {product.isMall && (
                <div className="absolute top-4 left-4 bg-shopbee-blue text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                  MALL
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-3 sm:mt-4">
              {mediaItems.map((media, index) => {
                const isActive = index === selectedMediaIndex;
                return (
                  <button
                    key={`${media.type}-${media.url}-${index}`}
                    type="button"
                    onClick={() => setSelectedMediaIndex(index)}
                    onMouseEnter={() =>
                      media.type === "video" &&
                      handleVideoThumbnailHover(index, true)
                    }
                    onMouseLeave={() =>
                      media.type === "video" &&
                      handleVideoThumbnailHover(index, false)
                    }
                    aria-label={`Xem media sản phẩm ${index + 1}`}
                    className={`pt-[100%] relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isActive
                        ? "border-shopbee-blue shadow-sm shadow-shopbee-blue/40"
                        : "border-transparent hover:border-shopbee-blue"
                    }`}
                  >
                    {media.type === "video" ? (
                      <div className="absolute inset-0">
                        <video
                          ref={(el) => {
                            thumbnailVideoRefs.current[index] = el;
                          }}
                          src={media.url}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover bg-black"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                          <span className="w-7 h-7 rounded-full bg-black/55 flex items-center justify-center">
                            <Video size={14} className="text-white" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media.url}
                        alt={`${product.name} - ảnh ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="mb-5 md:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-3 md:mb-4">
                {product.name}
              </h1>
              <div className="flex items-center flex-wrap gap-x-3 sm:gap-x-6 gap-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-shopbee-blue font-bold border-b border-shopbee-blue leading-none">
                    {product.rating}
                  </span>
                  <div className="flex text-shopbee-blue">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= product.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                <div className="hidden sm:block h-4 w-px bg-gray-200"></div>
                <div>
                  <span className="font-bold border-b border-gray-900 leading-none">
                    {reviews.length > 1000
                      ? `${(reviews.length / 1000).toFixed(1)}k`
                      : reviews.length}
                  </span>
                  <span className="text-gray-500 ml-1">Đánh giá</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-gray-200"></div>
                <div>
                  <span className="font-bold">
                    {product.sold > 1000
                      ? `${(product.sold / 1000).toFixed(1)}k`
                      : product.sold}
                  </span>
                  <span className="text-gray-500 ml-1">Đã bán</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <div className="w-6 h-6 rounded-md overflow-hidden bg-shopbee-blue/10 flex items-center justify-center">
                  {shopAvatar ? (
                    <img
                      src={shopAvatar}
                      alt={shopName}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={14} className="text-shopbee-blue" />
                  )}
                </div>
                <span className="font-semibold text-gray-700">{shopName}</span>
                <span className="hidden sm:inline">•</span>
                <Link
                  to={
                    product.sellerId
                      ? `/shop?sellerId=${product.sellerId}`
                      : "/shop"
                  }
                  className="text-shopbee-blue font-semibold hover:underline"
                >
                  Xem thêm sản phẩm
                </Link>
                <button
                  onClick={handleChatWithSeller}
                  className="inline-flex items-center gap-1.5 text-shopbee-blue font-semibold hover:bg-shopbee-blue/5 px-3 py-1 rounded-lg border border-shopbee-blue transition-colors"
                >
                  <MessageSquare size={14} />
                  Chat ngay
                </button>
              </div>
            </div>

            <div className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-4 sm:p-5 md:p-6 mb-6 md:mb-8">
              <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                {product.discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    ₫{product.originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-3xl sm:text-4xl font-bold text-shopbee-blue">
                  ₫{product.price.toLocaleString()}
                </span>
                {product.discount > 0 && (
                  <span className="bg-shopbee-blue/10 text-shopbee-blue text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {product.discount}% GIẢM
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6 md:space-y-8 flex-1">
              {optionGroups.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-10">
                  <span className="w-24 text-gray-500 text-sm shrink-0">
                    Phân loại
                  </span>
                  <div className="flex-1 space-y-3">
                    {optionGroups.map((group) => {
                      const groupName = group.name.trim();
                      return (
                        <div key={groupName}>
                          <p className="text-xs text-gray-500 mb-1">
                            {groupName}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.values.map((value) => (
                              <button
                                key={`${groupName}-${value}`}
                                type="button"
                                onClick={() =>
                                  setSelectedOptions((prev) => ({
                                    ...prev,
                                    [groupName]: value,
                                  }))
                                }
                                className={`px-3 py-1 rounded-2xl border text-xs font-medium transition-all ${
                                  selectedOptions[groupName] === value
                                    ? "bg-shopbee-blue/10 text-shopbee-blue dark:bg-shopbee-blue/40 dark:text-white border-shopbee-blue shadow-sm shadow-shopbee-blue/30"
                                    : "bg-white dark:bg-slate-900/60 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-10">
                <span className="w-24 text-gray-500 text-sm shrink-0">
                  Vận chuyển
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size="18" className="text-green-500" />
                    <span className="text-sm font-medium">
                      Miễn phí vận chuyển
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Miễn phí vận chuyển cho đơn hàng trên ₫50.000
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-10">
                <span className="w-24 text-gray-500 text-sm shrink-0">
                  Số lượng
                </span>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={decrementQuantity}
                      className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      className="w-12 text-center border-x border-gray-100 font-bold"
                    />
                    <button
                      onClick={incrementQuantity}
                      className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {product.stock ?? 999} sản phẩm có sẵn
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-2 sm:pt-4">
                <button
                  onClick={handleChatWithSeller}
                  className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl border-2 border-shopbee-blue text-shopbee-blue font-bold hover:bg-shopbee-blue/5 transition-all"
                >
                  <MessageSquare size={20} />
                  Chat ngay
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl border-2 border-shopbee-blue text-shopbee-blue font-bold hover:bg-shopbee-blue/5 transition-all"
                >
                  <ShoppingCart size={20} />
                  Thêm vào giỏ hàng
                </button>
                <button
                  onClick={handleBuyNow}
                  className="liquid-btn text-white font-bold rounded-2xl py-3.5 sm:py-4 shadow-lg shadow-shopbee-blue/20"
                >
                  Mua ngay
                </button>
              </div>
            </div>

            <div className="mt-8 md:mt-10 pt-6 md:pt-10 border-t border-gray-100 flex flex-wrap items-center gap-3 sm:gap-10">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={16} className="text-shopbee-blue" />
                <span>ShopBee Đảm Bảo</span>
              </div>
              <span className="text-[10px] text-gray-400">
                3 ngày trả hàng / Hoàn tiền
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white mt-4 p-3 sm:p-4 shadow-sm rounded-sm">
          <h2 className="bg-[#fafafa] p-2.5 sm:p-3 text-base sm:text-lg font-medium uppercase mb-4">
            CHI TIẾT SẢN PHẨM
          </h2>
          <div className="space-y-3 sm:space-y-4 text-sm px-1 sm:px-3">
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
              <span className="text-gray-500 w-32 shrink-0">Danh Mục</span>
              <span className="text-blue-800">{product.category}</span>
            </div>
            {(product.detailSpecs || []).map((spec, index) => (
              <div
                key={`spec-${index}`}
                className="flex flex-col sm:flex-row gap-1 sm:gap-0"
              >
                <span className="text-gray-500 w-32 shrink-0">
                  {spec.label}
                </span>
                <span>{spec.value}</span>
              </div>
            ))}
            {optionGroups.map((group) => (
              <div
                key={`detail-${group.name}`}
                className="flex flex-col sm:flex-row gap-1 sm:gap-0"
              >
                <span className="text-gray-500 w-32 shrink-0">
                  {group.name}
                </span>
                <span>{group.values.join(", ")}</span>
              </div>
            ))}
          </div>

          <h2 className="bg-[#fafafa] p-2.5 sm:p-3 text-base sm:text-lg font-medium uppercase mt-8 mb-4">
            MÔ TẢ SẢN PHẨM
          </h2>
          <div className="px-1 sm:px-3 text-sm leading-relaxed whitespace-pre-line">
            {product.description?.trim() || "Chưa có mô tả sản phẩm."}
          </div>
        </div>

        <div className="bg-white mt-4 p-4 sm:p-6 md:p-8 shadow-sm rounded-sm mb-10">
          <h2 className="text-lg sm:text-xl font-bold uppercase mb-5 sm:mb-8 flex items-center gap-2">
            <MessageSquare
              size={20}
              className="text-shopbee-blue sm:w-6 sm:h-6"
            />
            Đánh giá sản phẩm
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {reviews.length > 0 && (
                <div className="bg-shopbee-orange/5 border border-shopbee-orange/10 p-4 sm:p-6 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-8 mb-6 md:mb-8">
                  <div className="text-left md:text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-shopbee-orange">
                      {ratingStats.avg}{" "}
                      <span className="text-lg font-normal">trên 5</span>
                    </div>
                    <div className="flex text-shopbee-orange my-1 justify-start md:justify-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={18}
                          fill={
                            s <= Number(ratingStats.avg)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-start">
                    <button
                      onClick={() => setFilterStar("All")}
                      className={`px-3 sm:px-4 py-1.5 rounded-sm border text-xs sm:text-sm transition-colors ${
                        filterStar === "All"
                          ? "border-shopbee-orange text-shopbee-orange bg-white"
                          : "border-gray-200 text-gray-700 bg-white hover:border-gray-300"
                      }`}
                    >
                      Tất cả
                    </button>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFilterStar(star)}
                        className={`px-3 sm:px-4 py-1.5 rounded-sm border text-xs sm:text-sm transition-colors ${
                          filterStar === star
                            ? "border-shopbee-orange text-shopbee-orange bg-white"
                            : "border-gray-200 text-gray-700 bg-white hover:border-gray-300"
                        }`}
                      >
                        {star} Sao ({ratingStats.counts[star]})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => {
                  const isMyReview =
                    currentUserId &&
                    String(review.user || "") === currentUserId;
                  const isEditing = editingReviewId === review._id;

                  return (
                    <div
                      key={review._id}
                      className="flex gap-3 sm:gap-4 border-b border-gray-50 pb-6 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {review.userAvatar ? (
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold text-gray-800">
                            {review.userName}
                          </p>
                          {isMyReview && !isEditing && (
                            <button
                              type="button"
                              onClick={() => startEditReview(review)}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-shopbee-blue text-shopbee-blue hover:bg-shopbee-blue/5"
                            >
                              <Pencil size={12} />
                              Sửa đánh giá
                            </button>
                          )}
                        </div>
                        <div className="flex text-shopbee-orange my-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={10}
                              fill={
                                s <= review.rating ? "currentColor" : "none"
                              }
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mb-2">
                          {new Date(review.createdAt).toLocaleString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        {isEditing ? (
                          <div className="space-y-3 rounded-xl border border-shopbee-blue/20 p-3 bg-shopbee-blue/[0.03]">
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setEditRating(s)}
                                  className="transition-transform hover:scale-110"
                                >
                                  <Star
                                    size={18}
                                    className={
                                      s <= editRating
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-200"
                                    }
                                  />
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-shopbee-blue"
                              rows={3}
                            />

                            {(editImages.length > 0 ||
                              editVideos.length > 0) && (
                              <div className="flex flex-wrap gap-2">
                                {editImages.map((url) => (
                                  <div
                                    key={url}
                                    className="relative w-14 h-14 rounded-lg overflow-hidden border"
                                  >
                                    <img
                                      src={url}
                                      alt="Ảnh đã chọn"
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditImages((prev) =>
                                          prev.filter((item) => item !== url),
                                        )
                                      }
                                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/65 text-white flex items-center justify-center"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                                {editVideos.map((url) => (
                                  <div
                                    key={url}
                                    className="relative w-14 h-14 rounded-lg overflow-hidden border bg-black"
                                  >
                                    <video
                                      src={url}
                                      muted
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditVideos((prev) =>
                                          prev.filter((item) => item !== url),
                                        )
                                      }
                                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/65 text-white flex items-center justify-center"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="px-2 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-700 cursor-pointer inline-flex items-center gap-2">
                                <ImagePlus size={12} />
                                Thêm ảnh
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) =>
                                    setEditImageFiles(
                                      Array.from(e.target.files || []).slice(
                                        0,
                                        6,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <label className="px-2 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-700 cursor-pointer inline-flex items-center gap-2">
                                <Video size={12} />
                                Thêm video
                                <input
                                  type="file"
                                  accept="video/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) =>
                                    setEditVideoFiles(
                                      Array.from(e.target.files || []).slice(
                                        0,
                                        2,
                                      ),
                                    )
                                  }
                                />
                              </label>
                            </div>
                            {(editImageFiles.length > 0 ||
                              editVideoFiles.length > 0) && (
                              <p className="text-[11px] text-gray-500">
                                Đã chọn mới {editImageFiles.length} ảnh và{" "}
                                {editVideoFiles.length} video.
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => submitEditReview(review._id)}
                                disabled={submittingReview}
                                className="px-3 py-1.5 rounded-lg bg-shopbee-blue text-white text-xs font-semibold disabled:opacity-60"
                              >
                                Lưu chỉnh sửa
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditReview}
                                className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-gray-600"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {review.comment}
                            </p>
                            {(review.images?.length || 0) > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {review.images?.map((url) => (
                                  <button
                                    key={url}
                                    type="button"
                                    onClick={() =>
                                      openPreviewMedia("image", url)
                                    }
                                    className="w-16 h-16 rounded-lg overflow-hidden border cursor-zoom-in"
                                  >
                                    <img
                                      src={url}
                                      alt="Ảnh đánh giá"
                                      loading="lazy"
                                      decoding="async"
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                            {(review.videos?.length || 0) > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {review.videos?.map((url) => (
                                  <button
                                    key={url}
                                    type="button"
                                    onClick={() =>
                                      openPreviewMedia("video", url)
                                    }
                                    className="relative w-16 h-16 rounded-lg overflow-hidden border bg-black"
                                  >
                                    <video
                                      src={url}
                                      muted
                                      preload="metadata"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                      <Video size={14} className="text-white" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            {review.sellerReply?.message && (
                              <div className="mt-3 rounded-xl border border-shopbee-blue/20 bg-shopbee-blue/[0.04] p-3">
                                <p className="text-xs font-bold text-shopbee-blue mb-1">
                                  Phản hồi từ người bán
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {review.sellerReply.message}
                                </p>
                                {review.sellerReply.repliedAt && (
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    {new Date(
                                      review.sellerReply.repliedAt,
                                    ).toLocaleString("vi-VN")}
                                  </p>
                                )}
                              </div>
                            )}
                            {(review.comments?.length || 0) > 0 && (
                              <div className="mt-3 space-y-2">
                                {getVisibleComments(review).map((item, idx) => {
                                  const isMine =
                                    currentUserId &&
                                    String(item.userId || "") === currentUserId;
                                  return (
                                    <div
                                      key={item._id || `${review._id}-${idx}`}
                                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                    >
                                      <div
                                        className={`max-w-[92%] rounded-lg border p-2.5 ${
                                          isMine
                                            ? "border-shopbee-blue/20 bg-shopbee-blue/[0.06]"
                                            : "border-gray-100 bg-gray-50/80"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="w-6 h-6 rounded-full overflow-hidden bg-white border flex items-center justify-center">
                                            {item.userAvatar ? (
                                              <img
                                                src={item.userAvatar}
                                                alt={item.userName}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <User
                                                size={12}
                                                className="text-gray-400"
                                              />
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
                                          <span className="text-[10px] text-gray-400">
                                            •{" "}
                                            {new Date(
                                              item.createdAt,
                                            ).toLocaleString("vi-VN")}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-700">
                                          {item.message}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                                {canExpandComments(review) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedCommentThreads((prev) => ({
                                        ...prev,
                                        [review._id]: true,
                                      }))
                                    }
                                    className="text-[11px] text-shopbee-blue hover:underline"
                                  >
                                    Xem thêm{" "}
                                    {(review.comments?.length || 0) - 3} bình
                                    luận
                                  </button>
                                )}
                              </div>
                            )}
                            {user ? (
                              <div className="mt-3 flex gap-2">
                                <input
                                  type="text"
                                  value={reviewCommentDrafts[review._id] || ""}
                                  onChange={(e) =>
                                    setReviewCommentDrafts((prev) => ({
                                      ...prev,
                                      [review._id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Viết bình luận cho đánh giá này..."
                                  className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-shopbee-blue"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    submitReviewComment(review._id)
                                  }
                                  disabled={
                                    submittingCommentReviewId === review._id
                                  }
                                  className="px-3 h-9 rounded-lg bg-shopbee-blue text-white text-xs font-semibold"
                                >
                                  Gửi
                                </button>
                              </div>
                            ) : (
                              <p className="mt-3 text-[11px] text-gray-400">
                                Đăng nhập để bình luận thêm vào đánh giá này.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-gray-400 italic">
                  {reviews.length > 0
                    ? `Chưa có đánh giá ${filterStar} sao nào.`
                    : "Chưa có đánh giá nào cho sản phẩm này."}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="glass-card p-4 sm:p-6 rounded-3xl border-white/40 lg:sticky lg:top-24">
                <h3 className="font-bold mb-4">Viết đánh giá của bạn</h3>
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Số sao
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className="transition-transform hover:scale-125"
                          >
                            <Star
                              size={24}
                              className={
                                s <= rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-200"
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Nhận xét
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                        className="w-full bg-gray-50 border border-transparent focus:border-shopbee-blue focus:bg-white rounded-2xl p-4 text-sm outline-none transition-all h-32 resize-none"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Hình ảnh / Video đính kèm
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="px-3 py-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 cursor-pointer inline-flex items-center gap-2">
                          <ImagePlus size={14} />
                          Chọn ảnh (tối đa 6)
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) =>
                              setReviewImageFiles(
                                Array.from(e.target.files || []).slice(0, 6),
                              )
                            }
                          />
                        </label>
                        <label className="px-3 py-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 cursor-pointer inline-flex items-center gap-2">
                          <Video size={14} />
                          Chọn video (tối đa 2)
                          <input
                            type="file"
                            accept="video/*"
                            multiple
                            className="hidden"
                            onChange={(e) =>
                              setReviewVideoFiles(
                                Array.from(e.target.files || []).slice(0, 2),
                              )
                            }
                          />
                        </label>
                      </div>
                      {(reviewImageFiles.length > 0 ||
                        reviewVideoFiles.length > 0) && (
                        <p className="text-[11px] text-gray-500">
                          Đã chọn {reviewImageFiles.length} ảnh và{" "}
                          {reviewVideoFiles.length} video.
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full liquid-btn text-white font-bold py-3 rounded-2xl shadow-lg shadow-shopbee-blue/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {submittingReview ? (
                        "Đang gửi..."
                      ) : (
                        <>
                          Gửi đánh giá <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-4">
                      Vui lòng đăng nhập để viết đánh giá.
                    </p>
                    <Link
                      to="/login"
                      className="text-shopbee-blue font-bold hover:underline"
                    >
                      Đăng nhập ngay
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {previewMedia && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 p-4 flex items-center justify-center"
            onClick={closePreviewMedia}
          >
            <button
              type="button"
              onClick={closePreviewMedia}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
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
                alt="Xem ảnh đánh giá"
                className="max-w-[95vw] max-h-[90vh] rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;



