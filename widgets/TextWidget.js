(function (Solr, a$, $, jT) {

jT.TextWidgeting = function (settings) {
  a$.extend(this, settings);
};

jT.TextWidgeting.prototype = {
  __expects: [ Solr.Texting ],

  delayed: 300,
  init: function (manager) {
    var self = this;
    a$.act(this, Solr.Texting.prototype.init, manager);

    $(this.target).find('input').bind('keydown', function(e) {
      if (e.which == 13) {
        var value = $(this).val();
        if (value && self.set(value)) {
          self.doRequest();
        }
      }
    });
  },

  afterRequest: function () {
    $(this.target).find('input').val('');
  }
};

jT.TextWidget = a$(jT.TextWidgeting);

})(Solr, asSys, jQuery, jToxKit);
