var width = 960;
var height = 600;

var svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);

var projection = d3.geoNaturalEarth1()
  .scale(150)
  .translate([width / 2, height / 2]);

var path = d3.geoPath()
  .projection(projection);

// Define a color scale based on the total number of companies
var color = d3.scaleThreshold()
  .domain([1, 5, 10, 20, 50, 100])
  .range(["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"]);

// Create a mapping from company_location to ISO 3166-1 alpha-3 codes
var countryMapping = {
  "DEU": "DEU",
  "JPN": "JPN",
  "GBR": "GBR",
  "HND": "HND",
  "USA": "USA",
  "HUN": "HUN",
  "NZL": "NZL",
  "FRA": "FRA",
  "IND": "IND",
  "PAK": "PAK",
  "CHN": "CHN",
  "GRC": "GRC",
  "ARE": "ARE",
  "NLD": "NLD",
  "MEX": "MEX",
  "CAN": "CAN",
  "AUT": "AUT",
  "NGA": "NGA",
  "ESP": "ESP",
  "PRT": "PRT",
  "DNK": "DNK",
  "POL": "POL",
  "SGP": "SGP",
  "BEL": "BEL",
  "UKR": "UKR",
  "ISR": "ISR",
  "RUS": "RUS",
  "MLT": "MLT",
  "CHL": "CHL",
  "IRQ": "IRQ",
  "BRA": "BRA",
  "ROU": "ROU",
  "MDA": "MDA",
  "KEN": "KEN",
  "SVN": "SVN",
  "CHE": "CHE",
  "LUX": "LUX",
  "CZE": "CZE",
  "TUR": "TUR",
  "IRN": "IRN",
  "COL": "COL",
  "MYS": "MYS",
  "AUS": "AUS",
  "IRL": "IRL",
  "DZA": "DZA",
  "EST": "EST",
  "VNM": "VNM",
  "ASM": "ASM",
  "LTU": "LTU"
};

// Load and display the World
d3.json("https://d3js.org/world-50m.v1.json", function(error, world) {
  if (error) throw error;

  console.log(world);  // 確認 GeoJSON 數據已加載

  // Load data and display countries
  d3.csv("ds_salaries.csv", function(error, data) {
    if (error) throw error;

    console.log(data);  // 確認 CSV 數據已加載

    // Calculate the total number of companies by country
    var companyCountData = d3.nest()
      .key(function(d) { return d.company_location; })
      .rollup(function(v) {
        return v.length;  // Calculate the number of companies
      })
      .entries(data)
      .reduce(function(obj, d) {
        var countryCode = countryMapping[d.key];
        if (countryCode) {
          obj[countryCode] = d.value;
        }
        return obj;
      }, {});

    console.log(companyCountData);  // 確認計算的公司數量數據

    svg.append("g")
      .attr("class", "countries")
      .selectAll("path")
      .data(topojson.feature(world, world.objects.countries).features)
      .enter().append("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", function(d) {
        var countryCode = d.id;  // GeoJSON uses ISO 3166-1 alpha-3 codes
        var companyCount = companyCountData[countryCode];
        var fillColor = companyCount ? color(companyCount) : "#ccc";
        console.log("Country Code:", countryCode, "Company Count:", companyCount, "Fill Color:", fillColor);  // Debugging: Check the country ID, company count, and corresponding fill color
        return fillColor;
      });

    // Add legend
    var legend = svg.selectAll(".legend")
      .data(color.range().map(function(d) {
        d = color.invertExtent(d);
        if (!d[0]) d[0] = color.domain()[0];
        if (!d[1]) d[1] = color.domain()[1];
        return d;
      }))
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) {
        return "translate(" + (width - 30) + "," + (i * 20 + 20) + ")";
      });

    legend.append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", function(d) { return color(d[0]); });

    legend.append("text")
      .attr("x", -6)
      .attr("y", 10)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return Math.round(d[0]); });
  });
});
