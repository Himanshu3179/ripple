import express, { Router } from 'express';
import authMiddleware from '../middleware/auth';
import {
  createMembershipCheckout,
  createStarsCheckout,
  getBalance,
  getBillingMeta,
  razorpayWebhook,
  verifyPayment,
} from '../controllers/billingController';

const router = Router();

router.get('/meta', getBillingMeta);
router.get('/balance', authMiddleware, getBalance);
router.post('/stars/checkout', authMiddleware, createStarsCheckout);
router.post('/membership/checkout', authMiddleware, createMembershipCheckout);
router.post('/verify', verifyPayment);
router.post('/webhook', razorpayWebhook);

export default router;
