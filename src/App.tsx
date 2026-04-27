import { RouterProvider } from "react-router-dom";
import { AuthScreen } from "./components/AuthScreen";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { router } from "./router";
import { isSupabaseConfigured } from "./lib/supabase";
import { useAppData } from "./providers/AppDataProvider";
import { useAuth } from "./providers/AuthProvider";

function App() {
  const { loading, session } = useAuth();
  const { initialLoad } = useAppData();

  if (loading || initialLoad) {
    return <LoadingOverlay fullScreen />;
  }

  if (isSupabaseConfigured && !session) {
    return <AuthScreen />;
  }

  return <RouterProvider router={router} />;
}

export default App;
