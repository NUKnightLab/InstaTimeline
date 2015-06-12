'use strict';

instagramApp.factory('Instagram', ['$http', function($http) {
		
		//have the base instagram URL 
		var instagramURL = "https://api.instagram.com/v1";
		// get your own client id http://instagram.com/developer/
		var clientId = '6a4536f6c1334d1cb0e37519930b084c';


		return {
			'get': function(count, hashtag) {
				var request = '/tags/' + hashtag + '/media/recent';
				var endPoint = instagramURL + request;
				var config = {
					'params': {
						'client_id': clientId,
						'count': count,
						'callback': 'JSON_CALLBACK'
					}
				};
				return $http.jsonp(endPoint, config);
			}
		};
	}
]);