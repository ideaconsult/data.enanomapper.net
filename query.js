var Manager, Basket;

(function($) {
	$(function() {
		Manager = new AjaxSolr.Manager({
			//this is now updated wih cananolab index
			solrUrl : 'https://search.data.enanomapper.net/solr/enm_shard1_replica1/'
			//this has cananolab index
			//solrUrl : 'http://ambit.uni-plovdiv.bg:8983/solr/enm_shard1_replica1/'
		});
		
		Manager.addWidget(new AjaxSolr.ResultWidget({
			id : 'result',
			target : '#docs',
			onClick: function (e, doc, exp, widget) { 
				if (!Basket.findItem(doc)) {
					Basket.addItem(doc, exp);
					updateInlineCounter($('a[href="#basket_tab"]'), Basket.length);
					updateCollectionURL(Basket);
					$("footer", this).toggleClass("add none");					
				}
			},
			onCreated: function (doc) {
				$("footer", this).addClass("add");
			}
		}));

		Manager.addWidget(new AjaxSolr.PagerWidget({
			id : 'pager',
			target : '#pager',
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

		var fields = [ 'substanceType',
  				'owner_name', 'reference', 'guidance',
  				'interpretation_result', '_childDocuments_.params.Species','_childDocuments_.params.Cell_line',
  				'_childDocuments_.params.DATA_GATHERING_INSTRUMENTS','reference_year'],
				
        divs = [ 'substanceType',
  				'owner_name', 'reference', 'protocol',
  				'interpretation_result', 'species', 'cell', 'instruments','reference_year'],
  				
        pivots = [ 'P-CHEM_endpointcategory', 'TOX_endpointcategory', 'P-CHEM_effectendpoint', 'TOX_effectendpoint' ],
        
        colors = {},
  				
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
              .addClass('tagcloud_size_1 ')
              .click(handler);
          };
    
    // now start with adding non-hierarchical facet-blocks...
		for (var i = 0, l = fields.length; i < l; i++) {
  		var f = fields[i],
  		    el = $('#' + divs[i]);
  		
      colors[f] = el.data('color');
      el.addClass(colors[f]);
			Manager.addWidget(new AjaxSolr.TagWidget({
				id : divs[i],
				target : '#' + divs[i],
				field : f,
				tagRenderer: renderTag
			}));
		}

    
    // ... then - hierarhical (pivotal) ones...
    
    for (i = 0, l = pivots.length; i < l; ++i) {
      var fi = pivots[i].lastIndexOf("_"),
          f = pivots[i].substr(fi + 1),
          el = $('#' + pivots[i]);
      
      colors[f] = el.data('color');
      el.addClass(colors[f]);
  		Manager.addWidget(new AjaxSolr.PivotWidget({
  				id : pivots[i],
  				target : '#' + pivots[i],
  				field : f,
  				tagRenderer: renderTag
  		}));	
  		
  		// TODO: Add
    }
    
    // ... And finally the current-selection one, and ...
		Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
			id : 'currentsearch',
			target : '#selection',
			tagRenderer: renderTag,
			colorMap: colors
		}));
		/*
		 * Manager.addWidget(new AjaxSolr.TextWidget({ id: 'text', target:
		 * '#search' }));
		 */
		// ... auto-completed text-search.
		Manager.addWidget(new AjaxSolr.AutocompleteWidget({
			id : 'text',
			target : '#search',
			fields : [ 
			    'substanceType', 'effectendpoint', 'endpointcategory',
					'name', 'guidance', 'interpretation_result',
					'_childDocuments_.params.Species','_childDocuments_.params.Cell_line', 'reference',
					'_text_' ]
		}));

		Basket = new ItemListWidget({
			id : 'basket',
			target : '#basket-docs',
			onClick: function (e, doc, exp) {
				if (Basket.eraseItem(doc.s_uuid) === false) {
					console.log("Trying to remove from basket an inexistent entry: " + JSON.stringify(doc));
					return;
				}
				
				$(this).remove();
				updateInlineCounter($('a[href="#basket_tab"]'), Basket.length);
				updateCollectionURL(Basket);
				$("footer", $("#result_" + doc.s_uuid)[0]).toggleClass("add none");
			},
			onCreated: function (doc) {
				$("footer", this).addClass("remove");
			}			
		});
		
		Manager.init();
			
		Manager.store.addByValue('q', $.url().param('search') || '*:*');

		var params = {
			facet : true,
			'facet.field' : fields.concat('unit'),
			'facet.limit' : -1,
			'facet.mincount' : 3,
// 			'facet.pivot' : 'topcategory,endpointcategory,effectendpoint,unit',
			'facet.pivot': '{!stats=piv1}topcategory,endpointcategory,effectendpoint,unit',
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
// 			'fq' : 'sType=study',
      // https://cwiki.apache.org/confluence/display/solr/Collapse+and+Expand+Results
			'fq' : '{!collapse field=s_uuid}',
			'fl' : 'id,type_s,s_uuid,doc_uuid,loValue,upValue,topcategory,endpointcategory,effectendpoint,unit,guidance,substanceType,name,publicname,reference,reference_owner,e_hash,err,interpretation_result,textValue,reference_year,content,owner_name',
			'stats':true,
			'stats.field':'{!tag=piv1 min=true max=true}loValue',
			
			'json.nl' : 'map',
			'rows' : 20,
			'expand' : true,
			'expand.rows' : 20
		};
		
		for ( var name in params)
			Manager.store.addByValue(name, params[name]);

		Manager.doRequest();
	});
})(jQuery);
