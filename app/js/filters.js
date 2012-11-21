'use strict';

/* Filters */

angular.module('myApp.filters', []).
    filter('toClockTime',function () {
        return function (text) {
            if (!text) {
                text = "0";
            }
            var time = parseInt(text);
            var minutes = Math.floor(time / 60000);
            var seconds = Math.floor((time % 60000 ) / 1000);
            if (seconds < 10) {
                seconds = "0" + seconds;
            }
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            return minutes + ":" + seconds;
        }
    }).filter('timeFraction', function () {
        return function (text) {
            if (!text) {
                text = "0";
            }
            var time = parseInt(text);
            return "." + time % 1000;
        }
    });
