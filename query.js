var Manager;

(function($) {
	$(function() {
		Manager = new AjaxSolr.Manager({
			//solrUrl : 'https://search.data.enanomapper.net/solr/enm_shard1_replica1/'
			solrUrl : 'https://solr.ideaconsult.net/solr/enm_shard1_replica1/'
			//solrUrl : 'https://solr.ideaconsult.net/solr/ambitlri_shard1_replica1/'
		});
		
		Manager.addWidget(new AjaxSolr.ResultWidget({
			id : 'result',
			target : '#docs',
			options : {
					root : "https://data.enanomapper.net/substance/",
					summaryproperty: "P-CHEM.PC_GRANULOMETRY_SECTION.SIZE"
			},
		  template_header : function(doc) {
						var substancetype = lookup[doc.substanceType];
						var prop = doc[this.options.summaryproperty];
		
						var header = ((substancetype===undefined)?"":(substancetype+" ")) + ((prop===undefined)?"":("["+prop+"] "));
						var pname=  doc.publicname===undefined?"":doc.publicname[0];
						
						header += pname===undefined?"":pname
								+ "  "
								+ (pname === doc.name[0] ? ""
										: "(" + doc.name[0] + ")");
						return header;						
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

		var fields = [ 'endpointcategory', 'substanceType', 'effectendpoint',
				'owner_name', 'reference', 'guidance',
				'interpretation_result', '_childDocuments_.params.Species','_childDocuments_.params.Cell_line',
				'_childDocuments_.params.DATA_GATHERING_INSTRUMENTS','reference_year'];
		var divs = [ 'endpointcategory', 'substanceType', 'effectendpoint',
				'owner_name', 'reference', 'protocol',
				'interpretation_result', 'species', 'cell','instruments','reference_year'];
    var renderTag = function (facet, count, handler) {
      var view = facet,
          short = view;
          
      if (facet.lastIndexOf("caNanoLab.", 0) == 0)
        short = facet.replace("caNanoLab.","");
      else  if (facet.lastIndexOf("http://dx.doi.org/", 0) == 0)
        short = facet.replace("http://dx.doi.org/", "");
      else {
    	  view = (lookup[facet] || facet).replace("NPO_", "").replace(" nanoparticle", "");
    	  short = view.substring(0,26);
      }
      
      return $('<li><a href="#" class="tag" title="' + view + ' [' + facet + ']">' + short + ' <span>' + (count || 0) + '</span></a></li>')
          .addClass('tagcloud_size_1')
          .click(handler);
      };
    
		for (var i = 0, l = fields.length; i < l; i++) {
			Manager.addWidget(new AjaxSolr.TagWidget({
				id : divs[i],
				target : '#' + divs[i],
				field : fields[i],
				tagRenderer: renderTag
			}));
		}

		Manager.addWidget(new AjaxSolr.PivotWidget({
				id : "P-CHEM_endpointcategory",
				target : '#P-CHEM_endpointcategory',
				field : "endpointcategory",
				tagRenderer: renderTag
		}));	
		
		Manager.addWidget(new AjaxSolr.PivotWidget({
			id : "TOX_endpointcategory",
			target : '#TOX_endpointcategory',
			field : "endpointcategory",
      tagRenderer: renderTag
		}));		
		
		Manager.addWidget(new AjaxSolr.PivotWidget({
			id : "P-CHEM_effectendpoint",
			target : '#P-CHEM_effectendpoint',
			field : "effectendpoint",
			tagRenderer: renderTag
		}));	
		
		Manager.addWidget(new AjaxSolr.PivotWidget({
			id : "TOX_effectendpoint",
			target : '#TOX_effectendpoint',
			field : "effectendpoint",
			tagRenderer: renderTag			
		}));	
	
		Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
			id : 'currentsearch',
			target : '#selection',
			tagRenderer: renderTag
		}));
		/*
		 * Manager.addWidget(new AjaxSolr.TextWidget({ id: 'text', target:
		 * '#search' }));
		 */
		Manager.addWidget(new AjaxSolr.AutocompleteWidget({
			id : 'text',
			target : '#search',
			fields : [ 'substanceType', 'effectendpoint', 'endpointcategory',
					'name', 'guidance', 'interpretation_result',
					'_childDocuments_.params.Species','_childDocuments_.params.Cell_line', 'reference',
					'_text_' ]
		}));

		Manager.init();
			
		Manager.store.addByValue('q', $.url().param('search') || '*:*');

		var params = {
			facet : true,
			'facet.missing' : true,
			'facet.field' : [ 'endpointcategory', 'substanceType',
					'effectendpoint', 'reference',
					'_childDocuments_.params.Species',
					'_childDocuments_.params.Cell_line',
					'guidance',
					'_childDocuments_.params.DATA_GATHERING_INSTRUMENTS',
					'interpretation_result', 'owner_name' ,'unit'
					,'reference_year'
					//'_childDocuments_.conditions.Test_type'
					],
			'facet.limit' : -1,
			'facet.mincount' : 1,
			//'facet.range' : ['COMPOSITION.COATING','COMPOSITION.CORE'],
			'facet.range' : ['reference_year'],
			'facet.range.start' : 1900,
			'facet.range.end' : 2100,
			'facet.range.gap' : 5,
			//'facet.interval' : ['COMPOSITION.COATING'],
			//'f.COMPOSITION.COATING.facet.interval.set': ['[0,1],(1,*)'],
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
			//'f.COMPOSITION.CONSTITUENT': 1,
			//'f.COMPOSITION.ADDITIVE': 1,
			'f.COMPOSITION.IMPURITY': 1,
		  'f.COMPOSITION.CORE': 1,
			'f.COMPOSITION.COATING': 1,
			'f.endpointcategory.facet.limit' : -1,
			'f.substanceType.facet.limit' : -1,
			'f.s_uuid.facet.limit' : -1,
			'f.doc_uuid.facet.limit' : -1,
			'f.e_hash.facet.limit' : -1,
			'stats':true,
			'stats.field':'{!tag=piv1 min=true max=true}loValue',
			'facet.pivot': ['{!stats=piv1}topcategory,endpointcategory,effectendpoint,unit'],
			'json.nl' : 'map',
			'rows' : 20,
// 			'fq' : 'sType=study',
      // https://cwiki.apache.org/confluence/display/solr/Collapse+and+Expand+Results
			'fq' : '{!collapse field=s_uuid}',
			'expand' : true,
			'expand.rows' : 3,
			'fl' : 'id,type_s,s_uuid,doc_uuid,topcategory,endpointcategory,guidance,substanceType,name,publicname,reference,reference_owner,interpretation_result,reference_year,content,owner_name,P-CHEM.PC_GRANULOMETRY_SECTION.SIZE,CASRN.CORE,CASRN.COATING,CASRN.CONSTITUENT,CASRN.ADDITIVE,CASRN.IMPURITY,ChemicalName.CORE,ChemicalName.COATING,ChemicalName.CONSTITUENT,ChemicalName.ADDITIVE,ChemicalName.IMPURITY,COMPOSITION.CORE,COMPOSITION.COATING,COMPOSITION.CONSTITUENT,COMPOSITION.ADDITIVE,COMPOSITION.IMPURITY'
		};
		
		for ( var name in params)
			Manager.store.addByValue(name, params[name]);

		Manager.doRequest();
	});
})(jQuery);
