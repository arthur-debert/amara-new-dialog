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
directives.directive('syncPanel', function(subtitleList){
    /**
     * The time line is composed of two parts.
     * The strip with the time markers (which is draggeable)
     * and the timelineSubtitleList, containing the balloons with those subs
     * @type {undefined}
     */
    var timelineEl = undefined;
    var subtitleBubbleListEl = undefined;
    var viewWidth = 600;
    var zoomLevel = 1;
    // normalized to zoom level 1
    var millisecondsPerView = 6000;
    var pixelsPerMillisecond = (viewWidth / millisecondsPerView) * zoomLevel;
    var currentMouseX, previousMouseX = undefined;


    var markerEveryMilliseconds = 500;
    var currentTime = 0;

    function timeToPixels(time){
        return time * pixelsPerMillisecond;
    }
    function pixelsToTime(pixels){
        return parseInt(pixels / pixelsPerMillisecond)
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

    function redrawTimeline(timelineEl, currentTime, subtitles){

        $(timelineEl).children().remove();
        $(subtitleBubbleListEl).children().remove();
        var xOffset = timeToPixels(currentTime);
        var markerTimes = getMarkerTimes(currentTime, markerEveryMilliseconds, millisecondsPerView);
        _.each(markerTimes, function(markerTime, i){
            var ticker = $("<li>");
            if (markerTime % 1000 == 0){
                ticker.text(parseInt(markerTime / 1000));
            }else{
                ticker.text("|");
                ticker.addClass("timelineTicker");
            }
            // position
            var xPos = timeToPixels(markerTime) - xOffset;
            ticker.css("left", xPos);
            timelineEl.append(ticker);

        });
        var subtitles = subtitleList.get();
        var subtitlesInView = [];
        var endTime = currentTime + millisecondsPerView;
        for (var i = 0; i < subtitles.length; i ++){
            var subtitle = subtitles[i];
            if (subtitle.start_time > endTime ){
                break;
            }
            if (subtitle.start_time > currentTime || (subtitle.end_time  > currentTime && subtitle.end_time < endTime )){
                subtitlesInView.push(subtitle);
            }

        }
        //subtitleBubbleListEl.children().remove();
        _.each(subtitlesInView, function(subtitle,i){
            var subtitleBubble = $("<div>");
            subtitleBubble.text(subtitle.text);
            var left = timeToPixels(subtitle.start_time) - xOffset;
            var width = timeToPixels(subtitle.end_time - subtitle.start_time);
            subtitleBubble.css('left', left);
            subtitleBubble.css('width', width);
            subtitleBubble.addClass('subtitleBubble');
            subtitleBubbleListEl.append(subtitleBubble);
        })
    }

    function registerMouse(e){
        currentMouseX = e.pageX;
        e.stopPropagation();
    }
    function onDragging(){
        var xDelta = currentMouseX - previousMouseX;
        if (xDelta == 0){
            return;
        }
        var timeDelta = pixelsToTime(-xDelta);
        var newTime = currentTime + timeDelta;
        newTime = Math.max(0, newTime );
        if (newTime != currentTime){
            currentTime = newTime;
            redrawTimeline(timelineEl, currentTime );
            previousMouseX = currentMouseX;

        }
    }

    return {
        link: function(scope, elm, attrs){
            var dragTimeout = undefined;
            timelineEl= $("ul");

            subtitleBubbleListEl = $("div.subtitleBubbleList", elm);
            timelineEl.css("width", viewWidth + "px");
            redrawTimeline(timelineEl, currentTime);
            function onStartTimelineDrag (e){
                currentMouseX = previousMouseX = e.pageX;
                dragTimeout = setInterval(onDragging, 40);
                $(document).mousemove(registerMouse)
            }
            function onStopDragging(e){
                $(document).unbind("onmousemove");
                clearInterval(dragTimeout);
            }

            // atach drag and drop
            timelineEl.mousedown( onStartTimelineDrag);
            $(document).mouseup( onStopDragging);

        }
    }
});
