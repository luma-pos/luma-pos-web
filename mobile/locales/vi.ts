/** Bản dịch tiếng Việt (mặc định). Bổ sung key dần khi chuyển chuỗi sang t(). */
export const vi = {
  tabs: { home: "Trang chủ", pos: "Bán hàng", products: "Sản phẩm", customers: "Khách", more: "Thêm" },
  nav: {
    login: "Đăng nhập",
    productDetail: "Chi tiết sản phẩm",
    orderDetail: "Chi tiết đơn hàng",
    customerDetail: "Chi tiết khách hàng",
    supplierDetail: "Chi tiết NCC",
    inventory: "Tồn kho",
    orders: "Đơn hàng",
    reports: "Báo cáo",
    suppliers: "Nhà cung cấp",
    cashbook: "Sổ quỹ",
    productNew: "Thêm sản phẩm",
    productEdit: "Sửa sản phẩm",
    receive: "Nhập hàng",
    stocktake: "Kiểm kho",
    return: "Trả hàng",
  },
  common: {
    search: "Tìm kiếm…",
    retry: "Thử lại",
    loadError: "Lỗi tải dữ liệu",
    empty: "Không có dữ liệu",
    save: "Lưu",
    cancel: "Huỷ",
    confirm: "Xác nhận",
    signOut: "Đăng xuất",
  },
  more: { orders: "Đơn hàng", inventory: "Tồn kho", receive: "Nhập hàng", stocktake: "Kiểm kho", suppliers: "Nhà cung cấp", cashbook: "Sổ quỹ", reports: "Báo cáo", account: "Tài khoản", language: "Ngôn ngữ" },
  pos: { sell: "Bán hàng", quote: "Báo giá", cash: "Tiền mặt", bank: "Chuyển khoản", credit: "Ghi nợ", retailCustomer: "Khách lẻ", total: "Tổng tiền", saveQuote: "Lưu báo giá", collectAndCreate: "Thu tiền & tạo đơn" },
} as const;

export type Dict = typeof vi;
