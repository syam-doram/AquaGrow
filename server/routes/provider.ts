/**
 * Provider API Routes — /api/provider/*
 * All data reads/writes go to the separate aquagrow_providers database.
 * Authentication uses the shared JWT from the farmer DB auth flow.
 * Role guard: every route requires req.user.role === 'provider'.
 */

import { Router } from 'express';
import {
  isProviderDbReady,
  ProviderProfile,
  ProviderInventory,
  ProviderOrder,
  ProviderRateCard,
  ProviderChat,
  ProviderLedger,
  ProviderFarmerLink,
} from '../providerDb.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ── DB Guard ─────────────────────────────────────────────────────────────────
const dbGuard = (res: any) =>
  res.status(503).json({ error: 'Provider database unavailable. Please try again.' });

const providerOnly = [authenticate, requireRole('provider')];

// ═══════════════════════════════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/provider/profile — fetch or auto-create profile */
router.get('/profile', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    let profile = await ProviderProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await new ProviderProfile({
        userId: req.user.id,
        companyName: req.user.name || 'My Company',
        ownerName: req.user.name || '',
        phone: req.user.phoneNumber || '',
      }).save();
    }
    res.json(profile);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** PATCH /api/provider/profile — update profile fields */
router.patch('/profile', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const profile = await ProviderProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/provider/inventory */
router.get('/inventory', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const items = await ProviderInventory.find({ providerId: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** POST /api/provider/inventory — add item */
router.post('/inventory', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const item = await new ProviderInventory({ ...req.body, providerId: req.user.id }).save();
    res.json(item);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** PATCH /api/provider/inventory/:id — update item */
router.patch('/inventory/:id', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const item = await ProviderInventory.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** DELETE /api/provider/inventory/:id */
router.delete('/inventory/:id', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    await ProviderInventory.findOneAndDelete({ _id: req.params.id, providerId: req.user.id });
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/provider/orders?status=pending */
router.get('/orders', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const filter: any = { providerId: req.user.id };
    if (req.query.status) filter.status = req.query.status;
    const orders = await ProviderOrder.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(orders);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** POST /api/provider/orders — create order (farmers will call this when ordering) */
router.post('/orders', authenticate, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const order = await new ProviderOrder({
      ...req.body,
      farmerId: req.user.id,
      farmerName: req.user.name,
      farmerPhone: req.user.phoneNumber,
    }).save();
    res.json(order);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** PATCH /api/provider/orders/:id — advance status */
router.patch('/orders/:id', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const order = await ProviderOrder.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  RATE CARDS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/provider/rates */
router.get('/rates', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const rates = await ProviderRateCard.find({ providerId: req.user.id }).sort({ createdAt: -1 });
    res.json(rates);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** POST /api/provider/rates — add rate */
router.post('/rates', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const rate = await new ProviderRateCard({ ...req.body, providerId: req.user.id }).save();
    res.json(rate);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** PATCH /api/provider/rates/:id — update price / publish */
router.patch('/rates/:id', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const updates: any = { ...req.body };
    // If publishing, stamp publishedAt
    if (updates.isPublished === true) updates.publishedAt = new Date();
    const rate = await ProviderRateCard.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user.id },
      { $set: updates },
      { new: true }
    );
    if (!rate) return res.status(404).json({ error: 'Rate not found' });
    res.json(rate);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** POST /api/provider/rates/publish-all — mark all rates as published */
router.post('/rates/publish-all', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    await ProviderRateCard.updateMany(
      { providerId: req.user.id },
      { $set: { isPublished: true, publishedAt: new Date() } }
    );
    res.json({ success: true, message: 'All rates published to farmers' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** DELETE /api/provider/rates/:id */
router.delete('/rates/:id', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    await ProviderRateCard.findOneAndDelete({ _id: req.params.id, providerId: req.user.id });
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CHAT
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/provider/chat — all threads */
router.get('/chat', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const threads = await ProviderChat.find({ providerId: req.user.id })
      .sort({ lastMessageAt: -1 });
    res.json(threads);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** GET /api/provider/chat/:farmerId — single thread */
router.get('/chat/:farmerId', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    let thread = await ProviderChat.findOne({ providerId: req.user.id, farmerId: req.params.farmerId });
    if (!thread) {
      thread = await new ProviderChat({
        providerId: req.user.id, farmerId: req.params.farmerId, messages: [],
      }).save();
    }
    res.json(thread);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** POST /api/provider/chat/:farmerId/message — send message */
router.post('/chat/:farmerId/message', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const thread = await ProviderChat.findOneAndUpdate(
      { providerId: req.user.id, farmerId: req.params.farmerId },
      {
        $push: { messages: { from: 'provider', text, sentAt: new Date(), isRead: false } },
        $set: { lastMessageAt: new Date() },
      },
      { new: true, upsert: true }
    );
    res.json(thread?.messages?.slice(-1)[0]);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** PATCH /api/provider/chat/:farmerId/mark-read */
router.patch('/chat/:farmerId/mark-read', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    await ProviderChat.updateOne(
      { providerId: req.user.id, farmerId: req.params.farmerId },
      { $set: { 'messages.$[elem].isRead': true } },
      { arrayFilters: [{ 'elem.from': 'farmer', 'elem.isRead': false }] }
    );
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  LEDGER
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/provider/ledger?type=credit&year=2026 */
router.get('/ledger', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const filter: any = { providerId: req.user.id };
    if (req.query.type)   filter.type   = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const entries = await ProviderLedger.find(filter).sort({ date: -1, createdAt: -1 }).limit(500);
    res.json(entries);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** POST /api/provider/ledger — log new transaction */
router.post('/ledger', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const entry = await new ProviderLedger({ ...req.body, providerId: req.user.id }).save();
    res.json(entry);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** PATCH /api/provider/ledger/:id — update (e.g. mark settled) */
router.patch('/ledger/:id', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const entry = await ProviderLedger.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** DELETE /api/provider/ledger/:id */
router.delete('/ledger/:id', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    await ProviderLedger.findOneAndDelete({ _id: req.params.id, providerId: req.user.id });
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  FARMERS CRM
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/provider/farmers — list linked farmers */
router.get('/farmers', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const farmers = await ProviderFarmerLink.find({ providerId: req.user.id }).sort({ totalSpend: -1 });
    res.json(farmers);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/** POST /api/provider/farmers — link a farmer to this provider */
router.post('/farmers', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const link = await ProviderFarmerLink.findOneAndUpdate(
      { providerId: req.user.id, farmerId: req.body.farmerId },
      { $set: req.body, $setOnInsert: { providerId: req.user.id } },
      { new: true, upsert: true }
    );
    res.json(link);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

/** PATCH /api/provider/farmers/:farmerId — update notes/tags */
router.patch('/farmers/:farmerId', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const link = await ProviderFarmerLink.findOneAndUpdate(
      { providerId: req.user.id, farmerId: req.params.farmerId },
      { $set: req.body },
      { new: true }
    );
    if (!link) return res.status(404).json({ error: 'Farmer link not found' });
    res.json(link);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/provider/summary — aggregated stats for provider dashboard */
router.get('/summary', ...providerOnly, async (req: any, res) => {
  if (!isProviderDbReady()) return dbGuard(res);
  try {
    const pid = req.user.id;
    const [
      pendingOrders,
      todayOrders,
      unreadMessages,
      pendingLedger,
      totalRevenueCursor,
      inventoryCount,
      lowStockCount,
    ] = await Promise.all([
      ProviderOrder.countDocuments({ providerId: pid, status: 'pending' }),
      ProviderOrder.countDocuments({
        providerId: pid,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      ProviderChat.aggregate([
        { $match: { providerId: pid } },
        { $unwind: '$messages' },
        { $match: { 'messages.from': 'farmer', 'messages.isRead': false } },
        { $count: 'total' },
      ]),
      ProviderLedger.aggregate([
        { $match: { providerId: pid, type: 'credit', status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      ProviderLedger.aggregate([
        { $match: { providerId: pid, type: 'credit', status: 'settled' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      ProviderInventory.countDocuments({ providerId: pid, isActive: true }),
      // Count items below minStock
      ProviderInventory.aggregate([
        { $match: { providerId: pid, isActive: true } },
        { $match: { $expr: { $lte: ['$stock', '$minStock'] } } },
        { $count: 'total' },
      ]),
    ]);

    res.json({
      pendingOrders,
      todayOrders,
      unreadMessages: unreadMessages[0]?.total || 0,
      pendingRevenue: pendingLedger[0]?.total || 0,
      totalRevenue: totalRevenueCursor[0]?.total || 0,
      inventoryCount,
      lowStockCount: lowStockCount[0]?.total || 0,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
