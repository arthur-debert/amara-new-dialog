directives.directive('timelineTrackItem', function (subtitleList, currentPlayerTime, pubsub) {

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
