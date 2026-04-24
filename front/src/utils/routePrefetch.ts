type RoutePrefetchKey =
  | "home"
  | "productDetail"
  | "cart"
  | "checkout"
  | "shop"
  | "notifications"
  | "account"
  | "orders"
  | "vouchers"
  | "adminLayout"
  | "adminDashboard"
  | "adminProductList"
  | "adminProductForm"
  | "adminReviewList"
  | "adminChat"
  | "adminShopProfile";

const routeImporters: Record<RoutePrefetchKey, () => Promise<unknown>> = {
  home: () => import("../pages/Home"),
  productDetail: () => import("../pages/ProductDetail"),
  cart: () => import("../pages/Cart"),
  checkout: () => import("../pages/Checkout"),
  shop: () => import("../pages/ShopHome"),
  notifications: () => import("../pages/Notifications"),
  account: () => import("../pages/Account"),
  orders: () => import("../pages/Orders"),
  vouchers: () => import("../pages/Vouchers"),
  adminLayout: () => import("../pages/admin/AdminLayout"),
  adminDashboard: () => import("../pages/admin/AdminDashboard"),
  adminProductList: () => import("../pages/admin/AdminProductList"),
  adminProductForm: () => import("../pages/admin/AdminProductForm"),
  adminReviewList: () => import("../pages/admin/AdminReviewList"),
  adminChat: () => import("../pages/admin/AdminChat"),
  adminShopProfile: () => import("../pages/admin/AdminShopProfile"),
};

const prefetchedRoutes = new Set<RoutePrefetchKey>();

const runIdleTask = (task: () => void) => {
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;

  if (ric) {
    ric(task, { timeout: 1200 });
    return;
  }
  window.setTimeout(task, 180);
};

const isSlowConnection = () => {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const connection = nav.connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return /(^|-)2g/.test(connection.effectiveType || "");
};

export const prefetchRoute = (key: RoutePrefetchKey) => {
  if (prefetchedRoutes.has(key)) return;
  prefetchedRoutes.add(key);
  void routeImporters[key]().catch(() => {
    prefetchedRoutes.delete(key);
  });
};

export const prefetchRouteByPath = (path: string) => {
  if (!path) return;
  if (path === "/") prefetchRoute("home");
  else if (path.startsWith("/product/")) prefetchRoute("productDetail");
  else if (path === "/cart") prefetchRoute("cart");
  else if (path === "/checkout") prefetchRoute("checkout");
  else if (path === "/shop") prefetchRoute("shop");
  else if (path === "/notifications") prefetchRoute("notifications");
  else if (path === "/account") prefetchRoute("account");
  else if (path === "/orders") prefetchRoute("orders");
  else if (path === "/vouchers") prefetchRoute("vouchers");
  else if (path.startsWith("/admin/dashboard")) {
    prefetchRoute("adminLayout");
    prefetchRoute("adminDashboard");
  } else if (path.startsWith("/admin/products/new")) {
    prefetchRoute("adminLayout");
    prefetchRoute("adminProductForm");
  } else if (path.startsWith("/admin/products/edit/")) {
    prefetchRoute("adminLayout");
    prefetchRoute("adminProductForm");
  } else if (path.startsWith("/admin/products")) {
    prefetchRoute("adminLayout");
    prefetchRoute("adminProductList");
  } else if (path.startsWith("/admin/reviews")) {
    prefetchRoute("adminLayout");
    prefetchRoute("adminReviewList");
  } else if (path.startsWith("/admin/chat")) {
    prefetchRoute("adminLayout");
    prefetchRoute("adminChat");
  } else if (path.startsWith("/admin/shop-profile")) {
    prefetchRoute("adminLayout");
    prefetchRoute("adminShopProfile");
  } else if (path.startsWith("/admin")) {
    prefetchRoute("adminLayout");
    prefetchRoute("adminDashboard");
  }
};

export const prefetchLikelyRoutes = (currentPath: string) => {
  if (isSlowConnection()) return;

  const queue: RoutePrefetchKey[] = [];

  if (currentPath === "/") {
    queue.push("productDetail", "cart", "shop");
  } else if (currentPath.startsWith("/product/")) {
    queue.push("cart", "checkout", "home");
  } else if (currentPath === "/cart") {
    queue.push("checkout", "home");
  } else if (currentPath === "/checkout") {
    queue.push("orders", "home");
  } else if (
    currentPath === "/account" ||
    currentPath === "/orders" ||
    currentPath === "/vouchers" ||
    currentPath === "/notifications"
  ) {
    queue.push("account", "orders", "vouchers", "notifications");
  } else if (currentPath.startsWith("/admin")) {
    queue.push(
      "adminLayout",
      "adminDashboard",
      "adminProductList",
      "adminProductForm",
      "adminChat",
      "adminReviewList",
      "adminShopProfile",
    );
  } else {
    queue.push("home", "productDetail", "cart");
  }

  runIdleTask(() => {
    queue.forEach((key) => prefetchRoute(key));
  });
};



