
var mwidth = 1024,
    mheight = 640;
var ldata = [0,1,2,3,4,5,6,7,8];
// --> CREATE SVG DRAWING AREA

var cref = {};

var msvg = d3.select("#map-area").append("svg")
    .attr("width", mwidth)
    .attr("height", mheight);

var projection = d3.geo.mercator()
	.translate([mwidth/1.8, mheight/1.7])
	.scale(mheight/4);
var path = d3.geo.path()
	.projection(projection);
var quantize = d3.scale.quantile().domain([0, 100]).range(d3.range(9));
var quantiles = quantize.quantiles();
var quantilesl = [0];
var quantilesu = [];
quantiles.forEach(function(d,i){
	quantilesu.push(Math.round(quantiles[i]));
	quantilesl.push(quantilesu[i]);
});
quantilesu.push(100);
var procData = {};
var centRef = {};
var linkList = [];
var selSet = new Set();
var si;
var tooltip = d3.select('body').append('div')
            .attr('class', 'hidden tooltip');
var arcs;

// Use the Queue.js library to read two files
queue()
  .defer(d3.csv, "data/countryTotalInfluence.csv")
  .defer(d3.csv, "data/sohanRecipPairs.csv")
  .defer(d3.tsv, "data/country_centroids_all.csv")
  .await(function(error, valData, linkData, cenData){
    // console.log(topData);
	// console.log(valData);
    // --> PROCESS DATA
	procData = [];
	var maxp = 0;

	valData.forEach(function(d){
		if(d.influence > maxp) {
			maxp = +d.influence;
		}
	});
	valData.forEach(function(d){
		var procDatum = {};
		procDatum.p = +d.influence;
		procDatum.n = +d.neighbors;
		procDatum.pp = Math.round(procDatum.p*100/maxp);
		procDatum.rank = 1;
		valData.forEach(function(dd){
			if(dd.influence > d.influence) {
				procDatum.rank++;
			}
		});
		procDatum.ll = {}
		procData[d.country] = procDatum;
	});
	linkData.forEach(function(d){
		if(!(procData[d.a] == undefined) && d.ab != 0) {
			procData[d.a].ll[d.b]=d.ab;
			linkList.push({"from":d.a,"to":d.b,"weight":d.ab});
		}
		if(!(procData[d.b] == undefined) && d.ba != 0) {
			procData[d.b].ll[d.a]=d.ba;
			linkList.push({"from":d.b,"to":d.a,"weight":d.ba});
		}
	});
	cenData.forEach(function(d){
		centRef[d.SHORT_NAME] = [parseFloat(d.LONG),parseFloat(d.LAT)];
	});
	// console.log(procData);
	// console.log(centRef);
	var wdata = world.features
	var countries = msvg.selectAll("path")
		.data(wdata)
	countries.enter().append("path")
		.attr("d", path)
		.attr("class", "map-countries");
	msvg.append("path")
		.datum(topojson.mesh(world, world.features))
		.attr("d", path)
		.attr("fill", "none")
		.attr("class", "subunit-boundary");
	msvg.selectAll("rect").data(ldata).enter().append("rect").attr("width",10).attr("height",20).attr("x",20).attr("y",function(d,i){return 440+ i * 20;}).attr("class",function(d,i){return "q"+d+"-9"});
	msvg.selectAll("text").data(ldata).enter().append("text").attr("x",35).attr("y",function(d,i){return 455+ i * 20;}).attr("class","map-legend-text").text(function(d,i){return (quantilesl[i]+"% - "+quantilesu[i]+"%");});
	msvg.append("text").attr("x",20).attr("y",430).attr("class","map-legend-text").html("Relative Imposed Influence");

	msvg.selectAll(".map-countries").on('click', function(d) {
                    var mouse = d3.mouse(msvg.node()).map(function(d) {
                        return parseInt(d);
                    });
		if(!(procData[d.properties.name] == undefined)) {
			if(selSet.has(d.properties.name)) {
				selSet.delete(d.properties.name);
			} else {
				selSet.add(d.properties.name);
			}
			console.log(selSet);
			updateArcs();
		}
	});

	changeView(0);
	arcs = msvg.append("g").attr("class","arcs");
	allLinks();
	});

	var sSel = ["Reciprocity", "Cooperation"];
	var sField = ["pp", "pp"];
	var sPalette = ["Oranges","Greens"];

	function allLinks() {
		selSet = new Set(Object.keys(procData));
		updateArcs();
	}

	function noLinks() {
		selSet = new Set();
		updateArcs();
	}

	function updateArcs() {
		var arcData = []
		linkList.forEach(function(d) {
				if(selSet.has(d.from) || selSet.has(d.to)) {
					var arcDatum = {};
					arcDatum["sourceLocation"] = centRef[d.from]
					arcDatum["targetLocation"] = centRef[d.to]
					arcDatum["weight"] = d.weight
					arcDatum["label"] = d.from + "→" + d.to;
					arcData.push(arcDatum);
				}
			}
		)
		console.log("arcData",arcData);
		// arcs.selectAll("path").remove()
		// arcs = msvg.append("g").attr("class","arcs");

		arcs = msvg.select("g").selectAll("path").data(arcData);
        arcs.exit().remove();
        arcs.enter()
			.append("path")
			.style("stroke-opacity",function(d) { return d.weight;} )
			.attr("stroke-width",2)
			.attr('d', function(d) { 
				// console.log(lngLatToArc(d, 'sourceLocation', 'targetLocation', 3));
				console.log("drawing ",d.label);
				return lngLatToArc(d, 'sourceLocation', 'targetLocation', 3);
		}).transition().duration(1000).attrTween("stroke-dasharray", tweenDash)
            .call(endAll, function() {
                isDrawingline = false;
            });;

	}

	// function allArcDraw() {
	// 	var arcData = []
	// 	linkList.forEach(function(d) {
	// 			if(selSet.has(d.from) || selSet.has(d.to)) {
	// 				var arcDatum = {};
	// 				arcDatum["sourceLocation"] = centRef[d.from]
	// 				arcDatum["targetLocation"] = centRef[d.to]
	// 				arcDatum["weight"] = d.weight
	// 				arcData.push(arcDatum);
	// 			}
	// 		}
	// 	)
	// 	console.log("arcData",arcData);
	// 	arcs.selectAll("path").remove()
	// 	arcs = msvg.append("g").attr("class","arcs");

	// 	arcs.selectAll("path")
	// 		.data(arcData)
	// 		.enter()
	// 		.append("path")
	// 		.style("stroke-opacity",function(d) { return d.weight;} )
	// 		.attr("stroke-width",2)
	// 		.attr('d', function(d) { 
	// 			// console.log(lngLatToArc(d, 'sourceLocation', 'targetLocation', 3));
	// 			console.log("drawing ",d.label);
	// 			return lngLatToArc(d, 'sourceLocation', 'targetLocation', 3);
	// 	}).transition().duration(1000).attrTween("stroke-dasharray", tweenDash)
 //            .call(endAll, function() {
 //                isDrawingline = false;
 //            });;
	// }

    function tweenDash() {
        //This function is used to animate the dash-array property, which is a
        //  nice hack that gives us animation along some arbitrary path (in this
        //  case, makes it look like a line is being drawn from point A to B)
        var len = this.getTotalLength(),
            interpolate = d3.interpolateString("0," + len, len + "," + len);

        return function(t) {
            return interpolate(t);
        };
    };


    // function for calling when every transition is finished
    function endAll(transition, callback) {
        var n = 0;
        transition
            .each(function() {
                ++n;
            })
            .each("end", function() {
                if (!--n) callback.apply(this, arguments);
            });
    }

	function changeView(siparam) {
		si = siparam;
		// console.log("SELECTED "+sSel[si]);
		$(".view-select-label").html("International "+sSel[si]);
	    // Update choropleth
	    updateChoropleth();
	    allLinks();
		return false;
	}

	function lngLatToArc(d, sourceName, targetName, bend){
		// If no bend is supplied, then do the plain square root
		bend = bend || 1;
		// `d[sourceName]` and `d[targetname]` are arrays of `[lng, lat]`
		// Note, people often put these in lat then lng, but mathematically we want x then y which is `lng,lat`

		var sourceLngLat = d[sourceName],
				targetLngLat = d[targetName];

		if (targetLngLat && sourceLngLat) {
			var sourceXY = projection( sourceLngLat ),
					targetXY = projection( targetLngLat );

			// Uncomment this for testing, useful to see if you have any null lng/lat values
			// if (!targetXY) console.log(d, targetLngLat, targetXY)
			var sourceX = sourceXY[0],
					sourceY = sourceXY[1];

			var targetX = targetXY[0],
					targetY = targetXY[1];

			var dx = targetX - sourceX,
					dy = targetY - sourceY,
					dr = Math.sqrt(dx * dx + dy * dy)*bend;

			// To avoid a whirlpool effect, make the bend direction consistent regardless of whether the source is east or west of the target
			var west_of_source = (targetX - sourceX) < 0;
			if (west_of_source) return "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0 0 " + targetX + "," + targetY;
			return "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0 1 " + targetX + "," + targetY;
			
		} else {
			return "M0,0,l0,0z";
		}
	}

function updateChoropleth() {
	var countries = msvg.selectAll(".map-countries");
//	console.log(countries)
	d3.select("#map-area").attr("class",sPalette[si]);
	countries.attr("class",function(d){
		if(!(procData[d.properties.name] == undefined) && !(quantize(procData[d.properties.name][sField[si]]) == undefined)) {
			//console.log(d.properties.adm0_a3_is);
			return ("map-countries q"+quantize(procData[d.properties.name][sField[si]])+"-9");
		} else {
			return ("map-countries");
		}
	});
	countries.on('mousemove', function(d) {
                    var mouse = d3.mouse(msvg.node()).map(function(d) {
                        return parseInt(d);
                    });
					var dat;
					if(!(procData[d.properties.name] == undefined)) {
						var procDatum = procData[d.properties.name];
						dat = "<br>Influence Rank = "+procDatum.rank+"<br>Influence Score = "+procDatum[sField[si].slice(1)].toLocaleString()+"";
						if(Object.keys(procDatum.ll).length>0) {
							dat += "<br>"+sSel[si]+" with <br>⟷ " + Object.keys(procDatum.ll).toString().replace(/,/g,"<br>⟷ ");
						}
					} else {dat = "(no data)";}
                    tooltip.classed('hidden', false)
                        .attr('style', 'left:' + Math.max(0, d3.event.pageX - 150) +
                                'px; top:' + (d3.event.pageY + 20) + "px")
                        .html("<b>"+d.properties.name+"</b>"+dat);
                })
                .on('mouseout', function() {
                    tooltip.classed('hidden', true);
                });
}

