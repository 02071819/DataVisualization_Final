var data;

d3.csv('ds_salaries.csv', function(dataset) {
  data = dataset.map(function(d) {
    d.salary_in_usd = +d.salary_in_usd;
    return d;
  });
  buildBarChart();
});

function buildBarChart() {
  var w = 800;
  var h = 600;
  var padding = 50;

  var svg = d3.select('#barchart')
    .attr('width', w)
    .attr('height', h);

  // Group data by job_title and calculate the total salary_in_usd for each job_title
  var jobTitleSums = d3.nest()
    .key(function(d) { return d.job_title; })
    .rollup(function(v) { 
      return {
        total: d3.sum(v, function(d) { return d.salary_in_usd; }),
        details: v
      };
    })
    .entries(data);

  var jobTitles = jobTitleSums.map(function(d) { return d.key; });

  var xScale = d3.scaleLinear()
    .domain([0, d3.max(jobTitleSums, function(d) { return d.value.total; })])
    .range([padding, w - padding]);

  var yScale = d3.scaleBand()
    .domain(jobTitles)
    .range([padding, h - padding])
    .padding(0.1);

  var colorScale = d3.scaleOrdinal()
    .domain(['SE', 'MI', 'EN', 'EX'])
    .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']);

  var xAxis = d3.axisBottom().scale(xScale);
  var yAxis = d3.axisLeft().scale(yScale);

  svg.append('g')
    .attr('class', 'x_axis')
    .attr('transform', 'translate(0,' + (h - padding) + ')')
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y_axis')
    .attr('transform', 'translate(' + padding + ',0)')
    .call(yAxis);

  function updateBarChart() {
    var selectedLevels = d3.selectAll(".checkboxPanel input:checked").nodes().map(d => d.value);

    var filteredData = jobTitleSums.map(function(d) {
      var entry = { job_title: d.key };
      selectedLevels.forEach(function(level) {
        entry[level] = d3.sum(d.value.details.filter(function(e) { return e.experience_level === level; }), function(e) { return e.salary_in_usd; });
      });
      return entry;
    });

    var stack = d3.stack()
      .keys(selectedLevels)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    var series = stack(filteredData);

    xScale.domain([0, d3.max(series, s => d3.max(s, d => d[1]))]);

    svg.selectAll('.layer').remove();

    var layers = svg.selectAll('.layer')
      .data(series)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .style('fill', d => colorScale(d.key));

    layers.selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('y', d => yScale(d.data.job_title))
      .attr('x', d => xScale(d[0]))
      .attr('width', d => xScale(d[1]) - xScale(d[0]))
      .attr('height', yScale.bandwidth());

    svg.select(".x_axis")
      .transition()
      .duration(1000)
      .call(xAxis);
  }

  d3.selectAll(".checkboxPanel input").on("change", updateBarChart);

  updateBarChart();
}
