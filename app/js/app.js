'use strict';


// Declare app level module which depends on filters, and services
angular.module('amara.SubtitleEditor', ['amara.SubtitleEditor.filters', 'amara.SubtitleEditor.subtitleDataServices', 'amara.SubtitleEditor.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/subtitle', {templateUrl: 'partials/subtitle.html', controller: 'SubtitleList'});
    $routeProvider.when('/sync', {templateUrl: 'partials/sync.html'});
    $routeProvider.otherwise({redirectTo: '/subtitle'});
  }]);
