import { useEffect, useState, useMemo, useDeferredValue } from "react";
import { productApi } from "../../utils/api";
import type { Product } from "../../types";
import { CATEGORIES } from "../../utils/mockData";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  AdminProductTableSkeleton,
  GlassListSkeleton,
} from "../../components/GlassLoader";

type ProductListItem = Product & {
  _id?: string;
  createdAt?: string;
};

const AdminProductList = () => {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockStatus, setStockStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState<{
    key: "createdAt" | "sold" | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "desc" });
  const [visibleCount, setVisibleCount] = useState(80);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const ROW_BATCH_SIZE = 80;

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await productApi.getMine(token);
        setProducts(res.data || []);
        setError("");
      } catch {
        setProducts([]);
        setError("Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      const token = localStorage.getItem("token");
      await productApi.deleteProduct(String(id), token || "");
      setProducts((prev) =>
        prev.filter(
          (p) => String(p.id) !== String(id) && String(p._id) !== String(id),
        ),
      );
      setVisibleCount(ROW_BATCH_SIZE);
    }
  };

  const handleSort = (key: "createdAt" | "sold") => {
    setVisibleCount(ROW_BATCH_SIZE);
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by search query
    if (deferredSearchQuery.trim()) {
      const normalizedSearch = deferredSearchQuery.toLowerCase().trim();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(normalizedSearch),
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by stock status
    if (stockStatus === "In Stock") {
      result = result.filter((p) => (p.stock ?? 0) > 0);
    } else if (stockStatus === "Out of Stock") {
      result = result.filter((p) => (p.stock ?? 0) <= 0);
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;

        if (sortConfig.key === "createdAt") {
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
        } else {
          aValue = a.sold ?? 0;
          bValue = b.sold ?? 0;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [
    products,
    deferredSearchQuery,
    selectedCategory,
    stockStatus,
    sortConfig,
  ]);

  const renderedProducts = useMemo(
    () => filteredAndSortedProducts.slice(0, visibleCount),
    [filteredAndSortedProducts, visibleCount],
  );

  const renderSortIcon = (column: "createdAt" | "sold") => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={14} className="ml-1 text-shopbee-blue" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-shopbee-blue" />
    );
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Sản phẩm</h1>
        <Link
          to="/admin/products/new"
          className="liquid-btn text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
        >
          <PlusCircle size={20} />
          <span>Thêm sản phẩm</span>
        </Link>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50"
              value={searchQuery}
              onChange={(e) => {
                setVisibleCount(ROW_BATCH_SIZE);
                setSearchQuery(e.target.value);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50"
              value={selectedCategory}
              onChange={(e) => {
                setVisibleCount(ROW_BATCH_SIZE);
                setSelectedCategory(e.target.value);
              }}
            >
              <option value="All">Tất cả danh mục</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50"
              value={stockStatus}
              onChange={(e) => {
                setVisibleCount(ROW_BATCH_SIZE);
                setStockStatus(e.target.value);
              }}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="In Stock">Còn hàng</option>
              <option value="Out of Stock">Hết hàng</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[800px]">
        <div className="md:hidden p-3 space-y-3">
          {loading ? (
            <GlassListSkeleton
              rows={6}
              variant="full"
              minHeight="min-h-[560px]"
            />
          ) : renderedProducts.length > 0 ? (
            renderedProducts.map((product) => {
              const productId = product._id || product.id;
              return (
                <div
                  key={`mobile-${String(productId)}`}
                  className="rounded-2xl border border-gray-100 dark:border-gray-700 p-3 bg-white/70 dark:bg-slate-900/50"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.category}
                      </p>
                      <p className="text-sm font-bold text-shopbee-blue mt-1">
                        ₫{product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-2 py-1.5">
                      <p className="text-gray-500">Kho</p>
                      <p
                        className={`font-semibold ${
                          (product.stock ?? 0) <= 0
                            ? "text-red-500"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {product.stock ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-2 py-1.5">
                      <p className="text-gray-500">Đã bán</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {(product.sold ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 dark:bg-gray-900 px-2 py-1.5">
                      <p className="text-gray-500">Ngày đăng</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(product.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Link
                      to={`/admin/products/edit/${productId}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-shopbee-blue/10 text-shopbee-blue"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(productId)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
              {error || "Không tìm thấy sản phẩm nào khớp với bộ lọc."}
            </div>
          )}
        </div>

        <div
          className="hidden md:block overflow-auto max-h-[75vh]"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (
              el.scrollTop + el.clientHeight >= el.scrollHeight - 250 &&
              visibleCount < filteredAndSortedProducts.length
            ) {
              setVisibleCount((prev) =>
                Math.min(
                  filteredAndSortedProducts.length,
                  prev + ROW_BATCH_SIZE,
                ),
              );
            }
          }}
        >
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-5 border-b dark:border-gray-700">
                  Sản phẩm
                </th>
                <th
                  className="px-6 py-5 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Ngày đăng {renderSortIcon("createdAt")}
                  </div>
                </th>
                <th className="px-6 py-5 border-b dark:border-gray-700">Giá</th>
                <th className="px-6 py-5 border-b dark:border-gray-700">Kho</th>
                <th
                  className="px-6 py-5 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort("sold")}
                >
                  <div className="flex items-center">
                    Bán chạy {renderSortIcon("sold")}
                  </div>
                </th>
                <th className="px-6 py-5 border-b dark:border-gray-700 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <AdminProductTableSkeleton rows={12} />
              ) : filteredAndSortedProducts.length > 0 ? (
                renderedProducts.map((product) => {
                  const sold = product.sold ?? 0;
                  const productId = product._id || product.id;

                  return (
                    <tr
                      key={String(productId)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">
                                No image
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(product.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-semibold">
                          ₫{product.price.toLocaleString()}
                        </div>
                        {product.discount > 0 && (
                          <div className="text-xs text-gray-500 line-through">
                            ₫{product.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            (product.stock ?? 0) <= 0
                              ? "text-red-500"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {product.stock ?? 0}
                          {(product.stock ?? 0) <= 0 && (
                            <span className="ml-2 text-[10px] uppercase font-bold">
                              (Hết hàng)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {sold.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/products/edit/${productId}`}
                          className="text-shopbee-blue hover:text-shopbee-lightBlue mr-4 inline-block p-1 hover:bg-shopbee-blue/10 rounded-full transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(productId)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-500/10 rounded-full transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500 dark:text-gray-400"
                  >
                    {error || "Không tìm thấy sản phẩm nào khớp với bộ lọc."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {renderedProducts.length < filteredAndSortedProducts.length && (
            <div className="px-6 py-3 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/40 border-t border-gray-100 dark:border-gray-700">
              Đang hiển thị {renderedProducts.length}/
              {filteredAndSortedProducts.length} sản phẩm
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProductList;



