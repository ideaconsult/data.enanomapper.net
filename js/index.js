function getHeaderText(jel) { return jel.contents().filter(function () { return this.nodeType == 3; })[0]; }

function getTabsRefresher() { $("#accordion").accordion( "refresh" ); }

function getTitleFromFacet(facet) {
  facet = facet.replace(/^caNanoLab\./, "").replace(/^http\:\/\/dx\.doi\.org/, "");
  return (lookup[facet] || facet).replace("NPO_", "").replace(" nanoparticle", "");
}

function getRoundedNumber(num, prec) {
  var v = Math.round(num / prec) * prec;
  return parseFloat(num.toString().replace(new RegExp("\\.(\\d{" + (-Math.log10(prec)) + "})\\d*"), ".$1"));
}

$(document).ready(function() {

  ccLib.flexSize($(".container")[0]);
	
	$("#smartmenu" ).smartmenus();
	$("#search").find('input').autocomplete();
	$(document).on("click", "ul.tag-group", function (e) { 
		$(this).toggleClass("folded");
		$(this).parents(".widget-root").data("refreshPanel").call();
	});
			
	// Now instantiate and things around it.
	$("#accordion").accordion({
		heightStyle: "content",
		collapsible: true,
		animate: 200,
		active: false,
		activate: function( event, ui ) {
			if (!!ui.newPanel && !!ui.newPanel[0]) {
				var header = ui.newHeader[0],
						panel = ui.newPanel[0],
						filter = $("input.widget-filter", panel),
						widgetFilterScroll = filter.outerHeight(true),
						refreshPanel;
				
				if (!$("span.ui-icon-search", header).length) {
					refreshPanel = function () {
			  		if (panel.scrollHeight > panel.clientHeight || filter.val() != "" || $(header).hasClass("nested-tab") ) {
							$(panel).scrollTop(widgetFilterScroll);
							filter.show()
							$("span.ui-icon-search", header).removeClass("unused");
						}
						else {
							filter.hide();
							$("span.ui-icon-search", header).addClass("unused");
						}
					};

					ui.newPanel.data("refreshPanel", refreshPanel);
					ui.newHeader.data("refreshPanel", refreshPanel);
					ui.newHeader.append($('<span class="ui-icon ui-icon-search"></span>').on("click", function (e) {
						ui.newPanel.animate({ scrollTop: ui.newPanel.scrollTop() > 0 ? 0 : widgetFilterScroll }, 300, function () {
							if (ui.newPanel.scrollTop() > 0)
								$("input.widget-filter", panel).blur();
							else
								$("input.widget-filter", panel).focus();
						});
							
						e.stopPropagation();
						e.preventDefault();
					}));
				}
				else
					refreshPanel = ui.newPanel.data("refreshPanel");
				
				filter.val("");
				refreshPanel();
	  	}
		}
	});
	
	// ... and prepare the actual filtering funtion.
	$(document).on('keyup', "#accordion input.widget-filter", function (e) {
		var needle = $(this).val().toLowerCase(),
				div = $(this).parent('div.widget-root'),
				cnt;

		if ((e.keyCode || e.which) == 27)
			$(this).val(needle = "");
		
		if (needle == "")
			$('li,ul', div[0]).show();
		else {
			$('li>a', div[0]).each( function () {
				var fold = $(this).parents("ul.tag-group");
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
		$("ul.tag-group", div[0]).each(function () {
  		var me = $(this);
			cnt = parseInt(me.data("hidden")) || 0;
			if (me.children().length > cnt)
				me.show().removeClass("folded");
			else
				me.hide().addClass("folded");

			me.data("hidden", null);
		});
	});
		    
	var resDiv = $("#result-tabs"),
	    resSize;
	
	resDiv.tabs( { } );
		
  $("#accordion-resizer").resizable({
    minWidth: 150,
    maxWidth: 450,
    grid: [10, 10],
    handles: "e",
    start: function(e, ui) {
      resSize = { width: resDiv.width(), height: resDiv.height() };
    },
    resize: function(e, ui) {
      $( "#accordion" ).accordion( "refresh" );
      resDiv.width(resSize.width + ui.originalSize.width - ui.size.width);
    }
  });
  
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

