import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import "./nav.css";

function Navigation() {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-content">
          <div className="nav-links">
            <Link to="/experience1" className="nav-link">
              Experience One
            </Link>
            <Link to="/experience2" className="nav-link">
              Experience Two
            </Link>
          </div>

          <a
            href="https://github.com/freab"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="GitHub Repository"
          >
            <Github />
          </a>
        </div>
      </div>
      <div className="gradient-line"></div>
    </nav>
  );
}

export default Navigation;
