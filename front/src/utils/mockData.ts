export interface Product {
  id: number | string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  rating: number;
  sold: number;
  category: string;
  isMall?: boolean;
  stock?: number;
  seller?: string;
  description?: string;
}

export const CATEGORIES = [
  { id: 1, name: "Thời Trang Nam", icon: "👕" },
  { id: 2, name: "Điện Thoại & Phụ Kiện", icon: "📱" },
  { id: 3, name: "Thiết Bị Điện Tử", icon: "💻" },
  { id: 4, name: "Máy Tính & Laptop", icon: "🖥️" },
  { id: 5, name: "Máy Ảnh - Máy Quay Phim", icon: "📷" },
  { id: 6, name: "Đồng Hồ", icon: "⌚" },
  { id: 7, name: "Giày Dép Nam", icon: "👞" },
  { id: 8, name: "Thiết Bị Gia Dụng", icon: "🔌" },
  { id: 9, name: "Thể Thao & Du Lịch", icon: "⚽" },
  { id: 10, name: "Ô Tô - Xe Máy - Xe Đạp", icon: "🚗" },
];

export const PRODUCTS: Product[] = [
  // Để trống: không còn sản phẩm mẫu tĩnh ở frontend.
];



