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








