'use strict';

/* Directives */


var directives = angular.module('myApp.directives', []);
directives.directive('amaraEditableSubtitle', function() {
    return {
        link: function(scope, elm, attrs){
            if (scope.mustScrollToBottom ){
                var parent = elm[0].parentElement;
                parent.scrollTop = parent.scrollHeight - parent.offsetHeight;
                scope.mustScrollToBottom = false;
            }
        }
    };
  });
