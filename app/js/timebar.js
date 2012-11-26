directives.directive('timebar', function ($filter, subtitleList, currentPlayerTime) {
    /**
     * The time line is composed of two parts.
     * The strip with the time markers (which is draggeable)
     * and the timelineSubtitleList, containing the balloons with those subs
     * @type {undefined}
     */
    var timeNeedle;


    function redrawTimebar(timebarEl, currentTime) {
        var timeStart = getTimeToStart(currentTime, millisecondsPerView);
        var xOffset = timeToPixels(timeStart);
        var timebarToMove = $(".timelineInner", timebarEl);

        $(timebarToMove).children(".ticker").remove();
        $(timebarToMove).css('left', -xOffset);
        var markerTimes = getMarkerTimes(timeStart, markerEveryMilliseconds, millisecondsPerView);
        _.each(markerTimes, function (markerTime, i) {
            var xPos = timeToPixels(markerTime);
            var ticker = $("<div>").
                addClass("ticker").
                text($filter("toClockTime")(markerTime)).
                css("left", xPos);
            timebarToMove.append(ticker);

        });
        // the needle is svg positioned as absolute
        $(timeNeedle).css('left', timeToPixels(currentTime) - xOffset);


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

            elm.css("width", viewWidth + "px");
            redrawTimebar(elm, currentPlayerTime.get());
            function onStartTimelineDrag(e) {
                currentPlayerTime.suspend(true);
                currentMouseX = previousMouseX = e.pageX;
                dragTimeout = setInterval(onDragging, 40);
                $(document).mousemove(registerMouse)
            }

            function onStopDragging(e) {
                currentPlayerTime.suspend(false);
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
            timeNeedle = $(elm).children(".timeNeedle")[0];
            // atach drag and drop
            elm.mousedown(onStartTimelineDrag);
            $(document).mouseup(onStopDragging);
            scope.$on("subtitleChanged", function () {
                redrawTimebar(elm, currentPlayerTime.get());
            });
            scope.subtitlesInView = getSubtitlesInView(subtitleList.get(), currentPlayerTime.get());
            scope.$on("playerTimeChanged", function (event, newTime) {
                redrawTimebar(elm, newTime);

            });
        }
    }
});
