'use strict';

/* Directives */
var viewWidth = 640;
var zoomLevel = 1;
// normalized to zoom level 1
var millisecondsPerView = 5000;
var pixelsPerMillisecond = (viewWidth / millisecondsPerView) * zoomLevel;
var currentMouseX, previousMouseX = undefined;


var markerEveryMilliseconds = 500;

function itemsInView(container, childrenSelector) {
    var min = $(container).offset().top;
    var max = min + $(container).height();
    var inView = [];
    var children = $(childrenSelector, container);
    for (var i = 0; i < children.length; i++) {
        var pos = $(children[i]).offset().top;
        var h = $(children[i]).height() + parseInt($(children[i]).css("padding-top"));
        if (pos + h > min && pos < max) {
            inView.push(children[i]);
        }
    }
    return inView;
}
function getTimeToStart(currentTime, millisecondsPerView) {
    var timeStart = 0;
    if ((currentTime - millisecondsPerView / 2 ) > 0) {
        timeStart = currentTime - millisecondsPerView / 2;
    }
    return timeStart;
}

function cssPropToPixels(val) {
    return parseInt(val.substring(0, val.indexOf('p')));
}
function timeToPixels(time, currentTime) {
    return time * pixelsPerMillisecond;
}
function pixelsToTime(pixels) {
    return parseInt(pixels / pixelsPerMillisecond)
}
function nextMarkerTime(currentTime, markerEveryMilliseconds) {
    return Math.ceil(currentTime / markerEveryMilliseconds) * markerEveryMilliseconds;
}

function getMarkerTimes(startTime, markerEveryMilliseconds, millisecondsPerView) {
    var times = [];
    var finalTime = startTime + millisecondsPerView;
    // time to start drawing must be to the left of the screen
    // because some elements will begin off view port, but will
    // end already on viewport
    var startSecond = Math.ceil((startTime - (millisecondsPerView / 3)) / 1000);
    var endSecond = Math.ceil(finalTime / 1000);
    var step = Math.ceil((endSecond - startSecond) / (millisecondsPerView) / markerEveryMilliseconds);
    for (var i = startSecond; i <= endSecond; i += step) {
        var nextMarkerT = i * 1000;
        if (nextMarkerT < finalTime) {
            times.push(nextMarkerT);
        }
    }
    return times;
}






