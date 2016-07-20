function getHeaderText(jel) {
	return jel.contents().filter(function () { return this.nodeType == 3; })[0];	
}

$(document).ready(function() {

  ccLib.flexSize($(".container")[0]);
	
	$("#smartmenu" ).smartmenus();
	$("#search").find('input').autocomplete();
	$(document).on("click", ".facet-foldable", function (e) {
		$(this).toggleClass("folded");
		$("span.ui-icon", this).toggleClass("ui-icon-minus").toggleClass("ui-icon-plus");
	});
			
	// Now instantiate the accordion...
	$("#accordion").accordion({
		heightStyle: "content",
		collapsible: true,
		animate: 200,
		active: false,
		activate: function( event, ui ) {
			if (!!ui.newPanel && !!ui.newPanel[0]) {
	  		var widgetFilterScroll = $("input.widget-filter", ui.newPanel[0]).val("").outerHeight(true);
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
				div = $(this).parent('div.widget-root'),
				cnt;

		if ((e.keyCode || e.which) == 27)
			$(this).val(needle = "");
		
		if (needle == "")
			$('li,div.facet-foldable', div[0]).show();
		else {
			$('li>a', div[0]).each( function () {
				var fold = $(this).parents(".facet-foldable");
				cnt = fold.data("hidden") || 0;
				if (this.title.toLowerCase().indexOf(needle) >= 0 || this.innerText.toLowerCase().indexOf(needle) >= 0)
					$(this).parent().show();
				else {
					$(this).parent().hide();
					++cnt;
				}
				
				if (!!fold.length && !!cnt)
					fold.data("hidden", cnt);
			});
		}
		
		// now check if some of the boxes need to be hidden.
		$("div.facet-foldable ul", div[0]).each(function () {
			var par = $(this).parent();
			cnt = parseInt(par.data("hidden")) || 0;
			if ($(this).children().length > cnt)
				par.show();
			else
				par.hide();

			par.data("hidden", null);
		});
	});
	
	$("#result-tabs").tabs( {
// 		"heightStyle": "fill"
	});
		
  $(function() {
    $("#accordion-resizer").resizable({
      minHeight: 400,
      //minWidth: 200,
      resize: function() {
        $( "#accordion" ).accordion( "refresh" );
      },
      alsoResize: "#result-tabs"
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

