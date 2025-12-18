import * as d3 from "d3";
import { useEffect, useRef } from "react";

function ScoreHistogram({ data, binsCount = 10 }) {
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
        if (!data?.length) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // dimensions/margins
        const width = 540;
        const height = 430;
        const margin = { top: 40, right: 20, bottom: 55, left: 60 };

        svg.attr("width", width).attr("height", height);

        // --- tooltip (HTML overlay div) ---
        let tooltip = d3.select(tooltipRef.current);
        if (tooltip.empty()) {
            tooltip = d3
                .select("body")
                .append("div")
                .attr("id", "hist-tooltip")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background", "white")
                .style("border", "1px solid #ccc")
                .style("border-radius", "6px")
                .style("padding", "8px")
                .style("font-size", "12px")
                .style("opacity", 0);
            tooltipRef.current = tooltip.node();
        }

        const scores = data.map(d => d.exam_score).filter(v => Number.isFinite(v));

        // scales
        const xDomain = d3.extent(scores);
        const xMin = xDomain?.[0] ?? 0;
        const xMax = xDomain?.[1] ?? 100;

        const x = d3
            .scaleLinear()
            .domain([Math.floor(xMin), Math.ceil(xMax)])
            .nice()
            .range([margin.left, width - margin.right]);

        const bins = d3
            .bin()
            .domain(x.domain())
            .thresholds(binsCount)(scores);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(bins, d => d.length) ?? 0])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // bars
        svg
            .selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("x", d => x(d.x0))
            .attr("y", d => y(d.length))
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("height", d => height - margin.bottom - y(d.length))
            .attr("fill", "#69b3a2")
            .on("mousemove", (event, d) => {
                const [mx, my] = d3.pointer(event);
                const range = d.x1.toFixed(1) == 100 ?
                `${d.x0.toFixed(1)} – ${d.x1.toFixed(1)}` :
                `${d.x0.toFixed(1)} – ${(d.x1 - 0.01).toFixed(2)}`;

                d3.select(tooltipRef.current)
                    .style("opacity", 1)
                    .html(
                        `<div><strong>Score range:</strong> ${range}</div>
             <div><strong>Students:</strong> ${d.length}</div>`
                    )
                    .style("left", `${event.pageX + 12}px`)
                    .style("top", `${event.pageY + 12}px`);
            })
            .on("mouseleave", () => {
                d3.select(tooltipRef.current).style("opacity", 0);
            });

        // x axis
        svg
            .append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        // y axis
        svg
            .append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(y).ticks(6));

        // x label
        svg
            .append("text")
            .attr("x", (margin.left + (width - margin.right)) / 2)
            .attr("y", height - 12)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Exam Score");

        // y label
        svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(margin.top + (height - margin.bottom)) / 2)
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Number of Students");

        return () => {
        };
    }, [data, binsCount]);

    return <svg ref={svgRef} />;
}

export default ScoreHistogram;
