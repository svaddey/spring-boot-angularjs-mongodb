/* Set the defaults for DataTables initialisation */
$.extend( true, $.fn.dataTable.defaults, {
    "bFilter": true,
    "bInfo": false,
    "bScrollInfinite": false,
    "bScrollCollapse": true,
    "sScrollY": "400px",
    "bPaginate": false,
    "bDeferRender": true,
    "bAutoWidth": false,
    "sDom":'Rlrtip',
    //"bStateSave": true,
    //"sDom":'Rlfrtip',

    "bProcessing": true,
    "sEmptyTable": "No trades found...",
    "sZeroRecords": "Loading...",

    "oLanguage": {
		"sLengthMenu": "_MENU_ records per page",
        "sSearch": "Search all columns:"
    }

} );

//disable error alerts
$.fn.dataTableExt.sErrMode = 'throw';

/* Default class modification */
$.extend( $.fn.dataTableExt.oStdClasses, {
	"sWrapper": "dataTables_wrapper form-inline"
} );


$.fn.dataTableExt.oApi.fnFilterClear  = function ( oSettings )
{

    /* Remove global filter */
    oSettings.oPreviousSearch.sSearch = "";

    /* Remove the text of the global filter in the input boxes */
    if ( typeof oSettings.aanFeatures.f != 'undefined' )
    {
        var n = oSettings.aanFeatures.f;
        for ( var i=0, iLen=n.length ; i<iLen ; i++ )
        {
            $('input', n[i]).val( '' );
        }
    }

    /* Remove the search text for the column filters - NOTE - if you have input boxes for these
     * filters, these will need to be reset
     */
    for ( var i=0, iLen=oSettings.aoPreSearchCols.length ; i<iLen ; i++ )
    {
        oSettings.aoPreSearchCols[i].sSearch = "";
    }

    /* Redraw */
    oSettings.oApi._fnReDraw( oSettings );
};

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "formatted-num-pre": function ( a ) {
        a = a.toString();
        a = (a === "-" || a === "") ? 0 : a.replace( /[^\d\-\.]/g, "" );
        return parseFloat( a );
    },

    "formatted-num-asc": function ( a, b ) {
        return a - b;
    },

    "formatted-num-desc": function ( a, b ) {
        return b - a;
    }
} );





