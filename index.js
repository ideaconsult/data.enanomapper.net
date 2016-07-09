$(document).ready(function() {

  var widgetFilterScroll = 35;
	
	$( "#smartmenu" ).smartmenus();    
	$("#search").find('input').autocomplete();
		
	var initWidgetFilter = function( event, ui ) {
		if (!!ui.oldHeader && !!ui.oldHeader[0])
			$("span.ui-icon-search", ui.oldHeader[0]).remove();

		if (!!ui.newPanel && !!ui.newPanel[0]) {
			if (ui.newPanel[0].scrollHeight > ui.newPanel[0].clientHeight) {
	  		$("input.widget-filter", ui.newPanel[0]).show();	
		  			
  			var fe = $("<span class=\"ui-icon ui-icon-search\"></span>").on("click", function (e) {
					ui.newPanel.animate({ scrollTop: ui.newPanel.scrollTop() > 0 ? 0 : widgetFilterScroll });
					e.stopPropagation();
					e.preventDefault();
  			});
		  			
  			ui.newPanel.scrollTop(widgetFilterScroll);
  			ui.newHeader.append(fe);
  		}
  		else {
	  		$("input.widget-filter", ui.newPanel[0]).hide();
				$("span.ui-icon-search", ui.newHeader[0]).remove();
	  	}
  	}
	};
	
	$( "#accordion" ).accordion({
		heightStyle: "content",
		collapsible: true,
		animate: 200,
		active: false,
		activate: initWidgetFilter
	});
	
	$("#accordion div.widget-content").each(function () {
		var jq = $(this);
		jq.data('initWidget', function(e) { initWidgetFilter( e, { newPanel: jq, newHeader: jq.prev() } )});
	});
	
	$( "#result-tabs" ).tabs();
		
  $(function() {
    $( "#accordion-resizer" ).resizable({
      minHeight: 400,
      //minWidth: 200,
      resize: function() {
        $( "#accordion" ).accordion( "refresh" );
        // TODO: Resize the results pane.
      }
    });
  });	
  
  $(function() {
    $( "#about-message" ).dialog({
      modal: true,
      buttons: {
        Ok: function() {
          $( this ).dialog( "close" );
        }
      }
    });
    $( "#about-message" ).dialog("close");
  });  
});

