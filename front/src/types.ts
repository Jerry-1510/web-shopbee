export interface ProductOptionGroup {
  name: string;
  values: string[];
}

export interface ProductDetailSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  images?: string[];
  videos?: string[];
  rating: number;
  sold: number;
  category: string;
  isMall?: boolean;
  stock?: number;
  description?: string;
  shopName?: string;
  shopDescription?: string;
  shopAvatar?: string;
  shopCover?: string;
  shopAddress?: string;
  sellerId?: string;
  optionGroups?: ProductOptionGroup[];
  detailSpecs?: ProductDetailSpec[];
  selectedOptions?: Record<string, string>;
  variantSummary?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: "order" | "promotion" | "system" | "review" | "chat";
  link?: string;
}

export interface Review {
  _id: string;
  user?: string;
  userAvatar?: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  product?:
    | string
    | { _id: string; name: string; image?: string; seller?: string };
  images?: string[];
  videos?: string[];
  sellerReply?: {
    message: string;
    sellerId?: string;
    sellerName?: string;
    repliedAt?: string;
  };
  comments?: Array<{
    _id?: string;
    userId?: string;
    userName: string;
    userAvatar?: string;
    role?: "user" | "seller" | "admin";
    message: string;
    createdAt: string;
  }>;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "customer" | "seller";
  createdAt: string;
  isRead: boolean;
  isAI?: boolean;
  sellerReadAt?: string | null;
  userReadAt?: string | null;
  customerId?: string;
  sellerId?: string;
}

export interface ChatConversation {
  partnerId: string;
  sellerId?: string;
  name: string;
  email: string;
  avatar?: string;
  lastMessage: string;
  lastSender: "customer" | "seller";
  lastAt: string;
  unreadCount: number;
}



