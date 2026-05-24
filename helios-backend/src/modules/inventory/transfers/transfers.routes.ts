import { Router } from 'express';
import {
  listTransfersHandler, getTransferHandler, createTransferHandler,
  approveTransferHandler, dispatchTransferHandler, receiveTransferHandler,
  reconcileTransferHandler, cancelTransferHandler,
  getDiscrepanciesHandler, addDiscrepancyHandler,
} from './transfers.controller.js';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { requireAAL } from '../../../middleware/require-aal.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { createTransferSchema, transferIdParamSchema, receiveTransferSchema, createDiscrepancySchema } from './transfers.schemas.js';
import { InventoryPermissions } from '../inventory.permissions.js';

const router = Router();
router.use(authenticate, requireActiveUser);

router.get('/', requirePermission(InventoryPermissions.STOCK_READ), listTransfersHandler);
router.get('/:transferId', validate({ params: transferIdParamSchema }), requirePermission(InventoryPermissions.STOCK_READ), getTransferHandler);
router.post('/', validate({ body: createTransferSchema }), requirePermission(InventoryPermissions.TRANSFER_REQUEST), createTransferHandler);
router.post('/:transferId/approve', validate({ params: transferIdParamSchema }), requireAAL(2), requirePermission(InventoryPermissions.TRANSFER_APPROVE), approveTransferHandler);
router.post('/:transferId/dispatch', validate({ params: transferIdParamSchema }), requirePermission(InventoryPermissions.TRANSFER_DISPATCH), dispatchTransferHandler);
router.post('/:transferId/receive', validate({ params: transferIdParamSchema, body: receiveTransferSchema }), requirePermission(InventoryPermissions.TRANSFER_RECEIVE), receiveTransferHandler);
router.post('/:transferId/reconcile', validate({ params: transferIdParamSchema }), requireAAL(2), requirePermission(InventoryPermissions.TRANSFER_RECONCILE), reconcileTransferHandler);
router.post('/:transferId/cancel', validate({ params: transferIdParamSchema }), requirePermission(InventoryPermissions.TRANSFER_REQUEST), cancelTransferHandler);
router.get('/:transferId/discrepancies', validate({ params: transferIdParamSchema }), requirePermission(InventoryPermissions.STOCK_READ), getDiscrepanciesHandler);
router.post('/:transferId/discrepancies', validate({ params: transferIdParamSchema, body: createDiscrepancySchema }), requirePermission(InventoryPermissions.TRANSFER_RECONCILE), addDiscrepancyHandler);

export { router as transfersRoutes };

