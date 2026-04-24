import { memo } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { prefetchRouteByPath } from "../utils/routePrefetch";
import { productApi } from "../utils/api";

interface ProductCardProps {
  product: Product;
}

const prefetchedProductIds = new Set<string>();

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col h-full border border-white/50 min-w-0"
      onMouseEnter={() => {
        const productId = String(product.id);
        if (prefetchedProductIds.has(productId)) return;
        prefetchedProductIds.add(productId);
        prefetchRouteByPath(`/product/${productId}`);
        void productApi.prefetchById(productId);
      }}
    >
      <div className="relative pt-[100%] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {product.discount > 0 && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-yellow-400/90 backdrop-blur-md text-shopbee-blue text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
            -{product.discount}%
          </div>
        )}
        {product.isMall && (
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-shopbee-blue text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-lg shadow-shopbee-blue/20">
            Mall
          </div>
        )}
      </div>

      <div className="p-2 sm:p-2.5 md:p-3 flex flex-col flex-1 bg-white/70 dark:bg-slate-900/60">
        <h3
          className="text-[11px] sm:text-xs md:text-sm text-gray-800 dark:text-slate-100 line-clamp-2 mb-0.5 md:mb-1 font-medium leading-snug group-hover:text-shopbee-blue transition-colors"
          title={product.name}
        >
          {product.name}
        </h3>
        {product.shopName && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
            {product.shopName}
          </p>
        )}

        <div className="mt-auto">
          <div className="flex items-center gap-1 mb-1.5 md:mb-2">
            <span className="text-shopbee-blue font-bold text-xs sm:text-sm md:text-base">
              ₫{product.price.toLocaleString()}
            </span>
            {product.discount > 0 && (
              <span className="text-[10px] text-gray-400 line-through">
                ₫{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100/50 dark:border-slate-800 pt-1.5 md:pt-2">
            <div className="flex items-center">
              <Star size={10} className="text-yellow-400 fill-current" />
              <span className="ml-1">{product.rating}</span>
            </div>
            <span>
              Đã bán{" "}
              {product.sold > 1000
                ? `${(product.sold / 1000).toFixed(1)}k`
                : product.sold}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default memo(ProductCard);



