var Manager, 
		Basket,
  	Parameters = {
			'facet' : true,
			'facet.field' : ['unit'],
			'facet.limit' : -1,
			'facet.mincount' : 1,
// 			'echoParams': "none", // enable this for release versions.
			'f.s_uuid.facet.limit' : -1,
			'f.doc_uuid.facet.limit' : -1,
			'f.e_hash.facet.limit' : -1,
      // https://cwiki.apache.org/confluence/display/solr/Collapse+and+Expand+Results
			'fq' : "{!collapse field=s_uuid}",
			'fl' : 'id,type_s,s_uuid,doc_uuid,topcategory,endpointcategory,guidance,substanceType,name,publicname,reference,reference_owner,interpretation_result,reference_year,content,owner_name,P-CHEM.PC_GRANULOMETRY_SECTION.SIZE,CASRN.CORE,CASRN.COATING,CASRN.CONSTITUENT,CASRN.ADDITIVE,CASRN.IMPURITY,EINECS.CONSTITUENT,EINECS.ADDITIVE,EINECS.IMPURITY,ChemicalName.CORE,ChemicalName.COATING,ChemicalName.CONSTITUENT,ChemicalName.ADDITIVE,ChemicalName.IMPURITY,TradeName.CONSTITUENT,TradeName.ADDITIVE,TradeName.IMPURITY,COMPOSITION.CORE,COMPOSITION.COATING,COMPOSITION.CONSTITUENT,COMPOSITION.ADDITIVE,COMPOSITION.IMPURITY',
// 			'fl' : "id,type_s,s_uuid,doc_uuid,loValue,upValue,topcategory,endpointcategory,effectendpoint,unit,guidance,substanceType,name,publicname,reference,reference_owner,e_hash,err,interpretation_result,textValue,reference_year,content,owner_name",
			'json.nl' : "map",
			'expand' : true,
			'expand.rows' : 3,
			'q.alt': "*:*",
		},
		Facets = { 
			'substanceType': 	{ field: "substanceType", facet: { mincount: 2, limit: -1 } },
  		'owner_name': 		{ field: "owner_name", facet: { mincount: 3 } }, 
  		'reference': 			{ field: "reference", facet: { mincount: 2 } }, 
  		'reference_year': { field: "reference_year", facet: { mincount: 1 } },
  		'protocol': 			{ field: "guidance", facet: { mincount: 2 } },
  		'interpretation': { field: "interpretation_result", facet: { mincount: 2 } }, 
  		'species': 				{ field: "_childDocuments_.params.Species" }, 
  		'cell': 					{ field: "_childDocuments_.params.Cell_line", facet: { mincount: 1 } }, 
  		'instruments': 		{ field: "_childDocuments_.params.DATA_GATHERING_INSTRUMENTS" },
  		/*
  		'testtype': '_childDocuments_.conditions.Test_type',
			'solvent' :	'_childDocuments_.conditions.Solvent',
			'route':	'_childDocuments_.params.Route_of_administration',
			'genotoxicity':	'_childDocuments_.params.Type_of_genotoxicity'
			*/
  	},
  	PivotWidget = null;

(function(Solr, a$, $, jT) {
	$(function() {
  	Settings = {
			//this is now updated wih cananolab index
//       solrUrl : 'https://search.data.enanomapper.net/solr/enm_shard1_replica1/',
			// this has cananolab index
     solrUrl : 'https://solr.ideaconsult.net/solr/enm_shard1_replica1/',
 //      solrUrl: 'https://solr.ideaconsult.net/solr/ambitlri_shard1_replica1/',
			root : "https://data.enanomapper.net/substance/",
			summaryProperty: "P-CHEM.PC_GRANULOMETRY_SECTION.SIZE",
			servlet: "autophrase",
      parameters: Parameters,
      connector: $,
      onPrepare: function (settings) {
        var qidx = settings.url.indexOf("?");
        
        if (this.proxyUrl) {
          settings.data = { query: settings.url.substr(qidx + 1) };
          settings.url = this.proxyUrl;
          settings.type = settings.method = 'POST';
        }
        else {
          settings.url += (qidx < 0 ? "?" : "&" ) + "wt=json&json.wrf=?"; 
        }
      }
		},
		
		SolrManager = a$(Solr.Management, Solr.QueryingURL),
		Manager = new SolrManager(Settings);
		
    Manager.addListeners(new jT.ResultWidget({
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

    Manager.addListeners(new (a$(Solr.Widgets.Pager))({
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
			
    	me.addClass(f.color = col || f.color);
			Manager.addListeners(new jT.TagWidget($.extend({
				id : fid,
				target : me,
				header: hdr,
				multivalue: true,
				aggregate: true,
				exclusion: true,
				renderTag: renderTag
			}, f)));
		});
		
		// ... add the mighty pivot widget.
		Manager.addListeners(PivotWidget = new jT.PivotWidget({
			id : "studies",
			target : $(".after_topcategory"),

			pivotFields: [ "topcategory", "endpointcategory", "effectendpoint", "unit" ],
      facetFields: { endpointcategory: { color: "blue" }, effectendpoint: { color: "green" } },
      endpointField: "effectendpoint",
      unitField: "unit",
      statField: "loValue",
			
			multivalue: true,
			aggregate: true,
			exclusion: true,
			renderTag: renderTag,
			tabsRefresher: getTabsRefresher 
		}));
		
    // ... And finally the current-selection one, and ...
		Manager.addListeners(new jT.CurrentSearchWidget({
			id : 'currentsearch',
			target : $('#selection'),
			renderTag : renderTag,
		}));

		// ... auto-completed text-search.
		Manager.addListeners(new jT.AutocompleteWidget({
			id : 'text',
			target : $('#search'),
			fields : [ 
			    'substanceType', 'effectendpoint', 'endpointcategory',
					'name', 'guidance', 'interpretation_result',
					'_childDocuments_.params.Species','_childDocuments_.params.Cell_line', 'reference',
					'_text_' ]
		}));
		
		// Now add the basket.
		Basket = new jT.ItemListWidget({
			id : 'basket',
			target : $('#basket-docs'),
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
		Manager.addParameter('q', $.url().param('search') || '*:*');
		Manager.doRequest();

		// Set some general search machanisms
		$(document).on('click', "a.freetext_selector", function (e) {
  		Manager.addParameter('q', Solr.escapeValue(this.innerText));
  		Manager.doRequest();
		});
	});
})(Solr, asSys, jQuery, jToxKit);
