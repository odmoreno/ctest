/*
*    main.js
*    Grafo de sesiones individuales
*/

var margin = { left:80, right:20, top:70, bottom:100 };
var height = 700 - margin.top - margin.bottom, 
    width = 800 - margin.left - margin.right;

var g = d3.select("#chart-area")
    .append("svg")
        .attr("viewBox", [-width / 2, -height / 2, width + margin.left + margin.right , height + margin.top + margin.bottom])
        //.attr("width", width + margin.left + margin.right)
        //.attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + - margin.left + 
            ", " + margin.top + ")");


//datos sesion
let sesiones = []
let nodos = []
let links = []

let partidos = []
let asambleistas = []
let sesionid = 0

let validLinks = []
//let validNodes = []

let simulation = d3.forceSimulation(nodos)
    .force("charge", d3.forceManyBody().strength(-40))
    .force("link", d3.forceLink(links).id(d => d.id))
    //.force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .on("tick", tick);

let nodes = g.selectAll("circle")

const promises = [
    d3.json("data/partidos2.json"),
    d3.json("data/periodo2D.json"),
    d3.json("data/data2.json")
]

var continentColor = d3.scaleOrdinal(d3.schemeSet3);

let legend = d3.select("svg")
    .append("g")
    .attr("id", "g2")
    .attr("transform", "translate(" + (400) + 
            "," + (-200) + ")");
    //.attr("transform", "translate(" + (width - 50) + 
    //    "," + (height - 400) + ")");

// Tooltip
var tip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) {
        var text = "<strong>Nombre:</strong> <span style='color:red'>" + d.nombre + "</span><br>";
        text += "<strong>Partido:</strong> <span style='color:red;text-transform:capitalize'>" + d.partido + "</span><br>";
        text += "<strong>Provincia:</strong> <span style='color:red;text-transform:capitalize'>" + d.provincia + "</span><br>";
        text += "<strong>Region:</strong> <span style='color:red;text-transform:capitalize'>" + d.region + "</span><br>";
        return text;
    });
g.call(tip);

$("#region-select")
    .on("change", function(){
        console.log('Sesion actual:', sesionid)
        resetFlags()
        update(sesiones[sesionid]);
    })

$("#date-slider").ionRangeSlider({
    skin: "big",
    min: 0,
    max: 228,
    step: 1,
    grid: true,         // default false (enable grid)
    onChange: function (data) {
        // fired on every range slider update
        console.log('on change', data.from)
        sesionid = data.from
        resetFlags()
        update(sesiones[sesionid])
    }
});


Promise.all(promises).then(allData => {
    //partidos = allData[0].partidos
    //asambleistas = allData[0].nodes
    partidos = allData[0]
    asambleistas = allData[1]
    sesiones = allData[2]
    //console.log(allData)
    manageData()
}).catch(
    err => console.log(err))

function manageData(){
    console.log('partidos', partidos)
    console.log('asambleistas', asambleistas)
    console.log('sesiones', sesiones)

    //updateLegends()
    
    sesionid = 0
    updateLegends()
    updateSelects()
    update(sesiones[0])    
}

function resetFlags(){
    for (let key in asambleistas) {
        if(asambleistas[key].visitado == true) asambleistas[key].visitado = false
    }
}

function updateSelects(){
    var $dropdown = $("#partido-select");
    $.each(partidos, function() {
        //console.log("this", this)
        $dropdown.append($("<option />").val(this).text(this));
    });
}

function updateLegends(){
    //legend.attr('transform', function(d, i) { 
    //    return 'translate('+(10)+',' + (10+(25*i)) +')';
    //  })
    //  
    partidos.forEach(function(partido, i){
        //console.log(partido)
        var legendRow = legend.append("g")
            .attr("transform", "translate(0, " + (i * 20) + ")");
    
        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color1(partido));
    
        legendRow.append("text")
            .attr("x", -10)
            .attr("y", 10)
            .attr("text-anchor", "end")
            .style("text-transform", "capitalize")
            .text(partido);
    });
}

function update(data) {

    // Standard transition time for the visualization
    let t = d3.transition()
        .duration(100);

    console.log('sesion', data)
    let nodosSesion =  data.nodes
    let linksSesion =  data.links

    let region = $("#region-select").val();
    console.log('region select: ', region)

    for (let i=0; i<nodosSesion.length; i++){
        id = nodosSesion[i].id
        if(asambleistas[id]){
            asambleistas[id].visitado = true
        }
        else console.log('No existe', id)
    }

    let newnodes = []
    for (let key in asambleistas) {
        if(asambleistas[key].visitado == true) newnodes.push(asambleistas[key])
        //console.log(key, asambleistas[key]);
    }
    
    linksSesion = linksSesion.map(d => Object.create(d));
    console.log('nodos asam', newnodes)
    console.log('links asam', linksSesion)

    let validNodes =  newnodes.filter(function(d){
        if (region == "all") { return true; }
        else {
            return d.region == region;
        }
    })
    console.log('valid nodes', validNodes)

    //let links2 = linksSesion.filter(function(d){
    //    if (region == "all") { return true; }
    //    else {
    //        console.log('link', d)
    //        //console.log('link2', d.__proto__)
    //        console.log('link2', d['source'])
    //    }
    //})

    validLinks = validateLinks(validNodes, linksSesion)

    //console.log('newlinks', validLinks)

    nodes = nodes
    .data(validNodes, d => d.id)
    .join(
      enter => 
        enter.append("circle").attr("r", 4)
            .call(enter => enter.transition().attr("r", 4).attr("fill", color(d=> d.partido)).transition().duration(500)),
      update => update.transition().duration(500).attr("fill", color(d=> d.partido)),
      exit => exit.remove().transition().duration(500)
    );

    nodes.append("title")
      .text(d => d.nombre);

    nodes
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)

    simulation.nodes(validNodes, d=> d.id)
    simulation.force("link").links(validLinks);
    simulation.alpha(0.3).restart();

    $("#sesion")[0].innerHTML = data.sesion
    $("#votacion")[0].innerHTML = data.votacion
    $("#asunto")[0].innerHTML = data.asunto
}

function tick() {
    nodes.attr("cx", d => d.x)
        .attr("cy", d => d.y);
} 

function color(d){
    const scale = d3.scaleOrdinal(d3.schemeSet3);
    //console.log('value', d.partido)
    //console.log('example', scale(d.partido))
    return d => scale(d.partido);
    //var allGroups = [...new Set(partidos)]
    //console.log('partidos', allGroups)
    //const scale = d3.scaleOrdinal().domain(allGroups).range(d3.schemeSet2);
    //return scale;
}

var allGroups = [...new Set(partidos)]
var color1 = d3.scaleOrdinal().domain(allGroups).range(d3.schemeSet2)

function validateLinks(validNodes, linksSesion){
    let links = []
    console.log('Nodos actuales: ', validNodes)
    console.log('links actuales: ', linksSesion)
    for(let j=0;j<linksSesion.length;j++){
        //source = linksSesion[j].source
        for(let k=0;k<validNodes.length;k++){
            //console.log('Node:' , validNodes[k].id)
          if(validNodes[k].id === linksSesion[j].source){
            //console.log('igual: ', linksSesion[j].source)
            for(let m=0;m<validNodes.length;m++){
                //console.log('target :', linksSesion[j].target)
              if(validNodes[m].id === linksSesion[j].target){
                //console.log('target match:', linksSesion[j].target)
                links.push(linksSesion[j]);
                continue;
              } 
            } 
          }
        }
    }
    console.log('valid links', links)
    return links
}