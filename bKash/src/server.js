const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { randomUUID } = require("crypto");

const app = express();

const PORT = process.env.PORT || 8080;
const APP_KEY = process.env.BKASH_APP_KEY || "sandbox-app-key";
const APP_SECRET = process.env.BKASH_APP_SECRET || "sandbox-app-secret";
const USERNAME = process.env.BKASH_USERNAME || "sandbox-username";
const PASSWORD = process.env.BKASH_PASSWORD || "sandbox-password";
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 3600);
const ORG_NAME = process.env.BKASH_ORG_NAME || "Sandbox Merchant";
const ORG_LOGO = process.env.BKASH_ORG_LOGO || "https://sandbox.example.com/logo.png";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const authTokens = new Map();
const refreshTokens = new Map();
const payments = new Map();

function nowIso() {
  return new Date().toISOString();
}

function randomBkashId(prefix = "TRX") {
  const raw = randomUUID().replace(/-/g, "").toUpperCase();
  return `${prefix}${raw.slice(0, 10)}`;
}

function issueToken(refreshTokenValue = null) {
  const token = randomUUID().replace(/-/g, "");
  const refreshToken = refreshTokenValue || randomUUID().replace(/-/g, "");
  const expiresAt = Date.now() + TOKEN_TTL_SECONDS * 1000;
  authTokens.set(token, { expiresAt, refreshToken });
  refreshTokens.set(refreshToken, { token, expiresAt });
  return {
    id_token: token,
    token_type: "Bearer",
    refresh_token: refreshToken,
    expires_in: String(TOKEN_TTL_SECONDS),
  };
}

function verifyAppHeaders(req, res, next) {
  const appKey = req.header("X-APP-Key");
  if (!appKey || appKey !== APP_KEY) {
    return res.status(401).json({
      message: "Invalid or missing X-APP-Key",
    });
  }

  return next();
}

function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return res.status(401).json({
      message: "Missing bearer token",
    });
  }

  const record = authTokens.get(token);
  if (!record) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  if (record.expiresAt < Date.now()) {
    authTokens.delete(token);
    return res.status(401).json({
      message: "Token expired",
    });
  }

  return next();
}

function validateUsernamePassword(req) {
  const username = req.header("username");
  const password = req.header("password");
  return username === USERNAME && password === PASSWORD;
}

app.get("/health", (_, res) => {
  return res.json({
    service: "bkash-sandbox-simulator",
    status: "ok",
    time: nowIso(),
  });
});

function buildPaymentResponse(payment) {
  return {
    paymentID: payment.paymentID,
    createTime: payment.createTime,
    updateTime: payment.updateTime,
    trxID: payment.trxID,
    transactionStatus: payment.transactionStatus,
    amount: payment.amount,
    currency: payment.currency,
    intent: payment.intent,
    merchantInvoiceNumber: payment.merchantInvoiceNumber,
    refundAmount: payment.refundAmount,
  };
}

const api = express.Router();

api.post("/checkout/token/grant", (req, res) => {
  const { app_key: appKey, app_secret: appSecret } = req.body || {};

  if (!validateUsernamePassword(req) || appKey !== APP_KEY || appSecret !== APP_SECRET) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  return res.json(issueToken());
});

api.post("/checkout/token/refresh", (req, res) => {
  const { app_key: appKey, app_secret: appSecret, refresh_token: refreshToken } = req.body || {};

  if (!validateUsernamePassword(req) || appKey !== APP_KEY || appSecret !== APP_SECRET) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }

  return res.json(issueToken(refreshToken));
});

api.post("/checkout/payment/create", verifyAuth, verifyAppHeaders, (req, res) => {
  const { amount, currency, intent, merchantInvoiceNumber } = req.body || {};

  if (!amount || Number(amount) <= 0 || !currency || !intent || !merchantInvoiceNumber) {
    return res.status(400).json({
      message: "amount, currency, intent and merchantInvoiceNumber are required",
    });
  }

  if (currency !== "BDT") {
    return res.status(400).json({
      message: "Only BDT is supported in this simulator",
    });
  }

  if (!["sale", "authorization"].includes(intent)) {
    return res.status(400).json({
      message: "intent must be sale or authorization",
    });
  }

  const paymentID = randomBkashId("PAY");

  const payment = {
    paymentID,
    createTime: nowIso(),
    updateTime: nowIso(),
    trxID: null,
    transactionStatus: "Initiated",
    amount: Number(amount).toFixed(2),
    currency,
    intent,
    merchantInvoiceNumber,
    refundAmount: "0.00",
  };

  payments.set(paymentID, payment);

  return res.json({
    paymentID,
    createTime: payment.createTime,
    orgLogo: ORG_LOGO,
    orgName: ORG_NAME,
    transactionStatus: payment.transactionStatus,
    amount: payment.amount,
    currency,
    intent,
    merchantInvoiceNumber,
  });
});

api.post("/checkout/payment/execute/:paymentID", verifyAuth, verifyAppHeaders, (req, res) => {
  const { paymentID } = req.params;
  const payment = payments.get(paymentID);

  if (!payment) {
    return res.status(404).json({
      message: "Payment not found",
    });
  }

  if (payment.transactionStatus === "Completed") {
    return res.status(409).json({
      message: "Payment already executed",
    });
  }

  if (payment.transactionStatus === "Voided") {
    return res.status(409).json({
      message: "Voided payment cannot be executed",
    });
  }

  const trxID = randomBkashId("TRX");

  payment.transactionStatus = "Completed";
  payment.trxID = trxID;
  payment.updateTime = nowIso();
  payments.set(paymentID, payment);

  return res.json(buildPaymentResponse(payment));
});

api.get("/checkout/payment/query/:paymentID", verifyAuth, verifyAppHeaders, (req, res) => {
  const { paymentID } = req.params;
  const payment = payments.get(paymentID);

  if (!payment) {
    return res.status(404).json({
      message: "Payment not found",
    });
  }

  return res.json(buildPaymentResponse(payment));
});

api.post("/checkout/payment/void/:paymentID", verifyAuth, verifyAppHeaders, (req, res) => {
  const { paymentID } = req.params;
  const payment = payments.get(paymentID);

  if (!payment) {
    return res.status(404).json({
      message: "Payment not found",
    });
  }

  if (payment.transactionStatus === "Completed") {
    return res.status(409).json({
      message: "Completed payment cannot be voided",
    });
  }

  payment.updateTime = nowIso();
  payment.transactionStatus = "Voided";
  payments.set(paymentID, payment);

  return res.json({
    paymentID: payment.paymentID,
    createTime: payment.createTime,
    updateTime: payment.updateTime,
    trxID: payment.trxID,
    transactionStatus: payment.transactionStatus,
  });
});

app.use("/v1.2.0-beta", api);
app.use("/", api);

app.use((_, res) => {
  return res.status(404).json({
    message: "Route not found in bKash sandbox simulator",
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`bKash sandbox simulator running on port ${PORT}`);
});
