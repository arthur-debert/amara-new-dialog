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

var directives = angular.module('myApp.directives', []);
directives.directive('subtitleList', function (subtitleList, currentPlayerTime, pubsub) {
    var hasWindowResize = false;


    function resizeSubtitleList(window, elm) {
        var height = $(window).height() - $(elm).offset().top - 2;
        height = Math.max(40, height);
        $(elm).css("height", height + "px");
    }

    return {
        link:function (scope, elm, attrs) {

            var elm = elm;
            if (!hasWindowResize) {
                $(window).resize(function (event) {
                    resizeSubtitleList(window, elm);
                })
            }
            resizeSubtitleList(window, elm);
        }
    }
});

directives.directive('amaraEditableSubtitle', function (subtitleList, currentPlayerTime, pubsub) {
    var hasWindowResize = false;
    var obj =  {
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
                window.setTimeout(function () {
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
                if (!String.prototype.trim) {
                    text = text.replace(/^\s+|\s+$/g, '');
                } else {
                    text = text.trim();
                }
                if (text == '') {
                    $(editableParagrah).text(textOnFocus);
                    return;
                }
                scope.$root.$apply(function () {
                    scope.subtitle.text = $(editableParagrah).text();
                    scope.$root.subtitles = subtitleList.get();
                });
                scope.$emit("subtitleChanged")
            }, false);
            $(editableParagrah).keypress(function (event) {
                if (event.keyCode == 13 && !event.shiftKey) {
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

            function onSubtitleSelected(isSelected){
                if (isSelected){
                    el.get(0).scrollIntoView(true);
                }
                el.controller().setActive(isSelected);
            }
            // watch for changes to this specific sub
            pubsub.subscribe("subtitleSelected_" + scope.$index, onSubtitleSelected)
        }
    };
    return obj;
});

directives.directive('trackItem', function (subtitleList, currentPlayerTime, pubsub) {

    var MIN_SUBTITLE_DURATION = 500;
    var draggingMode = null;
    var resizingStartTime = false;
    var startDraggingX = null;
    var minNewTime = null;
    var maxNewTime = null;
    var draggingInterval = null;
    var playerTimeOffset = null;

    function getItemPos(subtitle, currentTime) {
        return {
            left:timeToPixels(subtitle.startTime),
            width:timeToPixels(subtitle.endTime - subtitle.startTime)
        }

    }

    function repositionItem(elm, subtitle, currentTime) {
        var pos = getItemPos(subtitle, currentTime);
        elm.css(pos);
    }

    function onMoving(event, element, subtitle, minDragPos, maxDragPos, mouseOffset) {
        var targetX = event.pageX - mouseOffset;
        if (targetX > minDragPos && targetX + cssPropToPixels(element.css("width")) < maxDragPos) {
            var duration = subtitle.endTime - subtitle.startTime;
            subtitle.startTime = pixelsToTime(targetX - element.parent().offset().left);
            subtitle.endTime = subtitle.startTime + duration;

        }
    }

    function onResizing(event, element, subtitle, previousSubtitle, nextSubtitle, minNewTime, maxNewTime) {
        var targetX = event.pageX - element.parent().offset().left;
        var firstTargetX = targetX;

        targetX = Math.max(timeToPixels(minNewTime), targetX);
        targetX = Math.min(timeToPixels(maxNewTime), targetX);
        var left = cssPropToPixels(element.css("left"));
        var width = cssPropToPixels(element.css("width"));
        if (resizingStartTime) {
            // if start time, move initial, keep final pos intact
            subtitle.startTime = pixelsToTime(targetX);
            var duration = subtitle.endTime - subtitle.startTime;
            if (previousSubtitle && subtitle.startTime <= previousSubtitle.endTime &&
                subtitle.startTime > minNewTime) {
                previousSubtitle.endTime = subtitle.startTime;
            }
        } else {
            // end time, let left alone, increase width
            var newWidth = targetX - left;
            subtitle.endTime = pixelsToTime(left + newWidth);
            if (nextSubtitle && subtitle.endTime >= nextSubtitle.startTime &&
                subtitle.endTime < maxNewTime) {
                nextSubtitle.startTime = subtitle.endTime;
            }
        }
    }

    function onStartDrag(event, element, subtitle, scope) {

        // get the x pos relative to the parent div
        startDraggingX = event.pageX - element.parent().offset().left;
        playerTimeOffset = timeToPixels(currentPlayerTime.get());
        var previousSubtitle = subtitleList.getPrevious(subtitle);
        var nextSubtitle = subtitleList.getNext(subtitle);
        if (element.css('cursor') == 'move') {
            startDraggingX = event.pageX - element.offset().left;
            draggingMode = 'moving';
            var minDragPos = previousSubtitle ?
                timeToPixels(previousSubtitle.endTime) + element.parent().offset().left : 1;
            var maxDragPos = nextSubtitle ? timeToPixels(nextSubtitle.startTime) + element.parent().offset().left : 500000;
            var mouseOffset = event.pageX - element.offset().left;
            $(document).mousemove(function (event) {
                onMoving(event, element, subtitle, minDragPos, maxDragPos, mouseOffset);
                scope.$root.$broadcast("subtitleChanged")
            });
        } else {
            draggingMode = 'resizing';
            var x = event.pageX - $(element).offset().left;
            var RESIZE_HIT_AREA = 10;
            resizingStartTime = false;
            if (x <= RESIZE_HIT_AREA) {
                resizingStartTime = true;
                minNewTime = previousSubtitle ? previousSubtitle.startTime + MIN_SUBTITLE_DURATION : 0;
                maxNewTime = subtitle.endTime - MIN_SUBTITLE_DURATION;
            } else {
                maxNewTime = nextSubtitle ? nextSubtitle.endTime - MIN_SUBTITLE_DURATION : 30000;
                minNewTime = subtitle.startTime + MIN_SUBTITLE_DURATION;
            }
            $(document).mousemove(function (event) {
                onResizing(event, element, subtitle, previousSubtitle, nextSubtitle, minNewTime, maxNewTime);
                scope.$root.$broadcast("subtitleChanged")
            });
        }
    }

    function onTrackItemMouseMove(element, subtitle, event) {
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
                onTrackItemMouseMove(elm, subtitle, event);
            });
            scope.$on('playerTimeChanged', function (event, newTime) {
                repositionItem(elm, scope.subtitle, newTime);
            });
            scope.$root.$on("subtitleChanged", function () {
                repositionItem(elm, scope.subtitle, currentPlayerTime.get());
            });
            repositionItem(elm, scope.subtitle, currentPlayerTime.get());
            elm.mousedown(function (event) {
                scope.selectedTrackItem = subtitle;
                pubsub.publish("subtitleSelected_" + _.indexOf(subtitleList.get(), subtitle), [true]);
                scope.$root.$broadcast("onTrackItemSelected", subtitle);
                var controller = elm.controller();
                if (controller) {
                    //controller.setActive(true);
                }
                currentPlayerTime.suspend(true);
                onStartDrag(event, elm, subtitle, scope);
                $(document).mouseup(function (event) {
                    $(document).unbind('mousemove');
                    scope.selectedTrackItem = null;
                    scope.$root.$apply(function () {
                        scope.$root.subtitles = subtitleList.get();
                        _.delay(function(){
                            pubsub.publish("subtitleSelected_" + _.indexOf(subtitleList.get(), subtitle), [false]);
                        });
                    });

                    currentPlayerTime.suspend(false);
                })
            })
        }
    };
});


