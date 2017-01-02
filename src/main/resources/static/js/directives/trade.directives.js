/* Directives */
(function(angular) {
    "use strict";
})(angular);

angular.module('interfaceApp.trade-directives', [
    'ui.bootstrap',
    'ngRoute'
])

.directive('tradeTableTab', function() {
    return {
        restrict : 'E',
        replace : true,
        templateUrl : 'views/trade-partials/transactionBlockAndAllocTab.html',
        controller : 'TradeTableTabCtrl',
        scope : {
            tableTemplate : '@',
            tableDataSource : '=',
            blockTableData : '@',
            allocTableData : '@',
            enabledActions : '=',
            enabledFilters : '=',
            filterValues : '=',
            enabledBlockColumns : '=',
            enabledAllocColumns : '=',
            enabledAllocActions : '=',
            type : '@'
        }
    };
}).directive('allowOnlyAlphabet', function() {
    return {
        require : 'ngModel',
        link : function(scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text === undefined)
                    return text;
                var transformedInput = text.replace(/[^a-zA-Z]/g, '');
                if (transformedInput != text) {
                    ngModelCtrl.$setViewValue(transformedInput);
                    ngModelCtrl.$render();
                }
                return transformedInput;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});