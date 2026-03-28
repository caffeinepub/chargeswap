import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Copy, Loader2, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AuthScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [newAppId, setNewAppId] = useState<bigint | null>(null);
  const [copied, setCopied] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const isLoggingIn = loginStatus === "logging-in";

  const handleRegister = async () => {
    if (!regName.trim() || !regPhone.trim()) {
      toast.error("নাম ও ফোন নম্বর দিন");
      return;
    }
    try {
      setRegLoading(true);
      if (!identity) {
        await login();
        return;
      }
      if (!actor || isFetching) {
        toast.error("সংযোগ স্থাপন হচ্ছে, আবার চেষ্টা করুন");
        return;
      }
      const appId = await actor.register({
        name: regName.trim(),
        phoneNumber: regPhone.trim(),
      });
      setNewAppId(appId);
      toast.success("রেজিস্ট্রেশন সফল!");
    } catch (e: any) {
      toast.error(`রেজিস্ট্রেশন ব্যর্থ: ${e?.message ?? "অজানা ত্রুটি"}`);
    } finally {
      setRegLoading(false);
    }
  };

  const handleContinueAfterRegister = async () => {
    if (!actor || isFetching || !newAppId) return;
    try {
      setRegLoading(true);
      const profile = await actor.getCallerUserProfile();
      if (profile) {
        onLoginSuccess(profile);
      } else {
        toast.error("প্রোফাইল পাওয়া যায়নি");
      }
    } catch {
      toast.error("লগইন ব্যর্থ হয়েছে");
    } finally {
      setRegLoading(false);
    }
  };

  const handleCopy = () => {
    if (newAppId !== null) {
      navigator.clipboard.writeText(newAppId.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("App ID কপি হয়েছে");
    }
  };

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      if (!identity) {
        await login();
        return;
      }
      if (!actor || isFetching) {
        toast.error("সংযোগ স্থাপন হচ্ছে, আবার চেষ্টা করুন");
        return;
      }
      const profile = await actor.getCallerUserProfile();
      if (profile) {
        onLoginSuccess(profile);
      } else {
        toast.error("একাউন্ট পাওয়া যায়নি। প্রথমে রেজিস্ট্রেশন করুন।");
      }
    } catch {
      toast.error("লগইন ব্যর্থ হয়েছে");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="px-6 pt-14 pb-10 flex flex-col items-center text-center"
        style={{
          background:
            "linear-gradient(160deg, var(--navy-deep) 0%, var(--navy-mid) 100%)",
        }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "var(--balance-blue)" }}
        >
          <Zap className="w-8 h-8 text-white fill-white" />
        </motion.div>
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-3xl font-bold text-white tracking-tight"
        >
          ChargeSwap
        </motion.h1>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-white/60 mt-2 text-sm"
        >
          ফোন চার্জ ক্রেডিট পাঠান ও গ্রহণ করুন
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="flex-1 bg-card rounded-t-3xl -mt-4 px-5 pt-6 pb-8 shadow-card"
      >
        <Tabs defaultValue="register" className="w-full">
          <TabsList
            className="w-full mb-5 rounded-xl h-11"
            data-ocid="auth.tab"
          >
            <TabsTrigger
              value="register"
              className="flex-1 rounded-lg text-sm font-semibold"
            >
              রেজিস্ট্রেশন
            </TabsTrigger>
            <TabsTrigger
              value="login"
              className="flex-1 rounded-lg text-sm font-semibold"
            >
              লগইন
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4 mt-0">
            <AnimatePresence mode="wait">
              {newAppId !== null ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div
                    className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
                    style={{ background: "var(--send-green)" }}
                  >
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">
                      রেজিস্ট্রেশন সফল!
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      আপনার App ID সেভ করুন
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 p-3 rounded-xl border-2"
                    style={{
                      borderColor: "var(--balance-blue)",
                      background: "oklch(0.95 0.02 255)",
                    }}
                    onClick={handleCopy}
                    data-ocid="auth.register.success_state"
                  >
                    <span
                      className="flex-1 font-mono font-bold text-lg text-center"
                      style={{ color: "var(--balance-blue)" }}
                    >
                      #{newAppId.toString()}
                    </span>
                    {copied ? (
                      <CheckCircle2
                        className="w-5 h-5"
                        style={{ color: "var(--send-green)" }}
                      />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <Button
                    type="button"
                    className="w-full h-12 text-base font-bold rounded-xl"
                    style={{ background: "var(--send-green)" }}
                    onClick={handleContinueAfterRegister}
                    disabled={regLoading}
                    data-ocid="auth.register.submit_button"
                  >
                    {regLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "অ্যাপে প্রবেশ করুন →"
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-sm font-semibold">
                      পূর্ণ নাম
                    </Label>
                    <Input
                      id="reg-name"
                      placeholder="আপনার নাম লিখুন"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="h-12 rounded-xl text-base"
                      data-ocid="auth.register.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reg-phone"
                      className="text-sm font-semibold"
                    >
                      ফোন নম্বর
                    </Label>
                    <Input
                      id="reg-phone"
                      placeholder="01XXXXXXXXX"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="h-12 rounded-xl text-base"
                      data-ocid="auth.register.input"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full h-12 text-base font-bold rounded-xl mt-2"
                    style={{ background: "var(--balance-blue)" }}
                    onClick={handleRegister}
                    disabled={regLoading || isLoggingIn}
                    data-ocid="auth.register.submit_button"
                  >
                    {regLoading || isLoggingIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : identity ? (
                      "রেজিস্ট্রেশন করুন"
                    ) : (
                      "লগইন করে রেজিস্ট্রেশন করুন"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Internet Identity দিয়ে নিরাপদ লগইন
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="login" className="space-y-4 mt-0">
            <div
              className="p-4 rounded-xl text-center space-y-3"
              style={{ background: "oklch(0.95 0.012 240)" }}
            >
              <div
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "var(--balance-blue)" }}
              >
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Internet Identity দিয়ে লগইন করুন
              </p>
              <p className="text-xs text-muted-foreground">
                আপনার আগের একাউন্টে প্রবেশ করতে নিচে ক্লিক করুন
              </p>
            </div>
            <Button
              type="button"
              className="w-full h-12 text-base font-bold rounded-xl"
              style={{ background: "var(--balance-blue)" }}
              onClick={handleLogin}
              disabled={loginLoading || isLoggingIn}
              data-ocid="auth.login.submit_button"
            >
              {loginLoading || isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : identity ? (
                "একাউন্টে প্রবেশ করুন"
              ) : (
                "লগইন করুন"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              নতুন ব্যবহারকারী? উপরে রেজিস্ট্রেশন ট্যাব ব্যবহার করুন
            </p>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center mt-8">
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
      </motion.div>
    </div>
  );
}
