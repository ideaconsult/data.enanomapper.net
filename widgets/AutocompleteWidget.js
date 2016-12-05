(function (Solr, a$, $, jT) {

jT.AutocompleteWidgeting = function (settings) {
  a$.extend(this, settings);
};

jT.AutocompleteWidgeting.prototype = {
  __depends: [ Solr.Texting ],
  __expects: [ "doRequest", "set" ],
  
  afterRequest: function () {
    var findbox = this.target.find('input');
    findbox.unbind().removeData('events').val('');

    var self = this;

    var callback = function (response) {
      var list = [];
      for (var i = 0; i < self.fields.length; i++) {
        var field = self.fields[i];
        for (var facet in response.facet_counts.facet_fields[field]) {
          list.push({
            field: field,
            value: facet,
            label: facet + ' (' + response.facet_counts.facet_fields[field][facet] + ') - ' + field
          });
        }
      }

      self.requestSent = false;
      findbox.autocomplete('destroy').autocomplete({
        source: list,
        select: function(event, ui) {
          if (ui.item) {
            self.requestSent = true;
            if (self.manager.addParameter('fq', ui.item.field + ':' + Solr.escapeValue(ui.item.value))) {
              self.doRequest();
            }
          }
        }
      });

      // This has lower priority so that requestSent is set.
      findbox.bind('keydown', function(e) {
        if (self.requestSent === false && e.which == 13) {
          var value = $(this).val();
          if (value && self.set(value)) {
            self.doRequest();
          }
        }
      });
    } // end callback

    var params = [ 'rows=0&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map' ];
    for (var i = 0; i < this.fields.length; i++) {
      params.push('facet.field=' + this.fields[i]);
    }
    
    var values = this.manager.getAllValues('fq');
    for (var i = 0; i < values.length; i++) {
      params.push('fq=' + encodeURIComponent(values[i]));
    }
    
    var qval = this.manager.getParameter('q').value;
    params.push('q=' + qval);
    $.getJSON(this.manager.solrUrl + 'autophrase?' + params.join('&') + '&wt=json&json.wrf=?', {}, callback);
    
    if (qval != "*:*")
      findbox.val(qval);
  }
};

jT.AutocompleteWidget = a$(jT.AutocompleteWidgeting);

})(Solr, asSys, jQuery, jToxKit);
