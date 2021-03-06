'use strict';

/* Controllers */


var module  = angular.module('amara.SubtitleEditor' );
module.controller('EditableSubtitle', function ($scope){
    $scope.active = false;
    this.setActive = function(isActive){
        $scope.active = !!isActive;
        $scope.activeClass = $scope.active ? "active" : "";
    };

});

module.controller('SubtitleList', function ($scope, subtitleList, currentPlayerTime){
    $scope.subtitles = subtitleList.get();
    $scope.removeSubtitle = function(subtitle){
        subtitleList.removeSubtitle(subtitle);
    };
    $scope.addSubtitle = function(text){
        $scope.mustScrollToBottom = true;
        var subtitle  = subtitleList.addSubtitle({'text':text});
        $scope.newSubtitleText = '';
    };
    $scope.resetSubtitling = function(){
        $scope.subtitles = subtitleList.resetStep('beforeSubtitling');
    };
});

module.controller('Track', function ($scope, subtitleList, currentPlayerTime){

});
//Track.$inject(["$scope", "subtitleList", "currentPlayerTime"])
module.controller('TrackItem', function ($scope, subtitleList){
});

module.controller('VideoPlayerCallToAction', function ($scope, currentPlayerTime){
    $scope.isPlaying = currentPlayerTime.isPlaying();
    $scope.playTimeMode = currentPlayerTime.playTimeMode();
    $scope.updatePlayheadTime = function(newTime){
        $scope.playheadTime = newTime;
        $scope.isPlaying = currentPlayerTime.isPlaying();
    };
    $scope.$on("playerTimeChanged", function(event, newTime){
        $scope.updatePlayheadTime(newTime);
    });
    $scope.onPlayPausePressed = function (){
        $scope.isPlaying = currentPlayerTime.playPause();
    };
    $scope.$watch("playTimeMode", function(){
        currentPlayerTime.playTimeMode($scope.playTimeMode);
    });
});
//VideoPlayerCallToAction.$inject(["$scope", "subtitleList", "currentPlayerTime"])

