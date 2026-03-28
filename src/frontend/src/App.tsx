import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useState } from "react";
import type { UserProfile } from "./backend.d";
import AuthScreen from "./components/AuthScreen";
import HomeScreen from "./components/HomeScreen";
import SendChargeFlow from "./components/SendChargeFlow";
import TransactionHistory from "./components/TransactionHistory";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

export type AppView = "auth" | "home" | "send" | "history";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [view, setView] = useState<AppView>("auth");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      setLoading(true);
      const profile = await actor.getCallerUserProfile();
      if (profile) {
        setCurrentUser(profile);
        localStorage.setItem("chargeswap_appid", profile.appID.toString());
        setView("home");
      } else {
        setView("auth");
      }
    } catch {
      setView("auth");
    } finally {
      setLoading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    if (!isInitializing && identity && !isFetching && actor) {
      loadProfile();
    } else if (!isInitializing && !identity) {
      setView("auth");
      setCurrentUser(null);
    }
  }, [identity, isInitializing, isFetching, actor, loadProfile]);

  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem("chargeswap_appid", profile.appID.toString());
    setView("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("chargeswap_appid");
    setCurrentUser(null);
    setView("auth");
  };

  if (isInitializing || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--navy-deep)" }}
      >
        <div className="text-center space-y-3">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
            style={{ background: "var(--balance-blue)" }}
          >
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-white/70 text-sm font-medium">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.95 0.01 240)" }}
    >
      <div className="mx-auto max-w-[420px] min-h-screen relative">
        {view === "auth" && <AuthScreen onLoginSuccess={handleLoginSuccess} />}
        {view === "home" && currentUser && (
          <HomeScreen
            user={currentUser}
            onSend={() => setView("send")}
            onHistory={() => setView("history")}
            onLogout={handleLogout}
          />
        )}
        {view === "send" && currentUser && (
          <SendChargeFlow
            currentUser={currentUser}
            onBack={() => setView("home")}
            onSuccess={() => setView("home")}
          />
        )}
        {view === "history" && currentUser && (
          <TransactionHistory
            currentUser={currentUser}
            onBack={() => setView("home")}
          />
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
