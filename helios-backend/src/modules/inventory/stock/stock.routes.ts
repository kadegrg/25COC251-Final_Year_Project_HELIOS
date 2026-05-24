import { Router } from 'express';
import {
  queryStockHandler, stockSummaryHandler, stockByLocationHandler, stockByWarehouseHandler,
  stockBySiteHandler, stockBySkuHandler, stockItemHandler, stockItemBySerialHandler,
  receiveStockHandler, moveStockHandler, reserveStockHandler, unreserveStockHandler,
  quarantineStockHandler, releaseQuarantineHandler, writeOffHandler, statusChangeHandler,
} from './stock.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { requireAAL } from '../../../middleware/require-aal.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import {
  receiveStockSchema, moveStockSchema, reserveStockSchema, unreserveStockSchema,
  quarantineStockSchema, releaseQuarantineSchema, writeOffSchema, statusChangeSchema,
} from './stock.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuidParam(...paramNames: string[]) {
  return (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    for (const name of paramNames) {
      const value = req.params[name];
      if (value && !UUID_REGEX.test(value as string)) {
        res.status(400).json({ error: `Invalid UUID for parameter '${name}': ${value}` });
        return;
      }
    }
    next();
  };
}

// ── Query endpoints ──────────────────────────────────
router.get('/', requirePermission(InventoryPermissions.STOCK_READ), queryStockHandler);
router.get('/summary', requirePermission(InventoryPermissions.STOCK_READ), stockSummaryHandler);
router.get('/by-location/:locationId', requireUuidParam('locationId'), requirePermission(InventoryPermissions.STOCK_READ), stockByLocationHandler);
router.get('/by-warehouse/:warehouseId', requireUuidParam('warehouseId'), requirePermission(InventoryPermissions.STOCK_READ), stockByWarehouseHandler);
router.get('/by-site/:siteId', requireUuidParam('siteId'), requirePermission(InventoryPermissions.STOCK_READ), stockBySiteHandler);
router.get('/by-sku/:skuId', requireUuidParam('skuId'), requirePermission(InventoryPermissions.STOCK_READ), stockBySkuHandler);
// NOTE: /items/serial/:serialNumber must be declared before /items/:stockItemId to avoid param shadowing
router.get('/items/serial/:serialNumber', requirePermission(InventoryPermissions.STOCK_READ), stockItemBySerialHandler);
router.get('/items/:stockItemId', requireUuidParam('stockItemId'), requirePermission(InventoryPermissions.STOCK_READ), stockItemHandler);

// ── Operational endpoints ────────────────────────────
router.post('/receive', validate({ body: receiveStockSchema }), requirePermission(InventoryPermissions.STOCK_RECEIVE), receiveStockHandler);
router.post('/move', validate({ body: moveStockSchema }), requirePermission(InventoryPermissions.STOCK_MOVE), moveStockHandler);
router.post('/reserve', validate({ body: reserveStockSchema }), requirePermission(InventoryPermissions.STOCK_RESERVE), reserveStockHandler);
router.post('/unreserve', validate({ body: unreserveStockSchema }), requirePermission(InventoryPermissions.STOCK_UNRESERVE), unreserveStockHandler);
router.post('/quarantine', validate({ body: quarantineStockSchema }), requirePermission(InventoryPermissions.STOCK_MOVE), quarantineStockHandler);
router.post('/release-quarantine', validate({ body: releaseQuarantineSchema }), requirePermission(InventoryPermissions.STOCK_MOVE), releaseQuarantineHandler);
router.post('/write-off', validate({ body: writeOffSchema }), requireAAL(2), requirePermission(InventoryPermissions.STOCK_ADJUST), writeOffHandler);
router.post('/status-change', validate({ body: statusChangeSchema }), requirePermission(InventoryPermissions.STOCK_MOVE), statusChangeHandler);

export { router as stockRoutes };

