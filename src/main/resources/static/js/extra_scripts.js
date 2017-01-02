var scrollerPosition = 0;

// This is wrong to define global variables, need refactoring
var userInfo = {};
var time24Hour = false;
var thousandsSeparator = true;
var minQuantityDecimals = 0;
var maxQuantityDecimals = 0;
var minMoneyDecimals = 2;
var maxMoneyDecimals = 2;
var minPriceDecimals = 2;
var maxPriceDecimals = 4;
var dateTemplate = "mm/dd/yy";
var minutesForTimeout = 20;
var userLocale = "en-US";
var decodeSecIDTypeMap = {
    "1" : "CUSIP",
    "2" : "SEDOL",
    "4" : "ISIN",
    "5" : "RIC"
};
var decodeSideMap = {
    "1" : "BUY",
    "2" : "SELL",
    "3" : "BUY MINUS",
    "4" : "SELL PLUS",
    "5" : "SELL SHORT",
    "6" : "SELL SHORT EXEMPT",
    "7" : "UNDISCLOSED",
    "8" : "CROSS",
    "9" : "CROSS SHORT",
    "A" : "CROSS SHORT EXEMPT",
    "B" : "AS DEFINED",
    "C" : "OPPOSITE",
    "D" : "SUBSCRIBE",
    "E" : "REDEEM",
    "F" : "LEND",
    "G" : "BORROW"
};
var encodeSideMap = {
    "BUY" : "1",
    "SELL" : "2",
    "BUY MINUS" : "3",
    "SELL PLUS" : "4",
    "SELL SHORT" : "5",
    "SELL SHORT EXEMPT" : "6",
    "UNDISCLOSED" : "7",
    "CROSS" : "8",
    "CROSS SHORT" : "9",
    "CROSS SHORT EXEMPT" : "A",
    "AS DEFINED" : "B",
    "OPPOSITE" : "C",
    "SUBSCRIBE" : "D",
    "REDEEM" : "E",
    "LEND" : "F",
    "BORROW" : "G"
}
var decodeBrokerAllocStatusMap = {
    1 : "Received",
    2 : "Conf Rejected",
    3 : "Affirmed"
};
var decodeClientAllocStatusMap = {
    0 : "Accepted",
    1 : "Block&nbsp;Reject",
    2 : "Account&nbsp;Reject",
    3 : "Acknowledged",
    4 : "Incomplete",
    5 : "Reject&nbsp;by&nbsp;FIXAffirm",
    6 : "Allocation&nbsp;Pending",
    7 : "Reversed"
};
var decodeBrokerAllocRejReasonMap = {
    1 : "Mismatched Acct",
    2 : "Missing Settl Inst",
    3 : "IndAllocID Mismatch",
    4 : "Unk Transaction",
    5 : "Dup Transaction",
    6 : "Instrument Mismatch",
    7 : "Price Mismatch",
    8 : "Commission Mismatch",
    9 : "Settle Date Mismatch",
    10 : "Fund Mismatch",
    11 : "Qty Mismatch",
    12 : "Fees Mismatch",
    13 : "Tax Mismatch",
    14 : "Party Mismatch",
    15 : "Side Mismatch",
    16 : "Net Money Mismatch",
    17 : "Trade Date Mismatch",
    18 : "Settle Ccy Mismatch",
    19 : "Capacity Mismatch",
    99 : "Other (see text)"
};
var decodeClientAllocRejReasonMap = {
    0 : "Unknown Account(s)",
    1 : "Incorrect Quantity",
    2 : "Incorrect Average Price",
    3 : "Unknown Executing Broker",
    4 : "Commission Difference",
    5 : "Unknown OrderID",
    6 : "Unknown ListID",
    7 : "Other",
    8 : "Incorrect Allocated Quantity",
    9 : "Calculation Difference",
    10 : "Unknown or Stale ExecID",
    11 : "Mismatched Data",
    12 : "Unknown ClOrdID",
    13 : "Warehouse Request Rejected",
    99 : "Other"
};

Array.prototype.contains = function(v) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === v)
            return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for (var i = 0; i < this.length; i++) {
        if (!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr;
};

// first, checks if it isn't implemented yet
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

Number.prototype.aofs_toFixed = function(precision) {
    var multiplier = Math.pow(10, precision);
    return (Math.round(multiplier * parseFloat(this)) / multiplier).toFixed(precision);
};

function setDropDownFilterValues(data, column) {
    var values = _.reject(data, function(v) {
        return !v[column];
    });
    return _.map(values, function(v) {
        return v[column];
    }).unique().sort();
}

/*
 * Upon further research found some problems with .toLocaleString(). The performance is not as good as a regex formatter. See the following link:
 * jsperf.com/number-formatting-with-commas. Also trying to get trailing zeros as decimal places is problematic
 */
function number(n, decimals) {
    return parseFloat(n).aofs_toFixed(decimals);
}

function numberWithCommas(n, decimals) {
    var parts = parseFloat(n).aofs_toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

function formatValue(n, minDecimals, maxDecimals, displayCommas) {
    if (n == "" || n == "-") {
        return n;
    }

    minDecimals = minDecimals < 0 ? 0 : minDecimals;
    maxDecimals = maxDecimals < 0 ? 0 : maxDecimals;

    var parts = parseFloat(n).aofs_toFixed(maxDecimals).split('.');
    if (displayCommas) {
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    if (parts[1]) {
        var maxZeroToBeRemoved = maxDecimals - minDecimals;
        var regex = new RegExp('0{0,' + maxZeroToBeRemoved + '}$');
        parts[1] = parts[1].replace(regex, '');
    }
    return parts[1] == '' ? parts[0] : parts.join('.');
}

function formatPrice(v) {
    return formatValue(v, minPriceDecimals, maxPriceDecimals, thousandsSeparator);
}

function formatQty(v) {
    return formatValue(v, 0, 0, thousandsSeparator);
}

function formatMoney(v) {
    return formatValue(v, 2, 2, thousandsSeparator);
}
function decodeSecIDType(code) {
    return decodeSecIDTypeMap[code] || "UNKNOWN";
}
function decodeSide(code) {
    return decodeSideMap[code] || "UNKNOWN";
}
function decodeBrokerAllocStatus(code) {
    return decodeBrokerAllocStatusMap[code] || " ";
}
function decodeBrokerAllocRejReason(code) {
    return decodeBrokerAllocRejReasonMap[code] || " ";
}
function decodeClientAllocStatus(code) {
    return decodeClientAllocStatusMap[code] || " ";
}
function decodeClientAllocRejReason(code) {
    return decodeClientAllocRejReasonMap[code] || " ";
}
function encodeSide(code) {
    return encodeSideMap[code] || -1;
}

function aofs_customToYmd(date) {
    if (!date) {
        return date;
    }
    return $.datepicker.parseDate(dateTemplate, date).aofs_yyyymmdd();
}

function aofs_ymdToCustom(date) {
    if (!date) {
        return date;
    }
    return $.datepicker.parseDate('yymmdd', date).aofs_format(dateTemplate);
    // --------- potential improvements
    // hh to hours
    // mm to minutes
}

function formatTradeState(rawState) {
    if (rawState === undefined) {
        return "";
    } else if (rawState == "MATCH_PENDING") {
        return "MATCHED";
    } else if (rawState == "CANCEL_PENDING") {
        return "CLIENT&nbsp;CXL";
    } else if (rawState == "CANCELED_BY_BROKER") {
        return "BROKER&nbsp;CXL";
    } else if (rawState == "CLIENT_REJECT") {
        return "CLIENT&nbsp;REJECT";
    } else {
        return rawState.replace(/_/g, "&nbsp;");
    }
};

function deltaWithCommas(n, decimals) {
    return numberWithCommas(n, decimals);
}

function chk(value) {
    return value === undefined ? '' : (value == " " || value == "  " ? '' : value);
}
function nullIfEmpty(value) {
    return value == "" ? null : value;
}

function uniqueid() {
    // always start with a letter (for DOM friendliness)
    var idstr = String.fromCharCode(Math.floor((Math.random() * 25) + 65));
    do {
        // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
        var ascicode = Math.floor((Math.random() * 42) + 48);
        if (ascicode < 58 || ascicode > 64) {
            // exclude all chars between : (58) and @ (64)
            idstr += String.fromCharCode(ascicode);
        }
    } while (idstr.length < 32);

    return (idstr);
}

myConsole = window.console || (function() {
    var c = {};
    c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function() {};
    return c;
})();

function fnSetKey(aoData, sKey, mValue) {
    for (var i = 0, iLen = aoData.length; i < iLen; i++) {
        if (aoData[i].name == sKey) {
            aoData[i].value = mValue;
        }
    }
}

function fnGetKey(aoData, sKey) {
    for (var i = 0, iLen = aoData.length; i < iLen; i++) {
        if (aoData[i].name == sKey) {
            return aoData[i].value;
        }
    }
    return null;
}

// populates select list from array of items given as array
function populateSelect(el, items) {
    el.options.length = 0;
    if (items.length > 0 && ($(el).attr('class')).indexOf('multi-select-filter') == -1) {
        el.options[0] = new Option('All', '');
    }
    $.each(items, function(index, value) {
        el.options[el.options.length] = new Option(value, value);
    });
}

// function populateSelectFilters(data, datatable) { // sprint 12: this code is unnecessary in this product.
// var headers = $(datatable).children("thead").children("tr").children("th");
// _.each(headers, function(header) {
// var selectValue = "select", multiSelectValue = "multi-select";
// if (selectValue.localeCompare($(header).attr('data-filter')) == 0 || multiSelectValue.localeCompare($(header).attr('data-filter')) == 0) {
// var rowName = $(header).attr('data-mdata');
// var items = new Array();
// _.each(data, function(row) {
// var option = row[rowName].replace(/<.*>/g, "").replace(/&nbsp;/g, " ");
// if (!items.contains(option)) {
// items.push(option);
// }
// });
// populateSelect($("#" + rowName + "Filter select").get(0), items);
// }
// });
// }

function setRangeValue(inputValue) {
    // inputFloat = parseFloat(inputValue.replace(",", "."));
    inputFloat = parseFloat(inputValue);
    decimalPlaces = 2;
    rv = Math.pow(10, -decimalPlaces) / 2;
    return "{0},{1}".format(inputFloat - rv, inputFloat + rv);
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) {
        return obj;
    }
    var copy = obj.constructor();
    for ( var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            copy[attr] = obj[attr];
        }
    }
    return copy;
}

var alertFallback = false;
if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    if (alertFallback) {
        console.log = function(msg) {
            alert(msg);
        };
    } else {
        console.log = function() {};
    }
}

function aofs_long_datetime_string_to_date(longDateString) {
    var d = new Date(longDateString);
    return d;
}

function closeCommentPopup(popupParent, popupID) {
    $(popupID).stop(true, true); // stops current and queued animations
    $(popupID).fadeOut(70);
    $(popupParent).off("mouseleave mousemove");
    $("div.dataTables_scrollBody").off("scroll");
}

function fadeMeOut(identifier, speed) {
    $(identifier).fadeOut(speed, function() {
        $(this).remove();
    });
}

function openCommentPopup(thisObject, popupID, message, leftOffset, topOffset) {
    $(popupID).stop(true, true); // stops current and queued animations
    $("div.dataTables_scrollBody").off("scroll");
    if (message) {
        var parentOffset = $(thisObject).offset();
        var mousePosX = parentOffset.left, mousePosY = parentOffset.top;
        $(popupID + " .popup-content").html(message);
        $(popupID).fadeIn(200);
        $(popupID).offset({
            top : (parentOffset.top - topOffset),
            left : (parentOffset.left - leftOffset)
        });
        if (leftOffset < 0)
            $(popupID).find(".arrow").css('left', '-7px');
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
    }
}

function serverRowToDataTableRow($filter, serverRow) {
    // var info = "";
    // info not needed, but if we want a hover icon later just activate this code and add 'info' to the column data
    // if (serverRow[c.text] != undefined && serverRow[c.text] != "") {
    // info = '<img src="img/alerticon.png" onmouseover="openCommentPopup(this, \'#block-trade-comment-popup\', \''
    // + serverRow[c.text].replace("'", "\\'") + '\', 140, 36)" class="info-icon"/>';
    // }
    return {
        "DT_RowId" : "bTblRow_" + chk(serverRow.tradeID),
        "symbol" : chk(serverRow.symbol),
        "securityID" : chk(serverRow.securityID),
        "securityIDSource" : chk(decodeSecIDType(serverRow.securityIDSource)),
        "side" : chk(decodeSide(serverRow.side)),
        "quantity" : chk(serverRow.quantity),
        "brokerAcronym" : chk(serverRow.brokerAcronym),
        "clientAcronym" : chk(serverRow.clientAcronym),
        "currency" : chk(serverRow.currency),
        "avgPx" : chk(serverRow.avgPx),
        "grossTradeAmt" : chk(serverRow.grossTradeAmt),
        "netMoney" : chk(serverRow.netMoney),
        "allocID" : chk(serverRow.allocID),
        "aofsAllocID" : chk(serverRow.aofsAllocID),
        "allocStatus" : "<span onmouseover='openCommentPopup(this, \"#block-trade-comment-popup\", \""
            + chk(decodeClientAllocRejReason(serverRow.allocRejCode)) + "\", 140, 30)' style='color:inherit;'>"
            + chk(decodeClientAllocStatus(serverRow.allocStatus)) + "</span>",
        "allocRejCode" : chk(decodeClientAllocRejReason(serverRow.allocRejCode)),
        "tradeDate" : chk(serverRow.tradeDate),
        "state" : chk(formatTradeState(serverRow.state)),
        "statusClass" : chk(serverRow.state),
        "tradeID" : chk(serverRow.tradeID),
        "entity" : chk(serverRow.entity),
        "RB" : "<input type='radio' id='cb_{0}' name='rb_select' instructionid='{0}' class='rb_select'/>".format(chk(serverRow.tradeID)),
        "CB" : "<input type='checkbox' id='cb_{0}' tradeid='{0}' class='blockTblcb'/>".format(chk(serverRow.tradeID)),
        "settlDate" : chk(serverRow.settlDate),
        "modifyTimestamp" : Date.fromISO(serverRow.modifyTimestamp),
        "text" : chk(serverRow.text),
        "tagName" : chk(serverRow.tagName),
        "tagValue" : chk(serverRow.tagValue),
        "version" : serverRow.version,
        "totalCommission" : chk(serverRow.totalCommission),
        "totalMiscFees" : chk(serverRow.totalMiscFees)
    };
}

function aofs_uncompress(json) {
    if (json.cjson === "P") {
        json.cjson = "Y";
        json.header = json.header.split("|");
        json.data = _.map(json.data, function(v) {
            return v.split("|");
        });
    }

    if (json.cjson !== "Y") {
        return json;
    } else {
        // rewritten to use for-loop for performance reason
        var uncompressed = {};
        if (json.count != undefined) {
            uncompressed.count = json.count;
        }
        var data = [];
        for (var i = 0, ilen = json.data.length; i < ilen; ++i) {
            var item = json.data[i];
            var trade = {};
            for (var j = 0, jlen = json.header.length; j < jlen; ++j) {
                trade[json.header[j]] = item[j];
            }
            data.push(trade);
        }
        uncompressed[json.id] = data;
        return uncompressed;
    }
}

function arrayToCommadString(array) {
    if (array == null) {
        return null;
    }
    var firstTime = true;
    var result = "";
    array.forEach(function(item) {
        if (!firstTime) {
            result = result.concat(",");
        } else {
            firstTime = false;
        }
        result = result.concat(item);
    });
    return result;
};

function aofs_testDate_mmddYYYY(dateString) {
    // dateString is in mm/dd/yyyy format
    var t = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (t === null)
        return false;
    var m = +t[1], d = +t[2], y = +t[3];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 2000) {
        return true;
    }
    return false;
}

function aofs_testDate(dateString) {
    // for now check mmddYYYY format and others can be added if needed.
    return aofs_testDate_mmddYYYY(dateString);
}

function aofs_ymdToMdy(date) {
    if (!date) {
        return date;
    }
    var s = date.toString();
    return "{0}/{1}/{2}".format(s.substring(4, 6), s.substring(6, 8), s.substring(0, 4));
}

function aofs_mdyToYmd(date) {
    if (!date) {
        return date;
    }
    var s = date.toString();
    return "{0}{1}{2}".format(s.substring(6, 10), s.substring(0, 2), s.substring(3, 5));
}

function aofs_formatEventTime(isoDate) {
    var d = Date.fromISO(isoDate);
    return '{0} {1}'.format(aofs_formatDate(d), aofs_formatTime(d));
}

function aofs_formatDate(date) {
    return date ? date.formatLocaleDateString(userLocale, {}) : date;
}

function aofs_formatTime(date) {
    return date ? date.toLocaleTimeString(userLocale, {}) : date;
}

Date.prototype.aofs_mmddyyyy = function(sep) {
    var format = sep == undefined ? 'mmddyy' : 'mm{0}dd{0}yy'.format(sep);
    return $.datepicker.formatDate(format, this);
};

Date.prototype.aofs_yyyymmdd = function(sep) {
    var format = sep == undefined ? 'yymmdd' : 'yy{0}mm{0}dd'.format(sep);
    return $.datepicker.formatDate(format, this);
};

Date.prototype.aofs_format = function(dateTemplate) {
    return $.datepicker.formatDate(dateTemplate, this);
};

Date.prototype.aofs_addDay = function(n) {
    var d = new Date(this.getTime());
    d.setDate(d.getDate() + n);
    return d;
};

Date.prototype.aofs_addMonth = function(n) {
    var d = new Date(this.getTime());
    d.setMonth(d.getMonth() + n);
    return d;
};

Date.prototype.aofs_locale = function(locale) {
    return this.toLocaleString(locale);
};

function aofs_dump(o) {
    if (Array.isArray(o)) {
        var s = '[';
        for (var i = 0; i < o.length; ++i) {
            s += "'" + o[i] + "', ";
        }
        return s.replace(/, $/, '') + ']';
    } else if (typeof o === 'object') {
        var s = '{';
        for ( var k in o) {
            s += k + ":'" + o[k] + "', ";
        }
        return s.replace(/, $/, '') + '}';
    } else {
        return '' + o;
    }
}

// poor man logger
function aofs_debug(message) {
    var debug = false;
    if (debug) {
        console.log(message);
        var trace = printStackTrace();
        // console.log(trace);
    }
}

function moneyRender(data, type, val) {
    if (type === 'display') {
        return formatValue(data, minMoneyDecimals, maxMoneyDecimals, thousandsSeparator);
    } else if (type == 'filter') {
        return number(data, maxPriceDecimals);
    } else {
        return data;
    }
}

function avgPxRender(data, type, val) {
    if (type === 'display') {
        return formatValue(data, 7, 7, thousandsSeparator);
    } else if (type == 'filter') {
        return number(data, maxPriceDecimals);
    } else {
        return data;
    }
}

function quantityRender(data, type, val) {
    if (type === 'display') {
        return formatValue(data, minQuantityDecimals, maxQuantityDecimals, thousandsSeparator);
    } else if (type == 'filter') {
        return number(data, maxQuantityDecimals);
    } else {
        return data;
    }
}

function priceRender(data, type, val) {
    if (type === 'display') {
        return formatValue(data, minPriceDecimals, maxPriceDecimals, thousandsSeparator);
    } else if (type == 'filter') {
        return number(data, maxPriceDecimals);
    } else {
        return data;
    }
}

function dateTimeRender(data, type, val) {
    if (type === 'display') {
        if (!data) {
            return data;
        }
        var today = new Date();
        var showTime = today.getFullYear() == data.getFullYear() && today.getMonth() == data.getMonth() && today.getDate() == data.getDate();
        return showTime ? aofs_formatTime(data) : aofs_formatDate(data);
    } else {
        return data;
    }
}

function dateRender(data, type, val) {
    if (type === 'display') {
        return aofs_ymdToCustom(data);
    } else if (type == 'filter') {
        return aofs_ymdToMdy(data); // column filter always use local
        // format, need to fix it later
    } else {
        return data;
    }
}

function eventTimeRender(data, type, val) {
    if (type === 'display') {
        return aofs_formatEventTime(data);
    } else {
        return data;
    }
}

aofs_datatypes = {
    'money' : {
        'render' : moneyRender
    },
    'quantity' : {
        'render' : quantityRender
    },
    'price' : {
        'render' : priceRender
    },
    'preciseprice' : {
        'render' : avgPxRender,
        'sortType' : 'numeric'
    },
    'datetime' : {
        'render' : dateTimeRender,
        'sortType' : 'date'
    },
    'date' : {
        'render' : dateRender,
        'sortType' : 'date'
    },
    'eventTime' : {
        'render' : eventTimeRender,
        'sortType' : 'date'
    }
};

var old_gotoToday = $.datepicker._gotoToday;
$.datepicker._gotoToday = function(id) {
    old_gotoToday.call(this, id);
    this._selectDate(id);
};

function saveTableScrollPosition(scroller) {
    aofs_debug("savingTableScrollPosition:" + scroller.scrollTop());
    scrollerPosition = scroller.scrollTop();
}
function restoreTableScrollPosition(scroller) {
    aofs_debug("restoringTableScrollToPosition:" + scrollerPosition);
    scroller.scrollTop(scrollerPosition);
}

function getSelectOptions(el) {
    return $.map(el.options, function(e) {
        if (e.value !== '') {
            return e.value;
        }
    });
}

function getUniqueCurrencies(data, currencies) {
    var existingCurrencies = typeof currencies !== "undefined" && currencies != null && currencies.length > 0 ? currencies : new Array();
    $.each(data, function() {
        if ($.inArray(this.currency, existingCurrencies) == -1 && this.currency !== '') {
            existingCurrencies.push(this.currency);
        }
    });
    return existingCurrencies.sort();
}

function getFilteredRowDataIfAny(oTable, tradeID) {
    var row;
    var oSettings = oTable.fnSettings();
    if (oSettings.aiDisplay.length > 0) {
        var aiRows = oSettings.aiDisplay;
        var rowPosition;
        for (var i = 0, c = aiRows.length; i < c; i++) {
            var iRow = aiRows[i];
            var aData = oTable.fnGetData(iRow);
            if (aData.tradeID == tradeID) {
                rowPosition = i;
                break;
            }
        }
        return rowPosition != undefined ? oSettings.aoData[rowPosition] : row;
    }
    return row;
}

function objectToQueryParamString(obj) {
    var paramString = "", value;
    for (property in obj) {
        value = obj[property];
        if (value) {
            paramString += property + "=" + (value instanceof Array ? arrayToCommadString(value) : value) + "&";
        }
    }
    return paramString ? paramString.slice(0, -1) : paramString;
}

function formatParsedFixMsg(unformatted) {

    var formatTagRecursive = function(list, level) {
        var thisLayer = [];
        for (var tagIndex = 0; tagIndex < list.length; tagIndex++) {
            thisLayer.push({
                number : list[tagIndex].tag[0],
                description : list[tagIndex].tag[1],
                value : list[tagIndex].tag[2],
                explanation : list[tagIndex].tag[3],
                level : level,
                repeatingGroup : !!list[tagIndex].nestedTags
            });
            if (list[tagIndex].nestedTags) {
                thisLayer = thisLayer.concat(formatTagRecursive(list[tagIndex].nestedTags, level == 2 ? 3 : (level + 1)));
            }
        }
        return thisLayer;
    };

    return formatTagRecursive(unformatted, 1);
}

/*
 * var old_fnCreateSelect = $.fn.columnFilter.fnCreateSelect; aofs_debug("called old_"); //debug $.fn.columnFilter.fnCreateSelect = function(oTable,
 * aData, bRegex, oSelected, firstOption){ aofs_debug("TEST"); //DEBUG $.fn.columnFilter.fnCreateSelect(oTable, aData, bRegex, oSelected,
 * firstOption); };
 */
