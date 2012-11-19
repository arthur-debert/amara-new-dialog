'use strict';

/* Directives */
var viewWidth = 640;
var zoomLevel = 1;
// normalized to zoom level 1
var millisecondsPerView = 5000;
var pixelsPerMillisecond = (viewWidth / millisecondsPerView) * zoomLevel;
var currentMouseX, previousMouseX = undefined;


var markerEveryMilliseconds = 500;

function getTimeToStart(currentTime, millisecondsPerView){
    var timeStart = 0;
    if ((currentTime - millisecondsPerView/2 ) > 0){
        timeStart = currentTime - millisecondsPerView/2;
    }
    return timeStart;
}

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
    // time to start drawing must be to the left of the screen
    // because some elements will begin off view port, but will
    // end already on viewport
    var startSecond = Math.ceil((startTime - (millisecondsPerView/3)) / 1000);
    var endSecond = Math.ceil(finalTime / 1000);
    var step = Math.ceil((endSecond - startSecond) / (millisecondsPerView)/ markerEveryMilliseconds);
    for (var i = startSecond; i <= endSecond; i+=step){
        var nextMarkerT = i * 1000;
        if (nextMarkerT < finalTime) {
            times.push(nextMarkerT);
        }
    }
    return times;
}

var directives = angular.module('myApp.directives', []);
directives.directive('subtitleList', function (subtitleList, currentPlayerTime) {
    var hasWindowResize = false;
    function resizeSubtitleList(window, elm){
        var height = $(window).height() - $(elm).offset().top - 2;
        height = Math.max(40, height);
        $(elm).css("height", height + "px");
    }
    return {
        link:function (scope, elm, attrs) {

            var elm = elm;
            if (! hasWindowResize){
                $(window).resize(function(event){
                    resizeSubtitleList(window, elm);
                })
            }
            resizeSubtitleList(window, elm);
        }
    }
});

directives.directive('amaraEditableSubtitle', function (subtitleList, currentPlayerTime) {
    var hasWindowResize = false;
    return {
        link:function (scope, elm, attrs) {
            var textOnFocus = null;
            var el = angular.element(elm[0]);
            var editableParagrah = $(elm[0]).children("p")[0];
            editableParagrah.addEventListener('focus', function () {
                $(el).addClass("active");
                currentPlayerTime.set(scope.subtitle.startTime);
                angular.element(el).controller().setActive(true);
                textOnFocus = $(editableParagrah).text();
                // this little monster is the helper that
                // selects all text in a div.
                window.setTimeout(function() {
                    var sel, range;
                    if (window.getSelection && document.createRange) {
                        range = document.createRange();
                        range.selectNodeContents(editableParagrah);
                        sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (document.body.createTextRange) {
                        range = document.body.createTextRange();
                        range.moveToElementText(editableParagrah);
                        range.select();
                    }
                }, 1);
            });
            editableParagrah.addEventListener('blur', function (event) {
                // if text is empty, restore to the text on focus
                // easy cop out, but just saner than alternatives
                // (deleting, sub, etc)
                $(el).removeClass("active");
                angular.element(el).controller().setActive(false);
                var text = $(editableParagrah).text();
                if(!String.prototype.trim) {
                    text  = text.replace(/^\s+|\s+$/g,'');
                }else{
                    text = text.trim();
                }
                if (text == ''){
                    $(editableParagrah).text(textOnFocus);
                    return;
                }
                scope.$root.$apply(function () {
                    scope.subtitle.text = $(editableParagrah).text();
                    scope.$root.subtitles = subtitleList.get();
                });
                scope.$emit("subtitleChanged")
            }, false);
            $(editableParagrah).keypress(function(event){
                if (event.keyCode == 13 && ! event.shiftKey){
                    event.preventDefault();
                    editableParagrah.blur();
                }
            });
            if (scope.mustScrollToBottom) {
                var parent = elm[0].parentElement;
                parent.scrollTop = parent.scrollHeight - parent.offsetHeight;
                scope.mustScrollToBottom = false;
            }
            var currentTime = currentPlayerTime.get();
            if (scope.subtitle.startTime > currentTime &&
                scope.subtitle.endTime < currentTime) {
                el.addClass("currentlyPlaying");
            }
        }
    };
});
directives.directive('syncPanel', function ($filter,subtitleList, currentPlayerTime ) {
    /**
     * The time line is composed of two parts.
     * The strip with the time markers (which is draggeable)
     * and the timelineSubtitleList, containing the balloons with those subs
     * @type {undefined}
     */
    var timebarEl = undefined;
    var timelineEl = undefined;
    var timeNeedle;


    function redrawTimebar( timebarEl, currentTime) {
        $(timebarEl).children("li").remove();
        var timeStart = getTimeToStart(currentTime, millisecondsPerView);
        var xOffset = timeToPixels(timeStart);
        var markerTimes = getMarkerTimes(timeStart, markerEveryMilliseconds, millisecondsPerView);
        _.each(markerTimes, function (markerTime, i) {
            var ticker = $("<li>");
            ticker.text($filter("toClockTime")(markerTime ));
            // position
            var xPos = timeToPixels(markerTime) - xOffset;
            ticker.css("left", xPos);
            timebarEl.append(ticker);

        });

        $(timeNeedle).css('left' , timeToPixels(currentTime) - xOffset);


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
        var startTime = getTimeToStart(currentTime, millisecondsPerView);
        var endTime = startTime + millisecondsPerView;

        for (var i = 0; i < allSubtitles.length; i++) {
            var subtitle = allSubtitles[i];
            if (subtitle.startTime > endTime) {
                break;
            }
            if (subtitle.startTime > startTime || (subtitle.endTime > startTime && subtitle.endTime < endTime )) {
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
            redrawTimebar(timebarEl, currentPlayerTime.get());
            function onStartTimelineDrag(e) {
                currentMouseX = previousMouseX = e.pageX;
                dragTimeout = setInterval(onDragging, 40);
                $(document).mousemove(registerMouse)
            }

            function onStopDragging(e) {
                $(document).unbind("onmousemove");
                clearInterval(dragTimeout);
            }

            var paper = Raphael($(".timebar .timeNeedle")[0])
            var circle = paper.circle(4, 4, 4);
            circle.attr("stroke-width", "0");
            circle.attr("fill", "#f00");
            var line = paper.path("M 4,4L4,70")
            line.attr("stroke-width", "2px")
            line.attr("stroke", "#f00")
            timeNeedle = $(timebarEl).children(".timeNeedle")[0];
            // atach drag and drop
            timebarEl.mousedown(onStartTimelineDrag);
            $(document).mouseup(onStopDragging);
            scope.$on("subtitleChanged", function () {
                redrawTimebar(timebarEl, currentPlayerTime.get());
            })
            scope.subtitlesInView = getSubtitlesInView(subtitleList.get(), currentPlayerTime.get());
            scope.$on("playerTimeChanged", function (event, newTime) {
                redrawTimebar(timebarEl, newTime);
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
            left: timeToPixels(subtitle.startTime) - timeToPixels(getTimeToStart(currentTime, millisecondsPerView)),
            width : timeToPixels(subtitle.endTime - subtitle.startTime)
        }

    }
    function repositionSubtitle(elm, subtitle, currentTime) {
        var pos = getSubtitlePos(subtitle, currentTime);
        elm.css(pos);
        elm.text(subtitle.text);
    }

    function onMoving(event, element, subtitle, minDragPos, maxDragPos){
        var targetX = event.pageX - startDraggingX + playerTimeOffset;

        if (targetX > minDragPos && targetX + cssPropToPixels(element.css("width"))< maxDragPos){
            var duration = subtitle.endTime - subtitle.startTime;
           subtitle.startTime = pixelsToTime(targetX);
            subtitle.endTime = subtitle.startTime + duration;

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
                subtitle.startTime = pixelsToTime(targetX) ;
                var duration = subtitle.endTime - subtitle.startTime;
                if (previousSubtitle && subtitle.startTime <= previousSubtitle.endTime &&
                    subtitle.startTime > minNewTime){
                    previousSubtitle.endTime = subtitle.startTime;
                }
            }else{
                // end time, let left alone, increase width
                var newWidth = targetX - left;
                subtitle.endTime = pixelsToTime( left + newWidth );
                if (nextSubtitle && subtitle.endTime >= nextSubtitle.startTime &&
                    subtitle.endTime < maxNewTime){
                    nextSubtitle.startTime = subtitle.endTime;
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
               timeToPixels(previousSubtitle.endTime) : 0;
           var maxDragPos = nextSubtitle? timeToPixels(nextSubtitle.startTime) : 500000;
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
               minNewTime = previousSubtitle? previousSubtitle.startTime + MIN_SUBTITLE_DURATION: 0;
               maxNewTime = subtitle.endTime - MIN_SUBTITLE_DURATION;
            }else{
               maxNewTime = nextSubtitle ? nextSubtitle.endTime - MIN_SUBTITLE_DURATION: 30000;
               minNewTime = subtitle.startTime + MIN_SUBTITLE_DURATION;
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

            elm.addClass('subtitleBubble');
            elm.mousemove(function (event) {
                onSubtitleBubbleMouseMove(elm, subtitle, event);
            });
            scope.$on('playerTimeChanged', function(event, newTime){
                repositionSubtitle(elm, scope.subtitle, newTime);
            });
            scope.$root.$on("subtitleChanged", function () {
                repositionSubtitle(elm, scope.subtitle, currentPlayerTime.get());
            })
            repositionSubtitle(elm, scope.subtitle, currentPlayerTime.get());
            elm.mousedown(function(event){
                elm.controller().active = true;
                onStartDrag(event, elm, subtitle, scope);
                $(document).mouseup(function(event){
                    $(document).unbind('mousemove') ;
                    scope.$root.$apply(function(){
                    scope.$root.subtitles = subtitleList.get();
                    elm.controller().active = false;
                    });
                })
            })
        }
    };
});

