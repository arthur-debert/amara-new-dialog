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
}
//SubtitleList.$inject(["$scope", "subtitleList"])

