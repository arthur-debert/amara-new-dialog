'use strict';

/* Controllers */


function EditableSubtitle($scope){
    $scope.active = false;
    this.setActive = function(isActive){
        $scope.active = !!isActive;
        $scope.activeClass = $scope.active ? "active" : "";
    };

}

function SubtitleList($scope, subtitleList, currentPlayerTime) {
    $scope.subtitles = subtitleList.get();
    $scope.removeSubtitle = function(subtitle){
        subtitleList.removeSubtitle(subtitle);
    };
    $scope.addSubtitle = function(text){
        $scope.mustScrollToBottom = true;
        var subtitle  = subtitleList.addSubtitle({'text':text})
        $scope.newSubtitleText = '';
        //currentPlayerTime.set(subtitle.starTime)
    };
    $scope.resetSubtitling = function(){
        $scope.subtitles = subtitleList.resetStep('beforeSubtitling');
    };

}
//SubtitleList.$inject(["$scope", "subtitleList"])

function Track($scope, subtitleList, currentPlayerTime){

}
//Track.$inject(["$scope", "subtitleList", "currentPlayerTime"])
function TrackItem($scope, subtitleList){
}

function VideoPlayerCallToAction($scope, currentPlayerTime){
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
}
//VideoPlayerCallToAction.$inject(["$scope", "subtitleList", "currentPlayerTime"])

