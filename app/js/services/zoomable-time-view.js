'use strict';
angular.module('amara.SubtitleEditor.services.ZoomableTimeMapper', []);
angular.module('amara.SubtitleEditor.services.ZoomableTimeMapper').factory('timeMapper', function () {


    var viewWidth = 640;
    var zoomLevel = 1;
// normalized to zoom level 1
    var millisecondsPerView = 5000;
    var pixelsPerMillisecond = (viewWidth / millisecondsPerView) * zoomLevel;


    var markerEveryMilliseconds = 500;

    return  {

        markerEveryMilliseconds :function (val) {
            if (val !== undefined) {
                markerEveryMilliseconds= val;
            }
            return markerEveryMilliseconds;
        },
        millisecondsPerView:function (val) {
            if (val !== undefined) {
                millisecondsPerView = val;
            }
            return millisecondsPerView;
        },
        viewWidth:function (val) {
            if (val !== undefined) {
                viewWidth = val;
            }
            return viewWidth;
        },
        itemsInView:function (container, childrenSelector) {
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
        },
        getTimeToStart:function (currentTime, millisecondsPerView) {
            var timeStart = 0;
            if ((currentTime - millisecondsPerView / 2 ) > 0) {
                timeStart = currentTime - millisecondsPerView / 2;
            }
            return timeStart;
        },
        timeToPixels:function (time, currentTime) {
            return time * pixelsPerMillisecond;
        },
        pixelsToTime:function (pixels) {
            return parseInt(pixels / pixelsPerMillisecond)
        }
    }

});
