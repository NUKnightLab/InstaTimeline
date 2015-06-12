var instagramApp = angular.module('instagramApp')
	.factory('feedData', function($rootScope) {
		
		var config = {};

		return {
			setHashtag: function (x) {
					config.hashtag = x;
			},
			getHashtag: function () {
				return config.hashtag;
			}
		}
	});

instagramApp.controller('indexController', ['$scope', 'feedData', '$location',
	function($scope, feedData, $location){

	$scope.generate = function(){
		feedData.setHashtag($scope.hashtag);
		$location.path('/results');
	};

	
}]);


instagramApp.controller('instagramController', ['$scope', 'Instagram', '$http', 'feedData',
	function($scope, Instagram, $http, feedData){
		feedUrl = '/feed/?hashtag=' + feedData.getHashtag();
		console.log(feedUrl);

	  // two arguments: the id of the Timeline container (no '#')
	  // and the URL to your JSON data file. In this case, a relative URL.
	  window.timeline = new VCO.Timeline('my-timeline', feedUrl);

	  // You may also want to ensure that the timeline redraws 
	  // when the window is resized
	  window.onresize = function(event) {
	    timeline.updateDisplay();
	  }
	}
]);

