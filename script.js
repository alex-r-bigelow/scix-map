/* globals d3 */

var ANIMATION_SPEED = 300;

var currentSelection = null;

function updateHighlight (includeTrack, includeArea, includeTitle) {
  var transition = d3.transition()
    .duration(ANIMATION_SPEED);
  // Update the tracks in the legend
  d3.select('#legend').selectAll('div.legendEntry')
    .transition(transition)
    .style('opacity', function (d) { return includeTrack(d) ? 1.0 : 0.25; });
  // Update the areas in the map
  d3.select('svg').select('#Layer_2').selectAll('*')
    .transition(transition)
    .attr('opacity', function (d) { return includeArea(d) ? 1.0 : 0.25; });
  // Update the list of titles
  d3.select('#titles').selectAll('div.poster')
    .style('display', function (d) { return includeTitle(d) ? null : 'none'; });
}
function highlightTitle (title) {
  currentSelection = currentSelection === title ? null : title;
  var includeTrack = function (d) {
    return currentSelection === null || window.areaToTrack[window.titleToArea[title]] === d;
  };
  var includeArea = function (d) {
    return currentSelection === null || window.titleToArea[title] === d.key;
  };
  var includeTitle = function (d) {
    return currentSelection === null || title === d.Title;
  };
  updateHighlight(includeTrack, includeArea, includeTitle);
}
function highlightArea (area) {
  currentSelection = currentSelection === area ? null : area;
  var includeTrack = function (d) {
    return currentSelection === null || window.areaToTrack[area] === d;
  };
  var includeArea = function (d) {
    return currentSelection === null || area === d.key;
  };
  var includeTitle = function (d) {
    return currentSelection === null || area === d.Area;
  };
  updateHighlight(includeTrack, includeArea, includeTitle);
}
function highlightTrack (track) {
  currentSelection = currentSelection === track ? null : track;
  var includeTrack = function (d) {
    return currentSelection === null || track === d;
  };
  var includeArea = function (d) {
    return currentSelection === null || track === d.value;
  };
  var includeTitle = function (d) {
    return currentSelection === null || track === d.Track;
  };
  updateHighlight(includeTrack, includeArea, includeTitle);
}

d3.text('map.svg', function (mapContent) {
  d3.select('#map').html(mapContent);
  d3.text('allTitles.csv', function (posterText) {
    var posters = d3.dsvFormat('|').parse(posterText);
    // A little data reshaping...
    posters.sort((a, b) => a.title >= b.title ? 1 : -1);
    window.posters = posters;

    // Construct lookups for cleaner interaction code
    var areaToTrack = {};
    var trackToAreas = {};
    var titleToArea = {};
    posters.forEach(d => {
      areaToTrack[d.Area] = d.Track;

      if (trackToAreas.hasOwnProperty(d.Track) === false) {
        trackToAreas[d.Track] = [];
      }
      trackToAreas[d.Track].push(d.Area);

      titleToArea[d.Title] = d.Area;
    });
    window.areaToTrack = areaToTrack;
    window.trackToAreas = trackToAreas;
    window.titleToArea = titleToArea;

    posters.forEach(d => {
      areaToTrack[d.Area] = d.Track;
    });
    window.areaToTrack = areaToTrack;

    // Create the color scale and the legend
    var colorMap = {
      'Scientific Computing': '#e2831e',
      'Scientific Visualization': '#377eb8',
      'Information Visualization': '#e41a1c',
      'Biomedical Computation': '#ffff33',
      'Imaging': '#4daf4a'
    };

    var legendEntries = d3.select('#legend').selectAll('div.legendEntry').data(d3.keys(trackToAreas));
    var legendEntriesEnter = legendEntries.enter().append('div')
      .attr('class', 'legendEntry')
      .on('click', d => { highlightTrack(d); d3.event.stopPropagation(); });
    legendEntriesEnter.append('div')
      .attr('class', 'colorbox')
      .style('background-color', d => colorMap[d]);
    legendEntriesEnter.append('div')
      .attr('class', 'legendLabel')
      .text(d => d);

    // Apply the colors to the map
    var spaces = d3.select('svg').select('#Layer_2').selectAll('*')
      .data(d3.entries(areaToTrack), function (d) {
        return d ? d.key : this.id;
      });
    spaces.style('fill', d => colorMap[d.value])
      .style('cursor', 'pointer')
      .attr('opacity', 1.0)
      .on('click', function (d) { highlightArea(d.key); d3.event.stopPropagation(); });

    var titleDivs = d3.select('#titles').selectAll('div.poster').data(posters);
    var titleDivsEnter = titleDivs.enter().append('div')
      .attr('class', 'poster')
      .on('click', d => { highlightTitle(d.Title); d3.event.stopPropagation(); });
    titleDivsEnter.append('div')
      .attr('class', 'colorbox')
      .style('background-color', d => colorMap[d.Track]);
    titleDivsEnter.append('div')
      .attr('class', 'title')
      .text(d => d.Title);
    titleDivsEnter.append('div')
      .attr('class', 'details')
      .text(d => d.Details);
  });
});
