import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  LogOut,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Transfer, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface HomeScreenProps {
  user: UserProfile;
  onSend: () => void;
  onHistory: () => void;
  onLogout: () => void;
}

export default function HomeScreen({
  user,
  onSend,
  onHistory,
  onLogout,
}: HomeScreenProps) {
  const { actor, isFetching } = useActor();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transfer[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const prevBalanceRef = useRef<bigint | null>(null);
  const isFirstLoad = useRef(true);

  const fetchData = useCallback(
    async (showToast = false) => {
      if (!actor || isFetching) return;
      try {
        const [bal, txns] = await Promise.all([
          actor.getBalance(user.appID),
          actor.getTransactionHistory(user.appID),
        ]);
        if (
          !isFirstLoad.current &&
          prevBalanceRef.current !== null &&
          bal > prevBalanceRef.current
        ) {
          const diff = bal - prevBalanceRef.current;
          toast.success(`নতুন চার্জ পেয়েছেন! +${diff.toString()} units`, {
            icon: "⚡",
            duration: 5000,
          });
        }
        prevBalanceRef.current = bal;
        isFirstLoad.current = false;
        setBalance(bal);
        const sorted = [...txns].sort((a, b) =>
          Number(b.timestamp - a.timestamp),
        );
        setRecentTxns(sorted.slice(0, 3));
        if (showToast) toast.success("ব্যালেন্স আপডেট হয়েছে");
      } catch {
        // silent
      } finally {
        setLoadingBalance(false);
      }
    },
    [actor, isFetching, user.appID],
  );

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatDate = (ts: bigint) => {
    const d = new Date(Number(ts));
    return `${d.toLocaleDateString("bn-BD", { day: "2-digit", month: "short" })}, ${d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{
          background:
            "linear-gradient(160deg, var(--navy-deep) 0%, var(--navy-mid) 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--balance-blue)" }}
            >
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-white font-bold text-lg">ChargeSwap</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            data-ocid="home.logout.button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-white/60 text-sm">স্বাগতম,</p>
          <h2 className="text-white font-bold text-xl">{user.name}</h2>
          <p className="text-white/50 text-xs mt-0.5">
            📱 {user.phoneNumber} · App ID #{user.appID.toString()}
          </p>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-5 rounded-2xl p-5"
          style={{ background: "var(--balance-blue)" }}
          data-ocid="home.balance.card"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
              চার্জ ব্যালেন্স
            </span>
            <button
              type="button"
              onClick={() => fetchData(true)}
              className="text-white/60 hover:text-white transition-colors"
              data-ocid="home.balance.button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <Zap className="w-7 h-7 text-yellow-300 fill-yellow-300 mb-0.5" />
            {loadingBalance ? (
              <Skeleton className="h-10 w-28 bg-white/20" />
            ) : (
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {balance?.toString() ?? "0"}
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm mt-1">Charge Units</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 pt-5 pb-8 space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              className="w-full h-16 flex flex-col items-center justify-center gap-1 rounded-2xl text-white font-bold shadow-card border-0"
              style={{ background: "var(--send-green)" }}
              onClick={onSend}
              data-ocid="home.send.primary_button"
            >
              <Send className="w-5 h-5" />
              <span className="text-sm">চার্জ পাঠান</span>
            </Button>
          </motion.div>
          <motion.div
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              className="w-full h-16 flex flex-col items-center justify-center gap-1 rounded-2xl text-white font-bold shadow-card border-0"
              style={{ background: "var(--receive-teal)" }}
              onClick={onHistory}
              data-ocid="home.history.secondary_button"
            >
              <History className="w-5 h-5" />
              <span className="text-sm">ট্রানজেকশন</span>
            </Button>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-foreground">
              সাম্প্রতিক লেনদেন
            </h3>
            <button
              type="button"
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--balance-blue)" }}
              onClick={onHistory}
              data-ocid="home.history.link"
            >
              সব দেখুন
            </button>
          </div>

          {loadingBalance ? (
            <div
              className="space-y-2"
              data-ocid="home.transactions.loading_state"
            >
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : recentTxns.length === 0 ? (
            <div
              className="text-center py-6"
              data-ocid="home.transactions.empty_state"
            >
              <p className="text-muted-foreground text-sm">কোনো লেনদেন নেই</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                প্রথম ট্রান্সফার পাঠান!
              </p>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="home.transactions.list">
              {recentTxns.map((txn, i) => {
                const isSent = txn.senderAppID === user.appID;
                return (
                  <div
                    key={`${txn.senderAppID}-${txn.receiverAppID}-${txn.timestamp}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: "oklch(0.97 0.008 240)" }}
                    data-ocid={`home.transactions.item.${i + 1}`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isSent
                          ? "oklch(0.95 0.04 150)"
                          : "oklch(0.95 0.04 195)",
                      }}
                    >
                      {isSent ? (
                        <ArrowUpRight
                          className="w-4 h-4"
                          style={{ color: "var(--send-green)" }}
                        />
                      ) : (
                        <ArrowDownLeft
                          className="w-4 h-4"
                          style={{ color: "var(--receive-teal)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        {isSent
                          ? `→ App #${txn.receiverAppID.toString()}`
                          : `← App #${txn.senderAppID.toString()}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(txn.timestamp)}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold flex-shrink-0"
                      style={{
                        color: isSent
                          ? "var(--send-green)"
                          : "var(--receive-teal)",
                      }}
                    >
                      {isSent ? "-" : "+"}
                      {txn.amount.toString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
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
