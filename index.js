// Some of the tools
function fillString(str, info) {
	var pieces = str.split(/{{(\w+)}}/),
			pl = pieces.length,
			out = "",
			i, f;
	
	for (i = 0;; ++i) {
		out += pieces[i++];
		if (i >= pl)
			break;
			
		f = info[pieces[i]];
		out += f != null ? f : "{{" + pieces[i] + "}}";
	}
	
	return out;
}

function getFillTemplate(name, info) {
	return $(fillString($("#" + name).html(), info).replace(/(<img(\s+.*)?)(\s+jt-src=")/, "$1 src=\""));
}

function updateInlineCounter(jel, count) {
	var htt = jel.html(),
			m = htt.match(/\s\(\d+\)/);
	
	if (!m)
		htt = htt + " (" + count + ")";
	else
		htt = htt.replace(m[0], count > 0 ? " (" + count + ")" : "");
	
	jel.html(htt);
}

function updateCollectionURL(basket) {
	var str = "",
			href = window.location.href,
			mbs = href.match(/basket=[\S^&]+/);
			
	basket.enumerateItems(function (doc) {
		str += doc.s_uuid + ";";
	});
	
	if (str != "") str = "basket=" + str;
	
	if (!!mbs)
		href = href.replace(mbs[0], str);
	else if (href.lastIndexOf('?') < 0)
		href += '?' + str;
	else
		href += (href.slice(-1) == "&" ? "" : "&") + str;
		
	window.history.replaceState({ "basket" : str }, document.title, href);
};

function formatUnits(str) {
	// change the exponential
	return str.toString()
		.replace(/\^\(?([\-\d]+)\)?/, '<sup>$1</sup>')
		.replace(/([A-Za-z])(\d)(\D)/, '$1<sup>$2</sup>$3')
		.replace(/(\W)?u/, '$1&#x00B5;');
}

$(document).ready(function() {

  var widgetFilterScroll = 35;
	
	$("#smartmenu" ).smartmenus();
	$("#search").find('input').autocomplete();
		
	// Prepare the widget filter UI prepartion method.
	var initWidgetFilter = function( event, ui ) {
		if (!!ui.oldHeader && !!ui.oldHeader[0])
			$("span.ui-icon-search", ui.oldHeader[0]).remove();

		if (!!ui.newPanel && !!ui.newPanel[0]) {
			if (ui.newPanel[0].scrollHeight > ui.newPanel[0].clientHeight) {
	  		$("input.widget-filter", ui.newPanel[0]).show().val("");
		  			
  			var fe = $("<span class=\"ui-icon ui-icon-search\"></span>").on("click", function (e) {
					ui.newPanel.animate({ scrollTop: ui.newPanel.scrollTop() > 0 ? 0 : widgetFilterScroll });
					$("input.widget-filter", ui.newPanel[0]).focus();
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
	
	// Now instantiate the accordion...
	$("#accordion").accordion({
		heightStyle: "content",
		collapsible: true,
		animate: 200,
		active: false,
		activate: initWidgetFilter
	});
	
	// .. assign the widget-initialization funtion for each panel ...
	$("#accordion div.widget-content").each(function () {
		var jq = $(this);
		jq.data('initWidget', function(e) { initWidgetFilter( e, { newPanel: jq, newHeader: jq.prev() } )});
	});

	// ... and prepare the actual filtering funtion.
	$("#accordion input.widget-filter").on("keyup", function (e) {
		var needle = $(this).val().toLowerCase(),
				div = $(this).parent('div.widget-content');

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

