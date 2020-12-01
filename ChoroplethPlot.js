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
            year: Number(d[0]["year"]),
            id: undefined
        };
    })
    .map(data)

var padding = 50
var width = 1000
var height = 500

var widthSmallPlot = 800
var heightSmallPlot = 400

var svgChoro = d3.select("#choro").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "choroSvg")
    .call(d3.zoom().on("zoom", function () {
        svgChoro.attr("transform", d3.event.transform)
    })).append("g")
d3.select("#choro").style("background-color", "lightgray").style("display", "inline-block")
svgChoro.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "lightgray")


var svgScatter = d3.select("#scatter").append("svg")
    .attr("width", widthSmallPlot)
    .attr("height", heightSmallPlot)
    .attr("id", "scatterSvg")
svgScatter.append("rect")
    .attr("width", widthSmallPlot)
    .attr("height", heightSmallPlot)
    .attr("fill", "lightgray")

var svgTime = d3.select("#time").append("svg")
    .attr("width", widthSmallPlot)
    .attr("height", heightSmallPlot)
    .attr("id", "timeSvg")

svgTime.append("rect")
    .attr("width", widthSmallPlot)
    .attr("height", heightSmallPlot)
    .attr("fill", "lightgray")

var projection = d3.geoNaturalEarth1()

var path = d3.geoPath()
    .projection(projection)

colorScale = d3.scaleQuantize(extent, d3.schemeBlues[5])

var nameMap = {
    "The Bahamas": "Bahamas",
    "South Korea": "Republic of Korea",
    "Russia": "Russian Federation",
    "Republic of Serbia": "Serbia",
    "England": "United Kingdom",
    "USA": "United States"
}
function createLegend(selectedCountries) {
    let leg = d3.select("#legend").remove()

    leg = d3.select("body").append("svg")
        .attr("id", "legend")
        .attr("width", widthSmallPlot)
        .attr("height", heightSmallPlot)


    leg.append("rect")
        .attr("width", widthSmallPlot)
        .attr("height", 50)
        .attr("fill", "lightgray")


    leg.append("text")
        .text("Legend")
        .attr("x", widthSmallPlot / 2)
        .attr("y", 15)
        .style("text-anchor", "middle")

    let selectedIds = new Array()
    let itr = selectedCountries.keys()
    let next = itr.next()

    while (!next.done) {
        selectedIds.push(next.value)
        next = itr.next()
    }

    leg.selectAll("rect")             //Adds a square that shows which attribute category corresponds to which color
        .data(selectedIds, (d) => d)
        .enter()
        .append("rect")
        .attr("fill", (d) => getColor(d))
        .attr("x", (d, i) => i * (widthSmallPlot / selectedIds.length) + 10)
        .attr("y", 30)
        .attr("width", 10)
        .attr("height", 10)

    leg.selectAll("text")             //Adds a the label of the category next to the square
        .data(selectedIds, (d) => d)
        .enter()
        .append("text")
        .text((d) => d)
        .attr("x", (d, i) => i * (widthSmallPlot / selectedIds.length) + 22)
        .attr("y", 40)

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

function updateTimeSeries(countriesData, curYear) {
    if (countriesData.length != 0) {
        svgTime.selectAll("*").remove()

        svgTime.append("rect")
            .attr("width", widthSmallPlot)
            .attr("height", heightSmallPlot)
            .attr("fill", "lightgray")

        let paths = svgTime.select("#countryPaths")
        let timeSeriesAxis = svgTime.select("#timeSeriesTimeAxis")
        let attrSeriesAxis = svgTime.select("#timeSeriesYAxis")


        paths = svgTime.append("g")
            .attr("id", "countryPaths")

        let dat = countriesData.map((d) => d.properties.years)
        let countryTime = paths.selectAll("path").data(dat)

        let time = concatAttr(dat, "year")
        let deaths = concatAttr(dat, "total")

        let extentTime = d3.extent(Array.from(time.values()))

        if (extentTime[1] > endYear) {
            extentTime[1] = endYear
        }

        let extentDeaths = d3.extent(Array.from(deaths.values()))

        let scaleTime = d3.scaleLinear().domain(extentTime).range([padding, widthSmallPlot - padding / 4])
        let scaleDeath = d3.scaleLinear().domain(extentDeaths).range([heightSmallPlot - padding, padding / 3])


        countryTime.enter()
            .append("path")
            .attr("d", (d) => createPathTime(d, "total", scaleTime, scaleDeath))
            .attr("stroke", (d) => { return getColor(d.values()[0].id); })
            .style("stroke-width", 1)
            .attr("fill", "None")

        countryTime.enter()
            .each((d) => {
                createCircleTime(d, "total", scaleTime, scaleDeath, curYear)
            })


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

        timeSeriesAxis.attr("transform", `translate(0, ${heightSmallPlot - padding})`)
        attrSeriesAxis.attr("transform", `translate(${padding}, 0)`)

        svgTime.append("text").attr("class", "xTimeTitle").text("Year").attr("transform", `translate(${widthSmallPlot / 2}, ${heightSmallPlot - padding / 4})`)
        svgTime.append("text").attr("class", "yTimeTitle").text("Suicide No.").attr("transform", `translate(${padding / 3}, ${heightSmallPlot/2})rotate(-90)`)
    }
}

function createCircleTime(d, attr, timeScale, attrScale, curYear) {
    let vals = d.values()


    let circ = svgTime.append("g").attr("class", "timeCirc").selectAll("circ").data(vals, vals["year"])

    circ.enter()
        .append("circle")
        .attr("r", 2)
        .attr("cx", (d) => { return timeScale(d["year"]) })
        .attr("cy", (d) => { return attrScale(d[attr]) })
        .attr("stroke", "black")
        .style("stroke-width", .5)
        .attr("fill", (d) => {
            if (curYear == d["year"]) {
                return "red";
            }
            else {
                return getColor(d.id);
            }
        })
}

function createPathTime(d, attr, timeScale, attrScale) {
    let vals = d.values()

    let path = d3.path()
    path.moveTo(timeScale(vals[0]["year"]), attrScale(vals[0][attr]))

    vals.forEach((d) => {
        if (d["year"] > endYear) {
            path.moveTo(timeScale(d["year"]), attrScale(d[attr]))
        } else {
            path.lineTo(timeScale(d["year"]), attrScale(d[attr]))
        }
    })
    return path
}

function concatAttr(dat, attr) {
    let valuesAttr = new Set()

    for (let i = 0; i < dat.length; i++) {
        if (dat[i] != undefined) {
            let values = dat[i].values()
            for (let j = 0; j < values.length; j++) {
                valuesAttr.add(values[j][attr])
            }
        }
    }

    return valuesAttr
}

function getColor(id) {
    if (cateColorMap.has(id)) {
        console.log("HAS!!!")
        return cateColorMap.get(id)
    } else {
        let colorCopy = JSON.parse(JSON.stringify(d3.schemeSet3))
        console.log(cateColorMap)
        cateColorMap.forEach((v) => {
            colorCopy.splice(colorCopy.indexOf(v), 1)
        })
        cateColorMap.set(id, colorCopy[0])
        return cateColorMap.get(id)
    }
}

d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(data => {
    var countries = []
    cateColorMap = new Map()
    nameToId = new Map()

    data.features.forEach(function (d) { //Grabs any countries that contain name
        let name = d.properties.name
        if (data2.has(name) || nameMap[name] != undefined) {
            countries.push(name);
            if (nameMap[name] != undefined) {
                nameToId.set(nameMap[name], d.id)
                data2.get(nameMap[name]).values().map((q) => q.id = d.id)
                d.properties.years = data2.get(nameMap[name])
            } else {
                nameToId.set(name, d.id)
                nameMap[name] = name
                data2.get(name).values().map((q) => { q.id = d.id })
                d.properties.years = data2.get(name)
            }

        }
    })
    console.log(data)
    console.log(countries.sort())

    startYear = years[0]
    endYear = years[1]


    let countryShapes = svgChoro.append("g")
        .attr("class", "countries")
        .selectAll(".country")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("id", (d) => "" + d.id)
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
            d3.select("#" + d.id).transition("highlight").duration(200).style("opacity", 1).style("stroke-width", "3px")
        }
    })

    countryShapes.on("mouseout", function (d) {
        let shapes = countryShapes.filter((d) => !selectedCountries.has(d.id))
        shapes.transition("fade").duration(200).style("opacity", 1).style("stroke-width", ".5px")
    })
    let selectedCountries = new Map()

    countryShapes.on("click", selectCountry)

    function selectCountry(d){
        if (countries.includes(d.properties.name)) {
            if (selectedCountries.has(d.id)) {
                console.log(cateColorMap)
                cateColorMap.delete(d.id)
                selectedCountries.delete(d.id)
                d3.select("#" + d.id).transition("gsfr").duration(200).style("opacity", 1).style("stroke-width", ".5px")
            }
            else if (selectedCountries.size < 8) {
                d3.select("#" + d.id).transition("highlight").duration(200).style("opacity", 1).style("stroke-width", "2px")
                selectedCountries.set(d.id, d)
            }
            update(getYear())
        }
    }


    console.log(data)
    svgScatter.append("g").attr("class", "xAxis").attr("transform", `translate(0,${heightSmallPlot - padding + 2})`)
    svgScatter.append("g").attr("class", "yAxis").attr("transform", `translate(${padding},2)`)
    svgScatter.append("text").attr("class", "xTitle").text("Suicide No.").attr("transform", `translate(${(widthSmallPlot -padding) / 2}, ${heightSmallPlot - padding / 4})`)
    svgScatter.append("text").attr("class", "yTitle").text("GDP").attr("transform", `translate(${padding / 3}, ${heightSmallPlot/2})rotate(-90)`)

    function update(year) {
        let validValues = Object.values(data.features).filter((d) => { return (countries.includes(d.properties.name) && d.properties.years.has(year)) })
        console.log(validValues)
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
            .range([padding, widthSmallPlot - padding / 4])
        var scatterYScale = d3.scaleSqrt()
            .domain(gdpRange)
            .range([heightSmallPlot - padding, padding / 3])

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

        console.log(d3.selectAll(".test"))
        d3.selectAll(".test")
            .on("mouseover", toolTip)
            .on("click", selectCountry)


        d3.selectAll(".test").transition("q").delay(100).duration(150).attr("fill", (d) => { if (selectedCountries.has(d.id)) { return getColor(d.id) } else { return "blue" } })
            .attr("cx", (d) => { return getTotal(d, year, "total", scatterXScale) })
            .attr("cy", (d) => getTotal(d, year, "gdp", scatterYScale))
            .attr("r", (d) => getTotal(d, year, "pop", scatterRScale))
            .attr("opacity", (d) => { if (selectedCountries.has(d.id)) { return .75; } return .55; })
            .attr("stroke", (d) => { console.log("HE"); if (selectedCountries.has(d.id)) { return "black" } return "None" })
            .style("stroke-width", (d) => { if (selectedCountries.has(d.id)) { return "1px" } return "0px" })


        if (selectedCountries.size != 0) {
            updateTimeSeries(Array.from(selectedCountries.values()), year)
            createLegend(selectedCountries)
        }
        else {
            svgTime.selectAll("*").remove()
            d3.select("#legend").remove()
            svgTime.append("rect")
                .attr("width", widthSmallPlot)
                .attr("height", heightSmallPlot)
                .attr("fill", "lightgray")
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


function toolTip(d) {
    console.log(d)
}




