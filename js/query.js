var Manager, 
		Basket,
		Facets = { 
			'substanceType': 	"substanceType",
  		'owner_name': 		"owner_name", 
  		'reference': 			"reference", 
  		'reference_year': "reference_year",
  		'protocol': 			"guidance",
  		'interpretation': "interpretation_result", 
  		'species': 				"_childDocuments_.params.Species", 
//  		'cell': 					"_childDocuments_.params.Cell_line", 
  		'instruments': 		"_childDocuments_.params.DATA_GATHERING_INSTRUMENTS",

  		'testtype': '_childDocuments_.conditions.Test_type',
			'solvent' :	'_childDocuments_.conditions.Solvent',
			'route':	'_childDocuments_.params.Route_of_administration',
			'genotoxicity':	'_childDocuments_.params.Type_of_genotoxicity'

  	},
    Colors = {
      "endpointcategory": "blue",
      "effectendpoint": "green",
    };

(function($) {
	$(function() {
  	Settings = {
			//this is now updated wih cananolab index
//       solrUrl : 'https://search.data.enanomapper.net/solr/enm_shard1_replica1/',
			// this has cananolab index
 //    solrUrl : 'https://solr.ideaconsult.net/solr/enm_shard1_replica1/',
     solrUrl: 'https://solr.ideaconsult.net/solr/ambitlri_shard1_replica1/',
			root : "https://ambitlri.ideaconsult.net/tool/substance/",
			summaryProperty: "P-CHEM.PC_GRANULOMETRY_SECTION.SIZE"
		};
		Manager = new AjaxSolr.Manager(Settings);
		
		Manager.addWidget(new AjaxSolr.ResultWidget({
			id : 'result',
			target : $('#docs'),
			settings : Settings,
			onClick : function (e, doc, exp, widget) { 
				if (!Basket.findItem(doc)) {
					Basket.addItem(doc, exp);
					var s = "", jel = $('a[href="#basket_tab"]');
					
					jel.html(jT.ui.updateCounter(jel.html(), Basket.length));
					
					Basket.enumerateItems(function (d) { s += d.s_uuid + ";";});
					if (!!(s = ccLib.modifyURL(window.location.href, "basket", s)))
						window.history.pushState({ query : window.location.search }, document.title, s);					

					$("footer", this).toggleClass("add none");					
				}
			},
			onCreated : function (doc) {
				$("footer", this).addClass("add");
			}
		}));

		Manager.addWidget(new AjaxSolr.PagerWidget({
			id : 'pager',
			target : $('#pager'),
			prevLabel : '&lt;',
			nextLabel : '&gt;',
			innerWindow : 1,
			renderHeader : function(perPage, offset, total) {
				$('#pager-header').html('<span>' +
								'displaying ' + Math.min(total, offset + 1)
										+ ' to '
										+ Math.min(total, offset + perPage)
										+ ' of ' + total
								+ '</span>');
			}
		}));

		var fel = $("#tag-section").html();
        renderTag = function (facet, count, hint, handler) {
          var view = facet = facet.replace(/^\"(.+)\"$/, "$1");
          if (typeof hint === 'function') {
            handler = hint;
            hint = null;
          }
              
          if (facet.lastIndexOf("caNanoLab.", 0) == 0)
            view = facet.replace("caNanoLab.","");
          else if (facet.lastIndexOf("http://dx.doi.org/", 0) == 0)
            view = facet.replace("http://dx.doi.org/", "");
          else
        	  view = (lookup[facet] || facet).replace("NPO_", "").replace(" nanoparticle", "");
          
          return $('<li><a href="#" class="tag" title="' + view + (hint || "") + ((facet != view) ? ' [' + facet + ']' : '') + '">' + view + ' <span>' + (count || 0) + '</span></a></li>')
              .click(handler);
          };

		// Now the actual initialization of facet widgets
		$("#accordion .widget-content").each(function (idx){
			var me = $(this),
					hdr = me.closest(".widget-root").prev(),
					fid = me.data("facet"),
					col = me.data("color"),
					f = Facets[fid];
					
			if (!f) {
				console.log("Referred a missing wisget: " + fid);
				return;
			}

  		if (!!col) {
      	Colors[f] = col;
      	me.addClass(col);
      }

			Manager.addWidget(new AjaxSolr.TagWidget({
				id : fid,
				target : me,
				header: hdr,
				field : f,
				color: col,
				multivalue: true,
				renderTag: renderTag
			}));
		});
		
		// ... add the mighty pivot widget.
		Manager.addWidget(new AjaxSolr.PivotWidget({
			id : "studies",
			target : $(".after_topcategory"),
			colorMap: Colors,
			multivalue: true,
			renderTag: renderTag,
			tabsRefresher: getTabsRefresher 
		}));
		
    // ... And finally the current-selection one, and ...
		Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
			id : 'currentsearch',
			target : $('#selection'),
			renderTag : renderTag,
			colorMap : Colors
		}));

		// ... auto-completed text-search.
		Manager.addWidget(new AjaxSolr.AutocompleteWidget({
			id : 'text',
			target : $('#search'),
			fields : [ 
			    'substanceType', 'effectendpoint', 'endpointcategory',
					'name', 'guidance', 'interpretation_result',
					'_childDocuments_.params.Species','_childDocuments_.params.Cell_line', 'reference',
					'_text_' ]
		}));
		
		// Now add the basket.
		Basket = new ItemListWidget({
			id : 'basket',
			target : '#basket-docs',
			settings : Settings,
			onClick : function (e, doc, exp) {
				if (Basket.eraseItem(doc.s_uuid) === false) {
					console.log("Trying to remove from basket an inexistent entry: " + JSON.stringify(doc));
					return;
				}
				
				$(this).remove();
				var s = "", jel = $('a[href="#basket_tab"]');
				jel.html(jT.ui.updateCounter(jel.html(), Basket.length));
				Basket.enumerateItems(function (d) { s += d.s_uuid + ";";});
				if (!!(s = ccLib.modifyURL(window.location.href, "basket", s)))
					window.history.pushState({ query : window.location.search }, document.title, s);
							
				$("footer", $("#result_" + doc.s_uuid)[0]).toggleClass("add none");
			},
			onCreated: function (doc) {
				$("footer", this).addClass("remove");
			}			
		});
		
		Manager.init();
		
		// now get the search parameters passed via URL	
		Manager.store.addByValue('q', $.url().param('search') || '*:*');
		
		var params = {
			'facet' : true,
			'facet.field' : ['unit'],
			'facet.limit' : -1,
			'facet.mincount' : 1,
			'f._childDocuments_.params.Cell_line.facet.mincount' : 1,
			'f.interpretation_result.facet.mincount' : 2,
			'f.reference.facet.mincount' : 2,
			'f.owner_name.facet.mincount' : 3,
			'f.reference_year.facet.mincount' : 1,
			'f.substanceType.facet.mincount' : 2,
			'f.guidance.facet.mincount' : 2,
			'f.interpretation_result.facet.mincount' : 10,
			// 'f.topcategory.facet.limit': 50,
			// 'f.countryCodes.facet.limit': -1,
			// 'facet.date': 'date',
			// 'facet.date.start': '1987-02-26T00:00:00.000Z/DAY',
			// 'facet.date.end': '1987-10-20T00:00:00.000Z/DAY+1DAY',
			// 'facet.date.gap': '+1DAY',
			'f.endpointcategory.facet.limit' : -1,
			'f.substanceType.facet.limit' : -1,
			'f.s_uuid.facet.limit' : -1,
			'f.doc_uuid.facet.limit' : -1,
			'f.e_hash.facet.limit' : -1,
      // https://cwiki.apache.org/confluence/display/solr/Collapse+and+Expand+Results
			'fq' : "{!collapse field=s_uuid}",
			'fl' : 'id,type_s,s_uuid,doc_uuid,topcategory,endpointcategory,guidance,substanceType,name,publicname,reference,reference_owner,interpretation_result,reference_year,content,owner_name,P-CHEM.PC_GRANULOMETRY_SECTION.SIZE,CASRN.CORE,CASRN.COATING,CASRN.CONSTITUENT,CASRN.ADDITIVE,CASRN.IMPURITY,EINECS.CONSTITUENT,EINECS.ADDITIVE,EINECS.IMPURITY,ChemicalName.CORE,ChemicalName.COATING,ChemicalName.CONSTITUENT,ChemicalName.ADDITIVE,ChemicalName.IMPURITY,TradeName.CONSTITUENT,TradeName.ADDITIVE,TradeName.IMPURITY,COMPOSITION.CORE,COMPOSITION.COATING,COMPOSITION.CONSTITUENT,COMPOSITION.ADDITIVE,COMPOSITION.IMPURITY',
// 			'fl' : "id,type_s,s_uuid,doc_uuid,loValue,upValue,topcategory,endpointcategory,effectendpoint,unit,guidance,substanceType,name,publicname,reference,reference_owner,e_hash,err,interpretation_result,textValue,reference_year,content,owner_name",
			'stats': true,			
			'json.nl' : "map",
			'rows' : 20,
			'expand' : true,
			'expand.rows' : 3
		};
		
		for ( var name in params)
			Manager.store.addByValue(name, params[name]);

		Manager.doRequest();

		// Set some general search machanisms
		$(document).on('click', "a.freetext_selector", function (e) {
  		Manager.store.addByValue('q', AjaxSolr.Parameter.escapeValue(this.innerText));
  		Manager.doRequest();
		});
	});
})(jQuery);
