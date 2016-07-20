$(document).ready(function() {

  var widgetFilterScroll = 36;
	
	$("#smartmenu" ).smartmenus();
	$("#search").find('input').autocomplete();
	$(document).on("click", ".facet-foldable", function (e) {
		$(this).toggleClass("folded");
		$(".title>.ui-icon", this).toggleClass("ui-icon-minus").toggleClass("ui-icon-plus");
	});
			
	// Now instantiate the accordion...
	$("#accordion").accordion({
		heightStyle: "content",
		collapsible: true,
		animate: 200,
		active: false,
		activate: function( event, ui ) {
			if (!!ui.newPanel && !!ui.newPanel[0]) {
	  		$("input.widget-filter", ui.newPanel[0]).val("");
				ui.newPanel.scrollTop(widgetFilterScroll);
				
				if (!$("span.ui-icon-search", ui.newHeader[0]).length) {
					ui.newHeader.append($('<span class="ui-icon ui-icon-search"></span>').on("click", function (e) {
						ui.newPanel.animate({ scrollTop: ui.newPanel.scrollTop() > 0 ? 0 : widgetFilterScroll });
						$("input.widget-filter", ui.newPanel[0]).focus();
						e.stopPropagation();
						e.preventDefault();
					}));
				}
	  	}
		}
	});
	
	// ... and prepare the actual filtering funtion.
	$("#accordion input.widget-filter").on("keyup", function (e) {
		var needle = $(this).val().toLowerCase(),
				div = $(this).parent('div.widget-content');

		if ((e.keyCode || e.which) == 27)
			$(this).val(needle = "");
		
		if (needle == "")
			$('li', div[0]).show();
		else
			$('li>a', div[0]).each( function () {
				if (this.title.toLowerCase().indexOf(needle) >= 0 || this.innerText.toLowerCase().indexOf(needle) >= 0)
					$(this).parent().show();
				else
					$(this).parent().hide();
			});
	});
	
	$("#result-tabs").tabs();
		
  $(function() {
    $("#accordion-resizer").resizable({
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

