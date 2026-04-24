const Footer = () => {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t-4 border-shopbee-orange pt-12 pb-8">
      <div className="site-container grid grid-cols-1 md:grid-cols-5 gap-8">
        <div>
          <h3 className="font-bold text-xs uppercase mb-4">CHĂM SÓC KHÁCH HÀNG</h3>
          <ul className="text-xs space-y-2 text-gray-500 dark:text-gray-400">
            <li className="hover:text-shopbee-orange cursor-pointer">Trung Tâm Trợ Giúp</li>
            <li className="hover:text-shopbee-orange cursor-pointer">ShopBee Blog</li>
            <li className="hover:text-shopbee-orange cursor-pointer">ShopBee Mall</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Hướng Dẫn Mua Hàng</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Hướng Dẫn Bán Hàng</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Thanh Toán</li>
            <li className="hover:text-shopbee-orange cursor-pointer">ShopBee Xu</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Vận Chuyển</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Trả Hàng & Hoàn Tiền</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Chăm Sóc Khách Hàng</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Chính Sách Bảo Hành</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-xs uppercase mb-4">VỀ ShopBee</h3>
          <ul className="text-xs space-y-2 text-gray-500 dark:text-gray-400">
            <li className="hover:text-shopbee-orange cursor-pointer">Giới Thiệu Về ShopBee Việt Nam</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Tuyển Dụng</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Điều Khoản ShopBee</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Chính Sách Bảo Mật</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Chính Hãng</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Kênh Người Bán</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Flash Sales</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Chương Trình Tiếp Thị Liên Kết ShopBee</li>
            <li className="hover:text-shopbee-orange cursor-pointer">Liên Hệ Với Truyền Thông</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-xs uppercase mb-4">THANH TOÁN</h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Replace with payment icons if available */}
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
          </div>
          <h3 className="font-bold text-xs uppercase mt-6 mb-4">ĐƠN VỊ VẬN CHUYỂN</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
            <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-8"></div>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-xs uppercase mb-4">THEO DÕI CHÚNG TÔI TRÊN</h3>
          <ul className="text-xs space-y-2 text-gray-500 dark:text-gray-400">
            <li className="hover:text-shopbee-orange cursor-pointer flex items-center space-x-2">
              <span>Facebook</span>
            </li>
            <li className="hover:text-shopbee-orange cursor-pointer flex items-center space-x-2">
              <span>Instagram</span>
            </li>
            <li className="hover:text-shopbee-orange cursor-pointer flex items-center space-x-2">
              <span>LinkedIn</span>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-xs uppercase mb-4">TẢI ỨNG DỤNG ShopBee NGAY THÔI</h3>
          <div className="flex space-x-2">
            <div className="w-20 h-20 bg-white dark:bg-slate-900 border shadow p-1">QR Code</div>
            <div className="flex flex-col justify-between">
              <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-6 w-20 text-[8px] flex items-center justify-center">App Store</div>
              <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-6 w-20 text-[8px] flex items-center justify-center">Google Play</div>
              <div className="bg-white dark:bg-slate-900 shadow p-1 border rounded h-6 w-20 text-[8px] flex items-center justify-center">App Gallery</div>
            </div>
          </div>
        </div>
      </div>
      <div className="site-container mt-12 pt-8 border-t border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>&copy; 2026 ShopBee. Tất cả các quyền được bảo lưu.</p>
        <p className="mt-4">Quốc gia & Khu vực: Việt Nam | Singapore | Indonesia | Thái Lan | Malaysia | Đài Loan | Philippines | Brazil | México | Colombia | Chile | Ba Lan</p>
      </div>
    </footer>
  );
};

export default Footer;



