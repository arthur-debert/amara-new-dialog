'use strict';

/* Controllers */


function SubtitleList($scope, subtitleList) {
    $scope.subtitles = subtitleList.get();
    $scope.removeSubtitle = function(subtitle){
        subtitleList.removeSubtitle(subtitle);
    };
    $scope.addSubtitle = function(text){
        subtitleList.addSubtitle({'text':text})
        $scope.newSubtitleText = '';
    }
}
//SubtitleList.$inject(["$scope", "subtitleList"])

