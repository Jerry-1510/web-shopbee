import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productApi } from "../utils/api";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";
import { Star, MapPin, Clock } from "lucide-react";
import {
  GlassProgressLoader,
  ProductCardSkeleton,
} from "../components/GlassLoader";

const ShopHome = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sort = searchParams.get("sort") || "";
        const sellerId = searchParams.get("sellerId") || "";
        const params: Record<string, string> = {
          sort,
          limit: "24",
          page: "1",
        };
        if (sellerId) {
          params.sellerId = sellerId;
        }
        const res = await productApi.getAll(params);
        const data = Array.isArray(res.data) ? res.data : [];
        setProducts(
          data.map((p: Product) => ({
            ...p,
            id: p._id ?? p.id,
          })),
        );
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  const activeSort = searchParams.get("sort") || "";
  const updateSort = (value: "" | "sold" | "new") => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("sort", value);
    else params.delete("sort");
    setSearchParams(params, { replace: true });
  };

  const totalProducts = products.length;
  const totalSold = products.reduce((sum, p) => sum + (p.sold ?? 0), 0);
  const averageRating =
    products.length > 0
      ? Number(
          (
            products.reduce((sum, p) => sum + (p.rating ?? 0), 0) /
            products.length
          ).toFixed(1),
        )
      : 0;
  const shopName = products[0]?.shopName || "Kênh Người Bán";
  const shopDescription =
    products[0]?.shopDescription ||
    "Kênh người bán đang cập nhật thông tin shop.";
  const shopAvatar = products[0]?.shopAvatar || "";
  const shopCover = products[0]?.shopCover || "";
  const shopAddress = products[0]?.shopAddress || "Chưa cập nhật địa chỉ shop";
  const shopLetter = (shopName || "S").trim().charAt(0).toUpperCase();

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 md:pb-10">
      <div className="site-container">
        <div className="mt-4 mb-5 md:mb-6 text-xs text-gray-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-shopbee-blue transition-colors">
            ShopBee
          </Link>
          <span>/</span>
          <span className="text-gray-400">Trang chủ shop</span>
        </div>

        <div className="glass-card rounded-3xl md:rounded-[32px] overflow-hidden mb-6 md:mb-8">
          {shopCover ? (
            <img
              src={shopCover}
              alt={`${shopName} cover`}
              className="w-full h-28 object-cover"
            />
          ) : (
            <div className="bg-gradient-to-r from-shopbee-blue to-shopbee-lightBlue/80 h-28"></div>
          )}
          <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center">
            <div className="-mt-14 md:-mt-16 flex items-center gap-3 md:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold overflow-hidden">
                {shopAvatar ? (
                  <img
                    src={shopAvatar}
                    alt={shopName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  shopLetter
                )}
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  {shopName}
                </h1>
                <p className="text-[11px] md:text-xs text-gray-700 dark:text-slate-300 mt-1 line-clamp-2">
                  {shopDescription}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] md:text-xs text-gray-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400" />
                    {averageRating.toFixed(1)} ({totalSold.toLocaleString()}{" "}
                    lượt bán)
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>{totalProducts} Sản phẩm</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 w-full md:w-auto md:flex gap-2.5 md:gap-3 md:ml-auto">
              <button className="px-3 sm:px-4 py-2 rounded-2xl bg-white/95 text-shopbee-blue border border-shopbee-blue/70 text-xs md:text-sm font-bold shadow-sm shadow-shopbee-blue/15 hover:bg-white/70 hover:backdrop-blur-md hover:shadow-[0_0_18px_rgba(14,116,144,0.45)] transition-all">
                Theo dõi
              </button>
              <button className="px-3 sm:px-4 py-2 rounded-2xl bg-white/95 text-gray-900 border border-shopbee-blue/70 text-xs md:text-sm font-bold shadow-sm shadow-shopbee-blue/15 hover:bg-white/70 hover:backdrop-blur-md hover:shadow-[0_0_18px_rgba(14,116,144,0.45)] transition-all">
                Chat
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <div className="glass-card rounded-3xl p-5 text-sm text-gray-800 dark:text-slate-100 space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Thông tin shop
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <Clock size={14} className="text-shopbee-blue" />
              <span>Tham gia: 2024</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin size={14} className="text-shopbee-blue" />
              <span>{shopAddress}</span>
            </div>
            <div className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
              {shopDescription}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-3.5 sm:p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 sm:gap-3 text-xs md:text-sm font-semibold text-gray-900 dark:text-slate-200 overflow-x-auto whitespace-nowrap pb-1 -mb-1">
                <button
                  type="button"
                  onClick={() => updateSort("")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-all shrink-0 ${
                    activeSort === ""
                      ? "bg-white/95 text-gray-900 border border-shopbee-blue shadow-[0_0_16px_rgba(14,116,144,0.4)]"
                      : "bg-slate-100/90 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white hover:border-shopbee-blue/40 hover:shadow-[0_0_12px_rgba(14,116,144,0.35)]"
                  }`}
                >
                  Tất cả sản phẩm
                </button>
                <button
                  type="button"
                  onClick={() => updateSort("sold")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-all shrink-0 ${
                    activeSort === "sold"
                      ? "bg-white/95 text-gray-900 border border-shopbee-blue shadow-[0_0_16px_rgba(14,116,144,0.4)]"
                      : "bg-slate-100/90 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white hover:border-shopbee-blue/40 hover:shadow-[0_0_12px_rgba(14,116,144,0.35)]"
                  }`}
                >
                  Bán chạy
                </button>
                <button
                  type="button"
                  onClick={() => updateSort("new")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-all shrink-0 ${
                    activeSort === "new"
                      ? "bg-white/95 text-gray-900 border border-shopbee-blue shadow-[0_0_16px_rgba(14,116,144,0.4)]"
                      : "bg-slate-100/90 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white hover:border-shopbee-blue/40 hover:shadow-[0_0_12px_rgba(14,116,144,0.35)]"
                  }`}
                >
                  Mới nhất
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
              {loading ? (
                <div className="col-span-full space-y-8">
                  <GlassProgressLoader
                    label="Đang tải sản phẩm..."
                    variant="full"
                    minHeight="min-h-[160px]"
                  />
                  <ProductCardSkeleton
                    count={12}
                    className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    minHeight="min-h-[600px]"
                  />
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full text-center text-sm text-slate-400 py-16">
                  Chưa có sản phẩm nào trong shop.
                </div>
              ) : (
                products.map((p) => <ProductCard key={p.id} product={p} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopHome;



