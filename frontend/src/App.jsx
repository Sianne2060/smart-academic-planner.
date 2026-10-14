import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./app.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;