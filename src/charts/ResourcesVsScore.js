import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";

function AccessFactorsBar({ data, factor = "internet_access" }) {
    const ref = useRef();

    const aggregated = useMemo(() => {
        if (!data?.length) return [];

        const grouped = d3.group(data, d => d[factor]);

        const rows = Array.from(grouped, ([key, vals]) => ({
            key,
            avg: d3.mean(vals, v => v.exam_score),
            n: vals.length,
        }));

        if (factor === "internet_access") {
            const order = ["no", "yes"];
            return rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
        }

        if (factor === "facility_rating") {
            const order = ["low", "medium", "high"];
            return rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
        }

        return rows.sort((a, b) => d3.descending(a.avg, b.avg));
    }, [data, factor]);

    useEffect(() => {
        if (!aggregated.length) return;

        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const width = 580;
        const height = 400;
        const margin = { top: 70, right: 20, bottom: 50, left: 70 };

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
            .attr("y", height - 3)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(() => {
                if (factor === "internet_access") return "Internet Access";
                if (factor === "facility_rating") return "Facility Rating";
                return "Study Method";
            });

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
            .attr("fill", "#6c83ff")
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

        // value labels
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
    }, [aggregated, factor]);

    return (
        <div style={{ position: "relative" }}>
            <svg ref={ref} />
        </div>
    );
}

export default AccessFactorsBar;
