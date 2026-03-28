import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { Transfer, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface TransactionHistoryProps {
  currentUser: UserProfile;
  onBack: () => void;
}

export default function TransactionHistory({
  currentUser,
  onBack,
}: TransactionHistoryProps) {
  const { actor, isFetching } = useActor();
  const [txns, setTxns] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTxns = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const data = await actor.getTransactionHistory(currentUser.appID);
      const sorted = [...data].sort((a, b) =>
        Number(b.timestamp - a.timestamp),
      );
      setTxns(sorted);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [actor, isFetching, currentUser.appID]);

  useEffect(() => {
    loadTxns();
  }, [loadTxns]);

  const formatDate = (ts: bigint) => {
    const d = new Date(Number(ts));
    return `${d.toLocaleDateString("bn-BD", { day: "2-digit", month: "short", year: "numeric" })} ${d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-5"
        style={{
          background:
            "linear-gradient(160deg, var(--navy-deep) 0%, var(--navy-mid) 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            data-ocid="history.back.button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-white font-bold text-lg">ট্রানজেকশন ইতিহাস</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 pb-8">
        {loading ? (
          <div
            className="space-y-3"
            data-ocid="history.transactions.loading_state"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : txns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
            data-ocid="history.transactions.empty_state"
          >
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "oklch(0.93 0.018 240)" }}
            >
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground">কোনো লেনদেন নেই</p>
            <p className="text-sm text-muted-foreground mt-1">
              প্রথম চার্জ ট্রান্সফার করুন!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3" data-ocid="history.transactions.list">
            {txns.map((txn, i) => {
              const isSent = txn.senderAppID === currentUser.appID;
              return (
                <motion.div
                  key={`${txn.senderAppID}-${txn.receiverAppID}-${txn.timestamp}`}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3"
                  data-ocid={`history.transactions.item.${i + 1}`}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isSent
                        ? "oklch(0.92 0.06 150)"
                        : "oklch(0.92 0.06 195)",
                    }}
                  >
                    {isSent ? (
                      <ArrowUpRight
                        className="w-5 h-5"
                        style={{ color: "var(--send-green)" }}
                      />
                    ) : (
                      <ArrowDownLeft
                        className="w-5 h-5"
                        style={{ color: "var(--receive-teal)" }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: isSent
                            ? "oklch(0.92 0.06 150)"
                            : "oklch(0.92 0.06 195)",
                          color: isSent
                            ? "var(--send-green)"
                            : "var(--receive-teal)",
                        }}
                      >
                        {isSent ? "পাঠানো" : "পাওয়া"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5 truncate">
                      {isSent
                        ? `→ App #${txn.receiverAppID.toString()}`
                        : `← App #${txn.senderAppID.toString()}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(txn.timestamp)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-base font-extrabold"
                      style={{
                        color: isSent
                          ? "var(--send-green)"
                          : "var(--receive-teal)",
                      }}
                    >
                      {isSent ? "-" : "+"}
                      {txn.amount.toString()}
                    </p>
                    <p className="text-xs text-muted-foreground">units</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center pb-6">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-foreground transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
