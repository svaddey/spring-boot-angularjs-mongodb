
angular.module('LoadingIndicator', []).config(function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q, $rootScope) {
        var enableCount = 0;
        return {
            request: function (config) {
                enableCount++;
                $rootScope.$broadcast("$requestEventStart");
                return config || $q.when(config)
            },
            response: function (response) {
                if ((--enableCount) === 0) {
                    $rootScope.$broadcast("$requestEventEnd");
                }
                return response || $q.when(response);
            },
            responseError: function (response) {
                if (!(--enableCount)) {
                    $rootScope.$broadcast("$requestEventEnd");
                }
                return $q.reject(response);
            }
        };
    });
}).directive("loader", function ($rootScope) {
    return function ($scope, element, attrs) {
        $scope.$on("$requestEventStart", function () {
            return element.show();
        });
        return $scope.$on("$requestEventEnd", function () {
            return element.hide();
        });
    };
});
