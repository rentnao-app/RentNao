import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InsufficientBalanceModal from "../components/InsufficientBalanceModal";
import {
  fetchActiveFee,
  fetchWalletAccount,
  hasSufficientBalance,
  parsePaymentRequired,
} from "../lib/wallet";

export function usePaymentGuard({ feeCode, enabled = true, percentBaseValue } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fee, setFee] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insufficientDetails, setInsufficientDetails] = useState(null);

  const returnTo = `${location.pathname}${location.search || ""}`;
  const requiredAmount =
    fee?.amount ?? insufficientDetails?.requiredAmount ?? "";
  const availableBalance =
    wallet?.availableBalance || insufficientDetails?.availableBalance || "";
  const currency =
    fee?.currency || wallet?.currency || insufficientDetails?.currency || "BDT";

  const refresh = useCallback(async () => {
    if (!enabled || !feeCode) return null;

    setLoading(true);
    setError("");
    try {
      const [nextFee, nextWallet] = await Promise.all([
        fetchActiveFee(feeCode, { percentBaseValue }),
        fetchWalletAccount(),
      ]);
      setFee(nextFee);
      setWallet(nextWallet);
      return { fee: nextFee, wallet: nextWallet };
    } catch (err) {
      setError(err.message || "Unable to verify wallet balance");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enabled, feeCode, percentBaseValue]);

  useEffect(() => {
    if (!enabled || !feeCode) return;
    refresh().catch(() => {});
  }, [enabled, feeCode, refresh]);

  const openInsufficientModal = useCallback((details) => {
    setInsufficientDetails(details);
  }, []);

  const ensureSufficientBalance = useCallback(async () => {
    const current = await refresh();
    if (!current?.fee || !current?.wallet) return false;

    if (
      hasSufficientBalance(current.wallet.availableBalance, current.fee.amount)
    ) {
      return true;
    }

    openInsufficientModal({
      feeCode: current.fee.code,
      requiredAmount: current.fee.amount,
      availableBalance: current.wallet.availableBalance,
      currency: current.fee.currency || current.wallet.currency,
    });
    return false;
  }, [openInsufficientModal, refresh]);

  const handlePaymentRequiredResponse = useCallback(
    (response, body) => {
      if (response?.status !== 402) return false;
      const details = parsePaymentRequired(body);
      if (!details) return false;

      openInsufficientModal(details);
      setWallet((prev) =>
        prev
          ? {
              ...prev,
              availableBalance: details.availableBalance,
              currency: details.currency,
            }
          : prev,
      );
      return true;
    },
    [openInsufficientModal],
  );

  const modal = useMemo(
    () =>
      createElement(InsufficientBalanceModal, {
        open: Boolean(insufficientDetails),
        details: insufficientDetails,
        onClose: () => setInsufficientDetails(null),
        onTopUp: () => {
          setInsufficientDetails(null);
          navigate(`/wallet?returnTo=${encodeURIComponent(returnTo)}`);
        },
      }),
    [insufficientDetails, navigate, returnTo],
  );

  return {
    fee,
    wallet,
    loading,
    error,
    requiredAmount,
    availableBalance,
    currency,
    refresh,
    ensureSufficientBalance,
    handlePaymentRequiredResponse,
    modal,
  };
}