import { formatMoney } from "../lib/wallet";

export default function InsufficientBalanceModal({
    open,
    details,
    onClose,
    onTopUp,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/45 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                    </svg>
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">
                    Not enough balance
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Not enough balance, please top-up to proceed
                </p>
                {details ? (
                    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <p>
                            <span className="font-semibold">Required:</span>{" "}
                            {formatMoney(details.requiredAmount, details.currency)}
                        </p>
                        <p>
                            <span className="font-semibold">Available:</span>{" "}
                            {formatMoney(details.availableBalance, details.currency)}
                        </p>
                    </div>
                ) : null}
                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onTopUp}
                        className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                        Top-up
                    </button>
                </div>
            </div>
        </div>
    );
}