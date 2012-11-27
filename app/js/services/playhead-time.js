angular.module('amara.SubtitleEditor.services.PlayHeadTime', []);
angular.module('amara.SubtitleEditor.services.PlayHeadTime').factory('currentPlayerTime',
    ['$rootScope', '$window', function ($scope, $window) {
        var currentTime = 0;
        var timeInterval = undefined;
        var lastTimeStamp = undefined;
        var suspended = false;
        var BURST_TIME = 4000;
        var STOP_PLAYING_AFTER_SILENCE_TIME = 1000;
        var NO_MANAGEMENT = 'nomanagement';
        var SHORT_BURSTS = 'shortbursts';
        var TYPING_DETECTION = 'typingdetection';
        var playTimeMode = NO_MANAGEMENT;
        // if on SHORT_BURSTS, when to stop the player time
        var stopPlayingAt = undefined;
        var totalDuration = 100000;

        function updatePlayTime() {
            var newTime = new Date().getTime();
            if (!suspended) {
                currentTime += (newTime - lastTimeStamp);
                if ((playTimeMode == SHORT_BURSTS || playTimeMode == TYPING_DETECTION)
                    &&  currentTime > stopPlayingAt){
                    playTimeService.pause();
                }
                $scope.$broadcast("playerTimeChanged", currentTime)
            }
            lastTimeStamp = newTime;
        }

        var playTimeService =  {
            /**
             * If suspended and playing, won't updated the current time.
             * This is used when user interaction (timeline dragging, or
             * track item resizing are taking place).
             * @param isSuspended
             */
            suspend:function (isSuspended) {
                suspended = isSuspended;
            },
            get:function () {
                return currentTime;
            },
            set:function (newTime) {
                try {
                    newTime = parseInt(newTime);
                } catch (e) {
                    console.log("Can't set new time to", newTime);
                    throw e;
                }

                // FIXME: cap to min max
                newTime = Math.max(0, newTime);
                if (newTime != currentTime) {
                    currentTime = newTime;
                    $scope.$broadcast("playerTimeChanged", newTime)
                }
            },
            isPlaying:function () {
                return timeInterval !== undefined;
            },
            playPause:function () {
                if (this.isPlaying()) {
                    this.pause();
                    return false;
                } else {
                    this.play();
                    return true;
                }
            },
            play:function () {
                clearInterval(timeInterval);
                timeInterval = undefined;
                lastTimeStamp = new Date().getTime();
                timeInterval = setInterval(updatePlayTime, 10)
                if (playTimeMode == SHORT_BURSTS){
                    stopPlayingAt = currentTime + BURST_TIME;
                }else if (playTimeMode == TYPING_DETECTION){
                    stopPlayingAt = currentTime + STOP_PLAYING_AFTER_SILENCE_TIME;
                }
            },
            pause:function () {
                clearInterval(timeInterval);
                timeInterval = undefined;
            },
            playTimeMode : function(newValue){
                if (newValue !== undefined){
                    playTimeMode = newValue;
                }
                return playTimeMode;
            }
        }

        $(window).keydown(function(event){
            // isTab
            var isTab = event.keyCode === 9;
            var userIsEditing = document.activeElement && (
                document.activeElement.tagName.toLowerCase()   == 'input' ||
                    $(document.activeElement).attr("contenteditable") == 'true');
            if (isTab && !userIsEditing){
                event.preventDefault();
                if (playTimeMode == NO_MANAGEMENT){
                    playTimeService.playPause();
                    return;
                }else  if (playTimeMode == TYPING_DETECTION){
                    return;
                }else if (playTimeMode == SHORT_BURSTS){
                    if (event.shiftKey){
                        currentTime = Math.max(0, currentTime - BURST_TIME);
                        stopPlayingAt = currentTime  + SHORT_BURSTS;
                    }else{
                        stopPlayingAt = Math.min(totalDuration - BURST_TIME, currentTime + BURST_TIME);
                        if (playTimeService.isPlaying()){
                            playTimeService.pause();
                            return;
                        }

                    }
                    if (!playTimeService.isPlaying()){
                        playTimeService.play();
                    }
                }
            }else{
                if (playTimeMode == TYPING_DETECTION){
                    stopPlayingAt = currentTime + STOP_PLAYING_AFTER_SILENCE_TIME;
                }
            }

        });
        return playTimeService;
    }])
