'use strict';

// Declare app level module which depends on views, and components
angular.module('instagramApp', [
  'ngRoute'
]).
config(['$routeProvider', function($routeProvider) 

{
  $routeProvider
  // route for the results page
    .when('/results', {
        templateUrl : 'results.html',
        controller  : 'instagramController'
    })
    .when('/splash', {
      templateUrl : 'splash.html',
      controller : 'indexController'
    })
    .otherwise({redirectTo: '/splash'})
}]);


