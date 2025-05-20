import React, { useState, useEffect } from "react";
import "./App.css";
import PaperMap from "./components/PaperMap";
import tsneData from "./data/tsne_papers.json";
import umapData from "./data/umap_papers.json";

function App() {
  const [papers, setPapers] = useState([]);
  const [visualizationType, setVisualizationType] = useState("tsne");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [highlightedPapers, setHighlightedPapers] = useState([]);

  useEffect(() => {
    // 実際のアプリケーションでは、ここでJSONファイルを取得します
    // ここでは、インポートしたデータを使用します
    setLoading(true);
    setTimeout(() => {
      if (visualizationType === "tsne") {
        setPapers(tsneData);
      } else {
        setPapers(umapData);
      }
      setLoading(false);
    }, 300); // データを切り替えるときの短い遅延
  }, [visualizationType]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term.trim() === "") {
      setHighlightedPapers([]);
      return;
    }

    const matchedPapers = papers
      .filter(
        (paper) =>
          paper.title.toLowerCase().includes(term) ||
          paper.authors.toLowerCase().includes(term)
      )
      .map((paper) => paper.id);

    setHighlightedPapers(matchedPapers);
  };

  return (
    <div className="App">
      <header className="header">
        <h2>CVPR 2025 Papers Map</h2>
        <p style={{ margin: "5px 0" }}>
          Interactive visualization of computer vision research papers
        </p>
      </header>

      <div className="controls">
        <select
          value={visualizationType}
          onChange={(e) => setVisualizationType(e.target.value)}
        >
          <option value="tsne">t-SNE Visualization</option>
          <option value="umap">UMAP Visualization</option>
        </select>
      </div>

      <div
        className="search-container"
        style={{ width: "90%", maxWidth: "400px" }}
      >
        <input
          type="text"
          placeholder="Search papers by title or author..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ fontSize: "14px" }}
        />
      </div>

      {loading ? (
        <div className="loading">Loading visualization...</div>
      ) : (
        <PaperMap papers={papers} highlightedPapers={highlightedPapers} />
      )}

      <footer>
        <p style={{ margin: "3px 0" }}>
          Data from CVPR 2025 | Created with React and D3.js
        </p>
      </footer>
    </div>
  );
}

export default App;
