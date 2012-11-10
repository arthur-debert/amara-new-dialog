'use strict';

/* Directives */


var directives = angular.module('myApp.directives', []);
directives.directive('amaraEditableSubtitle', function() {
    return {
        link: function(scope, elm, attrs){
            var el = angular.element(elm[0]);
            var editableParagrah = $(elm[0]).children("p")[0];
            editableParagrah.addEventListener('blur' , function() {
                scope.$apply(function() {
                    scope.subtitle.text = $(editableParagrah).text();
                });
            }, false);
            if (scope.mustScrollToBottom ){
                var parent = elm[0].parentElement;
                parent.scrollTop = parent.scrollHeight - parent.offsetHeight;
                scope.mustScrollToBottom = false;
            }
        }
    };
  });
directives.directive('syncTimeline', function(){
    var viewWidth = 600;
    var zoomLevel = 1;
    // normalized to zoom level 1
    var millisecondsPerView = 6000;
    var pixelsPerMillisecond = (viewWidth / millisecondsPerView) * zoomLevel;


    var markerEveryMilliseconds = 500;
    var startTime = 3200;

    function timeToPixels(time){
        return time * pixelsPerMillisecond;
    }
    function pixelsToTime(pixels){
        return parseInt(time / pixelsPerMillisecond)
    }
    function nextMarkerTime(currentTime, markerEveryMilliseconds){
        return Math.ceil(currentTime / markerEveryMilliseconds) * markerEveryMilliseconds;
    }

    function getMarkerTimes(startTime, markerEveryMilliseconds, millisecondsPerView){
        var times = [];
        var currentTime = startTime;
        while(currentTime < startTime + millisecondsPerView){
            var nextMarkerT = nextMarkerTime(currentTime, markerEveryMilliseconds);
            if (nextMarkerT < startTime + millisecondsPerView){
                times.push(nextMarkerT);
            }
            currentTime += markerEveryMilliseconds;
        }
        return times;
    }

    return {
        link: function(scope, elm, attrs){
            var timelineContainer = $("ul");
            timelineContainer.css("width", viewWidth + "px");

            var markerTimes = getMarkerTimes(startTime, markerEveryMilliseconds, millisecondsPerView);
            console.log(markerTimes);
            _.each(markerTimes, function(markerTime, i){
                var ticker = $("<li>");
                if (markerTime % 1000 == 0){
                    ticker.text(i);
                }else{
                    ticker.text("|");
                    ticker.addClass("timelineTicker");
                }
                // position
                var xPos = timeToPixels(markerTime);
                ticker.css("left", xPos);
                timelineContainer.append(ticker);

            });
        }
    }
});
