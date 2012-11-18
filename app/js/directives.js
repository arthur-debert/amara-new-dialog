'use strict';

/* Directives */
var viewWidth = 620;
var zoomLevel = 1;
// normalized to zoom level 1
var millisecondsPerView = 6200;
var pixelsPerMillisecond = (viewWidth / millisecondsPerView) * zoomLevel;
var currentMouseX, previousMouseX = undefined;


var markerEveryMilliseconds = 500;

function cssPropToPixels(val){
    return parseInt(val.substring(0, val.indexOf('p')));
}
function timeToPixels(time) {
    return (time * pixelsPerMillisecond) ;
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
    var startSecond = Math.ceil(startTime / 1000)
    var endSecond = Math.ceil(finalTime / 1000);
    var step = Math.ceil((endSecond - startSecond) / (millisecondsPerView)/ markerEveryMilliseconds);
    var currentTime = startSecond;
    for (var i = startSecond; i <= endSecond; i+=step){
        var nextMarkerT = i * 1000;
        if (nextMarkerT < finalTime) {
            times.push(nextMarkerT);
        }
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
directives.directive('syncPanel', function (subtitleList, currentPlayerTime ) {
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
            ticker.text(parseInt(markerTime / 1000));
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
            timelineEl.css("width", viewWidth + "px");
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
    var playerTimeOffset  = null;
    function getSubtitlePos(subtitle, currentTime){
        return {
            left: timeToPixels(subtitle.start_time) - timeToPixels(currentTime),
            width : timeToPixels(subtitle.end_time - subtitle.start_time)
        }

    }
    function repositionSubtitle(elm, subtitle, currentTime) {
        elm.css(getSubtitlePos(subtitle, currentTime));
    }

    function onMoving(event, element, subtitle, minDragPos, maxDragPos){
        var targetX = event.pageX - startDraggingX + playerTimeOffset;

        if (targetX > minDragPos && targetX + cssPropToPixels(element.css("width"))< maxDragPos){
            var duration = subtitle.end_time - subtitle.start_time;
           subtitle.start_time = pixelsToTime(targetX);
            subtitle.end_time = subtitle.start_time + duration;

        }
    }
    function onResizing(event, element, subtitle, previousSubtitle, nextSubtitle, minNewTime, maxNewTime){
        var targetX = event.pageX + playerTimeOffset ;
        targetX = Math.max(timeToPixels(minNewTime), targetX);
        targetX = Math.min(timeToPixels(maxNewTime), targetX);
        var left = cssPropToPixels(element.css("left"));
        var width = cssPropToPixels(element.css("width"));
            if (resizingStartTime){
                // if start time, move initial, keep final pos intact
                subtitle.start_time = pixelsToTime(targetX) ;
                var duration = subtitle.end_time - subtitle.start_time;
                if (previousSubtitle && subtitle.start_time <= previousSubtitle.end_time &&
                    subtitle.start_time > minNewTime){
                    previousSubtitle.end_time = subtitle.start_time;
                }
            }else{
                // end time, let left alone, increase width
                var newWidth = targetX - left;
                subtitle.end_time = pixelsToTime( left + newWidth );
                if (nextSubtitle && subtitle.end_time >= nextSubtitle.start_time &&
                    subtitle.end_time < maxNewTime){
                    nextSubtitle.start_time = subtitle.end_time;
                }
            }
    }

    function onStartDrag(event, element, subtitle, scope){

        playerTimeOffset = timeToPixels(currentPlayerTime.get());
        var previousSubtitle = subtitleList.getPrevious(subtitle);
        var nextSubtitle = subtitleList.getNext(subtitle);
       if(element.css('cursor')=='move') {
           draggingMode = 'moving';
           startDraggingX =  event.pageX - element.offset().left;
           var minDragPos = previousSubtitle ?
               timeToPixels(previousSubtitle.end_time) : 0;
           var maxDragPos = nextSubtitle? timeToPixels(nextSubtitle.start_time) : 500000;
           $(document).mousemove (function(event) {
               onMoving(event, element, subtitle, minDragPos, maxDragPos);
               scope.$root.$broadcast("subtitleChanged")
           });
       }else{
           startDraggingX = event.pageX;
           draggingMode = 'resizing';
           var x = event.pageX - $(element).offset().left;
           var RESIZE_HIT_AREA = 10;
           resizingStartTime = false;
           if (x <= RESIZE_HIT_AREA ){
                resizingStartTime = true;
               minNewTime = previousSubtitle? previousSubtitle.start_time + MIN_SUBTITLE_DURATION: 0;
               maxNewTime = subtitle.end_time - MIN_SUBTITLE_DURATION;
            }else{
               maxNewTime = nextSubtitle ? nextSubtitle.end_time - MIN_SUBTITLE_DURATION: 30000;
               minNewTime = subtitle.start_time + MIN_SUBTITLE_DURATION;
           }
           $(document).mousemove (function(event) {
               onResizing(event, element, subtitle, previousSubtitle, nextSubtitle , minNewTime, maxNewTime );
               scope.$root.$broadcast("subtitleChanged")
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
            scope.$on("subtitleChanged", function () {
                repositionSubtitle(elm, scope.subtitle, currentPlayerTime.get());
            })
            repositionSubtitle(elm, scope.subtitle, currentPlayerTime.get());
            elm.mousedown(function(event){
                onStartDrag(event, elm, subtitle, scope);
                $(document).mouseup(function(event){
                    $(document).unbind('mousemove') ;
                })
            })
        }
    };
});

