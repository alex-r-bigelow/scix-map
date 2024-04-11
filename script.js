import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const ANIMATION_SPEED = 300;

let currentSelection = null;

// Objects for looking things up:
const areaToTrack = {};
const trackToArea = {};
const titleToArea = {};

function updateHighlight(includeTrack, includeArea, includeTitle) {
  const transition = d3.transition().duration(ANIMATION_SPEED);
  // Update the tracks in the legend
  d3.select("#legend")
    .selectAll("div.legendEntry")
    .transition(transition)
    .style("opacity", function (d) {
      return includeTrack(d) ? 1.0 : 0.25;
    });
  // Update the areas in the map
  const areas = d3
    .select("#map svg #InteractiveLayer")
    .selectAll("*")
    .transition(transition)
    .attr("opacity", function (d) {
      return includeArea(d) ? 1.0 : 0.25;
    });
  // Update the list of titles
  d3.select("#titles")
    .selectAll("div.poster")
    .style("display", function (d) {
      return includeTitle(d) ? null : "none";
    });
}
function highlightTitle(title) {
  currentSelection = currentSelection === title ? null : title;
  const includeTrack = function (d) {
    return currentSelection === null || areaToTrack[titleToArea[title]] === d;
  };
  const includeArea = function (d) {
    return currentSelection === null || titleToArea[title] === d;
  };
  const includeTitle = function (d) {
    return currentSelection === null || title === d.Title;
  };
  updateHighlight(includeTrack, includeArea, includeTitle);
}
function highlightArea(area) {
  currentSelection = currentSelection === area ? null : area;
  const includeTrack = function (d) {
    return currentSelection === null || areaToTrack[area] === d;
  };
  const includeArea = function (d) {
    return currentSelection === null || area === d;
  };
  const includeTitle = function (d) {
    return currentSelection === null || area === d.Area;
  };
  updateHighlight(includeTrack, includeArea, includeTitle);
}
function highlightTrack(track) {
  currentSelection = currentSelection === track ? null : track;
  const includeTrack = function (d) {
    return currentSelection === null || track === d;
  };
  const includeArea = function (d) {
    return currentSelection === null || track === areaToTrack[d];
  };
  const includeTitle = function (d) {
    return currentSelection === null || track === d.Track;
  };
  updateHighlight(includeTrack, includeArea, includeTitle);
}

globalThis.onload = async () => {
  const mapContent = await (await fetch("map.svg")).text();
  d3.select("#map").html(mapContent);
  const posterText = await (await fetch("allTitles.csv")).text();

  const posters = d3.dsvFormat("|").parse(posterText);
  // Sort posters by title
  posters.sort((a, b) => (a.title >= b.title ? 1 : -1));

  posters.forEach((d) => {
    areaToTrack[d.Area] = d.Track;

    if (trackToArea.hasOwnProperty(d.Track) === false) {
      trackToArea[d.Track] = [];
    }
    trackToArea[d.Track].push(d.Area);

    titleToArea[d.Title] = d.Area;
  });

  posters.forEach((d) => {
    areaToTrack[d.Area] = d.Track;
  });

  // Create the color scale and the legend
  const colorMap = {
    "Scientific Computing": "#e2831e",
    "Scientific Visualization": "#377eb8",
    "Information Visualization": "#e41a1c",
    "Biomedical Computation": "#ffff33",
    Imaging: "#4daf4a",
  };

  const legendEntries = d3
    .select("#legend")
    .selectAll("div.legendEntry")
    .data(Object.keys(trackToArea));
  const legendEntriesEnter = legendEntries
    .enter()
    .append("div")
    .attr("class", "legendEntry")
    .on("click", (event, d) => {
      highlightTrack(d);
      event.stopPropagation();
    });
  legendEntriesEnter
    .append("div")
    .attr("class", "colorbox")
    .style("background-color", (d) => colorMap[d]);
  legendEntriesEnter
    .append("div")
    .attr("class", "legendLabel")
    .text((d) => d);

  // Apply the colors to the map
  const spaces = d3
    .select("#map svg #InteractiveLayer")
    .selectAll("*")
    .data(Object.keys(areaToTrack), function (d) {
      // Initial setup: match the Area column to SVG ids
      return d ? d : this.id;
    });
  spaces
    .style("fill", (d) => colorMap[areaToTrack[d]])
    .style("cursor", "pointer")
    .attr("opacity", 1.0)
    .on("click", function (event, d) {
      highlightArea(d);
      event.stopPropagation();
    });

  const titleDivs = d3.select("#titles").selectAll("div.poster").data(posters);
  const titleDivsEnter = titleDivs
    .enter()
    .append("div")
    .attr("class", "poster")
    .on("click", (event, d) => {
      highlightTitle(d.Title);
      event.stopPropagation();
    });
  titleDivsEnter
    .append("div")
    .attr("class", "colorbox")
    .style("background-color", (d) => colorMap[d.Track]);
  titleDivsEnter
    .append("div")
    .attr("class", "title")
    .text((d) => d.Title);
  titleDivsEnter
    .append("div")
    .attr("class", "details")
    .text((d) => d.Details);

  d3.select(document).on("click", function () {
    highlightTitle(null);
  });
};
