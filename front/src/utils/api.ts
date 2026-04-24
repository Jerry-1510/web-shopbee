import axios from "axios";

import type { Product, ChatConversation, ChatMessage } from "../types";
const API_URL = "http://localhost:5000/api";
const PRODUCT_LIST_CACHE_TTL_MS = 30000;
const PRODUCT_LIST_STALE_TTL_MS = 5 * 60 * 1000;
const PRODUCT_DETAIL_CACHE_TTL_MS = 60000;
const PRODUCT_DETAIL_STALE_TTL_MS = 10 * 60 * 1000;

type ProductListParams = Record<string, string>;
type ProductListCacheValue = {
  freshUntil: number;
  staleUntil: number;
  data: Product[];
};
type ProductDetailCacheValue = {
  freshUntil: number;
  staleUntil: number;
  data: Product;
};

const productListCache = new Map<string, ProductListCacheValue>();
const productListInflight = new Map<string, Promise<{ data: Product[] }>>();
const productDetailCache = new Map<string, ProductDetailCacheValue>();
const productDetailInflight = new Map<string, Promise<{ data: Product }>>();

const api = axios.create({
  baseURL: API_URL,
});

const normalizeProductListParams = (params: ProductListParams) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b));

const buildProductListCacheKey = (params: ProductListParams) =>
  normalizeProductListParams(params)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

const getCachedProductList = (cacheKey: string) => {
  const cached = productListCache.get(cacheKey);
  if (!cached) return null;
  if (cached.staleUntil < Date.now()) {
    productListCache.delete(cacheKey);
    return null;
  }
  return {
    data: cached.data,
    isFresh: cached.freshUntil >= Date.now(),
  };
};

const setCachedProductList = (cacheKey: string, data: Product[]) => {
  productListCache.set(cacheKey, {
    data,
    freshUntil: Date.now() + PRODUCT_LIST_CACHE_TTL_MS,
    staleUntil: Date.now() + PRODUCT_LIST_STALE_TTL_MS,
  });
};

const getCachedProductDetail = (id: string) => {
  const cached = productDetailCache.get(id);
  if (!cached) return null;
  if (cached.staleUntil < Date.now()) {
    productDetailCache.delete(id);
    return null;
  }
  return {
    data: cached.data,
    isFresh: cached.freshUntil >= Date.now(),
  };
};

const setCachedProductDetail = (id: string, data: Product) => {
  productDetailCache.set(id, {
    data,
    freshUntil: Date.now() + PRODUCT_DETAIL_CACHE_TTL_MS,
    staleUntil: Date.now() + PRODUCT_DETAIL_STALE_TTL_MS,
  });
};

const clearProductCaches = () => {
  productListCache.clear();
  productListInflight.clear();
  productDetailCache.clear();
  productDetailInflight.clear();
};

const fetchProductList = (
  params: ProductListParams,
  cacheKey: string,
  skipInflightCache?: boolean,
) => {
  if (!skipInflightCache) {
    const inflight = productListInflight.get(cacheKey);
    if (inflight) return inflight;
  }
  const request = api
    .get<Product[]>("/products", { params })
    .then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      setCachedProductList(cacheKey, data);
      return { data };
    })
    .finally(() => {
      productListInflight.delete(cacheKey);
    });
  productListInflight.set(cacheKey, request);
  return request;
};

const fetchProductDetail = (id: string, skipInflightCache?: boolean) => {
  if (!skipInflightCache) {
    const inflight = productDetailInflight.get(id);
    if (inflight) return inflight;
  }
  const request = api
    .get<Product>(`/products/${id}`)
    .then((res) => {
      setCachedProductDetail(id, res.data);
      return { data: res.data };
    })
    .finally(() => {
      productDetailInflight.delete(id);
    });
  productDetailInflight.set(id, request);
  return request;
};

const getPreferredUploadImageFormat = () => {
  if (typeof document === "undefined") return "webp";
  const canvas = document.createElement("canvas");
  if (canvas.toDataURL("image/avif").startsWith("data:image/avif")) {
    return "avif";
  }
  if (canvas.toDataURL("image/webp").startsWith("data:image/webp")) {
    return "webp";
  }
  return "webp";
};

export const productApi = {
  getAll: async (
    params: ProductListParams,
    options?: { forceRefresh?: boolean; preferFresh?: boolean },
  ) => {
    const cacheKey = buildProductListCacheKey(params);
    const preferFresh = Boolean(options?.preferFresh);

    if (!options?.forceRefresh) {
      const cached = getCachedProductList(cacheKey);
      if (cached?.isFresh) {
        return { data: cached.data };
      }
      if (cached && !preferFresh) {
        void fetchProductList(params, cacheKey);
        return { data: cached.data };
      }
      const inflight = productListInflight.get(cacheKey);
      if (inflight) return inflight;
    }
    return fetchProductList(params, cacheKey, Boolean(options?.forceRefresh));
  },
  prefetchAll: async (params: ProductListParams) => {
    await productApi.getAll(params);
  },
  getMine: (token: string) =>
    axios.get<Product[]>(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { sellerOnly: "true" },
    }),
  getById: async (
    id: string,
    options?: { forceRefresh?: boolean; preferFresh?: boolean },
  ) => {
    const preferFresh = Boolean(options?.preferFresh);
    if (!options?.forceRefresh) {
      const cached = getCachedProductDetail(id);
      if (cached?.isFresh) return { data: cached.data };
      if (cached && !preferFresh) {
        void fetchProductDetail(id);
        return { data: cached.data };
      }
      const inflight = productDetailInflight.get(id);
      if (inflight) return inflight;
    }
    return fetchProductDetail(id, Boolean(options?.forceRefresh));
  },
  prefetchById: async (id: string) => {
    await productApi.getById(id);
  },
  create: (
    data: Omit<Product, "id" | "_id" | "rating" | "sold">,
    token: string,
  ) => {
    return axios
      .post(`${API_URL}/products`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .finally(() => {
        clearProductCaches();
      });
  },
  update: (id: string, data: Partial<Product>, token: string) => {
    return axios
      .put(`${API_URL}/products/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .finally(() => {
        clearProductCaches();
      });
  },
  deleteProduct: (id: string, token: string) => {
    return axios
      .delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .finally(() => {
        clearProductCaches();
      });
  },
  uploadProductImage: (formData: FormData, token: string) => {
    return axios.post<{
      imageUrl: string;
      sources?: { avif?: string; webp?: string };
    }>(`${API_URL}/products/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
        "X-Preferred-Image-Format": getPreferredUploadImageFormat(),
      },
    });
  },
  uploadProductVideo: (formData: FormData, token: string) => {
    return axios.post<{ videoUrl: string }>(
      `${API_URL}/products/upload-video`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },
  // chatbot: (message: string, partnerId?: string, token?: string) => {
  //   if (token) {
  //     return axios.post(
  //       `${API_URL}/chatbot`,
  //       { message, partnerId },
  //       { headers: { Authorization: `Bearer ${token}` } },
  //     );
  //   }
  //   return api.post("/chatbot", { message, partnerId });
  // },
  getChatMessages: (token: string, partnerId?: string, sellerId?: string) => {
    return axios.get<ChatMessage[]>(`${API_URL}/chat/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      params: partnerId
        ? sellerId
          ? { partnerId, sellerId }
          : { partnerId }
        : undefined,
    });
  },
  sendChatMessage: (
    text: string,
    token: string,
    partnerId?: string,
    sellerId?: string,
  ) => {
    return axios.post<ChatMessage>(
      `${API_URL}/chat/messages`,
      partnerId
        ? sellerId
          ? { text, partnerId, sellerId }
          : { text, partnerId }
        : { text },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
  getChatConversations: (token: string) => {
    return axios.get<ChatConversation[]>(`${API_URL}/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getDashboardStats: (token: string) => {
    return axios.get(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  createOrder: (
    orderData: {
      orderItems: {
        name: string;
        quantity: number;
        image: string;
        price: number;
        product: string;
      }[];
      totalPrice?: number;
      voucherCode?: string;
      shippingAddress: {
        fullName: string;
        phoneNumber: string;
        addressLine: string;
        isDefault?: boolean;
      };
    },
    token: string,
  ) => {
    return axios.post(`${API_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getMyOrders: (token: string) => {
    return axios.get(`${API_URL}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  cancelOrder: (id: string, token: string) => {
    return axios.put(
      `${API_URL}/orders/${id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },
  getNotifications: (token: string) => {
    return axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  markNotificationAsRead: (id: string, token: string) => {
    return axios.put(
      `${API_URL}/notifications/${id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
  markAllNotificationsAsRead: (token: string) => {
    return axios.put(
      `${API_URL}/notifications/read/all`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
  deleteNotification: (id: string, token: string) => {
    return axios.delete(`${API_URL}/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  deleteReadNotifications: (token: string) => {
    return axios.delete(`${API_URL}/notifications/read`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  createReview: (
    reviewData: {
      rating: number;
      comment: string;
      productId: string;
      images?: string[];
      videos?: string[];
    },
    token: string,
  ) => {
    return axios.post(`${API_URL}/reviews`, reviewData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateReview: (
    reviewId: string,
    reviewData: {
      rating?: number;
      comment?: string;
      images?: string[];
      videos?: string[];
    },
    token: string,
  ) => {
    return axios.put(`${API_URL}/reviews/${reviewId}`, reviewData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  uploadReviewMedia: (formData: FormData, token: string) => {
    return axios.post<{ images: string[]; videos: string[] }>(
      `${API_URL}/reviews/upload-media`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },
  getProductReviews: (productId: string) => {
    return axios.get(`${API_URL}/products/${productId}/reviews`);
  },
  getAllReviews: (token: string) => {
    return axios.get(`${API_URL}/reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getMySellerReviews: (token: string) => {
    return axios.get(`${API_URL}/reviews/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  deleteReview: (id: string, token: string) => {
    return axios.delete(`${API_URL}/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  replyReview: (id: string, message: string, token: string) => {
    return axios.put(
      `${API_URL}/reviews/${id}/reply`,
      { message },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
  addReviewComment: (id: string, message: string, token: string) => {
    return axios.post(
      `${API_URL}/reviews/${id}/comments`,
      { message },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
  getCart: (token: string) => {
    return axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  addToCart: (data: { productId: string; quantity: number }, token: string) => {
    return axios.post(`${API_URL}/cart/add`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateCartItem: (
    productId: string,
    data: { quantity: number },
    token: string,
  ) => {
    return axios.put(`${API_URL}/cart/item/${productId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  removeCartItem: (productId: string, token: string) => {
    return axios.delete(`${API_URL}/cart/item/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  clearCart: (token: string) => {
    return axios.delete(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  becomeSeller: (token: string) => {
    return axios.post(
      `${API_URL}/auth/become-seller`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
  getProfile: (token: string) => {
    return axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateProfile: (
    data: {
      name?: string;
      email?: string;
      username?: string;
      phone?: string;
      gender?: string;
      birthDate?: string;
      avatar?: string;
      shopName?: string;
      shopDescription?: string;
      shopAvatar?: string;
      shopCover?: string;
      shopAddress?: string;
    },
    token: string,
  ) => {
    return axios.put(`${API_URL}/auth/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  changePassword: (
    data: { currentPassword: string; newPassword: string },
    token: string,
  ) => {
    return axios.put(`${API_URL}/auth/password`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getAddresses: (token: string) => {
    return axios.get(`${API_URL}/auth/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  addAddress: (
    data: {
      fullName: string;
      phone: string;
      province: string;
      district: string;
      ward: string;
      street: string;
      isDefault?: boolean;
    },
    token: string,
  ) => {
    return axios.post(`${API_URL}/auth/addresses`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateAddress: (
    id: string,
    data: Partial<{
      fullName: string;
      phone: string;
      province: string;
      district: string;
      ward: string;
      street: string;
      isDefault: boolean;
    }>,
    token: string,
  ) => {
    return axios.put(`${API_URL}/auth/addresses/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  deleteAddress: (id: string, token: string) => {
    return axios.delete(`${API_URL}/auth/addresses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  setDefaultAddress: (id: string, token: string) => {
    return axios.put(
      `${API_URL}/auth/addresses/${id}/default`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },
  uploadAvatar: (formData: FormData, token: string) => {
    return axios.post(`${API_URL}/auth/avatar`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
        "X-Preferred-Image-Format": getPreferredUploadImageFormat(),
      },
    });
  },
  uploadShopAvatar: (formData: FormData, token: string) => {
    return axios.post(`${API_URL}/auth/shop-avatar`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
        "X-Preferred-Image-Format": getPreferredUploadImageFormat(),
      },
    });
  },
  uploadShopCover: (formData: FormData, token: string) => {
    return axios.post(`${API_URL}/auth/shop-cover`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
        "X-Preferred-Image-Format": getPreferredUploadImageFormat(),
      },
    });
  },
  getMyVouchers: (token: string) => {
    return axios.get(`${API_URL}/vouchers/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getShopVouchers: (token: string) => {
    return axios.get(`${API_URL}/vouchers/discover`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getVoucherHistory: (token: string) => {
    return axios.get(`${API_URL}/vouchers/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  addVoucher: (code: string, token: string) => {
    return axios.post(
      `${API_URL}/vouchers/add`,
      { code },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
  healthDb: () => {
    return axios.get(`${API_URL}/health/db`);
  },
  chatbot: async (message: string) => {
    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: message
      });
      return response;
    } catch (error) {
      console.error('Lỗi gọi chatbot:', error);
      throw error;
    }
  }
};

export default api;



