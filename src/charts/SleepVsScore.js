import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";

function SleepHabitsBar({ data, mode = "quality" }) {
    const ref = useRef();

    const aggregated = useMemo(() => {
        if (!data?.length) return [];

        if (mode === "hours") {
            const binLabel = h => {
                if (h < 4) return "0–4";
                if (h < 6) return "4–6";
                if (h < 8) return "6–8";
                if (h < 10) return "8–10";
                return "10+";
            };

            const grouped = d3.group(data, d => binLabel(d.sleep_hours));
            return Array.from(grouped, ([key, rows]) => ({
                key,
                avg: d3.mean(rows, r => r.exam_score),
                n: rows.length,
            }))
                .sort((a, b) => {
                    const order = ["0–4", "4–6", "6–8", "8–10", "10+"];
                    return order.indexOf(a.key) - order.indexOf(b.key);
                });
        }

        // mode === "quality"
        const order = ["poor", "average", "good"];

        const grouped = d3.group(data, d => d.sleep_quality);
        return Array.from(grouped, ([key, rows]) => ({
            key,
            avg: d3.mean(rows, r => r.exam_score),
            n: rows.length,
        }))
            .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

    }, [data, mode]);

    useEffect(() => {
        if (!aggregated.length) return;

        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const width = 560;
        const height = 420;
        const margin = { top: 20, right: 20, bottom: 70, left: 70 };

        svg.attr("width", width).attr("height", height);

        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3
            .scaleBand()
            .domain(aggregated.map(d => d.key))
            .range([0, plotW])
            .padding(0.25);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(aggregated, d => d.avg) || 0])
            .nice()
            .range([plotH, 0]);

        // axes
        g.append("g")
            .attr("transform", `translate(0,${plotH})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-20)")
            .style("text-anchor", "end");

        g.append("g").call(d3.axisLeft(y));

        // labels
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
            .text("Average Exam Score");

        // tooltip
        const container = d3.select(svg.node().parentNode);
        let tooltip = container.select(".tooltip");
        if (tooltip.empty()) {
            tooltip = container
                .append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("opacity", 0)
                .style("background", "white")
                .style("border", "1px solid #ccc")
                .style("padding", "8px")
                .style("border-radius", "6px")
                .style("font-size", "12px");
        }

        // bars
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
                        `<div><b>Group:</b> ${d.key}</div>
             <div><b>Avg score:</b> ${d.avg.toFixed(2)}</div>
             <div><b>Students:</b> ${d.n.toLocaleString()}</div>`
                    )
                    .style("left", `${event.offsetX + 20}px`)
                    .style("top", `${event.offsetY}px`);
            })
            .on("mouseleave", () => tooltip.style("opacity", 0));

        // value labels on top of bars
        g.selectAll(".bar-label")
            .data(aggregated)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("x", d => (x(d.key) || 0) + x.bandwidth() / 2)
            .attr("y", d => y(d.avg) - 6)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .text(d => d.avg.toFixed(1));
    }, [aggregated, mode]);

    return (
        <div style={{ position: "relative" }}>
            <svg ref={ref} />
        </div>
    );
}

export default SleepHabitsBar;
