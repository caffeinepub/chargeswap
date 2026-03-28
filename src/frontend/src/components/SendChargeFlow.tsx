import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { User, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

type Step = "search" | "amount" | "confirm" | "success";

interface SendChargeFlowProps {
  currentUser: UserProfile;
  onBack: () => void;
  onSuccess: () => void;
}

export default function SendChargeFlow({
  currentUser,
  onBack,
  onSuccess,
}: SendChargeFlowProps) {
  const { actor, isFetching } = useActor();
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [recipient, setRecipient] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      toast.error("ফোন নম্বর বা App ID দিন");
      return;
    }
    if (!actor || isFetching) return;
    try {
      setSearchLoading(true);
      let user: User;
      if (/^\d+$/.test(q) && q.length <= 10) {
        user = await actor.getUser(BigInt(q));
      } else {
        user = await actor.getUserByPhone(q);
      }
      if (user.appID === currentUser.appID) {
        toast.error("নিজেকে চার্জ পাঠানো যাবে না");
        return;
      }
      setRecipient(user);
      setStep("amount");
    } catch {
      toast.error("ব্যবহারকারী পাওয়া যায়নি");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAmountNext = () => {
    const amt = Number.parseInt(amount, 10);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      toast.error("সঠিক পরিমাণ দিন");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!actor || isFetching || !recipient) return;
    const amt = Number.parseInt(amount, 10);
    try {
      setSending(true);
      await actor.transfer({
        senderAppID: currentUser.appID,
        receiverAppID: recipient.appID,
        amount: BigInt(amt),
        timestamp: BigInt(Date.now()),
      });
      setStep("success");
      toast.success(`${amt} units পাঠানো হয়েছে!`);
    } catch (e: any) {
      toast.error(`ট্রান্সফার ব্যর্থ: ${e?.message ?? "অজানা ত্রুটি"}`);
    } finally {
      setSending(false);
    }
  };

  const stepIndex: Record<Step, number> = {
    search: 0,
    amount: 1,
    confirm: 2,
    success: 3,
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
        <div className="flex items-center gap-3 mb-4">
          {step !== "success" && (
            <button
              type="button"
              onClick={
                step === "search"
                  ? onBack
                  : () => setStep(step === "amount" ? "search" : "amount")
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              data-ocid="send.back.button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-white font-bold text-lg">চার্জ পাঠান</h2>
        </div>

        {step !== "success" && (
          <div className="flex gap-1.5">
            {(["search", "amount", "confirm"] as Step[]).map((s, i) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  background:
                    i <= stepIndex[step]
                      ? "var(--cta-orange)"
                      : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 pb-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Search */}
          {step === "search" && (
            <motion.div
              key="search"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div
                className="bg-card rounded-2xl p-5 shadow-card"
                data-ocid="send.search.panel"
              >
                <h3 className="font-bold text-base mb-4">প্রাপক খুঁজুন</h3>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">
                    ফোন নম্বর বা App ID
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="01XXXXXXXXX বা App ID"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-9 h-12 rounded-xl text-base"
                      data-ocid="send.search.input"
                    />
                  </div>
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-bold text-base mt-4 text-white"
                  style={{ background: "var(--balance-blue)" }}
                  onClick={handleSearch}
                  disabled={searchLoading}
                  data-ocid="send.search.primary_button"
                >
                  {searchLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "খুঁজুন"
                  )}
                </Button>
              </div>

              <div
                className="p-4 rounded-2xl"
                style={{ background: "oklch(0.95 0.012 240)" }}
              >
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  💡 কীভাবে খুঁজবেন
                </p>
                <p className="text-xs text-muted-foreground">
                  ফোন নম্বর (01XXXXXXXXX) বা 10 সংখ্যার কম App ID লিখুন
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Amount */}
          {step === "amount" && recipient && (
            <motion.div
              key="amount"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div
                className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3"
                data-ocid="send.recipient.card"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: "var(--receive-teal)" }}
                >
                  {recipient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm">{recipient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    📱 {recipient.phoneNumber} · App #
                    {recipient.appID.toString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
                <h3 className="font-bold text-base">কত units পাঠাবেন?</h3>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2">
                    <Zap
                      className="w-8 h-8"
                      style={{ color: "var(--cta-orange)" }}
                    />
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="text-5xl font-extrabold w-36 bg-transparent border-none outline-none text-center"
                      style={{ color: "var(--navy-mid)" }}
                      data-ocid="send.amount.input"
                    />
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Charge Units
                  </p>
                </div>
                <div className="flex gap-2">
                  {[10, 50, 100, 200].map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setAmount(v.toString())}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-colors"
                      style={{
                        background:
                          amount === v.toString()
                            ? "var(--cta-orange)"
                            : "oklch(0.95 0.012 240)",
                        color: amount === v.toString() ? "white" : "inherit",
                      }}
                      data-ocid="send.amount.button"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-bold text-base text-white"
                  style={{ background: "var(--send-green)" }}
                  onClick={handleAmountNext}
                  data-ocid="send.amount.primary_button"
                >
                  পরবর্তী ধাপ
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && recipient && (
            <motion.div
              key="confirm"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div
                className="bg-card rounded-2xl p-5 shadow-card"
                data-ocid="send.confirm.dialog"
              >
                <h3 className="font-bold text-base mb-4 text-center">
                  ট্রান্সফার নিশ্চিত করুন
                </h3>

                <div
                  className="p-4 rounded-xl mb-4 text-center"
                  style={{ background: "oklch(0.95 0.012 240)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mx-auto"
                        style={{ background: "var(--balance-blue)" }}
                      >
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs font-semibold mt-1 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-muted-foreground">প্রেরক</p>
                    </div>
                    <div className="flex flex-col items-center px-3">
                      <Zap
                        className="w-6 h-6"
                        style={{ color: "var(--cta-orange)" }}
                      />
                      <span
                        className="text-xl font-extrabold"
                        style={{ color: "var(--cta-orange)" }}
                      >
                        {amount}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        units
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mx-auto"
                        style={{ background: "var(--receive-teal)" }}
                      >
                        {recipient.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs font-semibold mt-1 truncate">
                        {recipient.name}
                      </p>
                      <p className="text-xs text-muted-foreground">প্রাপক</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">প্রাপকের ফোন</span>
                    <span className="font-semibold">
                      {recipient.phoneNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">App ID</span>
                    <span className="font-semibold">
                      #{recipient.appID.toString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">পরিমাণ</span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--cta-orange)" }}
                    >
                      {amount} units
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl font-bold"
                    onClick={() => setStep("amount")}
                    disabled={sending}
                    data-ocid="send.confirm.cancel_button"
                  >
                    বাতিল
                  </Button>
                  <Button
                    className="h-12 rounded-xl font-bold text-white"
                    style={{ background: "var(--send-green)" }}
                    onClick={handleConfirm}
                    disabled={sending}
                    data-ocid="send.confirm.confirm_button"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "নিশ্চিত করুন"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="text-center space-y-5 pt-8"
              data-ocid="send.success_state"
            >
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "var(--send-green)" }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold">সফল!</h3>
                <p className="text-muted-foreground mt-1">
                  {amount} units {recipient?.name}-কে পাঠানো হয়েছে
                </p>
              </div>
              <div
                className="p-4 rounded-2xl"
                style={{ background: "oklch(0.95 0.04 150 / 0.3)" }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--send-green)" }}
                >
                  ⚡ {amount} Charge Units ট্রান্সফার সম্পন্ন
                </p>
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold text-base"
                style={{ background: "var(--balance-blue)" }}
                onClick={onSuccess}
                data-ocid="send.success.primary_button"
              >
                হোমে ফিরে যান
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
