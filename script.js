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
    if (targetCenter.x + layerWidth >= 470) { // width of map.svg
      targetCenter.x -= layerWidth;
    }
    if (targetCenter.y + 57.7 >= 541) { // height of layer 4, height of map.svg
      targetCenter.y -= 57.7;
    }
    layer4.transition(transition)
      .attr('opacity', 1)
      .attr('transform', 'translate(' + targetCenter.x + ',' + targetCenter.y + ')');

    d3.select(targetElement).classed('selected', true);
  }
}
function loadSVG () {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: 'map.svg',
      dataType: 'text'
    }).done(result => {
      d3.select('#map').html(result);
      showLabel(null, null, null, true);
      resolve();
    });
  });
}
function getCSV (url) {
  return new Promise((resolve, reject) => {
    d3.csv(url, resolve);
  });
}
function getTXT (url) {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: url,
      dataType: 'text',
      success: resolve
    });
  });
}

Promise.all([getCSV('spaceAssignments.csv'), getCSV('researchAreas.csv'), getTXT('postertitles.txt'), loadSVG()]).then(results => {
  // Do an inital page layout (but never update again; zooming / resizing should just show scrollbars)
  /*let mapsize = d3.select('svg')
    .attr('height', jQuery(window).height())
    .node().getBoundingClientRect();
  d3.select('#sidebar')
    .style('min-width', (jQuery(window).width() - mapsize.width) + 'px')
    .style('max-width', (jQuery(window).width() - mapsize.width) + 'px')
    .style('height', jQuery(window).height() + 'px');*/

  d3.select('#titles').html(results[2]);

  let baseColor = {
    'Available': '#cccccc',
    'Intro Room': '#999999',
    'Scientific Computing': '#e41a1c',
    'Scientific Visualization': '#377eb8',
    'Information Visualization': '#4daf4a',
    'Biomedical Computation': '#ffff33',
    'Imaging': '#ff7f00'
  };

  let legendEntries = d3.select('#legend').selectAll('div.legendEntry').data(d3.entries(baseColor));
  let legendEntriesEnter = legendEntries.enter().append('div')
    .attr('class', 'legendEntry');
  legendEntriesEnter.append('div')
    .attr('class', 'legendLabel')
    .text(d => d.key);
  legendEntriesEnter.append('div')
    .attr('class', 'colorbox')
    .style('background-color', d => d.value);

  // TODO: group colors by faculty research area
  // let colorLookup = {};
  let facultyLookup = {};
  results[1].forEach(d => {
    facultyLookup[d.Group] = d.Area;
  });

  let spaces = d3.select('svg').select('#Layer_2').selectAll('*')
    .data(results[0], function (d) {
      return d ? d.Space : this.id;
    });
  spaces.style('fill', d => baseColor[d.Group])
    .attr('title', d => d.Space + ': ' + d.Group + ' (' + (facultyLookup[d.Group] || 'available') + ')')
    .style('cursor', 'pointer')
    .on('click', function (d) { showLabel(d, d.Details || '', this); d3.event.stopPropagation(); });
  d3.select('body')
    .on('click', function (d) { showLabel(null, null); });
});
