// 設置圖表的寬度和高度
var margin = {top: 20, right: 80, bottom: 50, left: 70},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// 設置 x 軸和 y 軸的比例尺
var x = d3.scalePoint().range([0, width]).padding(0.5),
    y = d3.scaleLinear().range([height, 0]);

// 設置顏色比例尺
var color = d3.scaleOrdinal(d3.schemeCategory10);

// 設置 x 軸和 y 軸
var xAxis = d3.axisBottom(x),
    yAxis = d3.axisLeft(y);

// 設置折線生成器
var line = d3.line()
    .defined(function(d) { return d.salary_in_usd != null; }) // 只繪製有數據的點
    .x(function(d) { return x(d.company_size); })
    .y(function(d) { return y(d.salary_in_usd); });

// 添加 SVG 元素
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// 加載數據
d3.csv("ds_salaries.csv", function(error, data) {
  if (error) throw error;

  // 轉換數據類型
  data.forEach(function(d) {
    d.salary_in_usd = +d.salary_in_usd;
  });

  // 分組數據並計算平均值
  var nested = d3.nest()
    .key(function(d) { return d.work_year; })
    .key(function(d) { return d.company_size; })
    .rollup(function(leaves) {
      return d3.mean(leaves, function(d) { return d.salary_in_usd; });
    })
    .entries(data);

  // 檢查和填補缺失的數據點
  var years = nested.map(function(d) { return d.key; });
  var sizes = ["S", "M", "L"];
  
  nested.forEach(function(year) {
    sizes.forEach(function(size) {
      var found = year.values.find(function(d) { return d.key === size; });
      if (!found) {
        year.values.push({ key: size, value: null });
      }
    });
    year.values.sort(function(a, b) { return sizes.indexOf(a.key) - sizes.indexOf(b.key); });
  });

  // 設置 x 軸和 y 軸的域
  x.domain(sizes);
  y.domain([0, d3.max(nested, function(c) { return d3.max(c.values, function(d) { return d.value; }); })]);

  // 繪製 x 軸和 y 軸
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Company size");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Salary (USD)");

  // 繪製折線圖
  var years = svg.selectAll(".year")
      .data(nested)
    .enter().append("g")
      .attr("class", "year");

  years.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values.map(function(v) { return {company_size: v.key, salary_in_usd: v.value}; })); })
      .style("stroke", function(d) { return color(d.key); });

  // 添加圖例
  var legend = svg.selectAll(".legend")
      .data(nested)
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width + 5)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function(d) { return color(d.key); });

  legend.append("text")
      .attr("x", width + 28)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(function(d) { return d.key; });
});
