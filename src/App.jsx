// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./Navigation";
import ExperienceOne from "./ExperienceOne";
import ExperienceTwo from "./ExperienceTwo";

function App() {
  return (
    <Router>
      <div style={{ width: "100vw", height: "100vh" }}>
        <Navigation />
        <Routes>
          <Route path="/experience1" element={<ExperienceOne />} />
          <Route path="/experience2" element={<ExperienceTwo />} />
          <Route path="/" element={<ExperienceOne />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
