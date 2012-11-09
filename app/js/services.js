'use strict';

/* Services */


angular.module('SubtitleDataServices', []).
    factory('SubtitleDataServices', function () {
        var subtitles = [];
        for (var i = 0; i < 100; i++) {
            subtitles.push({
                text:"Caption " + i,
                start_time:i * 1000,
                end_time:(i * 1000) + 1000
            });
        return {
            get:function () {
                return subtitles;
            },
            set: function(newSubtitles){
                subtitles = newSubtitles;
            }
        }
        };
    });
console.log('created')
