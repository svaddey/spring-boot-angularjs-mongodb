/**
 * Created by Nathaniel on 4/2/14.
 */

app.controller('TradeTableTabCtrl', function($scope, $compile, $rootScope, $http, $sce, $modal, $routeParams, $location, $filter, $timeout, Auth,
    ErrorMsgSvc, DataStorageSvc, Utils, $q) {

    var BLOCK_TABLE_ID = "#blockTable";
    var ALLOC_TABLE_ID = "#accTable";
    var DETAIL_TABLE_ID = "#detailTable";

    $scope.showBtnAccTblReloadData = false;
    $scope.tableHeight = 380; // initial table/table wrapper height in px
    $scope.AccTableSelectedRowId = false;
    $scope.BlockSelected = null;
    $scope.allocTableReadyFlag = false;
    $scope.AllocSelected = null;
    $scope.allocTableEmptyMessageEnabled = false;
    $scope.maxBlocksDisplayed = 2000;
    $scope.allocHeaderPanel = "";
    $scope.accTableData = [];
    $scope.detailTableData = [];
    $scope.entitlement = Auth.getEntitlement();
    var nowDate = new Date();
    $scope.filter = {
        tradeDateFrom : aofs_formatDate(nowDate),
        tradeDateTo : aofs_formatDate(nowDate),
        securityID : "",
        securityIDSource : "",
        client : "",
        state : "",
        entity : "",
        avgPxFrom : "",
        avgPxTo : "",
        qtyFrom : "",
        qtyTo : "",
        currency : "",
        aofsAllocID : "",
        side : "",
        settlDateFrom : "",
        settlDateTo : ""
    };
    $scope.sortParams = [];
    $scope.exportOptions = [
        {
            name : "CSV",
            value : "csv"
        },
        {
            name : "Excel",
            value : "excel"
        }
    ];
    $scope.isActionEnabled = function(action) {
        return $scope.enabledActions.contains(action);
    };
    $scope.isFilterEnabled = function(filterField) {
        if (!$scope.enabledFilters.contains(filterField)) {
            $("div[field-id=" + filterField + "Filter]").remove();
            return false;
        }
        return true;
    };
    $scope.isColumnEnabled = function(columnName) {
        return $scope.enabledColumns.contains(columnName);
    };
    $scope.isAllocActionEnabled = function(action) {
        return $scope.enabledAllocActions.contains(action);
    };

    // INITIALIZATION //
    var savedTableState = DataStorageSvc.get($scope.blockTableData);
    if (savedTableState) {
        $scope.blocksDisplayed = savedTableState.data.length;
        $scope.sortParams = savedTableState.sorting;
        $scope.savedFilters = savedTableState.filters;
        $scope.savedDataset = savedTableState.data.length > 0 ? savedTableState.data : undefined;
        $scope.blockTableEmptyMessageEnabled = true;

    } else {
        $scope.blocksDisplayed = 0;
        $scope.sortParams = savedTableState ? savedTableState.sorting : [
            "modifyTimestamp:desc"
        ];
        $scope.savedFilters = angular.copy($scope.filter);
        $scope.savedDataset = undefined;
        $scope.blockTableEmptyMessageEnabled = false;
    }
    // $scope.blockTableEmptyMessageEnabled = $scope.savedDataset !== undefined;

    // reeval table wrapper width based on table header width when changed.
    $scope.$watch(function() {
        return parseInt($("#blockTable_wrapper .dataTables_scrollHeadInner").width());
    }, function() {
        $scope.refitBlockTableContainer();
    });

    // FUNCTIONALITY //
    function setAccTblData(acronym, id, tradeData) {
        if (id == null) {
            var allocTable = $(ALLOC_TABLE_ID).dataTable();
            $timeout(function() {
                allocTable.api().clear();
                $scope.allocTableReadyFlag = true;
                allocTable.api().draw();
            });
            return;
        }
        $http.get($rootScope.APIServer + "trades/buyside/{0}/{1}/allocations".format(acronym, id), {
            params : {
                cacheKill : new Date().getTime(),
                compress : "Y",
                skipNull : "Y"
            }
        }).success(
            function(data) {
                data = aofs_uncompress(data);
                $scope.AccTableSelectedRowId = false;
                var accTable = {
                    data : []
                };
                var c = $rootScope.accTableDataMap;
                var rowId;
                $(data.allocations).each(
                    function(index) {
                        rowId = "accTblRow_" + index;
                        $scope.selectedRowId = rowId;
                        // lookup for the first row with status "mismatch"
                        if ($scope.AccTableSelectedRowId == false
                            && (this[c.matchStatus] !== undefined && this[c.matchStatus].toLowerCase() == "mismatch")) {
                            $scope.AccTableSelectedRowId = rowId;
                            // todo:add function to check for delta and select row;
                        }
                        var miscFeeLink = "<a class='link-style' ng-click=\"showMiscFees('" + BLOCK_TABLE_ID + "', '#accTable', '"
                            + tradeData.clientAcronym + "', '" + tradeData.allocID + "', '" + rowId + "');\">" + 'Misc&nbsp;Fees' + "</a>";
                        var customTagLink = "<a class='link-style' ng-click=\"showCustomTags('" + BLOCK_TABLE_ID + "', '#accTable', '"
                            + tradeData.DT_RowId + "', '" + rowId + "', '{0}');\">View Tags</a>";
                        accTable.data.push({
                            DT_RowId : rowId,
                            allocAccount : chk(this[c.allocAccount]),
                            allocQty : chk(this[c.allocQty]),
                            avgPx : chk(this[c.allocAvgPx]),
                            netMoney : chk(this[c.allocNetMoney]),
                            totalCommission : chk(this[c.totalCommission]),
                            totalMiscFees : chk(this[c.totalMiscFees]),
                            totalMiscFeesDetails : miscFeeLink,
                            status : $scope.type == "search" ? decodeBrokerAllocStatus(this[c.status]) : decodeClientAllocStatus(this[c.status]),
                            rejReason : $scope.type == "search" ? decodeBrokerAllocRejReason(this[c.rejReason])
                                : decodeClientAllocRejReason(this[c.rejReason]),
                            settlCurrency : chk(this[c.allocSettlCurrency]),
                            individualAllocID : chk(this[c.individualAllocID]),
                            aofsIndividualAllocID : chk(this[c.aofsIndividualAllocID]),
                            text : chk(this[c.text]),
                            allocCustomTags : customTagLink,
                            colorBox : ""
                        });
                    });

                $scope.deltaToFloat = function(delta) {
                    return parseFloat(delta);
                };
                $scope.accTableData = accTable.data;
                $scope.allocTableReadyFlag = true;
            }).error(function(error, status) {
            $scope.accTableData = [];
            $scope.allocTableReadyFlag = true;
            ErrorMsgSvc.showAlert("Connection Error (" + status + ")", "SERVER_DATA_NOT_FOUND", "Get Allocations");
        });
    }

    $scope.clearFilters = function() {
        var nowDate = new Date();
        $scope.filter = {
            tradeDateFrom : aofs_formatDate(nowDate),
            tradeDateTo : aofs_formatDate(nowDate),
            securityID : "",
            securityIDSource : "",
            client : "",
            state : "",
            entity : "",
            avgPxFrom : "",
            avgPxTo : "",
            qtyFrom : "",
            qtyTo : "",
            currency : "",
            aofsAllocID : "",
            side : "",
            settlDateFrom : "",
            settlDateTo : ""
        };
        $timeout(function() {
            $scope.$broadcast('refreshFilters');
        });
    };

    $scope.validateFilters = function() {
        var errorList = [];
        try {
            aofs_customToYmd($scope.filter.tradeDateFrom);
            aofs_customToYmd($scope.filter.tradeDateTo);
        } catch (err) {
            errorList.push("Invalid value entered in trade date filter");
        }
        try {
            aofs_customToYmd($scope.filter.settlDateFrom);
            aofs_customToYmd($scope.filter.settlDateTo);
        } catch (err) {
            errorList.push("Invalid value entered in settle date filter");
        }
        if ($scope.filter.securityID.replace(/ /g, "") != "" && $scope.filter.securityIDSource.replace(/ /g, "") == "") {
            errorList.push("When filtering by Sec. ID, the Sec. ID Type must also be specified");
        } else if ($scope.filter.securityID.replace(/ /g, "") == "" && $scope.filter.securityIDSource.replace(/ /g, "") != "") {
            errorList.push("When filtering by Sec. ID Type, the Sec. ID must also be specified");
        }
        var floatRegex = new RegExp("^[0-9]*\\.?[0-9]*$");
        if (floatRegex.test($scope.filter.avgPxFrom) && floatRegex.test($scope.filter.avgPxTo)) {
            if (parseFloat($scope.filter.avgPxFrom) > parseFloat($scope.filter.avgPxTo) && $scope.filter.avgPxFrom.replace(/ /g, "") != ""
                && $scope.filter.avgPxTo.replace(/ /g, "") != "") {
                errorList.push("The From value must be less than the To value in the Avg Px filter");
            }
        } else {
            errorList.push("Invalid value entered in average price filter");
        }
        if (floatRegex.test($scope.filter.qtyFrom) && floatRegex.test($scope.filter.qtyTo)) {
            if (parseFloat($scope.filter.qtyFrom) > parseFloat($scope.filter.qtyTo) && $scope.filter.qtyFrom.replace(/ /g, "") != ""
                && $scope.filter.qtyTo.replace(/ /g, "") != "") {
                errorList.push("The From value must be less than the To value in the Quantity filter");
            }
        } else {
            errorList.push("Invalid value entered in quantity filter");
        }
        if (errorList.length >= 1) {
            var errorMessage = "";
            for (var i = 0; i < errorList.length; i++) {
                errorMessage += (errorList.length >= 2 ? "- " : "") + errorList[i] + "<br/>";
            }
            ErrorMsgSvc.showPopup(errorMessage, "error", 2000 + (2500 * errorList.length));
            return false;
        }
        return true;
    };

    $scope.resort = function(eventObj) {
        var key = eventObj.target.attributes["data-mdata"].value;
        var classes = eventObj.target.attributes["class"].value.split(" ");
        var sort = "asc";
        classes.forEach(function(item) {
            if (item.indexOf("sorting_asc") >= 0) { // yes, it's backwards. It's because element has not been updated yet at this point.
                sort = "desc";
            }
        });
        $scope.sortParams = [];
        $scope.sortParams.push(key + ":" + sort); // TODO MULTISORT
        $scope.search();
    };

    $scope.search = function() {
        if (!$scope.validateFilters()) {
            return false;
        }
        ErrorMsgSvc.clearPopups(500); // Clear any previous alert popup if validation passes
        $http.get($scope.tableDataSource, {
            params : {
                cacheKill : new Date().getTime(),
                size : ($scope.maxBlocksDisplayed == 2000 ? null : $scope.maxBlocksDisplayed), // MAGIC NUMBER used for default size
                startTradeDate : nullIfEmpty(aofs_customToYmd($scope.filter.tradeDateFrom)),
                endTradeDate : nullIfEmpty(aofs_customToYmd($scope.filter.tradeDateTo)),
                securityID : nullIfEmpty($scope.filter.securityID),
                securityIDSource : nullIfEmpty($scope.filter.securityIDSource),
                clientAcronym : nullIfEmpty($scope.filter.client),
                state : arrayToCommadString(nullIfEmpty($scope.filter.state)),
                entity : nullIfEmpty($scope.filter.entity.toUpperCase()),
                minAvgPx : nullIfEmpty($scope.filter.avgPxFrom) == null ? null : parseFloat($scope.filter.avgPxFrom),
                maxAvgPx : nullIfEmpty($scope.filter.avgPxTo) == null ? null : parseFloat($scope.filter.avgPxTo),
                minQty : nullIfEmpty($scope.filter.qtyFrom) == null ? null : parseFloat($scope.filter.qtyFrom),
                maxQty : nullIfEmpty($scope.filter.qtyTo) == null ? null : parseFloat($scope.filter.qtyTo),
                currency : nullIfEmpty($scope.filter.currency.toUpperCase()),
                aofsAllocID : nullIfEmpty($scope.filter.aofsAllocID),
                side : arrayToCommadString(nullIfEmpty($scope.filter.side)),
                startSettlDate : nullIfEmpty(aofs_customToYmd($scope.filter.settlDateFrom)),
                endSettlDate : nullIfEmpty(aofs_customToYmd($scope.filter.settlDateTo)),
                sort : $scope.sortParams,
                compress : "Y",
                skipNull : "N"
            }
        }).success(
            function(data) {
                data = aofs_uncompress(data);
                var allocTable = $(ALLOC_TABLE_ID).DataTable();
                allocTable.settings().showEmptyMessage = false;
                allocTable.clear().draw();
                $scope.clearSelectedBlock(); // Forget selected row
                $('#linkTradeBtn, #rejectTradesBtn, #eventsLogBtn').attr('disabled', 'disabled');
                $scope.allocHeaderPanel = ""; // Clear alloc summary header
                $scope.miscModalHeaderPanel = ""; // Clear alloc summary header
                $scope.blocksDisplayed = 0; // Reset counter
                $("#blockTable .dataTables_empty").show(); // Turn on Empty Message
                // commented for FA-1190
                // $(BLOCK_TABLE_ID).dataTable().fnSettings().showEmptyMessage = true;
                var newSavedDataSet = {
                    data : _.map(data.trades, function(v) {
                        return serverRowToDataTableRow($filter, v);
                    }),
                    filters : angular.copy($scope.filter),
                    sorting : angular.copy($scope.sortParams)
                };
                $scope.blocksDisplayed = newSavedDataSet.data.length;
                if ($scope.blocksDisplayed == 0) {
                    ErrorMsgSvc.showPopup("No results found", "warning", 1500);
                } else if ($scope.blocksDisplayed >= $scope.maxBlocksDisplayed) {
                    ErrorMsgSvc.showPopup("Display limit reached; only the first " + $scope.maxBlocksDisplayed + " results are currently displayed",
                        "warning", 4500);
                }
                // Populate dataTable and save results
                $scope.savedDataset = newSavedDataSet.data;
                DataStorageSvc.set($scope.blockTableData, newSavedDataSet);
                $timeout(function() {
                    $scope.refitBlockTableContainer();
                });
            }).error(function(error, status) {
            $(BLOCK_TABLE_ID).DataTable().clear();
            DataStorageSvc.set($scope.blockTableData, null); // Clear stored table data
            ErrorMsgSvc.showAlert(status, status + "_FOR_SEARCH", "Get Trades");
        });
    };

    // for block table, row selected broadcast
    $scope.rowCallbackForBlockTable = function(nRow, datatable) {
        var rowClicked = datatable.api().row(nRow).data();
        if (rowClicked == $scope.BlockSelected) {
            return false;
        } else {
            $scope.clearSelectedAlloc();
            // set selected element
            $scope.BlockSelected = rowClicked;
        }
        if (!angular.element(nRow).hasClass("selected")) {
            var parentObj = angular.element(nRow).parent();
            angular.element(parentObj).children("tr.selected").removeClass("selected");
            angular.element(nRow).addClass("selected");
        }

        $timeout(function() {
            aofs_debug("BlockSelected has changed, modifying alloc table settings appropriately.");
            if ($(ALLOC_TABLE_ID).DataTable().settings() != null) {
                $('#eventsLogBtn').removeAttr('disabled');
                switch ($scope.type) {
                    case ("search"):
                        ([
                            "UNMATCHED",
                            "MISMATCHED",
                            "CLIENT&nbsp;REJECT"
                        ].indexOf($scope.BlockSelected.state) != -1) ? $('#linkTradeBtn').removeAttr('disabled') : $('#linkTradeBtn').attr(
                            'disabled', 'disabled');
                        break;
                    case ("client"):
                        ([
                            "ALLEGED",
                            "UNMATCHED",
                            "BROKER&nbsp;CXL",
                            "AFFIRMED&nbsp;PENDING"
                        ].indexOf($scope.BlockSelected.state) != -1) ? $('#linkTradeBtn').removeAttr('disabled') : $('#linkTradeBtn').attr(
                            'disabled', 'disabled');
                        ([
                            "ALLEGED",
                            "UNMATCHED"
                        ].indexOf($scope.BlockSelected.state) != -1) ? $('#rejectTradesBtn').removeAttr('disabled') : $('#rejectTradesBtn').attr(
                            'disabled', 'disabled');
                        break;
                }
            }

            switch ($scope.type) {
                case ("search"):
                    setAccTblData($scope.BlockSelected.clientAcronym,
                        ($scope.BlockSelected.state == "AFFIRMED" || $scope.BlockSelected.state == "MATCHED") ? $scope.BlockSelected.allocID : null,
                        $scope.BlockSelected);
                    break;
                case ("client"):
                    setAccTblData($scope.BlockSelected.clientAcronym, $scope.BlockSelected.allocID, $scope.BlockSelected);
                    break;
            }

            $scope.blockSummary = "Symbol:&nbsp;" + $scope.BlockSelected.symbol + " | Side:&nbsp;" + $scope.BlockSelected.side + " | Client:&nbsp;"
                + $scope.BlockSelected.clientAcronym + " | Qty:&nbsp;" + formatValue($scope.BlockSelected.quantity, 0, 2, true)
                + " | Avg&nbsp;Px:&nbsp;" + formatPrice($scope.BlockSelected.avgPx) + " | Trade&nbsp;Date:&nbsp;"
                + aofs_ymdToCustom($scope.BlockSelected.tradeDate)
                + ($scope.type == "search" ? (" | AllocID:&nbsp;" + $scope.BlockSelected.aofsAllocID) : "");
            $scope.$apply(function() {
                if ($scope.isAllocActionEnabled("customTags")) {
                    $scope.allocHeaderPanel = $sce.trustAsHtml("Symbol: " + $scope.BlockSelected.symbol + " | Side: " + $scope.BlockSelected.side
                            + " | Client: " + $scope.BlockSelected.clientAcronym + " | Qty: " + formatValue($scope.BlockSelected.quantity, 0, 2, true)
                            + " | <a class='link-style' ng-click=\"showCustomTags()\">View Block Custom Tags</a>");
                } else {
                    $scope.allocHeaderPanel = $sce.trustAsHtml("Symbol: " + $scope.BlockSelected.symbol + " | Side: " + $scope.BlockSelected.side
                            + " | Client: " + $scope.BlockSelected.clientAcronym + " | Qty: " + formatValue($scope.BlockSelected.quantity, 0, 2, true));
                }


                $scope.miscModalHeaderPanel = $sce.trustAsHtml("Symbol: " + $scope.BlockSelected.symbol + " | Side: " + $scope.BlockSelected.side
                    + " | Client: " + $scope.BlockSelected.clientAcronym + " | Qty: " + formatValue($scope.BlockSelected.quantity, 0, 2, true));
            });
        }, 10);
    };


    $scope.allocTableStructure = {
        scrollHeight : 120,
        initialSort : [
            "allocAccount:asc"
        ],
        emptyTableMsg : "Allocation Data Not Yet Received",
        columns : [
            {
                title : "Account",
                data : "allocAccount",
                sortable : true
            },
            {
                title : "Qty",
                data : "allocQty",
                datatype : "quantity",
                sortable : true
            }
        ]
    };
    if ($scope.type == "search") { // add status columns for broker tab
        $scope.allocTableStructure.columns.push({
            title : "Affirm&nbsp;Status",
            data : "status",
            sortable : true
        }, {
            title : "Confirm&nbsp;Reject&nbsp;Reason",
            data : "rejReason",
            sortable : true
        });
    }

    $scope.detailTableStructure = {
        scrollHeight : 120,
        rowCallback : function(row, data) {
            if (data.delta != "-") {
                $('td:eq(3)', row).addClass('delta');
            }
            if (data.type == "Text") {
                $('td:eq(1)', row).addClass('textEllipsis');
                $('td:eq(2)', row).addClass('textEllipsis');
            }
        },
        drawCallback : function(settings) {
            $("td.textEllipsis", this).each(function(cellIndex, textCell) {
                var cellWidth = $(textCell).outerWidth();
                if (cellWidth) {
                    $(textCell).each(function(i) {
                        if ($(this).html()) {
                            var element = $(this).clone().css({
                                display : 'inline',
                                width : 'auto',
                                visibility : 'hidden'
                            }).appendTo('body');
                            if (element.width() > cellWidth) {
                                $(this).css("text-overflow", "ellipsis");
                                $(this).css("-o-text-overflow", "ellipsis");
                                $(this).css("-ms-text-overflow", "ellipsis");
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
            });
        },
        columns : [
            {
                title : "",
                data : "type"
            },
            {
                title : "Manager",
                data : "manager"
            },
            {
                title : "Broker",
                data : "broker"
            },
            {
                title : "Delta",
                data : "delta"
            }
        ]
    };

    $scope.rowCallbackForAllocTable = function(nRow, datatable) {

        // check if row already selected
        if (datatable.row(nRow).data() == $scope.AllocSelected) {
            return;
        }

        $(datatable.table().body()).find("tr.selected").removeClass("selected");
        $(nRow).addClass("selected");
        $scope.AllocSelected = datatable.row(nRow).data();

        if ($scope.AllocSelected === undefined) { // in case is not a proper row (ex: no rows message)
            return false;
        }
        $scope.detailTableData = [];
        $scope.confirm = null;
        detailTableDataRows = [
            {
                name : "Commissions",
                data : "totalCommission",
                type : "num"
            },
            {
                name : "Misc&nbsp;Fees",
                data : "totalMiscFees",
                type : "numHtml"
            },
            {
                name : "Settle&nbsp;Currency",
                data : "settlCurrency",
                type : "string"
            },
            {
                name : "Net&nbsp;Money",
                data : "netMoney",
                type : "num"
            },
            {
                name : "Average&nbsp;Price",
                data : "avgPx",
                type : "num"
            },
            {
                name : "Account&nbsp;Alloc&nbsp;ID",
                data : "aofsIndividualAllocID",
                type : "string"
            },
            {
                name : "Text",
                data : "text",
                type : "string"
            },
            {
                name : "Custom&nbsp;Tags",
                data : "allocCustomTags",
                type : "allocCustomTags"
            }
        ];
        $http.get(
            $rootScope.APIServer
                + "trades/buyside/{0}/{1}/confirmations/{2}".format($scope.BlockSelected.clientAcronym, $scope.BlockSelected.allocID,
                    $scope.AllocSelected.aofsIndividualAllocID), {
                params : {
                    cacheKill : new Date().getTime(),
                    compress : "Y",
                    skipNull : "N"
                }
            }).success(function(data) {
            $scope.confirm = data.confirmation;
            var c = $rootScope.confirmTableDataMap;
            detailTableDataRows.forEach(function(row) {
                switch (row.type) {
                    case "numHtml":
                        var managerReplacement = $scope.AllocSelected[row.data + "Details"] || null;
                        var brokerReplacement = $scope.confirm[c[row.data] + "Details"] || null;
                        $scope.detailTableData.push({
                            type : managerReplacement,
                            manager : formatMoney($scope.AllocSelected[row.data]) || "Not Sent",
                            broker : formatMoney($scope.confirm[c[row.data]]) || "Not Sent",
                            delta : Utils.formatMoney(Utils.delta($scope.AllocSelected[row.data], $scope.confirm[c[row.data]])) || "-"
                        });
                        break;
                    case "num":
                        $scope.detailTableData.push({
                            type : row.name,
                            manager : formatMoney($scope.AllocSelected[row.data]) || "Not Sent",
                            broker : formatMoney($scope.confirm[c[row.data]]) || "Not Sent",
                            delta : Utils.formatMoney(Utils.delta($scope.AllocSelected[row.data], $scope.confirm[c[row.data]])) || "-"
                        });
                        break;
                    case "allocCustomTags":
                        $scope.detailTableData.push({
                            type : row.name,
                            manager : "-",
                            broker : $scope.AllocSelected[row.data].format($scope.confirm.confirmID) || "-",
                            delta : "-"
                        });
                        break;
                    default:
                        $scope.detailTableData.push({
                            type : row.name,
                            manager : $scope.AllocSelected[row.data] || "-",
                            broker : $scope.confirm[c[row.data]] || "-",
                            delta : $scope.AllocSelected[row.data] === chk($scope.confirm[c[row.data]]) ? "-" : "<b>X</b>"
                        });
                        break;
                }
            });
            $timeout(function() {
                $(DETAIL_TABLE_ID).DataTable().clear().rows.add($scope.detailTableData).draw();
                $compile($(DETAIL_TABLE_ID))($scope);
            });
        }).error(function(error, status) {
            if (status == 404) {
                detailTableDataRows.forEach(function(row) {
                    switch (row.type) {
                        case "numHtml":
                            var managerReplacement = $scope.AllocSelected[row.data + "Details"] || null;
                            $scope.detailTableData.push({
                                type : managerReplacement,
                                manager : formatMoney($scope.AllocSelected[row.data]) || "-",
                                broker : "-",
                                delta : "-"
                            });
                            break;
                        case "num":
                            $scope.detailTableData.push({
                                type : row.name,
                                manager : formatMoney($scope.AllocSelected[row.data]) || "-",
                                broker : "-",
                                delta : "-"
                            });
                            break;
                        default:
                            $scope.detailTableData.push({
                                type : row.name,
                                manager : "-",
                                broker : "-",
                                delta : "-"
                            });
                            break;
                    }
                });
                $timeout(function() {
                    $(DETAIL_TABLE_ID).DataTable().clear().rows.add($scope.detailTableData).draw();
                    $compile($(DETAIL_TABLE_ID))($scope);
                });
            } else {
                ErrorMsgSvc.showAlert(status, status, "Get Confirmations");
            }
        });
    };

    $scope.clearSelectedAlloc = function() {
        $(ALLOC_TABLE_ID).find("tr.selected").removeClass("selected");
        $scope.AllocSelected = null;
        $scope.allocTableReadyFlag = false;
        $scope.accTableData = [];
        $scope.$apply();
    };
    $scope.clearSelectedBlock = function() {
        $(BLOCK_TABLE_ID).find("tr.selected").removeClass("selected");
        $('#linkTradeBtn, #rejectTradesBtn, #eventsLogBtn').attr('disabled', 'disabled');
        $scope.allocHeaderPanel = ""; // Clear alloc summary header
        $scope.BlockSelected = null;
        $scope.AllocSelected = null;
        $scope.allocTableReadyFlag = false;
        $scope.accTableData = [];
    };

    $scope.OpenEventsLog = function() {
        var opts = {
            backdrop : true,
            keyboard : true,
            backdropClick : false,
            templateUrl : 'views/modals/eventsLog.html',
            controller : 'EventsLogCtrl',
            resolve : {
                blockSummary : function() {
                    return $scope.blockSummary;
                },
                selectedTrade : function() {
                    return angular.copy($scope.BlockSelected);
                },
                type : function() {
                    return $scope.type;
                }
            }
        };
        $modal.open(opts);
    };

    $scope.linkTrade = function() {
        var selectedTrade = null;
        if (angular.element(BLOCK_TABLE_ID + " tr.selected").size() != 1) {
            ErrorMsgSvc.showAlert(0, "TOO_MANY_TRADES_SELECTED_FOR_LINK", "Link Trades");
        } else {
            var instruction = $scope.BlockSelected;
            var linkableGetRequest = "";
            var parameterPackage = {};
            var templateToUse = "";
            switch ($scope.type) {
                case ("search"):
                    if (instruction.state != "UNMATCHED" && instruction.state != "MISMATCHED" && instruction.state != "CLIENT&nbsp;REJECT") {
                        ErrorMsgSvc.showAlert(0, "INVALID_TRADE_STATUS_FOR_BROKER_LINK", "Link Trades");
                        return;
                    }
                    linkableGetRequest = $rootScope.APIServer + "trades/sellside/{0}/{1}/linkables".format(Auth.user.company, instruction.tradeID);
                    templateToUse = 'views/modals/linkBrokerTrade.html';
                    parameterPackage = {
                        skipNull : "N",
                        side : encodeSide(instruction.side),
                        clientAcronym : instruction.clientAcronym,
                        quantity : instruction.quantity,
                        tradeDate : instruction.tradeDate,
                        minAvgPx : instruction.avgPx,
                        currency : instruction.currency,
                        settlDate : instruction.settlDate
                    };
                    break;
                case ("client"):
                    if (instruction.state != "ALLEGED" && instruction.state != "BROKER&nbsp;CXL" && instruction.state != "UNMATCHED"
                        && instruction.state != "AFFIRMED&nbsp;PENDING") {
                        ErrorMsgSvc.showAlert(0, "INVALID_TRADE_STATUS_FOR_CLIENT_LINK", "Link Trades");
                        return;
                    }
                    ;
                    linkableGetRequest = $rootScope.APIServer
                        + "trades/buyside/{0}/{1}/linkables".format(instruction.clientAcronym, instruction.allocID);
                    templateToUse = 'views/modals/linkClientTrade.html';
                    parameterPackage = {
                        skipNull : "N",
                        side : encodeSide(instruction.side),
                        brokerAcronym : Auth.user.company,
                        quantity : instruction.quantity,
                        tradeDate : instruction.tradeDate,
                        minAvgPx : instruction.avgPx,
                        currency : instruction.currency,
                        settlDate : instruction.settlDate
                    };
                    break;
            }
            ;

            selectedTrade = {
                "tradeID" : chk(instruction.tradeID),
                "securityID" : chk(instruction.securityID),
                "securityIDSource" : chk(instruction.securityIDSource),
                "clientAcronym" : chk(instruction.clientAcronym),
                "brokerAcronym" : chk(instruction.brokerAcronym),
                "side" : chk(instruction.side),
                "currency" : chk(instruction.currency),
                "quantity" : chk(instruction.quantity),
                "avgPx" : chk(instruction.avgPx),
                "tradeDate" : chk(instruction.tradeDate),
                "settlDate" : chk(instruction.settlDate),
                "allocID" : chk(instruction.allocID),
                "aofsAllocID" : chk(instruction.aofsAllocID),
                "version" : instruction.version
            };

            $http.get(linkableGetRequest, {
                headers : {
                    "If-Modified-Since" : "01 Jan 1970 00:00:00 GMT" // IE fix: to keep results from being cached
                },
                params : parameterPackage
            }).success(function(data) {
                var tableData = _.map(data.linkables, function(v) {
                    return serverRowToDataTableRow($filter, v);
                });
                $scope.linkTableData = tableData;

                var opts = {
                    backdrop : true,
                    keyboard : true,
                    backdropClick : false,
                    templateUrl : templateToUse,
                    controller : 'LinkTradeCtrl',
                    scope : $scope,
                    resolve : {
                        type : function() {
                            return $scope.type;
                        },
                        selectedTrade : function() {
                            return selectedTrade;
                        },
                        linkables : function() {
                            return tableData;
                        }
                    }
                };
                $modal.open(opts);
            }).error(function(msg, status) {
                ErrorMsgSvc.showAlert("INTERNAL_ERROR", status + "_FOR_LINKABLES", "Get Linkable Trades");
            });
        }

    };

    $scope.rejectTrades = function() {
        var selectedTrades = [];

        if (angular.element(BLOCK_TABLE_ID + " tr.selected").size() < 1) {
            ErrorMsgSvc.showAlert("INVALID_MODAL_DATA", "NO_TRADE_SELECTED_FOR_LINK", "Reject Trade");
        } else {
            // var oTable = $(BLOCK_TABLE_ID).dataTable(); // This can be used to enable multiple row rejections.
            // angular.element("tr.selected").each(function() {
            // selectedTrades.push(oTable.fnGetData($(this).get(0)));
            // });
            selectedTrades.push($scope.BlockSelected);
            var opts = {
                backdrop : true,
                keyboard : true,
                backdropClick : false,
                templateUrl : 'views/modals/rejectTrades.html',
                controller : 'RejectTradesCtrl',
                scope : $scope,
                resolve : {
                    selectedTrades : function() {
                        return selectedTrades;
                    }
                }
            };
            $modal.open(opts);
        }
    };

    $scope.startExport = function(exporttype) {
        var params = {
            cacheKill : new Date().getTime(),
            startTradeDate : nullIfEmpty(aofs_customToYmd($scope.filter.tradeDateFrom)),
            endTradeDate : nullIfEmpty(aofs_customToYmd($scope.filter.tradeDateTo)),
            securityID : nullIfEmpty($scope.filter.securityID),
            securityIDSource : nullIfEmpty($scope.filter.securityIDSource),
            clientAcronym : nullIfEmpty($scope.filter.client),
            state : arrayToCommadString(nullIfEmpty($scope.filter.state)),
            entity : nullIfEmpty($scope.filter.entity.toUpperCase()),
            minAvgPx : nullIfEmpty($scope.filter.avgPxFrom) == null ? null : parseFloat($scope.filter.avgPxFrom),
            maxAvgPx : nullIfEmpty($scope.filter.avgPxTo) == null ? null : parseFloat($scope.filter.avgPxTo),
            minQty : nullIfEmpty($scope.filter.qtyFrom) == null ? null : parseFloat($scope.filter.qtyFrom),
            maxQty : nullIfEmpty($scope.filter.qtyTo) == null ? null : parseFloat($scope.filter.qtyTo),
            currency : nullIfEmpty($scope.filter.currency.toUpperCase()),
            aofsAllocID : nullIfEmpty($scope.filter.aofsAllocID),
            side : arrayToCommadString(nullIfEmpty($scope.filter.side)),
            startSettlDate : nullIfEmpty(aofs_customToYmd($scope.filter.settlDateFrom)),
            endSettlDate : nullIfEmpty(aofs_customToYmd($scope.filter.settlDateTo)),
            sort : $scope.sortParams,
            compress : exporttype == "csv" ? "C" : ""
        };
        objectToQueryParamString(params);
        window.open($rootScope.APIServer
            + "trades/{0}/{1}/export".format($scope.type == "search" ? "sellside" : $scope.type == "client" ? "buyside" : "sellside",
                Auth.user.company) + "?" + objectToQueryParamString(params));
    };

    // $scope.exportDialog = function() { // FA-853 Modal no longer used for export workflow
    // var opts = {
    // backdrop : true,
    // keyboard : true,
    // backdropClick : false,
    // templateUrl : 'views/modals/export.html',
    // controller : 'ExportCtrl',
    // scope : $scope
    // };
    // $modal.open(opts);
    // };

    $scope.showCustomTags = function(blockTable, allocTable, blockData, allocData, confirmId) {
        var block = $scope.BlockSelected;
        var alloc = (allocTable != null ? $(allocTable).dataTable().fnGetData($("#" + allocData).get(0)) : null);
        var tableData = [];
        var request = "trades/"
            + (alloc == null ? "sellside/" + Auth.user.company + "/" + block.tradeID + "/customtags" : "buyside/" + block.clientAcronym + "/"
                + block.allocID + "/confirmations/" + alloc.aofsIndividualAllocID + "/" + confirmId + "/customtags");
        $http.get($rootScope.APIServer + request, {
            params : {
                skipNull : "N"
            }
        }).success(function(returnedData) {
            returnedData = aofs_uncompress(returnedData);
            tableData = _.map(returnedData.tags[0], function(value, key) {
                return {
                    "tagName" : key,
                    "tagValue" : value
                };
            });

            var opts = {
                backdrop : true,
                keyboard : true,
                backdropClick : false,
                templateUrl : 'views/modals/customTags.html',
                controller : 'CustomTagsCtrl',
                resolve : {
                    block : function() {
                        return block;
                    },
                    alloc : function() {
                        return alloc;
                    },
                    tags : function() {
                        return tableData;
                    }
                },
                scope : $scope
            };
            $modal.open(opts);
        }).error(function(msg, status) {
            ErrorMsgSvc.showAlert("INTERNAL_ERROR", "TECH_SUPPORT", "Get Custom Tags");
        });
    };

    $scope.showMiscFees = function(blockTable, allocTable, clientAcronym, allocID, allocData) {
        var alloc = (allocTable != null ? $(allocTable).dataTable().fnGetData($("#" + allocData).get(0)) : null);
        var promiseList = [
            $http.get($rootScope.APIServer
                + "trades/buyside/{0}/{1}/allocations/{2}/miscfees".format(clientAcronym, allocID, alloc.individualAllocID), {
                params : {
                    skipNull : "N"
                }
            })
        ];

        if ($scope.confirm)
            promiseList.push($http.get($rootScope.APIServer
                + "trades/buyside/{0}/{1}/confirmations/{2}/{3}/miscfees".format(clientAcronym, allocID, $scope.AllocSelected.aofsIndividualAllocID,
                    $scope.confirm.confirmID), {
                params : {
                    skipNull : "N"
                }
            }));

        $q.all(promiseList).then(function(returnedData) {
            returnedData = aofs_uncompress(returnedData);
            var brokerValue = null, delta = null, confirmMiscFeeDetail = returnedData[1] ? returnedData[1].data.miscFeeDetail : {};
            returnedData = returnedData[0].data;
            tableData = _.map(returnedData.miscFeeDetail, function(value, key) {
                brokerValue = confirmMiscFeeDetail[key] || "-";
                delta = Utils.delta(value, confirmMiscFeeDetail[key], true);
                if (key == "totalMiscFees") {
                    key = "Total";
                }
                return {
                    type : key,
                    manager : value || "-",
                    broker : brokerValue,
                    delta : delta
                };
            });
            var totalMiscFees = formatMoney($.grep(tableData, function(e) {
                return e.type == "Total";
            })[0].manager);

            var opts = {
                backdrop : true,
                keyboard : true,
                backdropClick : false,
                templateUrl : 'views/modals/miscFees.html',
                controller : 'MiscFeesCtrl',
                resolve : {
                    miscFeeRowData : function() {
                        return tableData;
                    },
                    totalMiscFees : function() {
                        return totalMiscFees == null ? '-' : totalMiscFees;
                    }
                },
                scope : $scope
            };
            $modal.open(opts);
        }, function(msg, status) {
            ErrorMsgSvc.showAlert("INTERNAL_ERROR", status == 500 || status == 404 ? "TECH_SUPPORT" : msg.details.error, "Get Misc Fees");
        });
    };

    $scope.refitBlockTableContainer = function() {
        $("#mainTableWrapper").css(
            'maxWidth',
            (parseInt($("#blockTable_wrapper .dataTables_scrollHeadInner").width()) + parseInt($("#blockTable_wrapper .dataTables_scrollHeadInner")
                .css('padding-right')))
                + "px");
    };

    // CLEAN UP //
    $scope.$on('$destroy', function() {
        $(BLOCK_TABLE_ID).dataTable().fnClearTable();
        DataStorageSvc.set($scope.allocTableData, null);
        ErrorMsgSvc.clearPopups(0); // Clear any alert popups
        $(window).off('resize');
    });
});

app.controller('TransactionDatatableCtrl', function($scope, $compile, $rootScope, $sce, $modal, $routeParams, $location, $filter, Auth, ErrorMsgSvc,
    DataStorageSvc) {

});