'use strict';

/* Controllers */


function EditableSubtitle($scope){
    $scope.active = false;
    this.setActive = function(isActive){
        $scope.active = !!isActive;
    }

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

function Track($scope, subtitleList, currentPlayerTime){
    this.$scope = $scope;

    $scope.magic = "hey"
    $scope.onTimeChanged = function(subs, newTime){
        $scope.$apply(function(){
            $scope.subtitlesInView= $scope.$parent.subtitlesInView = subs.slice();

        })


    }

}
//Track.$inject(["$scope", "subtitleList", "currentPlayerTime"])
function SubtitleBubble($scope, subtitleList){
}

