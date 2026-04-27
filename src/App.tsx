import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DashboardV2 from "./pages/DashboardV2";
import WellExplorer from "./pages/WellExplorer";
import Auth from "./pages/Auth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/wells" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboardv2" element={<DashboardV2 />} />
        <Route path="/wells" element={<WellExplorer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
