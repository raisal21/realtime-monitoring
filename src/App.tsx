import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import ScreenGuard from "@/components/ui/screen-guard";

function App() {
  return (
    <BrowserRouter>
      <ScreenGuard />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
