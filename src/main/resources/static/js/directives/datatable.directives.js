var datatableApp = angular.module('datatablesDirectives', [
    'ngRoute'
]);
datatableApp.directive('transactionDatatable', function($rootScope, $compile, ErrorMsgSvc, DataStorageSvc) {
    return {
        restrict : 'E',
        scope : {
            tableId : '@',
            enabledColumns : '=',
            // tableDataSet : '=',
            emptyMessage : '@',
            showEmptyMessage : '=',
            rowCallbackFunction : '&',
            headerClickSort : '&',
            tableScrollHeight : '@',
            initialSort : '=',
            initialDataSet : '=',
            resizeInWindow : '=',
            summaryTable : '@'
        },
        controller : 'TransactionDatatableCtrl',
        templateUrl : function($node, attrs) {
            return 'views/datatables/' + attrs.tableTemplate;
        },
        replace : true,
        link : function(scope, elem, attrs) {
            var options = {
                scrollX : "100%",
                processing : true,
                order : [],
                columnDefs : [],
                language : {
                    emptyTable : ""
                }
            };
            if (scope.resizeInWindow) {
                options.autoWidth = true;
            }

            _.each(elem.find('thead th'), function(v, k, l) {
                var data = angular.element(v).data();
                var option = {
                    targets : [
                        k
                    ]
                };
                option.data = data.mdata;
                option.visible = scope.enabledColumns.contains(data.mdata);
                if (data.sclass !== undefined) {
                    option.className = data.sclass;
                }
                if (data.sortable !== undefined) {
                    option.orderable = data.sortable;
                }
                if (data.sorttype !== undefined) {
                    option.type = data.sorttype;
                }
                if (data.swidth) {
                    option.width = data.swidth;
                }
                if (data.datatype !== undefined && aofs_datatypes[data.datatype] !== undefined) {
                    datatype = aofs_datatypes[data.datatype];
                    option.render = datatype.render;
                    if (datatype.sortType) {
                        option.type = datatype.sortType;
                    }
                }
                options.columnDefs.push(option);

                if (data.sortable == true) {
                    $(v).click(function($event) {
                        scope.headerClickSort({
                            eventObj : $event
                        });
                    });
                }

            });

            if (scope.initialSort !== undefined) { // TODO: Left room for multisort, but not tested
                for (var i = 0; i < scope.initialSort.length; i++) {
                    var sortParams = scope.initialSort[i].split(":");
                    var headers = $(elem).find('thead th');
                    for (var j = 0; j < headers.length; j++) {
                        if ($(headers[j]).attr('data-mdata') == sortParams[0]) {
                            options.order.push([
                                j,
                                sortParams[1] == undefined ? "asc" : sortParams[1]
                            ]);
                            break;
                        }
                    }
                }
            }

            if (scope.tableScrollHeight) {
                options.scrollY = scope.$eval(scope.tableScrollHeight);
            }

            options.language.zeroRecords = scope.emptyMessage ? ErrorMsgSvc.getMessage(scope.emptyMessage) : ErrorMsgSvc
                .getMessage("NO_RESULTS_FOUND");

            options.fnCreatedRow = function(row, data) {
                if (data['statusClass'] !== undefined) {
                    $(row).addClass(data['statusClass'].replace("&nbsp;", "").toLowerCase());
                }
            };

            // Jira FA-1186 adding hover on ellipsis
            options.fnDrawCallback = function() {
                var coulmnRenderedWidth = $('th.ErrorDescTagClass').first().outerWidth();
                if (coulmnRenderedWidth) {
                    $('td.ErrorDescTagClass').each(function(i) {
                        if ($(this).html()) {
                            var element = $(this).clone().css({
                                display : 'inline',
                                width : 'auto',
                                visibility : 'hidden'
                            }).appendTo('body');
                            if (element.width() > coulmnRenderedWidth) {
                                $(this).hover(function() {
                                    openCommentPopup($(this), '#block-trade-comment-popup', $(this).html(), 140, 30);
                                }, function() {
                                // do nothing on leaving the element. that is taken care of in the openCommentPopup function
                                });
                            }

                            element.remove();
                        }
                    });
                }
                if (scope.summaryTable) {
                    var summaryHeader = $('#' + scope.summaryTable);
                    summaryHeader.width($("#" + scope.tableId).width() - 1); // align summary header with table width
                }
            };

            // Load the datatable!
            scope.dataTable = $("#" + scope.tableId).dataTable(options);

            $(scope.dataTable).on("click", "tr", function(event) {
                scope.rowCallbackFunction({
                    row : event.currentTarget,
                    datatable : scope.dataTable
                });
            });

            function loadPage(dt, data, from) {
                if (from <= 0) {
                    dt.fnClearTable();
                }
                if (data && data.length > from) {
                    var batch = Math.min(data.length - from, 30);
                    dt.fnAddData(data.slice(from, from + batch), false);
                    dt.fnDraw();
                }
            }

            if (scope.initialDataSet !== undefined) {
                loadPage(scope.dataTable, scope.initialDataSet, 0);
            }

            scope.$watch("initialDataSet", function(data) {
                if (data !== undefined) {
                    loadPage(scope.dataTable, scope.initialDataSet, 0);
                }
            });

            $('.dataTables_wrapper .dataTables_scrollBody').on(
                'scroll',
                function(event) {
                    var oSettings = scope.dataTable.fnSettings();
                    var scrollTop = $(this).scrollTop();
                    aofs_debug("fnRecordsDisplay=" + oSettings.fnRecordsDisplay() + ", scrollTop=" + $(this).scrollTop() + ", height="
                        + $(oSettings.nTable).height() + ", iLoadGap=" + oSettings.oScroll.iLoadGap);
                    if (oSettings.fnRecordsDisplay() > 0 && scrollTop + $(this).height() > $(oSettings.nTable).height() - 20) { // oSettings.oScroll.iLoadGap)
                        // {
                        aofs_debug("load more.......");
                        loadPage(scope.dataTable, scope.initialDataSet, scope.dataTable.fnGetData().length);
                        $(this).scrollTop(scrollTop);
                    }
                });

            // check all header checkbox // Can be enabled for multiple select functionality
            // angular.element('#sAllAccTbl').die('change'); // clear any old listeners
            // angular.element('#sAllAccTbl').live('change', function() {
            // if (angular.element(this).is(':checked')) {
            // $(scope.dataTable._('tr', {
            // "filter" : "applied"
            // })).each(function(index) {
            // $("input#cb_" + this.tradeID + "").attr('checked', true);
            // });
            // } else {
            // angular.element('input', scope.dataTable.fnGetNodes()).attr('checked', false);
            // }
            // $('#linkTradeBtn').attr('disabled', 'disabled');
            // $('#rejectTradesBtn').attr('disabled', 'disabled');
            // });

            scope.$on('$destroy', function() {
                $(scope.dataTable).off("click", "tr");
            });

            if (scope.showEmptyMessage !== undefined && !scope.showEmptyMessage) {
                $("#" + scope.tableId + " .dataTables_empty").hide(); // Turn on Empty Message
            }

            // Jira FA-1186
            scope.closeCommentPopup = function(popupParent, popupID) {
                $(popupID).stop(true, true); // stops current and queued animations
                $(popupID).fadeOut(70);
                $(popupParent).off("mouseleave mousemove");
                $("div.dataTables_scrollBody").off("scroll");
            };

            scope.openCommentPopup = function(thisObject, popupID, message, leftOffset, topOffset) {
                $(popupID).stop(true, true); // stops current and queued animations
                $("div.dataTables_scrollBody").off("scroll");
                var parentOffset = $(thisObject).offset();
                var mousePosX = parentOffset.left, mousePosY = parentOffset.top;
                $(popupID + " .popup-content").html(message);
                $(popupID).fadeIn(200);
                $(popupID).offset({
                    top : (parentOffset.top - topOffset),
                    left : (parentOffset.left - leftOffset)
                });
                $(thisObject).mousemove(function(e) {
                    mousePosX = e.pageX;
                    mousePosY = e.pageY;
                });
                $(thisObject).mouseleave(function() {
                    closeCommentPopup(thisObject, popupID);
                });

                $("div.dataTables_scrollBody").on(
                    "scroll",
                    function() {
                        parentOffset = $(thisObject).offset();
                        $(popupID).offset({
                            top : (parentOffset.top - topOffset),
                            left : (parentOffset.left - leftOffset)
                        });
                        if (mousePosX < parentOffset.left || mousePosX > parentOffset.left + $(thisObject).width() || mousePosY < parentOffset.top
                            || mousePosY > parentOffset.top + $(thisObject).height()) {
                            aofs_debug("mouse out detected manually.  cursor:" + mousePosX + "," + mousePosY);
                            closeCommentPopup(thisObject, popupID);
                        }
                    });
            };
        }
    };
});

datatableApp.directive('modalDatatable', function($rootScope, ErrorMsgSvc) {
    return {
        restrict : 'A',
        link : function(scope, elem, attrs) {
            var options = {
                processing : true,
                columns : [],
                order : [],
                columnDefs : [],
                scrollX : "100%",
                language : {
                    zeroRecords : "No trades to display"
                }
            };
            _.each(elem.find('thead th'), function(v, k, l) {
                var data = angular.element(v).data();
                var option = {
                    targets : [
                        k
                    ]
                };
                if (data.sortable !== undefined) {
                    option.orderable = data.sortable;
                }
                if (data.sorttype !== undefined) {
                    option.type = data.sorttype;
                }
                if (data.datatype !== undefined && aofs_datatypes[data.datatype] !== undefined) {
                    datatype = aofs_datatypes[data.datatype];
                    option.render = datatype.render;
                    option.type = datatype.sortType;
                }
                if (data.swidth !== undefined) {
                    option.width = data.swidth;
                }
                options.columnDefs.push(option);

                options.columns.push({
                    data : data.mdata,
                    className : data.sclass,
                    width : data.swidth,
                    visible : data.bvisible
                });

                if (attrs.initialSort !== undefined && attrs.initialSort === data.mdata) {
                    options.order.push([
                        k,
                        attrs.initialSortDirection === undefined ? "asc" : attrs.initialSortDirection
                    ]);
                }
            });

            if (attrs.showEmptyMessage) {
                options.language.zeroRecords = ErrorMsgSvc.getMessage(attrs.showEmptyMessage);
            }

            if (attrs.scrollHeight) {
                options.scrollY = scope.$eval(attrs.scrollHeight);
            }

            // Load the datatable!
            var modalTable = elem.dataTable(options);

            if (attrs.aaData !== undefined) {
                scope.$watch(attrs.aaData, function(data) {
                    if (data) {

                        modalTable.api().clear().rows.add(data).draw();
                        modalTable.find("input.rb_select").on('click', function() {
                            scope.$emit('rbSelected');
                        });

                        // THIS CODE NEEDED TO BE REFACTORED AND MOVED TO trade.directive.js
                        if (scope.AccTableSelectedRowId !== undefined && scope.AccTableSelectedRowId !== false) {
                            var row = $("#" + scope.AccTableSelectedRowId + "");
                            if ($(row).hasClass('selected') == false)
                                angular.element("#" + scope.AccTableSelectedRowId + "").addClass("selected");
                            scope.detailsRows = scope.tradeTableData[scope.AccTableSelectedRowId];
                            scope.moreinfoIsCollapsed = false;
                        }
                    }
                    if (attrs.summaryTable) {
                        $("#" + attrs.summaryTable).width($(modalTable).width() - 1); // align summary header since table can shift with new data.
                    }
                });
            }

            if (attrs.fnRowCallback) {
                var rowCallback = scope.$eval(attrs.fnRowCallback);
                modalTable.on("click", "tr", function(event) {
                    rowCallback(event.currentTarget);
                });
            }
        }
    };
});

datatableApp.directive('modalLinkDatatable', function($rootScope, ErrorMsgSvc) {
    return {
        restrict : 'A',
        link : function(scope, elem, attrs) {
            var options = {
                processing : true,
                columns : [],
                order : [],
                columnDefs : [],
                scrollX : "100%",
                scrollY : "100%",
                language : {
                    zeroRecords : "No trades to display"
                }
            };
            _.each(elem.find('thead th'), function(v, k, l) {
                var data = angular.element(v).data();
                var option = {
                    targets : [
                        k
                    ]
                };
                if (data.sortable !== undefined) {
                    option.orderable = data.sortable;
                }
                if (data.sorttype !== undefined) {
                    option.type = data.sorttype;
                }
                if (data.datatype !== undefined && aofs_datatypes[data.datatype] !== undefined) {
                    datatype = aofs_datatypes[data.datatype];
                    option.render = datatype.render;
                    option.type = datatype.sortType;
                }
                if (data.swidth !== undefined) {
                    option.width = data.swidth;
                }
                options.columnDefs.push(option);

                options.columns.push({
                    data : data.mdata,
                    className : data.sclass,
                    width : data.swidth,
                    visible : data.bvisible
                });

                if (attrs.initialSort !== undefined && attrs.initialSort === data.mdata) {
                    options.order.push([
                        k,
                        attrs.initialSortDirection === undefined ? "asc" : attrs.initialSortDirection
                    ]);
                }
            });

            if (attrs.showEmptyMessage) {
                options.language.zeroRecords = ErrorMsgSvc.getMessage(attrs.showEmptyMessage);
            }

            /*
             * if (attrs.scrollHeight) { options.scrollY = scope.$eval(attrs.scrollHeight); }
             */

            // Load the datatable!
            var modalTable = elem.dataTable(options);
            // modalTable.fnAddData(scope.aaData);
            if (attrs.aaData !== undefined) {
                scope.$watch(attrs.aaData, function(data) {
                    if (data) {
                        modalTable.api().clear().rows.add([
                            data
                        ]).draw();
                    }
                })
            }

            /*
             * if (attrs.aaData !== undefined) { scope.$watch(attrs.aaData, function(data) { if (data) {
             * 
             * modalTable.api().clear().rows.add(data).draw(); modalTable.find("input.rb_select").on('click', function() { scope.$emit('rbSelected');
             * }); // THIS CODE NEEDED TO BE REFACTORED AND MOVED TO trade.directive.js if (scope.AccTableSelectedRowId !== undefined &&
             * scope.AccTableSelectedRowId !== false) { var row = $("#" + scope.AccTableSelectedRowId + ""); if ($(row).hasClass('selected') == false)
             * angular.element("#" + scope.AccTableSelectedRowId + "").addClass("selected"); scope.detailsRows =
             * scope.tradeTableData[scope.AccTableSelectedRowId]; scope.moreinfoIsCollapsed = false; } } if (attrs.summaryTable) { $("#" +
             * attrs.summaryTable).width($(modalTable).width() - 1); // align summary header since table can shift with new data. } }); }
             */

            if (attrs.fnRowCallback) {
                var rowCallback = scope.$eval(attrs.fnRowCallback);
                modalTable.on("click", "tr", function(event) {
                    rowCallback(event.currentTarget);
                });
            }
        }
    };
});

datatableApp.directive('datatableInstance', function($rootScope, $timeout) {
    return {
        restrict : 'E',
        replace : true,
        scope : {
            tableId : '@',
            tableStructure : '=',
            tableData : '=',
            rowSelectFunction : '&',
            drawCallbackFunction : '&',
            callbackFunction : '&'
        },
        template : "<table id={{tableId}} class='table' cellspacing='0' cellpadding='0'></table>",
        link : function(scope, elem, attrs) {
            if (!scope.tableStructure) {
                console.log(scope.tableId + " does not have tableStructure defined.  Not building directive");
                return false;
            }
            $timeout(function() {
                var tableStructure = scope.tableStructure;
                var columnList = tableStructure.columns || [];
                var initialSortList = tableStructure.initialSort || [];
                var options = {
                    processing : tableStructure.showProcessing || true,
                    columnDefs : [],
                    order : [],
                    data : scope.tableData || [],
                    dom : "Rlrtip",
                    rowCallback : null,
                    language : {
                        zeroRecords : tableStructure.emptyTableMsg || "No results",
                        emptyTable : tableStructure.emptyTableMsg || "No data to display"
                    }
                };
                if (tableStructure.autoWidth) {
                    options.autoWidth = tableStructure.autoWidth;
                }
                if (typeof tableStructure.resizeWithWindow != 'undefined' && tableStructure.resizeWithWindow == true) {
                    $(window).resize(function() {
                        datatable.columns.adjust().draw();
                    });
                }
                if (tableStructure.scrollHeight) {
                    options.scrollY = tableStructure.scrollHeight;
                }
                options.rowCallback = tableStructure.rowCallback || null;

                options.fnDrawCallback = tableStructure.drawCallback || null;

                var dataType = {};
                _.each(columnList, function(column, iter) {
                    dataType = aofs_datatypes[column.datatype];
                    var option = {
                        targets : [
                            iter
                        ],
                        className : column.classes,
                        width : column.width,
                        title : column.title,
                        orderable : column.sortable !== undefined ? column.sortable : false,
                        type : dataType ? dataType.sortType : null,
                        render : column.render || (dataType ? dataType.render : null),
                        data : column.data
                    };
                    options.columnDefs.push(option);
                });

                for (var i = 0; i < initialSortList.length; i++) { // TODO: Left room for multisort, but not fully implemented
                    var sortParams = initialSortList[i].split(":");
                    for (var j = 0; j < columnList.length; j++) {
                        if (columnList[j].data == sortParams[0]) {
                            options.order.push([
                                j,
                                sortParams[1] || 'asc'
                            ]);
                            break;
                        }
                    }
                }
                var datatable = $("#" + scope.tableId).DataTable(options);

                scope.$watch('tableData', function() {
                    datatable.clear();
                    if (scope.tableData) {
                        datatable.rows.add(scope.tableData);
                    }
                    datatable.draw();
                });

                if (typeof tableStructure.tableFilterId !== 'undefined') {
                    $('#' + tableStructure.tableFilterId).on('keyup change', function() {
                        datatable.search(this.value).draw();
                    });
                }

                if (scope.rowSelectFunction) {
                    datatable.on("click", "tr", function(event) {
                        scope.rowSelectFunction({
                            row : event.currentTarget,
                            datatable : datatable
                        });
                    });
                }

                scope.callbackFunction({
                    thisTable : datatable
                });
            });
        }
    };
});