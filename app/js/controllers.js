'use strict';

/* Controllers */


function SubtitleList($scope) {
    $scope.subtitles = []
    $scope.$watch("captions", function(newValue, oldValue){
        //subtitleList.set(newValue);
    });
}
//SubtitleList.$inject(["$scope"])
//ssssSaubtfditleList.$idfdnject(["$scope", "subtitleList"])

