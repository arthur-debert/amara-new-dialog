'use strict';

/* Directives */


var directives = angular.module('myApp.directives', []);
directives.directive('amaraEditableSubtitle', function() {
    return {
        link: function(scope, elm, attrs){
            window.scrollTo(0, elm.offsetTop - 100)
        }
    };
  });
