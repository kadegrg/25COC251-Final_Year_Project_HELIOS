import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth } from '@/components/auth/guards';
import { LoginPage } from '@/pages/login';
import { ForgotPasswordPage } from '@/pages/forgot-password';
import { ResetPasswordPage } from '@/pages/reset-password';
import { StepUpPage } from '@/pages/step-up';
import { DashboardPage } from '@/pages/dashboard';
import { ProfilePage } from '@/pages/profile/profile';
import { ChangePasswordPage } from '@/pages/profile/change-password';
import { MfaPage } from '@/pages/profile/mfa';
import { SessionsPage } from '@/pages/profile/sessions';
import { PlaceholderPage } from '@/pages/placeholder';
import { ErrorPage } from '@/components/ui/error-page';
import { ComponentLibraryPage } from '@/pages/component-library';
import { InventoryStructurePage } from '@/pages/inventory-structure/index';
import { SitesListPage } from '@/pages/inventory-structure/sites-list';
import { SiteDetailPage } from '@/pages/inventory-structure/site-detail';
import { CreateSitePage, EditSitePage } from '@/pages/inventory-structure/site-form';
import { WarehousesListPage } from '@/pages/inventory-structure/warehouses-list';
import { WarehouseDetailPage } from '@/pages/inventory-structure/warehouse-detail';
import { CreateWarehousePage, EditWarehousePage } from '@/pages/inventory-structure/warehouse-form';
import { LocationsListPage } from '@/pages/inventory-structure/locations-list';
import { LocationDetailPage } from '@/pages/inventory-structure/location-detail';
import { CreateLocationPage, EditLocationPage } from '@/pages/inventory-structure/location-form';
import { LocationTreePage } from '@/pages/inventory-structure/location-tree';
import { UsersListPage } from '@/pages/iam/users-list';
import { CreateUserPage } from '@/pages/iam/create-user';
import { UserDetailPage } from '@/pages/iam/user-detail';
import { RolesListPage } from '@/pages/iam/roles-list';
import { CreateRolePage } from '@/pages/iam/create-role';
import { RoleDetailPage } from '@/pages/iam/role-detail';
import { PermissionsListPage } from '@/pages/iam/permissions-list';
import { CatalogueIndexPage } from '@/pages/catalogue/index';
import { CategoriesListPage } from '@/pages/catalogue/categories-list';
import { AttributesListPage } from '@/pages/catalogue/attributes-list';
import { SkusListPage } from '@/pages/catalogue/skus-list';
import { SkuCreatePage } from '@/pages/catalogue/sku-create';
import { SkuDetailPage } from '@/pages/catalogue/sku-detail';
import { SkuEditPage } from '@/pages/catalogue/sku-edit';
import { StockListPage } from '@/pages/stock-movements/stock-list';
import { StockSummaryPage } from '@/pages/stock-movements/stock-summary';
import { StockBySitePage, StockByWarehousePage, StockByLocationPage, StockBySkuPage } from '@/pages/stock-movements/stock-by-entity';
import { StockItemDetailPage } from '@/pages/stock-movements/stock-item-detail';
import { SerialLookupPage } from '@/pages/stock-movements/serial-lookup';
import { ReceiveStockPage } from '@/pages/stock-movements/action-receive';
import { MoveStockPage } from '@/pages/stock-movements/action-move';
import { ReserveStockPage } from '@/pages/stock-movements/action-reserve';
import { UnreserveStockPage } from '@/pages/stock-movements/action-unreserve';
import { QuarantineStockPage } from '@/pages/stock-movements/action-quarantine';
import { ReleaseQuarantinePage } from '@/pages/stock-movements/action-release-quarantine';
import { WriteOffStockPage } from '@/pages/stock-movements/action-write-off';
import { StatusChangePage } from '@/pages/stock-movements/action-status-change';
import { MovementsListPage } from '@/pages/stock-movements/movements-list';
import { MovementDetailPage } from '@/pages/stock-movements/movement-detail';
import { AuditEventsPage } from '@/pages/stock-movements/audit-events';
import { ImportsListPage } from '@/pages/stock-movements/imports-list';
import { ImportDetailPage } from '@/pages/stock-movements/import-detail';
import { ImportNewPage } from '@/pages/stock-movements/import-new';
import { ReportsIndexPage } from '@/pages/stock-movements/reports-index';
import { LowStockReportPage, NegativeStockReportPage, DiscrepanciesReportPage, ReservedVsAvailableReportPage, RecentAdjustmentsReportPage, CycleCountVarianceReportPage } from '@/pages/stock-movements/report-pages';
import { TransfersListPage } from '@/pages/transfers/transfers-list';
import { TransferDetailPage } from '@/pages/transfers/transfer-detail';
import { TransferCreatePage } from '@/pages/transfers/transfer-create';
import { AdjustmentsListPage } from '@/pages/adjustments/adjustments-list';
import { AdjustmentDetailPage } from '@/pages/adjustments/adjustment-detail';
import { AdjustmentCreatePage } from '@/pages/adjustments/adjustment-create';
import { PluginsListPage } from '@/pages/plugins/plugins-list';
import { PluginDetailPage } from '@/pages/plugins/plugin-detail';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/step-up', element: <StepUpPage /> },
  { path: '/403', element: <ErrorPage status={403} /> },
  { path: '/404', element: <ErrorPage status={404} /> },

  // Protected routes
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },

      // Profile & Auth
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/password', element: <ChangePasswordPage /> },
      { path: 'profile/mfa', element: <MfaPage /> },
      { path: 'profile/sessions', element: <SessionsPage /> },

      // Inventory — Structure
      { path: 'inventory/structure', element: <InventoryStructurePage /> },
      { path: 'inventory/structure/sites', element: <SitesListPage /> },
      { path: 'inventory/structure/sites/new', element: <CreateSitePage /> },
      { path: 'inventory/structure/sites/:siteId', element: <SiteDetailPage /> },
      { path: 'inventory/structure/sites/:siteId/edit', element: <EditSitePage /> },
      { path: 'inventory/structure/warehouses', element: <WarehousesListPage /> },
      { path: 'inventory/structure/warehouses/new', element: <CreateWarehousePage /> },
      { path: 'inventory/structure/warehouses/:warehouseId', element: <WarehouseDetailPage /> },
      { path: 'inventory/structure/warehouses/:warehouseId/edit', element: <EditWarehousePage /> },
      { path: 'inventory/structure/locations', element: <LocationsListPage /> },
      { path: 'inventory/structure/locations/tree', element: <LocationTreePage /> },
      { path: 'inventory/structure/locations/new', element: <CreateLocationPage /> },
      { path: 'inventory/structure/locations/:locationId', element: <LocationDetailPage /> },
      { path: 'inventory/structure/locations/:locationId/edit', element: <EditLocationPage /> },

      // Inventory — Catalogue
      { path: 'inventory/catalogue', element: <CatalogueIndexPage /> },
      { path: 'inventory/catalogue/categories', element: <CategoriesListPage /> },
      { path: 'inventory/catalogue/attributes', element: <AttributesListPage /> },
      { path: 'inventory/catalogue/skus', element: <SkusListPage /> },
      { path: 'inventory/catalogue/skus/new', element: <SkuCreatePage /> },
      { path: 'inventory/catalogue/skus/:skuId', element: <SkuDetailPage /> },
      { path: 'inventory/catalogue/skus/:skuId/edit', element: <SkuEditPage /> },

      // Inventory — Stock
      { path: 'inventory/stock', element: <StockListPage /> },
      { path: 'inventory/stock/summary', element: <StockSummaryPage /> },
      { path: 'inventory/stock/by-site/:siteId', element: <StockBySitePage /> },
      { path: 'inventory/stock/by-warehouse/:warehouseId', element: <StockByWarehousePage /> },
      { path: 'inventory/stock/by-location/:locationId', element: <StockByLocationPage /> },
      { path: 'inventory/stock/by-sku/:skuId', element: <StockBySkuPage /> },
      { path: 'inventory/stock/items/:stockItemId', element: <StockItemDetailPage /> },
      { path: 'inventory/stock/serial-lookup', element: <SerialLookupPage /> },
      { path: 'inventory/stock/receive', element: <ReceiveStockPage /> },
      { path: 'inventory/stock/move', element: <MoveStockPage /> },
      { path: 'inventory/stock/reserve', element: <ReserveStockPage /> },
      { path: 'inventory/stock/unreserve', element: <UnreserveStockPage /> },
      { path: 'inventory/stock/quarantine', element: <QuarantineStockPage /> },
      { path: 'inventory/stock/release-quarantine', element: <ReleaseQuarantinePage /> },
      { path: 'inventory/stock/write-off', element: <WriteOffStockPage /> },
      { path: 'inventory/stock/status-change', element: <StatusChangePage /> },

      // Inventory — Movements
      { path: 'inventory/movements', element: <MovementsListPage /> },
      { path: 'inventory/movements/:movementId', element: <MovementDetailPage /> },

      // Inventory — Audit Events
      { path: 'inventory/audit-events', element: <AuditEventsPage /> },

      // Inventory — Imports
      { path: 'inventory/imports', element: <ImportsListPage /> },
      { path: 'inventory/imports/new', element: <ImportNewPage /> },
      { path: 'inventory/imports/:importJobId', element: <ImportDetailPage /> },

      // Inventory — Reports
      { path: 'inventory/reports', element: <ReportsIndexPage /> },
      { path: 'inventory/reports/low-stock', element: <LowStockReportPage /> },
      { path: 'inventory/reports/negative-stock', element: <NegativeStockReportPage /> },
      { path: 'inventory/reports/discrepancies', element: <DiscrepanciesReportPage /> },
      { path: 'inventory/reports/reserved-vs-available', element: <ReservedVsAvailableReportPage /> },
      { path: 'inventory/reports/recent-adjustments', element: <RecentAdjustmentsReportPage /> },
      { path: 'inventory/reports/cycle-count-variance', element: <CycleCountVarianceReportPage /> },

      // Inventory — Transfers
      { path: 'inventory/transfers', element: <TransfersListPage /> },
      { path: 'inventory/transfers/new', element: <TransferCreatePage /> },
      { path: 'inventory/transfers/:transferId', element: <TransferDetailPage /> },

      // Inventory — Adjustments
      { path: 'inventory/adjustments', element: <AdjustmentsListPage /> },
      { path: 'inventory/adjustments/new', element: <AdjustmentCreatePage /> },
      { path: 'inventory/adjustments/:adjustmentId', element: <AdjustmentDetailPage /> },

      // IAM
      { path: 'iam/users', element: <UsersListPage /> },
      { path: 'iam/users/new', element: <CreateUserPage /> },
      { path: 'iam/users/:userId', element: <UserDetailPage /> },
      { path: 'iam/roles', element: <RolesListPage /> },
      { path: 'iam/roles/new', element: <CreateRolePage /> },
      { path: 'iam/roles/:roleId', element: <RoleDetailPage /> },
      { path: 'iam/permissions', element: <PermissionsListPage /> },

      // Plugins
      { path: 'system/plugins', element: <PluginsListPage /> },
      { path: 'system/plugins/:pluginId', element: <PluginDetailPage /> },

      // Settings
      { path: 'settings', element: <PlaceholderPage title="Settings" /> },

      // Internal: Component Library preview
      { path: 'dev/components', element: <ComponentLibraryPage /> },

      // Catch-all 404
      { path: '*', element: <ErrorPage status={404} /> },
    ],
  },
]);
