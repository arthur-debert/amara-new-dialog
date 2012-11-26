directives.directive('timelineTrack', function ($filter, subtitleList, currentPlayerTime) {
    /**
     * The time line is composed of two parts.
     * The strip with the time markers (which is draggeable)
     * and the timelineSubtitleList, containing the balloons with those subs
     * @type {undefined}
     */

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
            elm.parent().css("width", viewWidth + "px");
            scope.subtitlesInView = getSubtitlesInView(subtitleList.get(), currentPlayerTime.get());
            scope.$on("playerTimeChanged", function (event, newTime) {
                var timeStart = getTimeToStart(newTime, millisecondsPerView);
                var xOffset = timeToPixels(timeStart);
                $(".timelineInner", elm).css('left', -xOffset);
                scope.$$childHead.onTimeChanged(getSubtitlesInView(subtitleList.get(), newTime))

            });
        }
    }
});