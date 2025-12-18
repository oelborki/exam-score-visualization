import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";

function SleepHabitsBar({ data, mode = "quality", sampleSize = 100 }) {
  const ref = useRef();
  const sampled = useMemo(() => {
    if (!data?.length) return [];
    const n = Math.min(sampleSize, data.length);
    return data.slice(0, n); // stable sampling (same idea as StudyVsScore option)
  }, [data, sampleSize]);
  const aggregated = useMemo(() => {
    if (!data?.length || mode !== "quality") return [];

    const order = ["poor", "average", "good"];
    const grouped = d3.group(data, d => d.sleep_quality);

    return Array.from(grouped, ([key, rows]) => ({
      key,
      avg: d3.mean(rows, r => r.exam_score),
      n: rows.length,
    })).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }, [data, mode]);

  useEffect(() => {
    if (!data?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 560;
    const height = 420;
    const margin = { top: 20, right: 30, bottom: 60, left: 70 };

    svg.attr("width", width).attr("height", height);

    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    const container = d3.select(svg.node().parentNode);
    let tooltip = container.select(".tooltip");

    if (tooltip.empty()) {
      tooltip = container
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("opacity", 0);
    }
//bar chart for sleep quality
    if (mode === "quality") {
      const x = d3
        .scaleBand()
        .domain(aggregated.map(d => d.key))
        .range([0, plotW])
        .padding(0.25);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(aggregated, d => d.avg)])
        .nice()
        .range([plotH, 0]);

      g.append("g")
        .attr("transform", `translate(0,${plotH})`)
        .call(d3.axisBottom(x));

      g.append("g").call(d3.axisLeft(y));

      g.selectAll("rect")
        .data(aggregated)
        .enter()
        .append("rect")
        .attr("x", d => x(d.key))
        .attr("y", d => y(d.avg))
        .attr("width", x.bandwidth())
        .attr("height", d => plotH - y(d.avg))
        .attr("fill", "#0f0063ff")
        .attr("opacity", 0.85)
        .on("mousemove", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              `<b>Sleep quality:</b> ${d.key}<br/>
               <b>Avg score:</b> ${d.avg.toFixed(2)}<br/>
               <b>Students:</b> ${d.n}`
            )
            .style("left", `${event.offsetX + 20}px`)
            .style("top", `${event.offsetY}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
    }
//scatter for sleep hours
    if (mode === "hours") {
      const x = d3
        .scaleLinear()
        .domain(d3.extent(sampled, d => d.sleep_hours))
        .nice()
        .range([0, plotW]);

      const y = d3
        .scaleLinear()
        .domain([0, 100])
        .nice()
        .range([plotH, 0]);

      g.append("g")
        .attr("transform", `translate(0,${plotH})`)
        .call(d3.axisBottom(x));

      g.append("g").call(d3.axisLeft(y));

      // deterministic jitter
      const jitter = (id, amount) => {
        const t = (Math.sin((id || 1) * 999) + 1) / 2;
        return (t - 0.5) * 2 * amount;
      };

      g.selectAll("circle")
        .data(sampled)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.sleep_hours + jitter(d.student_id, 0.12)))
        .attr("cy", d => y(d.exam_score + jitter(d.student_id, 0.6)))
        .attr("r", 2)
        .attr("fill", "#0f0063ff")
        .attr("opacity", 0.55)
        .on("mousemove", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              `<b>Sleep hours:</b> ${d.sleep_hours}<br/>
               <b>Exam score:</b> ${d.exam_score}`
            )
            .style("left", `${event.offsetX + 20}px`)
            .style("top", `${event.offsetY}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
    }
//axis labels
    svg
      .append("text")
      .attr("x", margin.left + plotW / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(mode === "hours" ? "Sleep Hours" : "Sleep Quality");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + plotH / 2))
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(mode === "hours" ? "Exam Score" : "Average Exam Score");
  }, [data, sampled, aggregated, mode]);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={ref} />
      {mode === "hours" && (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          Showing a random sample of {sampled.length.toLocaleString()} /{" "}
          {data.length.toLocaleString()} students
        </div>
      )}
    </div>
  );
}

export default SleepHabitsBar;
