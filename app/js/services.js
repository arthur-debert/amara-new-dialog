'use strict';

/* Services */
function randIntRange(min, max){
    return Math.floor(min + (Math.random() * max ));
}

var subtitleDataServices = angular.module('myApp.subtitleDataServices', [], function($provide){


$provide.factory('subtitleList', function () {
    var randomizeTimes = false;
    var resetData = {};
    var subtitles = [];
    var currentTime = 0;
    var bacon = "Bacon ipsum dolor sit amet meatloaf kielbasa turducken tail, cow leberkas prosciutto shoulder chuck pork chop turkey swine sausage. Swine beef bacon sausage bresaola. Tri-tip pastrami meatball meatloaf sausage brisket pork chop, ham drumstick shank venison shankle. Pancetta fatback drumstick, leberkas spare ribs chuck pastrami tail biltong prosciutto bacon. Sirloin jerky tongue turkey kielbasa. Strip steak andouille short loin, tail fatback ham hock leberkas pancetta boudin tri-tip tongue. Hamburger t-bone brisket kielbasa."
    for (var i = 0; i < 100; i++) {
        var duration = 1000;
        if (randomizeTimes){
            var duration = randIntRange(300, 3000);
        }
        subtitles.push({
            text: i + ") " + bacon.substr(0, randIntRange(8, 72)),
            startTime: currentTime,
            endTime: currentTime + duration
        });
        if (randomizeTimes){
            currentTime += duration + randIntRange(200, 3000);
        }else{
            currentTime = (i+1) * 2000;
        }
    }
    resetData['beforeSubtitling'] = subtitles.slice(0);
        return {
            get:function () {
                return subtitles;
            },
            set:function (newSubtitles) {
                subtitles = newSubtitles;
            },
            removeSubtitle: function(subtitle){
                for (var i =0 ; i < subtitles.length; i++){
                    if (subtitles[i]==subtitle){
                        subtitles.splice(i,1);
                    }
                }
            },
            getPrevious: function(subtitle){
                var index = _.indexOf(subtitles, subtitle);
                if (index ==0) {
                    return undefined;
                }
                return subtitles[index -1];
            },
            getNext: function(subtitle){
                var index = _.indexOf(subtitles, subtitle);
                if (index == subtitles.length) {
                    return undefined;
                }
                return subtitles[index +1];
            },
            addSubtitle: function(subtitle, afterSubtitle){
                var index = subtitles.length ;
                if (afterSubtitle ){
                    for (var i =0 ; i < subtitles.length; i++){
                        if (subtitles[i]==afterSubtitle){
                            index = i;
                        }
                    }
                }
                // if last, assume start and end times
                if (! afterSubtitle){
                    subtitle.startTime = subtitles[index - 1].endTime;
                    subtitle.endTime = subtitle.startTime + 2000;
                }
                subtitles.splice(index, 0, subtitle);
                return subtitle;

            },
            resetStep: function (stepName){
                if (resetData[stepName]){
                    subtitles = resetData[stepName].slice(0);
                    return subtitles;
                }
                throw Error("No such step");
            }
        }
});

$provide.factory('currentPlayerTime', ['$rootScope', function($scope){
   var currentTime = 0;
   var timeInterval = undefined;
    var lastTimeStamp = undefined;
    var suspended = false;
    function updatePlayTime(){
        var newTime = new Date().getTime();
        if (!suspended){
            currentTime += (newTime - lastTimeStamp) ;
            $scope.$broadcast("playerTimeChanged", currentTime)
        }
        lastTimeStamp = newTime;
    }
    return {
        /**
         * If suspended and playing, won't updated the current time.
         * This is used when user interaction (timeline dragging, or
         * track item resizing are taking place).
         * @param isSuspended
         */
        suspend: function(isSuspended){
            suspended = isSuspended;
        },
        get: function(){
            return currentTime;
        },
        set: function(newTime){
            try{
                newTime = parseInt(newTime);
            }catch(e){
                console.log("Can't set new time to", newTime);
                throw e;
            }

            // FIXME: cap to min max
            newTime = Math.max(0, newTime);
            if (newTime != currentTime){
                currentTime = newTime;
                $scope.$broadcast("playerTimeChanged", newTime)
            }
        },
        isPlaying: function(){
            return timeInterval !== undefined;
        },
        playPause: function(){
            if (this.isPlaying()){
                this.pause();
                return false;
            }else{
                this.play();
                return true;
            }
        },
        play: function(){
            clearInterval(timeInterval);
            timeInterval = undefined;
            lastTimeStamp = new Date().getTime();
            timeInterval = setInterval(updatePlayTime, 10)
        },
        pause: function(){
            clearInterval(timeInterval);
            timeInterval = undefined;
        }
    }
}])
});
