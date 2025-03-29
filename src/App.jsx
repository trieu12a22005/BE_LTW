import { Route, Routes } from "react-router-dom";
import Register from "./pages/Register/register.jsx";
import Login from "./pages/Login/Login.jsx";
import Otp from "./pages/otp/otp.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ResetPassword from "./pages/Login/resetPassword/resetPassword.jsx";
function App() {
  return (
    <>
      <ToastContainer /> {/* Di chuyển ra ngoài Routes */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<Otp />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
}

export default App;
