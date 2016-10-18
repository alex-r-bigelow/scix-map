/* globals d3, jQuery */

let ANIMATION_SPEED = 300;

function showLabel (data, researchArea, targetElement, suppressTransition) {
  let layer4 = d3.select('#Layer_4');
  d3.select('.selected').classed('selected', false);
  let transition = d3.transition()
    .duration(suppressTransition ? 0 : ANIMATION_SPEED);
  if (!data || !targetElement) {
    layer4.transition(transition).attr('opacity', 0);
  } else {
    let textElements = [
      d3.select('#SpaceLabel').text(data.Space).node(),
      d3.select('#GroupLabel').text(data.Group).node(),
      d3.select('#ResearchAreaLabel').text(researchArea).node()
    ];
    let layerWidth = Math.max(...textElements.map(d => 100 + d.getComputedTextLength()));
    layer4.select('#Background').attr('width', layerWidth);

    let targetCenter = targetElement.getBBox();
    targetCenter = {
      x: targetCenter.x + targetCenter.width / 2,
      y: targetCenter.y + targetCenter.height / 2
    };
    if (targetCenter.x + layerWidth >= 792) { // width of map.svg
      targetCenter.x -= layerWidth;
    }
    if (targetCenter.y + 57.7 >= 612) { // height of layer 4, height of map.svg
      targetCenter.y -= 57.7;
    }
    layer4.transition(transition)
      .attr('opacity', 1)
      .attr('transform', 'translate(' + targetCenter.x + ',' + targetCenter.y + ')');

    d3.select(targetElement).classed('selected', true);
  }
}
function loadSVG () {
  jQuery.ajax({
    url: 'map.svg',
    dataType: 'text'
  }).done(result => {
    d3.select('body').html(result);
    showLabel(null, null, null, true);
  });
}
function getCSV (url) {
  return new Promise((resolve, reject) => {
    d3.csv(url, resolve);
  });
}

Promise.all([loadSVG(), getCSV('spaceAssignments.csv'), getCSV('researchAreas.csv')]).then(results => {
  let baseColor = d3.scaleOrdinal(d3.schemeCategory20);

  // TODO: group colors by faculty research area
  // let colorLookup = {};
  let facultyLookup = {};
  results[2].forEach(d => {
    facultyLookup[d.Group] = d.Area;
  });

  let spaces = d3.select('svg').select('#Layer_2').selectAll('*')
    .data(results[1], function (d) {
      return d ? d.Space : this.id;
    });
  spaces.style('fill', d => baseColor(d.Group))
    .attr('title', d => d.Space + ': ' + d.Group + ' (' + (facultyLookup[d.Group] || 'available') + ')')
    .style('cursor', 'pointer')
    .on('click', function (d) { showLabel(d, facultyLookup[d.Group] || '', this); d3.event.stopPropagation(); });
  d3.select('body')
    .on('click', function (d) { showLabel(null, null); });
});
