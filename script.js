var data;

d3.csv('ds_salaries.csv', function (dataset) {
  data = dataset.map(function (d) {
    d.salary_in_usd = +d.salary_in_usd;
    d.remote_ratio = +d.remote_ratio;
    d.salary = +d.salary;
    d.work_year = +d.work_year;
    return d;
  });
  buildPlot();
});

function buildPlot() {
  var w = 600;
  var h = 500;
  var padding = 40;

  var svgFrame = d3.select('body')
    .append('svg')
    .attr('width', w)
    .attr('height', h);

  var xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.salary_in_usd)])
    .range([padding, w - padding]);

  var yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.salary_in_usd)])
    .range([h - padding, padding]);

  var xAxis = d3.axisBottom().scale(xScale);
  var yAxis = d3.axisLeft().scale(yScale);

  svgFrame.append('g')
    .attr('class', 'x_axis')
    .attr('transform', 'translate(0,' + (h - padding) + ')')
    .call(xAxis)
    .selectAll("text") // 選擇所有 x 軸標籤
    .attr("transform", "rotate(-45)"); // 旋轉 45 度

  svgFrame.append('g')
    .attr('class', 'y_axis')
    .attr('transform', 'translate(' + padding + ',0)')
    .call(yAxis);

  svgFrame.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.salary_in_usd))
    .attr('cy', d => yScale(d.salary_in_usd))
    .attr('r', 4.5)
    .attr('fill', 'steelblue');

  d3.select("#xAxis").on("change", updateScales);
  d3.select("#yAxis").on("change", updateScales);

  function updateScales() {
    var xAttr = d3.select("#xAxis").property("value");
    var yAttr = d3.select("#yAxis").property("value");

    xScale.domain([0, d3.max(data, d => d[xAttr])]);
    yScale.domain([0, d3.max(data, d => d[yAttr])]);

    svgFrame.select(".x_axis")
      .transition()
      .duration(1000)
      .call(xAxis)
      .selectAll("text") // 選擇所有 x 軸標籤
      .attr("transform", "rotate(-45)"); // 旋轉 45 度

    svgFrame.select(".y_axis")
      .transition()
      .duration(1000)
      .call(yAxis);

    svgFrame.selectAll("circle")
      .transition()
      .duration(1000)
      .attr("cx", d => xScale(d[xAttr]))
      .attr("cy", d => yScale(d[yAttr]));
  }
}
