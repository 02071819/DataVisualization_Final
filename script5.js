// 初始化圖表和篩選選項
const margin = { top: 20, right: 30, bottom: 40, left: 40 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleBand().range([0, width]).padding(0.1);
const y = d3.scaleLinear().range([height, 0]);

const xAxis = svg
  .append("g")
  .attr("transform", `translate(0,${height})`)
  .attr("class", "axis-label");

const yAxis = svg.append("g").attr("class", "axis-label");

// 初始化面積圖
const lineMargin = { top: 20, right: 30, bottom: 40, left: 40 },
  lineWidth = 960 - lineMargin.left - lineMargin.right,
  lineHeight = 300 - lineMargin.top - lineMargin.bottom;

const lineSvg = d3
  .select("#lineChart")
  .append("svg")
  .attr("width", lineWidth + lineMargin.left + lineMargin.right)
  .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
  .append("g")
  .attr("transform", `translate(${lineMargin.left},${lineMargin.top})`);

const lineX = d3.scaleLinear().range([0, lineWidth]);
const lineY = d3.scaleLinear().range([lineHeight, 0]);

const lineXAxis = lineSvg
  .append("g")
  .attr("transform", `translate(0,${lineHeight})`)
  .attr("class", "axis-label");

const lineYAxis = lineSvg.append("g").attr("class", "axis-label");

const color = d3.scaleOrdinal(d3.schemeCategory10);

const area = d3
  .area()
  .x((d) => lineX(d.data.work_year))
  .y0((d) => lineY(d[0]))
  .y1((d) => lineY(d[1]));

// 散佈圖設置
const scatterMargin = { top: 20, right: 30, bottom: 40, left: 40 },
  scatterWidth = 960 - scatterMargin.left - scatterMargin.right,
  scatterHeight = 500 - scatterMargin.top - scatterMargin.bottom;

const scatterSvg = d3
  .select("#scatterPlot")
  .append("svg")
  .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
  .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
  .append("g")
  .attr("transform", `translate(${scatterMargin.left},${scatterMargin.top})`);

const scatterX = d3.scaleLinear().range([0, scatterWidth]);
const scatterY = d3.scaleLinear().range([scatterHeight, 0]);

const scatterXAxis = scatterSvg
  .append("g")
  .attr("transform", `translate(0,${scatterHeight})`)
  .attr("class", "axis-label");

const scatterYAxis = scatterSvg.append("g").attr("class", "axis-label");

// 添加tooltip元素
const tooltip = d3.select(".tooltip");

// 讀取資料並初始化圖表
d3.csv("ds_salaries.csv").then((data) => {
  data.forEach((d) => {
    d.salary_in_usd = +d.salary_in_usd;
    d.remote_ratio = +d.remote_ratio;
    d.work_year = +d.work_year; // 確保 work_year 是數字
  });

  // 初始化篩選選項
  const years = Array.from(new Set(data.map((d) => d.work_year)));
  const yearFilter = d3.select("#yearFilter");
  years.forEach((year) => {
    yearFilter.append("option").attr("value", year).text(year);
  });

  const jobs = Array.from(new Set(data.map((d) => d.job_title)));
  const jobFilter = d3.select("#jobFilter");
  jobs.forEach((job) => {
    jobFilter
      .append("div")
      .attr("class", "job-checkbox")
      .append("label")
      .html(
        `<input type="checkbox" value="${job}" checked onchange="updateChart()"> ${job}`
      );
  });

  // 初始顯示所有資料
  updateChart(data);

  // 定義更新圖表的函數
  function updateChart(filteredData = data) {
    const selectedYear = d3.select("#yearFilter").property("value");
    const selectedJobs = Array.from(
      document.querySelectorAll("#jobFilter input:checked")
    ).map((input) => input.value);

    const displayData = data.filter(
      (d) =>
        (selectedYear === "all" || d.work_year == selectedYear) &&
        selectedJobs.includes(d.job_title)
    );

    x.domain(displayData.map((d) => d.job_title));
    y.domain([0, d3.max(displayData, (d) => d.salary_in_usd)]);

    xAxis
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    yAxis.call(d3.axisLeft(y));

    const bars = svg.selectAll(".bar").data(displayData);

    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.job_title))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.salary_in_usd))
      .attr("height", (d) => height - y(d.salary_in_usd));

    bars
      .attr("x", (d) => x(d.job_title))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.salary_in_usd))
      .attr("height", (d) => height - y(d.salary_in_usd));

    bars.exit().remove();

    // 更新堆積面積圖
    const nestedData = d3
      .groups(displayData, (d) => d.work_year)
      .map(([key, values]) => {
        const jobData = { work_year: key };
        values.forEach((d) => {
          jobData[d.job_title] = (jobData[d.job_title] || 0) + 1;
        });
        return jobData;
      });

    const keys = Array.from(new Set(displayData.map((d) => d.job_title)));
    const stack = d3.stack().keys(keys);

    lineX.domain(d3.extent(displayData, (d) => d.work_year));
    lineY.domain([
      0,
      d3.max(nestedData, (d) =>
        keys.reduce((acc, key) => acc + (d[key] || 0), 0)
      ),
    ]);

    lineXAxis.call(d3.axisBottom(lineX).tickFormat(d3.format("d")));
    lineYAxis.call(d3.axisLeft(lineY));

    const stackData = stack(nestedData);

    const areas = lineSvg.selectAll(".area").data(stackData, (d) => d.key);

    areas
      .enter()
      .append("path")
      .attr("class", "area")
      .attr("d", area)
      .style("fill", (d) => color(d.key))
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        const year = lineX.invert(event.layerX);
        const tooltipData = nestedData.find(
          (nd) => nd.work_year === Math.round(year)
        );
        tooltip
          .html(getTooltipHtml(tooltipData, Math.round(year)))
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    areas.attr("d", area);

    areas.exit().remove();

    // 添加圖例
    const legend = lineSvg.selectAll(".legend").data(keys, (d) => d);

    const legendEnter = legend
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legendEnter
      .append("rect")
      .attr("x", lineWidth + 20)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", (d) => color(d));

    legendEnter
      .append("text")
      .attr("x", lineWidth + 45)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text((d) => d);

    legend.exit().remove();

    // 更新散佈圖
    updateScatterPlot(displayData);
  }

  function updateScatterPlot(data) {
    const xAxisVariable = d3.select("#xAxisSelect").property("value");
    const yAxisVariable = d3.select("#yAxisSelect").property("value");

    scatterX.domain([0, d3.max(data, (d) => d[xAxisVariable])]);
    scatterY.domain([0, d3.max(data, (d) => d[yAxisVariable])]);

    scatterXAxis.call(d3.axisBottom(scatterX));
    scatterYAxis.call(d3.axisLeft(scatterY));

    const points = scatterSvg.selectAll(".point").data(data);

    points
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", (d) => scatterX(d[xAxisVariable]))
      .attr("cy", (d) => scatterY(d[yAxisVariable]))
      .attr("r", 5)
      .style("fill", (d) => color(d.job_title))
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `Job: ${d.job_title}<br>${xAxisVariable}: ${d[xAxisVariable]}<br>${yAxisVariable}: ${d[yAxisVariable]}`
          )
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    points
      .attr("cx", (d) => scatterX(d[xAxisVariable]))
      .attr("cy", (d) => scatterY(d[yAxisVariable]))
      .attr("r", 5)
      .style("fill", (d) => color(d.job_title));

    points.exit().remove();
  }

  // 使 updateChart 和 updateScatterPlot 函數在全局範圍內可訪問
  window.updateChart = () => {
    const selectedYear = d3.select("#yearFilter").property("value");
    const selectedJobs = Array.from(
      document.querySelectorAll("#jobFilter input:checked")
    ).map((input) => input.value);

    const displayData = data.filter(
      (d) =>
        (selectedYear === "all" || d.work_year == selectedYear) &&
        selectedJobs.includes(d.job_title)
    );

    updateChart(displayData);
  };

  window.updateScatterPlot = () => {
    const selectedYear = d3.select("#yearFilter").property("value");
    const selectedJobs = Array.from(
      document.querySelectorAll("#jobFilter input:checked")
    ).map((input) => input.value);

    const displayData = data.filter(
      (d) =>
        (selectedYear === "all" || d.work_year == selectedYear) &&
        selectedJobs.includes(d.job_title)
    );

    updateScatterPlot(displayData);
  };

  function getTooltipHtml(data, year) {
    let html = `<strong>${year}年</strong><br/>`;
    Object.keys(data).forEach((key) => {
      if (key !== "work_year") {
        html += `<span style="color:${color(key)}">${key}</span>: ${
          data[key]
        }<br/>`;
      }
    });
    return html;
  }
});
