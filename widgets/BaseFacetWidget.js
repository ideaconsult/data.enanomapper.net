(function (Solr, a$, $, jT) {

jT.BaseFacetWidget = function (settings) {
  a$.extend(this, settings);
};

jT.BaseFacetWidget.prototype = {
  __expects: [ Solr.Faceting ],
  
  init: function () {
    a$.act(this, Solr.Faceting.prototype.init);
  },
  
  facetSelected: function (value) {
    
  },
};
  
})(Solr, asSys, jQuery, jToxKit);
