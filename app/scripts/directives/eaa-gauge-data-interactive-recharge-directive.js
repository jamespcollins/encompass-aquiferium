(function() {
    'use strict';

    angular
        .module('eaa.directives.d3.interactive.recharge', [])
        .directive('eaaGaugeDataInteractiveRecharge', eaaGaugeDataInteractiveRecharge);

    function eaaGaugeDataInteractiveRecharge() {
        var directiveDefinitionObject = {
            compile: false,
            controller: false,
            controllerAs: false,
            link: false,
            priority: 0,
            require: false,
            restrict: 'E',
            scope: {},
            template: false,
            templateUrl: false,
            terminal: false,
            transclude: false,
            type: false
        };

        directiveDefinitionObject.link = function postLink(scope, element) {

            // VARS.
            var container = $('#interactive');
            var containerWidth = container.width();

            var width = containerWidth;
            var height = width * 0.75;

            var vizMargin = { top: 0, right: 0, bottom: 0, left: 0 };
            var vizWidth = width - vizMargin.left - vizMargin.right;
            var vizHeight = height - vizMargin.top - vizMargin.bottom;

            var dataDisplayWidth = vizWidth * 0.4;
            var dataDisplayHeight = vizHeight * 0.4;

            var mapWidth = vizWidth;
            var mapHeight = vizHeight * 0.35;

            var graphWidth = vizWidth;
            var graphHeight = vizHeight * 0.45;
            var graphLeftOffset = vizWidth * 0.05;
            var graphWidthOffset = 0.98;

            var slideDescText = 'Water or rainfall entering the recharge zone of the Aquifer replenishes this valuable resource.';
            var mapImageBaseSource = '../../images/directives/tr-panel01-map.png';
            // Encompass Version of Recharge Images. These correct for the inversion of intensity measure implicit in meteorological data.
            var mapImageAquiferSource00 = '../../images/directives/tr-panel02-range00-correct.png';
            var mapImageAquiferSource01 = '../../images/directives/tr-panel02-range01-correct.png';
            var mapImageAquiferSource02 = '../../images/directives/tr-panel02-range02.png';
            var mapImageAquiferSource03 = '../../images/directives/tr-panel02-range03-correct.png';
            var mapImageAquiferSource04 = '../../images/directives/tr-panel02-range04-correct.png';
            var mapImageKeySource = '../../images/directives/tr-panel03-key-inverted.png';

            var boundariesSource = '../../data/geojson/eaa/eaa-aquifer-zones-2014.geo.json';
            var dataSource = '../../data/recharge-annualAvg-byDate2.csv';
            var ingestedData = {};

            var color = d3.scale.category10().domain(['Barton Springs', 'Comal Springs', 'Hueco Springs', 'J17', 'J27', 'Las Moras Springs', 'Leona Springs', 'San Antonio Springs', 'San Marcos Springs', 'San Pedro Springs']);
            var dataKey = d3.scale.ordinal();
            var parseDate = d3.time.format('%Y');

            var x = d3.time.scale().range([graphLeftOffset, graphWidth * graphWidthOffset]);
            var y = d3.scale.linear().range([graphHeight - 50, 50]);

            var xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(20);
            var yAxis = d3.svg.axis().scale(y).orient('left').ticks(10);

            var xPosRange = [];
            var xNumericRange = 0;
            var dateRange = [];
            var xMinDate = 0;
            var xMaxDate = 0;
            var dateDelta = 0;
            var posYear = 0;

            var dataRange = [];
            var dataRangeMax = {};
            var dataRangeMin = {};
            var oldDataRange = {};
            var newDataMax = 100;
            var newDataMin = 0;
            var newDataRange = newDataMax - newDataMin;
            var newValue = {};
            var decimalValue = {};

            var criticalPeriodStage04 = 'rgba(150,0,0,1)';
            var criticalPeriodStage03 = 'rgba(150,0,0,1)';
            var criticalPeriodStage02 = 'rgba(150,100,0,1)';
            var criticalPeriodStage01 = 'rgba(0,0,150,1)';

            // METHODS.
            Array.prototype.max = function() {
                var max = this[0];
                var len = this.length;
                for (var i = 1; i < len; i++) {
                    if (this[i] > max) {
                        max = this[i];
                    }
                }
                return max;
            };

            Array.prototype.min = function() {
                var min = this[0];
                var len = this.length;
                for (var i = 1; i < len; i++) {
                    if (this[i] < min) {
                        min = this[i];
                    }
                }
                return min;
            };

            d3.selection.prototype.moveToFront = function() {
                return this.each(function() {
                    this.parentNode.appendChild(this);
                });
            };

            d3.selection.prototype.moveToBack = function() {
                return this.each(function() {
                    var firstChild = this.parentNode.firstChild;
                    if (firstChild) {
                        this.parentNode.insertBefore(this, firstChild);
                    }
                });
            };

            var roundDecimals = function(value, decimals) {
                return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
            };

            var defineInteractionRange = function() {
                xPosRange = [graphLeftOffset, graphWidth * graphWidthOffset];
                xNumericRange = xPosRange[1] - xPosRange[0];
                xMinDate = dateRange.min();
                xMaxDate = dateRange.max();
                dateDelta = xMaxDate - xMinDate;
                posYear = xNumericRange / dateDelta;
                setDisplayDate(xMaxDate);
            };

            var defineDataRange = function() {
                dataRangeMin = dataRange.min();
                dataRangeMax = dataRange.max();
                oldDataRange = dataRangeMax - dataRangeMin;
            };

            var setDataValuePercent = function(dataValue) {
                if (dataValue === 0) {
                    newValue = newDataMin;
                } else {
                    newValue = (((dataValue - dataRangeMin) * newDataRange) / oldDataRange) + newDataMin;
                }

                decimalValue = roundDecimals((newValue / 100), 4);
            };

            var setMapGraphicImage = function(dataValue) {
                var newImage = d3.select('.map-image-aquifer-recharge');
                var targetPath = newImage[0][0];

                if (dataValue < 100) {
                    targetPath.src = mapImageAquiferSource00;
                } else if (dataValue >= 100 && dataValue < 500) {
                    targetPath.src = mapImageAquiferSource01;
                } else if (dataValue >= 500 && dataValue < 1000) {
                    targetPath.src = mapImageAquiferSource02;
                } else if (dataValue >= 1000 && dataValue < 1500) {
                    targetPath.src = mapImageAquiferSource03;
                } else if (dataValue >= 1500) {
                    targetPath.src = mapImageAquiferSource04;
                }
            };

            var updateMapDisplay = function(dataValue) {
                setDataValuePercent(dataValue);
                setMapGraphicImage(dataValue);
            };

            var setDisplayDate = function(targetDate) {
                d3.select(el).select('.year-display-recharge').text(Math.round(targetDate));
            };

            var setDisplayData = function(targetIndex) {
                var dataSet = ingestedData[targetIndex];
                var vals = Object.keys(dataSet).map(function(key) {
                    return dataSet[key];
                });
                var dataLabelArray = d3.select(el).select('.legend-box').selectAll('.legend-item-recharge').selectAll('text');
                // Need to populate each legend-item text value with the appropriate val index string (remember to skip 0 which is the Date value).
                for (var j = 0; j < dataLabelArray.length; j++) {
                    var dataIndexOffset = j + 1;
                    d3.select(dataLabelArray[j][1]).text(function() {
                        var thisValue = roundDecimals(vals[dataIndexOffset], 0);
                        updateMapDisplay(thisValue);
                        if (isNaN(thisValue)) {
                            return 'No Data';
                        } else {
                            return thisValue.toString(); // + ' TAF';
                        }
                    });
                }
            };

            var updateIndicatorLine = function(xPos) {
                var indicatorLine = d3.select(el).select('.indicator-line');
                var gBounds = d3.select('.graph-bounds');
                var y1Pos = gBounds[0][0].clientHeight * 0.15;
                var y2Pos = gBounds[0][0].clientHeight * 0.845;

                indicatorLine.attr('x1', xPos).attr('y1', y1Pos).attr('x2', xPos).attr('y2', y2Pos);
            };

            var deriveDate = function(xPos) {
                var indicatorLine = d3.select(el).select('.indicator-line');

                if (xPos < xPosRange[0]) {
                    setDisplayDate(xMinDate);
                    indicatorLine.style('visibility', 'hidden');
                } else if (xPos > xPosRange[1]) {
                    setDisplayDate(xMaxDate);
                    indicatorLine.style('visibility', 'hidden');
                } else {
                    var normalizedX = xPos - xPosRange[0];
                    var yearIndex = normalizedX / posYear;
                    var currentDate = xMinDate + yearIndex;
                    setDisplayDate(currentDate);
                    setDisplayData(Math.round(yearIndex));
                    indicatorLine.style('visibility', 'visible');
                    updateIndicatorLine(xPos);
                }
            };

            var mouseOverGraph = function(event) {
                var position = d3.mouse(this);
                deriveDate(position[0]);
            };

            var onTargetClick = function(target) {
                console.log(target.properties.Name);
            };

            // VIZ - BASE.
            var el = element[0];
            var viz = d3.select(el).append('div').attr('class', 'viz').attr('width', vizWidth).attr('height', vizHeight);

            // Slide Banner.
            var slideBanner = viz.append('div').attr('class', 'slide-banner-recharge');
            var descriptionText = slideBanner.append('text')
                .attr('x', '0%')
                .attr('y', '0%')
                .text('Total Aquifer Recharge')
                .attr('class', 'banner-text-recharge');

            // Slide Description.
            var slideDescription = viz.append('div').attr('class', 'slide-desc-recharge');
            var descriptionText = slideDescription.append('text')
                .attr('x', '0%')
                .attr('y', '20%')
                .text(slideDescText)
                .attr('class', 'desc-text-recharge');

            // Map Image.
            var slideMap = viz.append('div').attr('class', 'slide-map-recharge');

            var mapImageBase = slideMap.append('img')
                .attr('src', mapImageBaseSource)
                .attr('x', '40%')
                .attr('y', '30%')
                .attr('class', 'map-image-base-recharge');

            var mapImageAquifer = slideMap.append('img')
                .attr('src', mapImageAquiferSource00)
                .attr('x', function() {
                    return (Number(mapImageBase.x + mapImageBase.width) + 'px');
                })
                .attr('y', '30%')
                .attr('class', 'map-image-aquifer-recharge');

            var mapImageKey = slideMap.append('img')
                .attr('src', mapImageKeySource)
                .attr('x', function() {
                    return (Number(mapImageAquifer.x + mapImageAquifer.width) + 'px');
                })
                .attr('y', '30%')
                .attr('class', 'map-image-key-recharge');

            viz.on('mousemove', mouseOverGraph);
            viz.append('text').attr('class', 'year-display-recharge').text('');

            var dataDisplay = viz.append('div').attr('class', 'data-display data-display-recharge');

            var graphBounds = viz.append('svg').attr('class', 'graph-bounds')
                .attr('width', graphWidth)
                .attr('height', graphHeight);

            // interpolate options: basis, basis-open, basis-closed, linear, step, step-before, step-after, bundle, cardinal, cardinal-open, cardinal-closed, monotone;
            var line = d3.svg.line()
                .interpolate('monotone')
                .x(function(d) {
                    return x(d.date);
                })
                .y(function(d) {
                    return y(d.gindex);
                })
                .defined(function(d) {
                    return d.gindex;
                });

            // CHART.
            d3.csv(dataSource, function(error, data) {

                data.forEach(function(d) {
                    dateRange.push(parseInt(d.Date));
                    d.Date = parseDate.parse(d.Date);
                    dataRange.push(parseFloat(d['Total Recharge']));
                    d['Total Recharge'] = +d['Total Recharge'];
                });

                ingestedData = data;

                dataKey.domain(d3.keys(data[0]).filter(function(key) {
                    return key !== 'Date';
                }));

                var gauges = dataKey.domain().map(function(name) {
                    return {
                        name: name,
                        values: data.map(function(d) {
                            return { date: d.Date, gindex: +d[name] };
                        })
                    };
                });

                x.domain(d3.extent(data, function(d) {
                    return d.Date;
                }));

                y.domain([
                    d3.min(gauges, function(c) {
                        return d3.min(c.values, function(v) {
                            return v.gindex;
                        });
                    }),
                    d3.max(gauges, function(c) {
                        return d3.max(c.values, function(v) {
                            return v.gindex;
                        });
                    })
                ]);

                graphBounds.append('g')
                    .attr('class', 'x axis')
                    .attr('id', 'xAxis')
                    .attr('transform', 'translate(0,' + (graphHeight - 50) + ')')
                    .call(xAxis);

                graphBounds.append('g')
                    .attr('class', 'y axis')
                    .attr('id', 'yAxis')
                    .attr('transform', 'translate(' + graphLeftOffset + ',0)')
                    .call(yAxis)
                    .append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('x', -50)
                    .attr('dy', '1em')
                    .style('text-anchor', 'end')
                    .text('thousands of acre-feet');

                var gauge = graphBounds.selectAll('.gauge')
                    .data(gauges)
                    .enter().append('g')
                    .attr('class', 'gauge-data');

                gauge.append('path')
                    .attr('class', 'line')
                    .attr('d', function(d) {
                        return line(d.values);
                    })
                    .style('stroke', function(d) {
                        return color(d.name);
                    })
                    .attr('id', function(d) {
                        return d.name;
                    });

                // Filter data points by gauge.
                var filtered = gauge.filter(function(d) {})
                    .selectAll('circle')
                    .data(function(d) {
                        return d.values;
                    })
                    .enter().append('circle')
                    .attr({
                        cx: function(d) {
                            return x(d.date);
                        },
                        cy: function(d) {
                            return y(d.gindex);
                        },
                        r: 2
                    })
                    .style('fill', '#555');

                var indicatorLine = graphBounds.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0).attr('stroke-width', 1).attr('stroke', 'rgba(50,50,50,0.9)').attr('class', 'indicator-line');

                // LEGEND.
                var legend = dataDisplay.append('div').attr('class', 'legend-box legend-box-recharge').attr('transform', 'translate(-180,30)');
                var legendItem = legend.selectAll('.svg').data(gauges).enter().append('svg').attr('class', 'legend-item-recharge');

                var label = legendItem.append('text')
                    .attr('x', '2%')
                    .attr('y', '22%')
                    .text(function(d) {
                        return d.name;
                    })
                    .attr('class', 'data-item-recharge');

                var dataValueText = legendItem.append('text')
                    .attr('x', '7%')
                    .attr('y', '72%')
                    .text('0')
                    .attr('class', 'div-absolute data-value-recharge');

                var horBar = legendItem.append('text')
                    .attr('x', '0%')
                    .attr('y', '35%')
                    .text('___________________');

                // NOTE.
                var notes = viz.append('div').attr('class', 'graph-notes')
                    .append('text')
                    .text('Note: Any gaps in the data lines represent gaps in the collected data for that time period.');

                defineInteractionRange();
                defineDataRange();
            });
        };

        return directiveDefinitionObject;
    }
})();
