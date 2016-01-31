(function($) {

	AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget
			.extend({
				start : 0,

				beforeRequest : function() {
					$(this.target).html(
							$('<img>').attr('src', 'images/ajax-loader.gif'));
				},

				facetLinks : function(facet_field, facet_values, title) {
					var links = [];
					if (facet_values) {
						var fv = facet_values;
						if (facet_values.constructor != Array)
							fv = [ facet_values ];

						for (var i = 0, l = fv.length; i < l; i++) {
							if (fv[i] !== undefined) {

								links.push($('<a href="#"></a>').text(
										title == null ? fv[i] : title).click(
										this.facetHandler(facet_field, fv[i])));
							} else {
								links
										.push('no items found in current selection');
							}
						}
					}
					return links;
				},

				facetHandler : function(facet_field, facet_value) {
					var self = this;
					return function() {
						self.manager.store.remove('fq');
						self.manager.store.addByValue('fq', facet_field + ':'
								+ AjaxSolr.Parameter.escapeValue(facet_value));
						self.doRequest(0);
						return false;
					};
				},

				afterRequest : function() {
					$(this.target).empty();

					for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
						var doc = this.manager.response.response.docs[i];
						$(this.target).append(this.template_substance(doc));

						/*
						var items = [];
						var view_category = lookup[doc.endpointcategory];
						var view_effectendpoint = lookup[doc.effectendpoint];
						var view_type = lookup[doc.substanceType];
						items = items.concat(this.facetLinks('substanceType',
								doc.substanceType,
								view_type == null ? doc.substanceType
										: view_type));
						items = items.concat(this.facetLinks(
								'endpointcategory', doc.endpointcategory,
								view_category == null ? doc.endpointcategory
										: view_category));
						items = items
								.concat(this
										.facetLinks(
												'effectendpoint',
												doc.effectendpoint,
												view_effectendpoint == null ? doc.effectendpoint
														: view_effectendpoint));
						items = items.concat(this.facetLinks('doc_uuid',
								doc.doc_uuid, 'study'));

						var $links = $('#links_' + doc.s_uuid);
						$links.empty();
						for (var j = 0, m = items.length; j < m; j++) {
							$links.append($('<li></li>').append(items[j]));
						}
						*/

					}
				},
				/**
				 * substance
				 */
				template_substance : function(doc) {
					var snippet = '';
					var root = "<a href='https://apps.ideaconsult.net/enanomapper/substance/";
					if (doc.type_s == 'study') {
						var header = doc.name[0]
								+ " "
								+ (doc.publicname[0] === doc.name[0] ? ""
										: doc.publicname[0]);
						var href = root
								+ doc.s_uuid
								+ "/study' title='Study' target='s_uuid'><span class='ui-icon ui-icon-extlink' style='float:right;margin:0;'></span></a>"

						var snippet = this.template_measurement(doc);
						var expanded = this.manager.response.expanded[doc.s_uuid];
						if (expanded != undefined) {
							snippet += ' <a href="#" class="more">more</a>';
							snippet += '<span style="display:none;">';
							for (var i = 0, l = expanded.docs.length; i < l; i++) {
								snippet += "<br/>";
								snippet += this
										.template_measurement(expanded.docs[i]);
							}
							snippet += '</span>';
						}
						var output = '<article class="item"><header>' + header
								+ ' ' + href + '</header>';
						output += '<p>' + snippet;
						output += '<a href="#" class="avatar"><img src="images/logo.png"></a>';
						output += '</p>';
						output += '<footer id="links_' + doc.s_uuid
								+ '" class="links">';
						output +=root + doc.s_uuid + "' title='Substance' target='s_uuid'>material</a>"
						output +=root + doc.s_uuid + "/structure' title='composition' target='s_uuid'>composition</a>"
						output +=root + doc.s_uuid + "/study' title='Study' target='s_uuid'>study</a>"
						output += '</footer>';
						output += '</article>';

						return output;

					}
				},
				template_measurement : function(doc) {
					var snippet = "";
					try {
						var value = doc.topcategory + ".";
						var view = lookup[doc.endpointcategory];
						value += (view==undefined?doc.endpointcategory:view) + " ";
						try {
							if (doc.interpretation_result != undefined)
								value += doc.interpretation_result + " ";
						} catch (err) {
						}

						try {
							if (doc.effectendpoint != undefined) {
								var view_effectendpoint = lookup[doc.effectendpoint];
								value += (view_effectendpoint == undefined ? doc.effectendpoint[0]
										: view_effectendpoint);
							}
						} catch (err) {
						}

						value += " = ";
						try {
							value += doc.loValue[0];
						} catch (err) {
						}
						try {
							value += " ";
							value += doc.upValue[0];
						} catch (err) {
						}

						try {
							value += " " + doc.unit[0];
						} catch (err) {
						}

						try {
							if (textValue != undefined)
								value += " " + doc.textValue;
						} catch (err) {
						}

						snippet += value;
						if (doc.guidance != null)
							snippet += " [" + doc.guidance + "]";

						if (doc.reference != null) {
							snippet += " <a href='" + doc.reference[0]
									+ "' title='" + doc.reference
									+ "' target='ref'>DOI</a>";
						}
						/*
						 * snippet += value + "<br/>" +
						 * (doc.reference_owner===undefined)?"":doc.reference_owner + ' ' +
						 * (doc.reference===null?"":doc.reference) + "<br/>";
						 * snippet += "<b>"+ doc.topcategory + "." +
						 * doc.endpointcategory + "</b><br/>Protocol: <i>" +
						 * doc.guidance+ "</i>";
						 */
					} catch (err) {
						console.log(err);
					}
					return snippet;
				},
				init : function() {
					$(document).on(
							'click',
							'a.more',
							function() {
								var $this = $(this), span = $this.parent()
										.find('span');

								if (span.is(':visible')) {
									span.hide();
									$this.text('more');
								} else {
									span.show();
									$this.text('less');
								}

								return false;
							});
				}
			});

})(jQuery);