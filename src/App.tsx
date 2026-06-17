import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { AuthScreen } from "./components/AuthScreen";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { router } from "./router";
import { isSupabaseConfigured } from "./lib/supabase";
import { useAppData } from "./providers/AppDataProvider";
import { useAuth } from "./providers/AuthProvider";

// Prevent horizontal swipe-back navigation gesture on touch devices
function useBlockSwipeBack() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);
}

function App() {
  const { loading, session } = useAuth();
  const { initialLoad } = useAppData();
  useBlockSwipeBack();

  if (loading || initialLoad) {
    return <LoadingOverlay fullScreen />;
  }

  if (isSupabaseConfigured && !session) {
    return <AuthScreen />;
  }

  return <RouterProvider router={router} />;
}

export default App;
