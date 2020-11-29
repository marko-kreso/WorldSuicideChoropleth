data = suicide




catAttr = Object.keys(data[0]).filter((d) => typeof data[0][d] === "string")
quanAttr = Object.keys(data[0]).filter((d) => typeof data[0][d] === "number")
extent = d3.extent(data, (d) => d.suicides_no)
years = d3.extent(data, (d) => d.year)
years[1]--;
data2 = d3.nest()
    .key((d) => d.country)
    .key((d) => d.year)
    .rollup(function (d) {
        return {
            total: d3.sum(d, (v) => v.suicides_no),
            d,
            totalProp: d3.sum(d, (v) => v["suicides/100k pop"]),
            pop: d3.sum(d, (v) => v.population),
            gdp: Number(d[0]['gdp_for_year ($)'].split(",").join("")),
            year: Number(d[0]["year"])
        };
    })
    .map(data)

var padding = 50
var width = 1000
var height = 500
var svgChoro = d3.select("#choro").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "choroSvg")
svgChoro.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "lightgray")


var svgScatter = d3.select("#scatter").append("svg")
    .attr("width", width / 2)
    .attr("height", height / 2)
    .attr("id", "scatterSvg")
svgScatter.append("rect")
    .attr("width", width / 2)
    .attr("height", height / 2)
    .attr("fill", "lightgray")

var svgTime = d3.select("#time").append("svg")
    .attr("width", width / 2)
    .attr("height", height / 2)
    .attr("id", "timeSvg")

svgTime.append("rect")
    .attr("width", width / 2)
    .attr("height", height / 2)
    .attr("fill", "lightgray")

var projection = d3.geoNaturalEarth1()

var path = d3.geoPath()
    .projection(projection)

colorScale = d3.scaleQuantize(extent, d3.schemeBlues[5])

var nameMap = {
    "The Bahamas": "Bahamas",
    "South Korea": "Republic of Korea",
    "Russia": "Russian Federation",
    "Serbia": "Republic of Serbia",
    "England": "United Kingdom",
    "USA": "United States"
}

function setupScatter(data, countries, year) {
    let validValues = Object.values(data.features).filter((d) => { return (countries.includes(d.properties.name) && d.properties.years.has(year)) })
    countryPoints = svgScatter.append("g")
        .attr("class", "countriesCircle")
        .selectAll("circle")
        .data(validValues, (d) => d.properties.name)
        .enter()
        .append("circle")
        .attr("class", "test")
    console.log("COUNTRY")

}

function updateTimeSeries(countriesData, CurYear) {
    if (countriesData.length != 0) {
        console.log(countriesData)
        let paths = svgTime.select("#countryPaths")
        let timeSeriesAxis = svgTime.select("#timeSeriesTimeAxis")
        let attrSeriesAxis = svgTime.select("#timeSeriesYAxis")

        if (paths.empty()) {
            paths = svgTime.append("g")
                .attr("id", "countryPaths")

        }

        let countryTime = paths.selectAll("path").data(countriesData, (d) => { return d.id })

        countryTime.enter().append("path")

        let dat = countriesData.map((d) => d.properties.years)

        let time = concatAttr(dat, "year")
        let deaths = concatAttr(dat, "total")

        let extentTime = d3.extent(Array.from(time.values()))
        let extentDeaths = d3.extent(Array.from(deaths.values()))

        let scaleTime = d3.scaleLinear().domain(extentTime).range([padding, width / 2 - padding / 4])
        let scaleDeath = d3.scaleLinear().domain(extentDeaths).range([height / 2 - padding, padding / 3])


        


        let axisXTime = d3.axisBottom().scale(scaleTime).tickFormat(d3.format("d"))
        let axisYTime = d3.axisLeft().scale(scaleDeath).ticks(6, "s")

        timeSeriesAxis.remove()
        attrSeriesAxis.remove()

        timeSeriesAxis = svgTime.append("g")
            .attr("id", "timeSeriesTimeAxis")
        attrSeriesAxis = svgTime.append("g")
            .attr("id", "timeSeriesYAxis")
        
        timeSeriesAxis.call(axisXTime)
        attrSeriesAxis.call(axisYTime)

        timeSeriesAxis.attr("transform", `translate(0, ${height/2-padding})`)
        attrSeriesAxis.attr("transform", `translate(${padding}, 0)`)



    }
}

function concatAttr(dat, attr) {
    let valuesAttr = new Set()

    for (let i = 0; i < dat.length; i++) {
        let values = dat[i].values()
        for (let j = 0; j < values.length; j++) {
            valuesAttr.add(values[j][attr])
        }
    }

    return valuesAttr
}

d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(data => {
    var countries = []

    data.features.forEach(function (d) { //Grabs any countries that contain name
        let name = d.properties.name
        if (data2.has(name) || nameMap[name] != undefined) {
            countries.push(name);
            if (nameMap[name] != undefined) {
                d.properties.years = data2.get(nameMap[name])
            } else {
                nameMap[name] = name
                d.properties.years = data2.get(name)
            }

        }
    })

    // console.log(countries)
    // console.log(data2.keys().filter((d) => {return !(countriesOnMap.includes(d))}))
    let startYear = years[0]
    let endYear = years[1]

    console.log(startYear)

    let countryShapes = svgChoro.append("g")
        .attr("class", "countries")
        .selectAll(".country")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("stroke-width", 2)

    function getAll(attr) {
        var allAttr = []
        data.features.forEach((d) => {
            if (countries.includes(d.properties.name)) {
                d.properties.years.values().forEach((v) => {
                    allAttr.push(v[attr])
                })

            }

        })
        return allAttr
    }

    var totalRange = d3.extent(getAll("total"))
    var gdpRange = d3.extent(getAll("gdp"))
    var popRange = d3.extent(getAll("pop"))


    // var gdpRange = d3.extent(validValues, (d) => d3.max(d.properties.years.values(), (v) => v.gdp))

    // var popRange = d3.extent(validValues, (d) => d3.max(d.properties.years.values(), (v) => v.pop))

    countryShapes.on("mouseover", function (d) {
        let shapes = countryShapes.filter((d) => !selectedCountries.has(d.id))
        shapes.transition("highlight").duration(200).style("opacity", .75)
        if (!selectedCountries.has(d.id)) {
            d3.select(this).transition("highlight").duration(200).style("opacity", 1).style("stroke-width", "3px")
        }
    })

    countryShapes.on("mouseout", function (d) {
        let shapes = countryShapes.filter((d) => !selectedCountries.has(d.id))
        shapes.transition("fade").duration(200).style("opacity", 1).style("stroke-width", ".5px")
    })
    let selectedCountries = new Map()

    countryShapes.on("click", function (d) {
        if (selectedCountries.has(d.id)) {
            selectedCountries.delete(d.id)
        } else {
            d3.select(this).transition("highlight").duration(200).style("opacity", 1).style("stroke-width", "2px")
            selectedCountries.set(d.id, d)
        }
        update(getYear())
    })


    console.log(data)
    svgScatter.append("g").attr("class", "xAxis").attr("transform", `translate(0,${height / 2 - padding + 2})`)
    svgScatter.append("g").attr("class", "yAxis").attr("transform", `translate(${padding},2)`)
    svgScatter.append("text").attr("class", "xTitle").text("Suicide No.").attr("transform", `translate(${width / 4 - padding}, ${height / 2 - padding / 4})`)
    svgScatter.append("text").attr("class", "yTitle").text("GDP").attr("transform", `translate(${padding / 3}, ${height / 4})rotate(-90)`)

    function update(year) {
        let validValues = Object.values(data.features).filter((d) => { return (countries.includes(d.properties.name) && d.properties.years.has(year)) })
        slider.property("value", year)

        d3.select(".year").text(year)
        countryShapes.attr("fill", (d) => {
            let properties = d.properties
            if (countries.includes(properties.name) && properties.years.has(year)) {
                return colorScale(properties.years.get(year).total)
            }
            return "gray"
        })


        console.log(validValues)
        //var t = validValues.filter((d) => console.log(d3.sum(d.properties.years, (v) => v.total)))
        //console.log(t)


        var scatterXScale = d3.scaleSqrt()
            .domain(totalRange)
            .range([padding, width / 2 - padding / 4])
        var scatterYScale = d3.scaleSqrt()
            .domain(gdpRange)
            .range([height / 2 - padding, padding / 3])

        var scatterRScale = d3.scaleLinear()
            .domain(popRange)
            .range([1, 15])
        let xAxis = d3.axisBottom().ticks(6, "s")
            .scale(scatterXScale)
        let yAxis = d3.axisLeft().ticks(6, "s")
            .scale(scatterYScale)

        d3.select(".xAxis").call(xAxis)
        d3.select(".yAxis").call(yAxis)


        d3.select(".countriesCircle")

        let circ = d3.select(".countriesCircle").selectAll(".test").data(validValues, (d) => d.properties.name)

        circ.exit().attr("class", "remove").transition("t").attr('r', 0).remove()


        console.log(circ)

        circ.enter().append("circle").attr("class", "test")
            .attr("cx", (d) => { return getTotal(d, year, "total", scatterXScale) })
            .attr("cy", (d) => getTotal(d, year, "gdp", scatterYScale))
            .attr("r", (d) => getTotal(d, year, "pop", scatterRScale))
            .attr("opacity", .55)
            .attr("fill", (d) => { if (selectedCountries.has(d.id)) { return "orange" } else { return "blue" } })

        d3.selectAll(".test").transition("q").delay(100).duration(150).attr("fill", (d) => { if (selectedCountries.has(d.id)) { return "red" } else { return "blue" } })
            .attr("cx", (d) => { return getTotal(d, year, "total", scatterXScale) })
            .attr("cy", (d) => getTotal(d, year, "gdp", scatterYScale))
            .attr("r", (d) => getTotal(d, year, "pop", scatterRScale))
            .attr("opacity", (d) => { if (selectedCountries.has(d.id)) { return .75; } return .55; })
            .attr("stroke", (d) => { console.log("HE"); if (selectedCountries.has(d.id)) { console.log("T"); return "black" } return "None" })
            .style("stroke-width", (d) => { if (selectedCountries.has(d.id)) { return "2px" } return "0px" })

        if(selectedCountries.size != 0){
            updateTimeSeries(Array.from(selectedCountries.values()), year)
        }
        else{
            svgTime.select("#timeSeriesTimeAxis").remove()
            svgTime.select("#timeSeriesYAxis").remove()
        }
    }

    function getYear() {
        return slider.node().value
    }

    var slider = d3.select(".slider")
        .append("input")
        .attr("type", "range")
        .attr("min", startYear)
        .attr("max", endYear)
        .attr("step", 1)
        .on("input", function () {
            stopPlay()
            update(this.value)
        })

    let running = false;
    let timer
    var play = d3.select("#play")
        .on("click", () => {
            if (running != true) {
                play.node().innerHTML = "Pause"
                timer = setInterval(() => {
                    if (slider.node().max > slider.node().value) {
                        running = true;
                        update(++slider.node().value)
                    }
                    if (slider.node().max <= slider.node().value) {
                        running = false
                        clearInterval(timer);
                    }
                }, 500);
            } else {
                stopPlay()
            }
        })

    function stopPlay() {
        running = false;
        play.node().innerHTML = "Play"
        clearInterval(timer);
    }

    function getTotal(d, year, attr, scale) {
        let properties = d.properties
        if (countries.includes(properties.name) && properties.years.has(year)) {
            if (scale != undefined) {

                return scale(properties.years.get(year)[attr])
            }
            return properties.years.get(year)[attr]
        }
    }

    setupScatter(data, countries, startYear)
    update(startYear)
})







