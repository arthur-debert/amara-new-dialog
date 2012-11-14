'use strict';

/* Directives */
var viewWidth = 600;
var zoomLevel = 1;
// normalized to zoom level 1
var millisecondsPerView = 6000;
var pixelsPerMillisecond = (viewWidth / millisecondsPerView) * zoomLevel;
var currentMouseX, previousMouseX = undefined;


var markerEveryMilliseconds = 500;

function timeToPixels(time) {
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
    var currentTime = startTime;
    while (currentTime < startTime + millisecondsPerView) {
        var nextMarkerT = nextMarkerTime(currentTime, markerEveryMilliseconds);
        if (nextMarkerT < startTime + millisecondsPerView) {
            times.push(nextMarkerT);
        }
        currentTime += markerEveryMilliseconds;
    }
    return times;
}

var directives = angular.module('myApp.directives', []);
directives.directive('amaraEditableSubtitle', function (currentPlayerTime) {
    return {
        link:function (scope, elm, attrs) {
            var el = angular.element(elm[0]);
            var editableParagrah = $(elm[0]).children("p")[0];
            editableParagrah.addEventListener('blur', function () {
                scope.$apply(function () {
                    scope.subtitle.text = $(editableParagrah).text();
                });
                scope.$emit("subtitleChanged")
            }, false);
            if (scope.mustScrollToBottom) {
                var parent = elm[0].parentElement;
                parent.scrollTop = parent.scrollHeight - parent.offsetHeight;
                scope.mustScrollToBottom = false;
            }
            var currentTime = currentPlayerTime.get();
            if (scope.subtitle.start_time > currentTime &&
                scope.subtitle.end_time < currentTime) {
                el.addClass("currentlyPlaying");
            }
        }
    };
});
directives.directive('syncPanel', function (subtitleList, currentPlayerTime) {
    /**
     * The time line is composed of two parts.
     * The strip with the time markers (which is draggeable)
     * and the timelineSubtitleList, containing the balloons with those subs
     * @type {undefined}
     */
    var timebarEl = undefined;
    var timelineEl = undefined;


    function redrawTimeline(timebarEl, currentTime, subtitles) {

        $(timebarEl).children().remove();
        var xOffset = timeToPixels(currentTime);
        var markerTimes = getMarkerTimes(currentTime, markerEveryMilliseconds, millisecondsPerView);
        _.each(markerTimes, function (markerTime, i) {
            var ticker = $("<li>");
            if (markerTime % 1000 == 0) {
                ticker.text(parseInt(markerTime / 1000));
            } else {
                ticker.text("|");
                ticker.addClass("timelineTicker");
            }
            // position
            var xPos = timeToPixels(markerTime) - xOffset;
            ticker.css("left", xPos);
            timebarEl.append(ticker);

        });

    }

    function registerMouse(e) {
        currentMouseX = e.pageX;
        e.stopPropagation();
    }

    function onDragging() {
        var xDelta = currentMouseX - previousMouseX;
        if (xDelta == 0) {
            return;
        }
        var timeDelta = pixelsToTime(-xDelta);
        var previousTime = currentPlayerTime.get();
        var newTime = previousTime + timeDelta;
        if (newTime != previousTime) {
            currentPlayerTime.set(newTime);
            previousMouseX = currentMouseX;
        }
    }

    function getSubtitlesInView(allSubtitles, currentTime) {
        var subtitlesInView = [];
        var endTime = currentTime + millisecondsPerView;
        for (var i = 0; i < allSubtitles.length; i++) {
            var subtitle = allSubtitles[i];
            if (subtitle.start_time > endTime) {
                break;
            }
            if (subtitle.start_time > currentTime || (subtitle.end_time > currentTime && subtitle.end_time < endTime )) {
                subtitlesInView.push(subtitle);
            }
        }
        return subtitlesInView;
    }

    return {
        link:function (scope, elm, attrs) {
            var dragTimeout = undefined;
            timebarEl = $("ul.timebar");

            timelineEl = $("div.timeline", elm);
            timebarEl.css("width", viewWidth + "px");
            redrawTimeline(timebarEl, currentPlayerTime.get());
            function onStartTimelineDrag(e) {
                currentMouseX = previousMouseX = e.pageX;
                dragTimeout = setInterval(onDragging, 40);
                $(document).mousemove(registerMouse)
            }

            function onStopDragging(e) {
                $(document).unbind("onmousemove");
                clearInterval(dragTimeout);
            }

            // atach drag and drop
            timebarEl.mousedown(onStartTimelineDrag);
            $(document).mouseup(onStopDragging);
            scope.$on("subtitleChanged", function () {
                redrawTimeline(timebarEl, currentPlayerTime.get(), subtitleList.get());
            })
            scope.subtitlesInView = getSubtitlesInView(subtitleList.get(), currentPlayerTime.get());
            scope.$on("playerTimeChanged", function (event, newTime) {
                redrawTimeline(timebarEl, newTime);
                scope.$$childHead.onTimeChanged(getSubtitlesInView(subtitleList.get(), newTime))

            });
        }
    }
});
directives.directive('subtitleBubble', function (subtitleList, currentPlayerTime) {

    var MIN_SUBTITLE_DURATION = 500;
    var draggingMode = null;
    var resizingStartTime = false;
    var startDraggingX = null;
    var minNewTime = null;
    var maxNewTime = null;
    var draggingInterval = null;
    function getSubtitlePos(subtitle, currentTime){
        return {
            left: timeToPixels(subtitle.start_time) - timeToPixels(currentTime),
            width : timeToPixels(subtitle.end_time - subtitle.start_time)
        }

    }
    function repositionSubtitle(elm, subtitle, currentTime) {
        elm.css(getSubtitlePos(subtitle, currentTime));

        // these are the dragging bounds
    }

    function onResizing(event, element, subtitle){
        var targetX = event.pageX;
        console.log(targetX, timeToPixels(minNewTime), timeToPixels(maxNewTime));
        targetX = Math.max(timeToPixels(minNewTime), targetX);
        targetX = Math.min(timeToPixels(maxNewTime), targetX);
            if (resizingStartTime){
                // if start time, move initial, keep final pos intact
                var finalPos = element.css("left") + element.css("width");
                element.css('left', targetX);
                element.css('width', finalPos - targetX);
                subtitle.start_time = timeToPixels(targetX) ;
            }else{
                // end time, let left alone, increase width
                var newWidth = targetX - element.css('left');
                element.css('width', newWidth);
                subtitle.end_time = timeToPixels(newWidth)
            }
    }

    function onStartDrag(event, element, subtitle){
        startDraggingX = event.pageX;
       if(element.css('cursor')=='move') {
           draggingMode = 'moving';
       }else{
           draggingMode = 'resizing';
           var x = event.pageX - $(element).offset().left;
           var RESIZE_HIT_AREA = 10;
           resizingStartTime = false;
           var previousSubtitle = subtitleList.getPrevious(subtitle);
           var nextSubtitle = subtitleList.getNext(subtitle);
           console.log(previousSubtitle, nextSubtitle);
           if (x <= RESIZE_HIT_AREA ){
                resizingStartTime = true;
               minNewTime = previousSubtitle? previousSubtitle.end_time: 0;
               maxNewTime = subtitle.end_time - MIN_SUBTITLE_DURATION;
            }else{
               maxNewTime = nextSubtitle ? nextSubtitle.start_time: 30000;
               minNewTime = subtitle.start_time + MIN_SUBTITLE_DURATION;
           }
           console.log(draggingMode, resizingStartTime, minNewTime, maxNewTime);
           element.mousemove (function(event) {
               onResizing(event, element, subtitle);
           });
       }
    }
    function onSubtitleBubbleMouseMove(element, subtitle, event) {
        var cursorType = 'move';
        var x = event.pageX - $(element).offset().left;
        var RESIZE_HIT_AREA = 10;
        if (x <= RESIZE_HIT_AREA || x >= $(element).width() - RESIZE_HIT_AREA) {
            cursorType = 'col-resize';
        }
        $(element).css('cursor', cursorType);
    }


    return {
        link:function (scope, elm, attrs) {
            var subtitle = scope.subtitle;
            elm.text(subtitle.text);

            elm.addClass('subtitleBubble');
            elm.mousemove(function (event) {
                onSubtitleBubbleMouseMove(elm, subtitle, event);
            });
            scope.$on('playerTimeChanged', function(event, newTime){
                repositionSubtitle(elm, scope.subtitle, newTime);
            });
            repositionSubtitle(elm, scope.subtitle, currentPlayerTime.get());
            elm.mousedown(function(event){
                onStartDrag(event, elm, subtitle);
            })
        }
    };
});

