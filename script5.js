function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const hamburgerMenu = document.getElementById("hamburgerMenu");

  if (sidebar.classList.contains("open")) {
    sidebar.classList.remove("open");
    hamburgerMenu.innerHTML = "&#9776;"; // Hamburger icon
  } else {
    sidebar.classList.add("open");
    hamburgerMenu.innerHTML = "&times;"; // Close icon
  }
}

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

const locationMapping = {
  US: "United States of America",
  CA: "Canada",
  BR: "Brazil",
  CL: "Chile",
  CO: "Colombia",
  MX: "Mexico",
  RU: "Russia",
  HN: "Honduras",
  CN: "China",
  FR: "France",
  GB: "United Kingdom",
  IE: "Ireland",
  ES: "Spain",
  PT: "Portugal",
  IN: "India",
  AU: "Australia",
  NZ: "New Zealand",
  MY: "Malaysia",
  PK: "Pakistan",
  IR: "Iran",
  TR: "Turkey",
  IQ: "Iraq",
  UA: "Ukraine",
  RO: "Romania",
  PL: "Poland",
  JP: "Japan",
  VN: "Vietnam",
  HU: "Hungary",
  IT: "Italy",
  SI: "Slovania",
  AT: "Austria",
  DE: "Germany",
  NL: "Netherland",
  BE: "Belgium",
  DZ: "Algeria",
  NG: "Nigeria",
  KE: "Kenya",
  DK: "Denmark",
  NL: "Netherlands",
  CZ: "Czechia",
  CH: "Switzerland",
  // 添加其他映射
};

const xAxis = svg
  .append("g")
  .attr("transform", `translate(0,${height})`)
  .attr("class", "axis-label");

const yAxis = svg.append("g").attr("class", "axis-label");

// 初始化地理圖
const worldMapSvg = d3
  .select("#worldMap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const projection = d3
  .geoNaturalEarth1()
  .scale(150)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const colorScale = d3.scaleSequential(d3.interpolateGreens);

// 初始化折線面積圖
const lineMargin = { top: 20, right: 30, bottom: 40, left: 40 },
  lineWidth = 1160 - lineMargin.left - lineMargin.right,
  lineHeight = 300 - lineMargin.top - lineMargin.bottom;

const lineSvg = d3
  .select("#lineChart")
  .append("svg")
  .attr("width", lineWidth + lineMargin.left + lineMargin.right)
  .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
  // .append("g")
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
    d.company_location = d.company_location || "Unknown"; // 確保 company_location 有效
  });

  // 初始化篩選選項
  const years = Array.from(new Set(data.map((d) => d.work_year)));
  const yearFilter = d3.select("#yearFilter");
  years.forEach((year) => {
    yearFilter.append("option").attr("value", year).text(year);
  });
  /*
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
    });*/

  // 計算每個工作標題的數量
  const jobCounts = Array.from(d3.rollup(
    data,
    v => v.length,
    d => d.job_title
  ), ([job_title, count]) => ({ job_title, count }))
    .sort((a, b) => d3.descending(a.count, b.count))
    .slice(0, 10); // 只取前十筆

  // 初始化job title篩選選項
  const jobs = Array.from(new Set(data.map((d) => d.job_title)));
  const jobFilter = d3.select("#jobFilter");
  jobs.forEach((job) => {
    const checked = jobCounts.some(j => j.job_title === job) ? 'checked' : '';
    jobFilter
      .append("div")
      .attr("class", "job-checkbox")
      .append("label")
      .html(
        `<input type="checkbox" value="${job}" ${checked} onchange="updateChart()"> ${job}`
      );
  }); //0526更新

  // 餅圖設置
  const pieMargin = { top: 20, right: 30, bottom: 40, left: 40 },
    pieWidth = 350 - pieMargin.left - pieMargin.right,
    pieHeight = 350 - pieMargin.top - pieMargin.bottom,
    pieRadius = Math.min(pieWidth, pieHeight) / 2;

  const pieSvg = d3
    .select("#pieChart")
    .append("svg")
    .attr("width", pieWidth + pieMargin.left + pieMargin.right)
    .attr("height", pieHeight + pieMargin.top + pieMargin.bottom)
    .append("g")
    .attr(
      "transform",
      `translate(${pieWidth / 2 + pieMargin.left},${pieHeight / 2 + pieMargin.top
      })`
    );

  const pieSvg2 = d3
    .select("#pieChart2")
    .append("svg")
    .attr("width", pieWidth + pieMargin.left + pieMargin.right)
    .attr("height", pieHeight + pieMargin.top + pieMargin.bottom)
    .append("g")
    .attr(
      "transform",
      `translate(${pieWidth / 2 + pieMargin.left},${pieHeight / 2 + pieMargin.top
      })`
    );

  // 處理並繪製第一個圓餅圖
  const experienceLevelData = Array.from(
    d3.rollup(
      data,
      (v) => v.length,
      (d) => d.experience_level
    ),
    ([key, value]) => ({ key, value })
  );

  const pie = d3.pie().value((d) => d.value);

  const arc = d3
    .arc()
    .outerRadius(pieRadius - 10)
    .innerRadius(pieRadius - 70);

  const pieColor = d3
    .scaleOrdinal()
    .domain(experienceLevelData.map((d) => d.key))
    .range(d3.schemeCategory10);

  const g = pieSvg
    .selectAll(".arc")
    .data(pie(experienceLevelData))
    .enter()
    .append("g")
    .attr("class", "arc");

  g.append("path")
    .attr("d", arc)
    .style("fill", (d) => pieColor(d.data.key));

  g.append("text")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .attr("dy", ".35em")
    .style("font-size", "15px")
    .style("text-anchor", "middle")
    .style("font-weight", "700")
    .text(
      (d) =>
        `${d.data.key}: ${(
          (d.data.value / d3.sum(experienceLevelData.map((dd) => dd.value))) *
          100
        ).toFixed(1)}%`
    );

  // 添加第一個圓餅圖的圖例
  const legend = pieSvg
    .append("g")
    .attr("transform", `translate(${pieWidth / 2},${-pieHeight / 2 + 20})`);

  const legendItem = legend
    .selectAll(".legend-item")
    .data(pieColor.domain())
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legendItem
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", pieColor);

  legendItem
    .append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text((d) => d);

  // 處理並繪製第二個圓餅圖
  const companysizeData = Array.from(
    d3.rollup(
      data,
      (v) => v.length,
      (d) => d.company_size
    ),
    ([key, value]) => ({ key, value })
  );

  const pie2 = d3.pie().value((d) => d.value);

  const arc2 = d3
    .arc()
    .outerRadius(pieRadius - 10)
    .innerRadius(pieRadius - 90);

  const pieColor2 = d3
    .scaleOrdinal()
    .domain(companysizeData.map((d) => d.key))
    .range(d3.schemeCategory10);

  const g2 = pieSvg2
    .selectAll(".arc")
    .data(pie2(companysizeData))
    .enter()
    .append("g")
    .attr("class", "arc");

  g2.append("path")
    .attr("d", arc2)
    .style("fill", (d) => pieColor2(d.data.key));

  g2.append("text")
    .attr("transform", (d) => `translate(${arc2.centroid(d)})`)
    .attr("dy", ".35em")
    .style("font-size", "15px")
    .style("text-anchor", "middle")
    .style("font-weight", "700")
    .text(
      (d) =>
        `${d.data.key}: ${(
          (d.data.value / d3.sum(companysizeData.map((dd) => dd.value))) *
          100
        ).toFixed(1)}%`
    );

  // 添加第二個圓餅圖的圖例
  const legend2 = pieSvg2
    .append("g")
    .attr("transform", `translate(${pieWidth / 2},${-pieHeight / 2 + 20})`);

  const legendItem2 = legend2
    .selectAll(".legend-item")
    .data(pieColor2.domain())
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legendItem2
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", pieColor2);

  legendItem2
    .append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text((d) => d);

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

    // 計算每個工作標題的數量
    /*const jobCounts = Array.from(d3.rollup(
      displayData,
      v => v.length,
      d => d.job_title
      ), ([job_title, count]) => ({ job_title, count }))
      .sort((a, b) => d3.descending(a.count, b.count))
      .slice(0, 10); // 只取前十筆

    // 過濾顯示數據，只保留前十個工作標題的數據
    const filteredDisplayData = displayData.filter(d => jobCounts.map(j => j.job_title).includes(d.job_title));
    */
    const jobCounts = Array.from(d3.rollup(
      displayData,
      v => v.length,
      d => d.job_title
    ), ([job_title, count]) => ({ job_title, count }))
      .sort((a, b) => d3.descending(a.count, b.count))
    //.slice(0, 10); // 只取前十筆0528註解此行

  // 確保選擇的 job_titles 也包含在前十名中
  const selectedJobCounts = jobCounts.filter(j => selectedJobs.includes(j.job_title));
  const remainingSlots = Math.max(10 - selectedJobCounts.length, 0);
  const topJobCounts = jobCounts.filter(j => !selectedJobs.includes(j.job_title)).slice(0, remainingSlots);
  const finalJobCounts = selectedJobCounts.concat(topJobCounts);

  // 過濾顯示數據，只保留最終選中的前十個工作標題的數據
  const filteredDisplayData = displayData.filter(d => finalJobCounts.map(j => j.job_title).includes(d.job_title));
   
    //0526更新   

    x.domain(finalJobCounts.map((d) => d.job_title));
    y.domain([0, d3.max(filteredDisplayData, (d) => d.salary_in_usd)]);

    xAxis
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    yAxis.call(d3.axisLeft(y));

    const bars = svg.selectAll(".bar").data(filteredDisplayData);

    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.job_title))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.salary_in_usd))
      .attr("height", (d) => height - y(d.salary_in_usd))

    bars
      .attr("x", (d) => x(d.job_title))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.salary_in_usd))
      .attr("height", (d) => height - y(d.salary_in_usd));

    bars.exit().remove();
    /*
     // 更新圖例
     const legend2 = svg.selectAll(".legend-item").data(jobCounts);

     const legendEnter2 = legend2.enter().append("g").attr("class", "legend-item");
 
     legendEnter2
         .append("rect")
         .attr("x", width + 20)
         .attr("width", 18)
         .attr("height", 18)
         .style("fill", (d, i) => d3.schemeCategory10[i % 10]);
 
     legendEnter2
         .append("text")
         .attr("x", width + 45)
         .attr("y", 9)
         .attr("dy", ".35em")
         .style("text-anchor", "start")
         .text((d) => d.job_title);
 
     legend2
         .merge(legendEnter2)
         .attr("transform", (d, i) => `translate(0, ${i * 20})`)
         .select("rect")
         .style("fill", (d, i) => d3.schemeCategory10[i % 10]);
 
     legend2
         .select("text")
         .text((d) => d.job_title);
 
     legend2.exit().remove();
*/
    // 更新圖例
    svg.selectAll(".legend-item").remove();

    const legend3 = svg.selectAll(".legend-item").data(finalJobCounts, d => d.job_title);

    //legend3.exit().remove(); // 移除不再存在的圖例項

    const legendEnter3 = legend3.enter().append("g").attr("class", "legend-item");

    legendEnter3
      .append("rect")
      .attr("x", width + 20)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", (d, i) => d3.schemeCategory10[i % 10]);

    legendEnter3
      .append("text")
      .attr("x", width + 45)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text((d) => d.job_title);

    legend3
      .merge(legendEnter3)
      .attr("transform", (d, i) => `translate(0, ${i * 20})`)
      .select("rect")
      .style("fill", (d, i) => d3.schemeCategory10[i % 10]);

    legend3
      .merge(legendEnter3)
      .select("text")
      .text((d) => d.job_title);

    //legend3.exit().remove();
    //0526更新

    // 更新地理圖
    updateWorldMap(filteredDisplayData);

    // 更新堆積面積圖
    const nestedData = d3
      .groups(filteredDisplayData, (d) => d.work_year)
      .map(([key, values]) => {
        const jobData = { work_year: key };
        values.forEach((d) => {
          jobData[d.job_title] = (jobData[d.job_title] || 0) + 1;
        });
        return jobData;
      });

    /*const keys = Array.from(new Set(displayData.map((d) => d.job_title)));
    const stack = d3.stack().keys(keys);*/
    const keys = finalJobCounts.map(d => d.job_title);
    const stack = d3.stack().keys(keys);

    lineX.domain(d3.extent(filteredDisplayData, (d) => d.work_year));
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

    // 添加堆積面積圖圖例
    const legend = lineSvg.selectAll(".legend").data(keys, (d) => d);

    legend.exit().remove(); // 移除不再存在的圖例項  

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
    updateScatterPlot(filteredDisplayData);

    // 更新圓餅圖
    updatePieCharts(filteredDisplayData);
  }
  // 定義更新圓餅圖的函數
  function updatePieCharts(data) {
    // 更新第一個圓餅圖
    const experienceLevelData = Array.from(
      d3.rollup(
        data,
        (v) => v.length,
        (d) => d.experience_level
      ),
      ([key, value]) => ({ key, value })
    );

    const pie = d3.pie().value((d) => d.value);

    const arc = d3
      .arc()
      .outerRadius(pieRadius - 10)
      .innerRadius(pieRadius - 90);

    const pieColor = d3
      .scaleOrdinal()
      .domain(experienceLevelData.map((d) => d.key))
      .range(d3.schemeCategory10);

    const g = pieSvg.selectAll(".arc").data(pie(experienceLevelData));

    g.enter()
      .append("g")
      .attr("class", "arc")
      .append("path")
      .attr("d", arc)
      .style("fill", (d) => pieColor(d.data.key))
      .merge(g.select("path"))
      .attr("d", arc)
      .style("fill", (d) => pieColor(d.data.key));

    g.select("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("dy", ".35em")
      .style("font-size", "15px")
      .style("text-anchor", "middle")
      .style("font-weight", "700")
      .text(
        (d) =>
          `${d.data.key}: ${(
            (d.data.value / d3.sum(experienceLevelData.map((dd) => dd.value))) *
            100
          ).toFixed(1)}%`
      );

    g.exit().remove();

    // 更新第二個圓餅圖
    const companySizeData = Array.from(
      d3.rollup(
        data,
        (v) => v.length,
        (d) => d.company_size
      ),
      ([key, value]) => ({ key, value })
    );

    const pie2 = d3.pie().value((d) => d.value);

    const arc2 = d3
      .arc()
      .outerRadius(pieRadius - 10)
      .innerRadius(pieRadius - 90);

    const pieColor2 = d3
      .scaleOrdinal()
      .domain(companySizeData.map((d) => d.key))
      .range(d3.schemeCategory10);

    const g2 = pieSvg2.selectAll(".arc").data(pie2(companySizeData));

    g2.enter()
      .append("g")
      .attr("class", "arc")
      .append("path")
      .attr("d", arc2)
      .style("fill", (d) => pieColor2(d.data.key))
      .merge(g2.select("path"))
      .attr("d", arc2)
      .style("fill", (d) => pieColor2(d.data.key));

    g2.select("text")
      .attr("transform", (d) => `translate(${arc2.centroid(d)})`)
      .attr("dy", ".35em")
      .style("font-size", "15px")
      .style("text-anchor", "middle")
      .style("font-weight", "700")
      .text(
        (d) =>
          `${d.data.key}: ${(
            (d.data.value / d3.sum(companySizeData.map((dd) => dd.value))) *
            100
          ).toFixed(1)}%`
      );

    g2.exit().remove();
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

  function updateWorldMap(data) {
    const locationCount = d3.rollup(
      data,
      (v) => v.length,
      (d) => locationMapping[d.company_location] || d.company_location
    );

    colorScale.domain([0, d3.max(Array.from(locationCount.values()))]);

    d3.json("world-110m.json").then((worldData) => {
      const countries = worldData.features;

      const paths = worldMapSvg.selectAll("path").data(countries);

      paths
        .enter()
        .append("path")
        .attr("d", path)
        .merge(paths)
        .attr("fill", (d) => {
          const count = locationCount.get(d.properties.name) || 0;
          return count > 0 ? colorScale(count) : "#ccc";
        })
        .attr("stroke", "#000") // 添加黑色邊界線
        .attr("stroke-width", 0.5)
        .on("mouseover", function (event, d) {
          const count = locationCount.get(d.properties.name) || 0;
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(`${d.properties.name}: ${count}`)
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

      paths.exit().remove();

      // 檢查圖例是否已存在，避免重複生成
      if (!d3.select("#legendContainer svg").empty()) {
        return;
      }

      // 添加地理圖圖例
      const legendWidth = 300;
      const legendHeight = 10;
      const legendSvg = d3
        .select("#legendContainer")
        .append("svg")
        .attr("width", legendWidth)
        .attr("height", 50);

      const defs = legendSvg.append("defs");

      const linearGradient = defs
        .append("linearGradient")
        .attr("id", "linear-gradient");

      linearGradient
        .selectAll("stop")
        .data(
          colorScale.ticks().map((t, i, n) => ({
            offset: `${(100 * i) / n.length}%`,
            color: colorScale(t),
          }))
        )
        .enter()
        .append("stop")
        .attr("offset", (d) => d.offset)
        .attr("stop-color", (d) => d.color);

      legendSvg
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)");

      legendSvg
        .append("text")
        .attr("x", legendWidth - 20)
        .attr("y", 30)
      // .text(d3.max(Array.from(locationCount.values())));

      legendSvg
        .append("text")
        .attr("x", legendWidth / 2 - 20)
        .attr("y", 50)
        .text("公司總數");

      legendSvg
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(
          d3
            .axisBottom(
              d3
                .scaleLinear()
                .domain([0, d3.max(Array.from(locationCount.values()))])
                .range([0, legendWidth])
            )
            .ticks(5)
        );
    });
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
        html += `<span style="color:${color(key)}">${key}</span>: ${data[key]
          }<br/>`;
      }
    });
    return html;
  }
});
