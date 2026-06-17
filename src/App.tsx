import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import RoomsList from "@/pages/RoomsList";
import RoomDetail from "@/pages/RoomDetail";
import StudyCenter from "@/pages/StudyCenter";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<RoomsList />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/study" element={<StudyCenter />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}
