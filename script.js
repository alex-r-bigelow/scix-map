/* globals d3, jQuery */

let ANIMATION_SPEED = 300;

function highlightAll (researchArea) {
  let transition = d3.transition()
    .duration(ANIMATION_SPEED);
  d3.select('svg').select('#Layer_2').selectAll('*')
    .transition(transition)
    .attr('opacity', d => {
      if (!researchArea || d.Group === researchArea) {
        return 1.0;
      } else {
        return 0.25;
      }
    });
  d3.select('#titles').selectAll('div.poster')
    .style('display', d => {
      if (!researchArea || d.area === researchArea) {
        return null;
      } else {
        return 'none';
      }
    });
  d3.select('#legend').selectAll('div.legendEntry')
    .transition(transition)
    .style('opacity', d => {
      if (!researchArea || d.key === researchArea) {
        return 1.0;
      } else {
        return 0.25;
      }
    });
}
function loadSVG () {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: 'map.svg',
      dataType: 'text'
    }).done(result => {
      d3.select('#map').html(result);
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
  // Create the color scale and the legend
  let baseColor = {
    'Reception': '#984ea3',
    'Scientific Computing': '#ff7f00',
    'Scientific Visualization': '#377eb8',
    'Information Visualization': '#e41a1c',
    'Biomedical Computation': '#ffff33',
    'Imaging': '#4daf4a'
  };

  let legendEntries = d3.select('#legend').selectAll('div.legendEntry').data(d3.entries(baseColor));
  let legendEntriesEnter = legendEntries.enter().append('div')
    .attr('class', 'legendEntry')
    .on('click', d => { highlightAll(d.key); d3.event.stopPropagation(); });
  legendEntriesEnter.append('div')
    .attr('class', 'legendLabel')
    .text(d => d.key);
  legendEntriesEnter.append('div')
    .attr('class', 'colorbox')
    .style('background-color', d => d.value);

  // Apply the colors to the map
  let spaces = d3.select('svg').select('#Layer_2').selectAll('*')
    .data(results[0], function (d) {
      return d ? d.Space : this.id;
    });
  spaces.style('fill', d => baseColor[d.Group])
    .style('cursor', 'pointer')
    .attr('opacity', 1.0)
    .on('click', function (d) { highlightAll(d.Group); d3.event.stopPropagation(); });
  d3.select('body')
    .on('click', function (d) { highlightAll(null); });

  // Create an author-name lookup
  let authorAreas = {};
  results[1].forEach(d => {
    authorAreas[d['Name']] = d['Area'];
  });

  // Collect details about posters
  let allTitles = {};
  let posters = [];
  let title = null;
  let posterArea = null;
  let details = [];
  results[2].split('\n').forEach(d => {
    if (!d) {
      if (title !== null && !(title in allTitles)) {
        posters.push({
          title: title,
          area: posterArea,
          details: details
        });
        allTitles[title] = true;
      }
      posterArea = null;
      title = null;
      details = [];
    } else if (title === null) {
      title = d;
    } else {
      details.push(d);
      d.split(/\band\b|,/g).forEach(d => {
        let author = d.trim();
        posterArea = posterArea || authorAreas[author];
      });
    }
  });
  window.posters = posters;
  posters.sort((a, b) => a.title >= b.title ? 1 : -1);

  let posterDivs = d3.select('#titles').selectAll('div.poster').data(posters);
  let posterDivsEnter = posterDivs.enter().append('div')
    .attr('class', 'poster')
    .on('click', d => { highlightAll(d.area); d3.event.stopPropagation(); });
  posterDivsEnter.append('div')
    .attr('class', 'colorbox')
    .style('background-color', d => baseColor[d.area] || baseColor.Available);
  posterDivsEnter.append('div')
    .attr('class', 'title')
    .text(d => d.title);
  posterDivsEnter.append('div')
    .attr('class', 'details')
    .text(d => d.details.join('\n'));
});
