import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "../utils/mockData";
import ProductCard from "../components/ProductCard";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { productApi } from "../utils/api";
import type { Product } from "../types";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  ProductCardSkeleton as ProductGridSkeleton,
} from "../components/GlassLoader";

const Home = () => {
  const heroBanners = [
    {
      id: 1,
      image: "https://picsum.photos/seed/banner1/1200/600",
      title: "Siêu Sale Công Nghệ",
      subtitle: "Giảm đến 50% cho các thiết bị Apple",
    },
    {
      id: 2,
      image: "https://picsum.photos/seed/banner2/1200/600",
      title: "Flash Deal Trong Ngày",
      subtitle: "Săn ưu đãi sốc từ 0h - 24h",
    },
    {
      id: 3,
      image: "https://picsum.photos/seed/banner3/1200/600",
      title: "Mua Sắm Không Lo Giá",
      subtitle: "Miễn phí vận chuyển cho đơn từ 99K",
    },
  ];
  const [products, setProducts] = useState<Product[]>([]);
  const [bestProducts, setBestProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingBest, setLoadingBest] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const { theme: _theme } = useTheme();
  const PAGE_SIZE = 12;
  const currentQuery = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return {
      search: searchParams.get("search") || "",
      sort: searchParams.get("sort") || "",
    };
  }, [location.search]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingMain(true);
      try {
        const response = await productApi.getAll({
          search: currentQuery.search,
          category: selectedCategory || "",
          sort: currentQuery.sort || "",
          limit: String(PAGE_SIZE),
          page: "1",
        });

        if (response.data && Array.isArray(response.data)) {
          const mappedProducts = response.data.map((p: Product) => ({
            ...p,
            id: p._id ?? p.id,
          }));
          setProducts(mappedProducts);
          setPage(1);
          setHasMore(mappedProducts.length === PAGE_SIZE);
          if (mappedProducts.length === PAGE_SIZE) {
            void productApi.prefetchAll({
              search: currentQuery.search,
              category: selectedCategory || "",
              sort: currentQuery.sort || "",
              limit: String(PAGE_SIZE),
              page: "2",
            });
          }
        } else {
          setProducts([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      } finally {
        setLoadingMain(false);
      }
    };

    fetchProducts();
  }, [currentQuery, selectedCategory]);

  useEffect(() => {
    const fetchBestAndNew = async () => {
      setLoadingBest(true);
      setLoadingNew(true);
      try {
        const [bestRes, newRes] = await Promise.all([
          productApi.getAll({ sort: "sold", limit: "6" }),
          productApi.getAll({ sort: "new", limit: "6" }),
        ]);
        setBestProducts(
          (bestRes.data || []).map((p: Product) => ({
            ...p,
            id: p._id ?? p.id,
          })),
        );
        setNewProducts(
          (newRes.data || []).map((p: Product) => ({
            ...p,
            id: p._id ?? p.id,
          })),
        );
      } catch (_e) {
        setBestProducts([]);
        setNewProducts([]);
      } finally {
        setLoadingBest(false);
        setLoadingNew(false);
      }
    };
    fetchBestAndNew();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory((prev) =>
      prev === categoryName ? null : categoryName,
    );
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await productApi.getAll({
        search: currentQuery.search,
        category: selectedCategory || "",
        sort: currentQuery.sort || "",
        limit: String(PAGE_SIZE),
        page: String(nextPage),
      });
      const mapped = (res.data || []).map((p: Product) => ({
        ...p,
        id: (p as Product)._id ?? p.id,
      }));
      setProducts((prev) => [...prev, ...mapped]);
      setPage(nextPage);
      setHasMore(mapped.length === PAGE_SIZE);
      if (mapped.length === PAGE_SIZE) {
        void productApi.prefetchAll({
          search: currentQuery.search,
          category: selectedCategory || "",
          sort: currentQuery.sort || "",
          limit: String(PAGE_SIZE),
          page: String(nextPage + 1),
        });
      }
    } catch (_e) {
      // ignore load more errors
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroBanners.length]);

  const handlePrevBanner = () => {
    setActiveBannerIndex((prev) =>
      prev === 0 ? heroBanners.length - 1 : prev - 1,
    );
  };

  const handleNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % heroBanners.length);
  };

  const activeSort = currentQuery.sort || "";
  const setSort = (val: "" | "sold" | "new") => {
    const sp = new URLSearchParams(location.search);
    if (val) sp.set("sort", val);
    else sp.delete("sort");
    navigate(`/?${sp.toString()}`);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 pb-10 min-h-screen">
      <div className="site-container">
        {/* Banner Section - iOS Liquid Glass style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-6 h-[220px] md:h-[280px] lg:h-[320px]">
          <div className="lg:col-span-2 relative glass-card rounded-3xl overflow-hidden group">
            <img
              src={heroBanners[activeBannerIndex].image}
              alt="Main Banner"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h2 className="text-3xl font-bold mb-2">
                {heroBanners[activeBannerIndex].title}
              </h2>
              <p className="text-sm opacity-90">
                {heroBanners[activeBannerIndex].subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrevBanner}
              aria-label="Banner trước"
              className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white hover:bg-white/40 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={handleNextBanner}
              aria-label="Banner tiếp theo"
              className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white hover:bg-white/40 transition-all"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-4 right-4 flex gap-2">
              {heroBanners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setActiveBannerIndex(index)}
                  aria-label={`Chuyển đến banner ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeBannerIndex
                      ? "w-7 bg-white"
                      : "w-2.5 bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-rows-2 gap-3 h-full mt-3 lg:mt-0">
            <div className="glass-card rounded-3xl overflow-hidden relative group">
              <img
                src="https://picsum.photos/seed/sub1/400/200"
                alt="Sub Banner 1"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-shopbee-blue/10"></div>
            </div>
            <div className="glass-card rounded-3xl overflow-hidden relative group">
              <img
                src="https://picsum.photos/seed/sub2/400/200"
                alt="Sub Banner 2"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-shopbee-lightBlue/10"></div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mt-8 glass-card rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-gray-800 dark:text-slate-100 font-bold uppercase text-sm tracking-wider">
              Khám Phá Danh Mục
            </h2>
          </div>
          {isMobile ? (
            <div className="-mx-3 overflow-x-auto">
              <div className="inline-flex gap-3 px-2 py-1 rounded-3xl bg-white/50 dark:bg-slate-950/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/80 shadow-sm">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`min-w-[88px] max-w-[100px] p-3 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer ${
                      selectedCategory === cat.name
                        ? "bg-white text-gray-900 border border-shopbee-blue shadow-lg shadow-shopbee-blue/30 scale-105 glass-interactive dark:bg-slate-900 dark:text-slate-50"
                        : "glass glass-interactive text-gray-700 dark:text-slate-200"
                    }`}
                  >
                    <span className="text-3xl mb-1.5 filter drop-shadow-sm">
                      {cat.icon}
                    </span>
                    <span className="text-[11px] text-center font-semibold line-clamp-2 capitalize tracking-tight">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`p-4 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer ${
                    selectedCategory === cat.name
                      ? "bg-white text-gray-900 border border-shopbee-blue shadow-lg shadow-shopbee-blue/30 scale-105 glass-interactive dark:bg-slate-900 dark:text-slate-50"
                      : "glass glass-interactive text-gray-700 dark:text-slate-200"
                  }`}
                >
                  <span className="text-4xl md:text-3xl mb-2 filter drop-shadow-sm">
                    {cat.icon}
                  </span>
                  <span className="text-[12px] md:text-[10px] text-center font-semibold line-clamp-2 capitalize tracking-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Flash Sale Section */}
        <div className="mt-8 glass-card rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <h2 className="text-shopbee-blue font-black text-lg md:text-xl italic uppercase tracking-tighter">
                Flash Sale
              </h2>
              <div className="flex gap-1.5 sm:gap-2 items-center">
                <span className="glass glass-capsule glass-tint-blue text-slate-900 dark:text-slate-100 px-2 py-0.5 md:py-1 font-bold text-xs md:text-sm shadow-sm">
                  01
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base">
                  :
                </span>
                <span className="glass glass-capsule glass-tint-blue text-slate-900 dark:text-slate-100 px-2 py-0.5 md:py-1 font-bold text-xs md:text-sm shadow-sm">
                  45
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base">
                  :
                </span>
                <span className="glass glass-capsule glass-tint-blue text-slate-900 dark:text-slate-100 px-2 py-0.5 md:py-1 font-bold text-xs md:text-sm shadow-sm">
                  12
                </span>
              </div>
            </div>
            <Link
              to="/?sort=sold"
              className="text-shopbee-blue text-[11px] sm:text-xs font-bold flex items-center glass glass-capsule glass-interactive glass-tint-cyan px-3 py-1.5 sm:px-4 sm:py-2 self-end sm:self-auto"
            >
              Xem tất cả <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 pb-2">
            {loadingMain ? (
              <ProductGridSkeleton count={6} className="col-span-6" minHeight="min-h-[360px]" />
            ) : (
              products
                .slice(0, 6)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
            )}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="mt-8 glass-card rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-gray-800 dark:text-slate-100 font-bold uppercase text-sm tracking-wider">
              Bán Chạy
            </h2>
            <Link
              to="/?sort=sold"
              className="text-shopbee-blue text-xs font-bold hover:opacity-80 transition-opacity"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {loadingBest ? (
              <ProductGridSkeleton count={6} className="col-span-6" minHeight="min-h-[360px]" />
            ) : bestProducts.length > 0 ? (
              bestProducts.map((product) => (
                <ProductCard key={`best-${product.id}`} product={product} />
              ))
            ) : (
              <div className="col-span-6 glass-card rounded-2xl py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                Chưa có sản phẩm bán chạy
              </div>
            )}
          </div>
        </div>

        {/* New Arrivals */}
        <div className="mt-8 glass-card rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-gray-800 dark:text-slate-100 font-bold uppercase text-sm tracking-wider">
              Hàng Mới
            </h2>
            <Link
              to="/?sort=new"
              className="text-shopbee-blue text-xs font-bold hover:opacity-80 transition-opacity"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {loadingNew ? (
              <ProductGridSkeleton count={6} className="col-span-6" minHeight="min-h-[360px]" />
            ) : newProducts.length > 0 ? (
              newProducts.map((product) => (
                <ProductCard key={`new-${product.id}`} product={product} />
              ))
            ) : (
              <div className="col-span-6 glass-card rounded-2xl py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                Chưa có sản phẩm mới
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-8 mb-6">
          <div className="sticky top-28 z-20">
            <div className="glass-card bg-white/80 dark:bg-slate-900/90 rounded-3xl overflow-hidden">
              <div className="flex text-[11px] sm:text-xs md:text-sm lg:text-base">
                <button
                  onClick={() => setSort("")}
                  className={`flex-1 py-3 md:py-4 text-center uppercase tracking-tight cursor-pointer transition-colors ${
                    activeSort === ""
                      ? "font-bold text-shopbee-blue border-b-4 border-shopbee-blue bg-shopbee-blue/5"
                      : "font-bold text-gray-500 hover:bg-gray-50"
                  }`}
                  aria-pressed={activeSort === ""}
                >
                  Gợi Ý Hôm Nay
                </button>
                <button
                  onClick={() => setSort("sold")}
                  className={`flex-1 py-3 md:py-4 text-center uppercase tracking-tight cursor-pointer transition-colors ${
                    activeSort === "sold"
                      ? "font-bold text-shopbee-blue border-b-4 border-shopbee-blue bg-shopbee-blue/5"
                      : "font-bold text-gray-500 hover:bg-gray-50"
                  }`}
                  aria-pressed={activeSort === "sold"}
                >
                  Bán Chạy
                </button>
                <button
                  onClick={() => setSort("new")}
                  className={`flex-1 py-3 md:py-4 text-center uppercase tracking-tight cursor-pointer transition-colors ${
                    activeSort === "new"
                      ? "font-bold text-shopbee-blue border-b-4 border-shopbee-blue bg-shopbee-blue/5"
                      : "font-bold text-gray-500 hover:bg-gray-50"
                  }`}
                  aria-pressed={activeSort === "new"}
                >
                  Hàng Mới
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {loadingMain ? (
              <ProductGridSkeleton count={12} className="col-span-full" minHeight="min-h-[720px]" />
            ) : products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-24 glass-card rounded-3xl">
                <img
                  src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/a60759ad1dabe909c46a817ecbf51877.png"
                  alt="No results"
                  className="w-40 mb-6 opacity-50"
                />
                <p className="text-gray-400 font-medium">
                  Không tìm thấy sản phẩm nào khớp với lựa chọn của bạn
                </p>
              </div>
            )}
          </div>
        </div>

        {hasMore && (
          <div className="mt-12">
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="liquid-btn text-white px-16 py-3.5 rounded-2xl font-bold shadow-xl shadow-shopbee-blue/20 hover:scale-105 transition-all disabled:opacity-50"
                aria-busy={loadingMore}
              >
                {loadingMore ? "Đang tải thêm..." : "Xem Thêm Sản Phẩm"}
              </button>
            </div>
            {loadingMore && (
              <div className="mt-6">
                <ProductGridSkeleton count={6} minHeight="min-h-[360px]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;



