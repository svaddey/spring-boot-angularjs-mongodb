var app = angular.module('misc-directives', [
    'ngRoute'
]);
app
    .directive(
        'dropdownButton',
        function(ErrorMsgSvc, $compile, $timeout) {
            return {
                restrict : 'A',
                replace : false,
                scope : {
                    optionList : '=',
                    optionClickFn : '&'
                },
                link : function(scope, elem, attrs, ctrl) {
                    scope.dropdownOpen = false;
                    scope.dropdownElement = $('#dropdownOptionBox');
                    var positionDropdown = function() {
                        var dropdownPosition = elem.position();
                        dropdownPosition.top = dropdownPosition.top + parseInt(elem.css('height'));
                        dropdownPosition.left = dropdownPosition.left + parseInt(elem.css('margin-left'));
                        scope.dropdownElement.css({
                            top : dropdownPosition.top,
                            left : dropdownPosition.left
                        });
                    };
                    $(elem)
                        .on(
                            'click',
                            function() {
                                if (!scope.dropdownOpen) {
                                    positionDropdown();
                                    scope.dropdownElement.show();
                                    scope.dropdownElement
                                        .html("<ul style='list-style-type: none;'><li ng-repeat='option in optionList' value='{{option.value}}'>{{option.name}}</li></ul>");
                                    $compile(scope.dropdownElement)(scope);
                                    scope.$apply();
                                    $timeout(function() {
                                        var checkAndCloseDropdown = function(event) {
                                            if ($(event.target).closest('#dropdownOptionBox').length) {
                                                scope.optionClickFn({
                                                    exporttype : event.target.attributes.value.value
                                                });
                                            }
                                            $('#dropdownOptionBox').hide();
                                            $(document).unbind('click', checkAndCloseDropdown);
                                            $(document).unbind('resize', positionDropdown);
                                            scope.dropdownOpen = false;
                                        };
                                        scope.dropdownElement.find('li').on('mouseover', function(event) {
                                            $(event.target).addClass('selected');
                                        });
                                        scope.dropdownElement.find('li').on('mouseout', function(event) {
                                            $(event.target).removeClass('selected');
                                        });
                                        $(document).bind('click', checkAndCloseDropdown);
                                        $(window).bind('resize', positionDropdown);
                                    });
                                }
                                ;
                                scope.dropdownOpen = !scope.dropdownOpen;
                            });
                }
            };
        })
.directive('compileTemplate', function($compile, $parse){
    return {
        link: function(scope, element, attr){
            var parsed = $parse(attr.ngBindHtml);
            function getStringValue() { return (parsed(scope) || '').toString(); }

            //Recompile if the template changes
            scope.$watch(getStringValue, function() {
                $compile(element, null, -9999)(scope);  //The -9999 makes it skip directives so that we do not recompile ourselves
            });
        }         
    }
});