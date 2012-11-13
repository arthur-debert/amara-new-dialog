'use strict';

/* Controllers */


function SubtitleList($scope, subtitleList) {
    $scope.subtitles = subtitleList.get();
    $scope.removeSubtitle = function(subtitle){
        subtitleList.removeSubtitle(subtitle);
    };
    $scope.addSubtitle = function(text){
        $scope.mustScrollToBottom = true;
        subtitleList.addSubtitle({'text':text})
        $scope.newSubtitleText = '';
    }
    $scope.resetSubtitling = function(){
        $scope.subtitles = subtitleList.resetStep('beforeSubtitling');
    }
    $scope.onSubtitlesInViewChanged = function(newSubtitles){
        $scope.subtitlesInView = newSubtitles ;
        console.log("subs updated")
    }

}
//SubtitleList.$inject(["$scope", "subtitleList"])

function TimeLine($scope, subtitleList, currentPlayerTime){
    this.$scope = $scope;

    $scope.magic = "hey"
    $scope.onTimeChanged = function(subs, newTime){
        $scope.$apply(function(){
            $scope.subtitlesInView= $scope.$parent.subtitlesInView = subs.slice();

        })


    }

}
//TimeLine.$inject(["$scope", "subtitleList", "currentPlayerTime"])

