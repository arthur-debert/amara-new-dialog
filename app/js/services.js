'use strict';

/* Services */
function randIntRange(min, max){
    return Math.floor(min + (Math.random() * max ));
}

var subtitleDataServices = angular.module('myApp.subtitleDataServices', [], function($provide){


$provide.factory('subtitleList', function () {
    var resetData = {};
    var subtitles = [];
    var currentTime = 0;
    var bacon = "Bacon ipsum dolor sit amet meatloaf kielbasa turducken tail, cow leberkas prosciutto shoulder chuck pork chop turkey swine sausage. Swine beef bacon sausage bresaola. Tri-tip pastrami meatball meatloaf sausage brisket pork chop, ham drumstick shank venison shankle. Pancetta fatback drumstick, leberkas spare ribs chuck pastrami tail biltong prosciutto bacon. Sirloin jerky tongue turkey kielbasa. Strip steak andouille short loin, tail fatback ham hock leberkas pancetta boudin tri-tip tongue. Hamburger t-bone brisket kielbasa."
    for (var i = 0; i < 100; i++) {
        var duration = randIntRange(300, 3000);
        subtitles.push({
            text: i + ") " + bacon.substr(0, randIntRange(8, 72)),
            start_time: currentTime,
            end_time: currentTime + duration,
        });
        currentTime += duration + randIntRange(200, 3000);
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
            addSubtitle: function(subtitle, afterSubtitle){
                var index = subtitles.length;
                if (afterSubtitle ){
                    for (var i =0 ; i < subtitles.length; i++){
                        if (subtitles[i]==afterSubtitle){
                            index = i;
                        }
                    }
                }
                subtitles.splice(index, 0, subtitle);

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
    return {
        get: function(){
            return currentTime;
        },
        set: function(newTime){
            // FIXME: cap to min max
            newTime = Math.max(0, newTime);
            if (newTime != currentTime){
                currentTime = newTime;
                $scope.$emit("playerTimeChanged", newTime)
            }
        }
    }
}])
});
