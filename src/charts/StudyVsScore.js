import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";

function StudyHoursScatter({ data, sampleSize = 1000, xField = "study_hours" }) {
    const ref = useRef();

    const xMeta = useMemo(() => {
        // label shown on axis + tooltip
        if (xField === "class_attendance") return { label: "Class Attendance (%)", key: "class_attendance" };
        return { label: "Study Hours", key: "study_hours" };
    }, [xField]);

    // sample a subset to reduce clutter
    const sampled = useMemo(() => {
        if (!data?.length) return [];
        const n = Math.min(sampleSize, data.length);
        return d3.shuffle([...data]).slice(0, n);
    }, [data, sampleSize]);

    useEffect(() => {
        if (!sampled.length) return;

        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        // layout
        const width = 700;
        const height = 370;
        const legendWidth = 160;
        const margin = { top: 20, right: 20 + legendWidth, bottom: 60, left: 70 };

        svg.attr("width", width).attr("height", height);

        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // scales
        const x = d3
            .scaleLinear()
            .domain(d3.extent(sampled, d => +d[xMeta.key]))
            .nice()
            .range([0, plotW]);

        const y = d3
            .scaleLinear()
            .domain(d3.extent(sampled, d => d.exam_score))
            .nice()
            .range([plotH, 0]);

        // categories + color
        const difficulties = Array.from(new Set(sampled.map(d => d.exam_difficulty)));
        const color = d3.scaleOrdinal().domain(difficulties).range(d3.schemeTableau10);

        // axes
        g.append("g")
            .attr("transform", `translate(0,${plotH})`)
            .call(d3.axisBottom(x));

        g.append("g").call(d3.axisLeft(y));

        // axis labels
        svg.append("text")
            .attr("x", margin.left + plotW / 2)
            .attr("y", height - 15)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(xMeta.label);

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(margin.top + plotH / 2))
            .attr("y", 18)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Exam Score");

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

        // points
        g.selectAll("circle")
            .data(sampled)
            .enter()
            .append("circle")
            .attr("cx", d => x(+d[xMeta.key]))
            .attr("cy", d => y(d.exam_score))
            .attr("r", 3)
            .attr("fill", d => color(d.exam_difficulty))
            .attr("opacity", 0.55)
            .on("mousemove", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(
                        `<div><b>${xMeta.label}:</b> ${(+d[xMeta.key]).toFixed(2)}</div>
             <div><b>Exam Score:</b> ${d.exam_score}</div>
             <div><b>Difficulty:</b> ${d.exam_difficulty}</div>`
                    )
                    .style("left", `${event.offsetX + 20}px`)
                    .style("top", `${event.offsetY}px`);
            })
            .on("mouseleave", () => tooltip.style("opacity", 0));

        // legend
        const legendX = margin.left + plotW + 30;
        const legendY = margin.top;

        const legend = svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`);

        legend.append("text")
            .attr("x", 0)
            .attr("y", -6)
            .style("font-size", "12px")
            .style("font-weight", "600")
            .text("Exam Difficulty");

        difficulties.forEach((k, i) => {
            const row = legend.append("g").attr("transform", `translate(0, ${i * 18})`);
            row.append("rect").attr("width", 10).attr("height", 10).attr("fill", color(k));
            row.append("text").attr("x", 14).attr("y", 9).style("font-size", "12px").text(k);
        });
    }, [sampled, xMeta]);

    return (
        <div style={{ position: "relative" }}>
            <svg ref={ref} />
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                Showing a random sample of {sampled.length.toLocaleString()} / {data.length.toLocaleString()} students
            </div>
        </div>
    );
}

export default StudyHoursScatter;
