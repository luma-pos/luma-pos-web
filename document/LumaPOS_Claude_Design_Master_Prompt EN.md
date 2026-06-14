## STEP 1 - LumaPOS Project Initialization

You are a Principal Product Manager, Principal UX Designer, Flutter Architect, Enterprise Solution Architect, and AI Product Designer.

Design a system called **LumaPOS**.

LumaPOS is an intelligent, AI-integrated Point of Sale (POS) management platform tailored for individual retailers, small shops, and medium-sized enterprises.

**Objectives:**
* Support Web Admin.
* Support Android.
* Support iPhone.
* Support Tablet POS.
* Scalable and extensible for future expansion.
* Optimized specifically for Flutter development.

**Core Principles:**
* Simplicity.
* Modernity.
* Low learning curve (Easy to learn).
* High-speed operations (Fast execution).
* Offline-first capability.
* Seamless cloud synchronization when internet connection is restored.
* **Native Multi-language Support:** Built-in bilingual (English & Vietnamese) core architecture with an intuitive UI switcher toggle.

**Deliverables to create:**
1. Product Vision
2. Product Goals
3. User Personas
4. Product Map
5. Information Architecture (IA)
6. User Flows
7. A comprehensive list of required screens.

*Note: Do not generate UI layouts at this stage.*

---

## STEP 2 - Multi-Industry Architectural Design

Design LumaPOS using a modular architecture.

**Shared Core Modules:**
* POS (Point of Sale)
* Products
* Inventory
* Invoices / Receipts
* Customers (CRM)
* Reports & Analytics
* AI Assistant
* Settings

**The system must support multiple industries & verticals:**
* Grocery Stores
* Mini-marts / Convenience Stores
* Fashion & Apparel
* Cosmetics & Beauty
* Bookstores
* Electronics & Appliances
* Restaurants
* Cafes & Coffee Shops
* Service-based Businesses
* Pet Shops
* Mobile Phone & Gadget Stores
* Construction & Building Materials

When creating a new store, the user selects their business industry. 

**LumaPOS will automatically:**
* Toggle (Enable/Disable) relevant modules.
* Adapt the User Interface (UI).
* Adjust data fields and schemas.
* Calibrate business workflows accordingly.

Design an open architecture to easily onboard new industries in the future.

---

## STEP 3 - Design System Specifications

Create a comprehensive Design System for LumaPOS.

**System Requirements:**
* Material Design 3 compliance.
* 8pt Grid system.
* 16px Border Radius (Large corner rounding).
* Modern Typography scale.
* Modern Card designs with ample whitespace.
* Responsive layout system (Web, Tablet, Mobile layouts).
* Native Light Mode and Dark Mode support.
* **Localization-Ready UI Constraints:** Components (Cards, Tables, Buttons, Flex boxes) must feature dynamic width/height expansion to smoothly accommodate text length variations between English and Vietnamese (Vietnamese strings are 30-40% longer) without clipping text or breaking layouts.

**Components & Tokens to include:**
* Color Palette & Design Tokens
* Typography Scale
* Buttons (Elevated, Filled, Tonal, Outlined, Text)
* Text Fields & Input Forms
* Search Bars
* Cards & Containers
* Data Tables
* Charts & Data Visualizations
* Dialogs & Modals
* Bottom Sheets
* Navigation Elements (Navbar, Rail, Drawer)
* Toasts & Snackbars
* Empty States
* Loading States
* Error States
* Iconography
* Elevation & Shadow tokens
* Micro-interactions & Animations

Ensure the design system is fully optimized for native Flutter widgets.

---

## STEP 4 - Wireframing

Create Low-Fidelity (Lo-fi) Wireframes for the entire ecosystem.

**Required Screens/Views:**
* Splash Screen
* Login / Authentication
* Main Dashboard
* POS Terminal
* Product List
* Product Details
* Stock Inbound (Goods Receipt)
* Stock Outbound (Goods Issue)
* Inventory Management
* Invoices & Transaction History
* Customer Management
* Reports & Analytics
* AI Assistant Chat Interface
* AI Inventory Smart Panel
* System Settings

*Focus heavily on UX flows, spacing, and structural layouts.*

---

## STEP 5 - High-Fidelity UI Generation

Transform all Lo-fi Wireframes into High-Fidelity (Hi-fi) User Interfaces.

**Design Guidelines:**
* Modern, premium, and minimalist aesthetics.
* Strict adherence to Material Design 3.
* Fully responsive adaptation across form factors.
* Visually striking cards with large corner radiuses.
* Subtle, fluid micro-animations.
* Multi-platform compliance: Web, Tablet, Android, and iPhone.

*Deliver an original, bespoke design without copying any existing products on the market.*

---

## STEP 6 - POS Screen Optimization & Bilingual Presentation

Design a highly optimized POS checkout terminal interface tailored for cashiers.

**Bilingual Visual Hierarchy Requirements:**
* For all core UI components, titles, and data tables, display text elements in both languages simultaneously for preview purposes using an elegant layout format: `"English Title / Tiếng Việt"` or `"English (Vietnamese Subtext)"`.
* Use distinct typography weight and color opacity to ensure clean readability (e.g., Charcoal 100% for English, Slate 60% with italic text for Vietnamese subtext) to maintain a premium, clean layout.

**Left-Hand Panel Layout:**
* Global Search Bar
* Barcode / QR Code Scanner Input
* Category Shortcuts
* Product Grid/List View
* Best-Sellers / Top Items Quick Access

**Right-Hand Panel Layout (Checkout/Cart):**
* Active Cart / Order List
* Quantity Selectors (Increment/Decrement controls)
* Item Notes / Modifiers
* Discounts & Promotions Input
* Order Total / Summary

**Payment Processing:**
* Cash / Tiền mặt
* Dynamic QR Code Payment / Quét mã QR
* Bank Transfer / Chuyển khoản
* Credit & Debit Cards / Thẻ ngân hàng

**Post-Purchase Workflow:**
* Print Physical Receipt / In hóa đơn
* Share Digital Invoice / Chia sẻ hóa đơn (SMS/Zalo/Email)
* Save Order / Giữ giỏ hàng

**Ultimate Goal:** Complete any standard transaction within a maximum of **3 core actions**.

---

## STEP 7 - Product Management Module

Design the Product Management interface.

**Each product profile must include:**
* SKU
* Barcode
* QR Code
* Product Name / Tên sản phẩm
* Product Image Gallery
* Cost Price / Giá vốn
* Selling Price / Giá bán
* Category / Danh mục
* Supplier / Nhà cung cấp
* Unit of Measurement (UoM) / Đơn vị tính
* Current Stock Level / Tồn kho hiện tại
* Minimum Stock Level / Tồn tối thiểu (Safety Stock Alert)
* Status / Trạng thái (Active/Draft/Archived)

Support advanced global search, multi-layered filtering, and inline quick edits. Allow data model expansion to support variants (e.g., color, size, attributes) if required by the industry.

---

## STEP 8 - Inventory Management Module

Design the Inventory/Warehouse module.

**Core Features:**
* Stock Inbound / Nhập hàng (Goods Procurement)
* Stock Outbound / Xuất hàng (Internal Usage/Damage Write-off)
* Stock Adjustment / Điều chỉnh tồn (Manual Corrections)
* Stocktaking / Kiểm kho (Inventory Auditing)
* Inventory Transaction Logs / Nhật ký kho (Audit Trail)

**Inventory Dashboard Widgets:**
* Total Inventory Value / Tổng giá trị tồn kho
* Low-Stock Alerts / Sắp hết hàng
* Stagnant Stock / Tồn kho lâu ngày (High Days-on-Hand)
* Slow-Moving Items / Hàng bán chậm

*Keep the data visualization clean, intuitive, and highly actionable.*

---

## STEP 9 - AI Assistant Integration

Design an embedded conversational AI Assistant within the LumaPOS workspace.

**Users should be able to ask natural language queries such as:**
* *“How much did we sell today? / Hôm nay bán được bao nhiêu?”*
* *“What does our revenue look like this week? / Doanh thu tuần này thế nào?”*
* *“Which items are our top best-sellers? / Mặt hàng nào bán chạy nhất?”*
* *“Which items are slow-moving? / Mặt hàng nào bán chậm?”*
* *“What stock has been sitting in the warehouse for too long? / Hàng nào tồn kho lâu quá?”*
* *“Which products are running low on stock? / Sản phẩm nào sắp hết hàng?”*
* *“What should I restock/order today? / Hôm nay nên nhập thêm hàng gì?”*

The AI must respond using natural language processing (NLP) seamlessly combined with interactive tables and charts where applicable.

---

## STEP 10 - AI Inventory Smart Restocking

Design the **AI Inventory** forecasting module.

**The AI engine must perform the following core logic:**
* Analyze historical sales data and seasonal trends.
* Calculate the average daily sales velocity per item.
* Forecast the remaining "Days of Stock" (Runway time).
* Generate automated smart restock quantity recommendations.
* Assign restock priority levels: **High (Cao)**, **Medium (Trung bình)**, **Low (Thấp)**.

**Interactive Data Table Specifications (Bilingual Headers):**
* Product Info / Sản phẩm
* Current Stock On Hand / Tồn hiện tại
* Average Daily Sales Velocity / Tốc độ bán trung bình ngày
* Estimated Days of Stock Remaining / Số ngày đủ bán dự kiến
* AI Suggested Restock Quantity / Đề xuất số lượng nhập từ AI
* Priority Badge / Mức độ ưu tiên

**Actionable Controls:**
* Generate Purchase Order (PO) Button / Tạo phiếu nhập hàng
* Edit Recommendation Manual Override / Chỉnh sửa nhanh
* Export to PDF / Xuất file PDF
* Export to Excel / Xuất file Excel

---

## STEP 11 - Executive Dashboard & Analytics

Design an administrative Executive Dashboard.

**Key Performance Indicators (KPIs) to display (Bilingual Presentation):**
* Today's Revenue / Doanh thu hôm nay
* Weekly Revenue / Doanh thu tuần
* Monthly Revenue / Doanh thu tháng
* Net Profit Margin / Lợi nhuận ròng
* Top Performing Products / Top sản phẩm bán chạy
* Slow-Moving Dead Stock / Hàng hóa bán chậm
* Low-Stock Critical Alerts / Cảnh báo tồn kho nguy hiểm
* AI-Generated Business Insights / Phân tích thông minh từ AI (e.g., "Sales increased by 15% / Doanh số tăng 15%")

**Data Visualizations & Charts:**
* Revenue Breakdown Trend lines (With dual legends: "Revenue / Doanh thu")
* Profit Margin Distributions
* Inventory Turnover Ratios
* Sales Forecasting and Velocity Trends (With dynamic X/Y axis labels: "Jan / Thg 1", "Feb / Thg 2"...)

*All dashboard widgets must support drag-and-drop structural layout customization.*

---

## STEP 12 - Flutter Developer Handoff Preparation

Evaluate the finalized design system and UI flows from the perspective of a Principal Flutter Architect.

**Architectural Blueprint Deliverables:**
* Feature-First Directory Structure mapping.
* Clean Architecture domain segregation layers.
* Reusable UI Component mapping definitions.
* Native Material 3 Widget implementation mappings.
* Responsive Layout strategy (LayoutBuilder, Breakpoints).
* Design Tokens conversion maps (Colors, Spacing, Typography).
* Micro-interaction and Motion animation curves.
* Accessibility & Localization guidelines (Intl package integration mapping, Semantics, Minimum contrast).

Prepare a strict developer handoff package so the Flutter engineering team can implement the designs directly without ambiguity.

**Future Extension Codebase Scaling Strategy:**
Propose a source-code architectural blueprint that cleanly isolates core functions to easily accommodate future enterprise expansions:
* Multi-branch & Multi-warehouse support
* Advanced CRM Engine
* Voucher & Promotion Engines
* Customer Loyalty Programs
* Advanced Predictive AI Models
* Real-time Cloud Synchronization
* Granular Role-Based Access Control (RBAC)

---

### Post-12 Step Execution Checklist:
* Generate a clickable, fully interactive prototype.
* Audit the entire UX ecosystem to ruthlessly eliminate redundant clicks and friction.
* Ensure the high-speed checkout flow remains frictionless and consistent across Web, Tablet, and Mobile layouts.
* Prioritize long-term enterprise scalability while maintaining a clean, accessible interface for small individual operators.