import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';

const PaperMap = ({ papers, highlightedPapers }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [tooltipData, setTooltipData] = useState(null);
  const [zoomState, setZoomState] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  // 論文マップを描画する関数
  useEffect(() => {
    if (!papers || papers.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // 前のコンテンツをクリア
    svg.selectAll("*").remove();
    
    // グループ要素を作成
    const mapGroup = svg.append("g")
      .attr("transform", `translate(${zoomState.translateX}, ${zoomState.translateY}) scale(${zoomState.scale})`);

    // ズーム動作を設定 - mousedownイベントが.tooltipで始まった場合はイベントをキャンセル
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .filter(event => {
        // ツールチップ内でのイベントはズームさせない
        if (tooltipData && event.target.closest('.tooltip')) {
          return false;
        }
        return !event.ctrlKey && !event.button;
      })
      .on("zoom", (event) => {
        const { transform } = event;
        mapGroup.attr("transform", transform);
        setZoomState({
          scale: transform.k,
          translateX: transform.x,
          translateY: transform.y
        });
      });
    
    svg.call(zoom);
    
    // 現在のズーム状態を適用
    const initialTransform = d3.zoomIdentity
      .translate(zoomState.translateX, zoomState.translateY)
      .scale(zoomState.scale);
    
    svg.call(zoom.transform, initialTransform);
    
    // スケールを設定
    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([50, width - 50]);
    
    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([50, height - 50]);
    
    // 論文ノードを描画
    mapGroup.selectAll("circle")
      .data(papers)
      .enter()
      .append("circle")
      .attr("class", "paper-node")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", d => highlightedPapers.includes(d.id) ? 8 : 4)
      .attr("fill", d => highlightedPapers.includes(d.id) ? "#ea4335" : "#4285f4")
      .attr("opacity", d => highlightedPapers.length > 0 
        ? (highlightedPapers.includes(d.id) ? 1 : 0.3) 
        : 0.7)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("r", 8)
          .attr("fill", "#ea4335");
        
        setTooltipData({
          title: d.title,
          authors: d.authors,
          session: d.session,
          location: d.location,
          url: d.url,
          x: xScale(d.x),
          y: yScale(d.y)
        });
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("r", d => highlightedPapers.includes(d.id) ? 8 : 4)
          .attr("fill", d => highlightedPapers.includes(d.id) ? "#ea4335" : "#4285f4");
        
        setTooltipData(null);
      })
      .on("click", (event, d) => {
        // 論文にURLがある場合、ノード自体をクリックしたらURLを開く
        // ツールチップは別途インタラクション可能にする
        if (d.url && !tooltipData) {
          window.open(d.url, '_blank');
        }
      });
    
  }, [papers, highlightedPapers, zoomState]);

  // ツールチップの位置を更新
  useEffect(() => {
    if (!tooltipData || !tooltipRef.current) return;
    
    const tooltip = tooltipRef.current;
    const svgRect = svgRef.current.getBoundingClientRect();
    
    // ツールチップの位置を計算（論文ノードの中心）
    const tooltipX = svgRect.left + tooltipData.x * zoomState.scale + zoomState.translateX;
    const tooltipY = svgRect.top + tooltipData.y * zoomState.scale + zoomState.translateY;
    
    // ウィンドウのサイズを取得
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // ツールチップのサイズを取得
    const tooltipWidth = 300; // max-widthと同じ値に設定
    
    // 右側に表示するのが画面からはみ出す場合は左側に表示
    let finalX;
    if (tooltipX + tooltipWidth + 15 > windowWidth) {
      finalX = tooltipX - tooltipWidth - 15;
    } else {
      finalX = tooltipX + 15; // 右側に15px離して表示
    }
    
    // ツールチップの高さを概算（実際のDOM要素の高さは動的）
    const estimatedTooltipHeight = 200; // 平均的な高さを広めに設定
    
    // ツールチップが画面からはみ出さないように調整
    let finalY;
    if (tooltipY + estimatedTooltipHeight > windowHeight) {
      // 下側に表示すると画面外にはみ出す場合、上側に表示
      finalY = tooltipY - estimatedTooltipHeight - 15;
    } else if (tooltipY - estimatedTooltipHeight < 0) {
      // 上側に表示すると画面外にはみ出す場合、下側に表示
      finalY = tooltipY + 15;
    } else {
      // どちらも画面内に収まる場合は、上側に表示
      finalY = tooltipY - estimatedTooltipHeight - 15;
    }
    
    // ツールチップの配置を更新
    tooltip.style.left = `${finalX}px`;
    tooltip.style.top = `${finalY}px`;
    tooltip.style.display = 'block';
    
  }, [tooltipData, zoomState]);

  return (
    <div className="paper-map-container">
      <svg className="paper-map" ref={svgRef}></svg>
      
      {tooltipData && (
        <div className="tooltip" ref={tooltipRef}>
          <h3>{tooltipData.title}</h3>
          <p><strong>Authors:</strong> {tooltipData.authors}</p>
          <p><strong>Session:</strong> {tooltipData.session}</p>
          <p><strong>Location:</strong> {tooltipData.location}</p>
          {tooltipData.url && (
            <p><strong>URL:</strong> <a href={tooltipData.url} target="_blank" rel="noopener noreferrer">リンクを開く</a></p>
          )}
        </div>
      )}
    </div>
  );
};

export default PaperMap;