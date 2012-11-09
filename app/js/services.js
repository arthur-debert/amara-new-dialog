'use strict';

/* Services */


var subtitleDataServices = angular.module('myApp.subtitleDataServices', []);
subtitleDataServices.factory('subtitleList', function () {
    var subtitles = [];
    for (var i = 0; i < 100; i++) {
        subtitles.push({
            text:"Caption " + i,
            start_time:i * 1000,
            end_time:(i * 1000) + 1000
        });
    }
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

            }
        }
});
