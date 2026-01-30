odoo.define('wk_odoo_direct_print.Attachment', function (require) {
  "use strict";
  // Copyright(c) 2015 - Present Webkul Software Pvt.Ltd. (<https://webkul.com/>)
  // See LICENSE file for full copyright and licensing details.
  // "License URL : <https://store.webkul.com/license.html/>"

  var AttachmentBox = require('mail.AttachmentBox');
  var core = require('web.core');
  var _t = core._t;

  var extensions = ['pdf', 'PDF', 'zpl', 'ZPL', 'png', 'PNG', 'jpg', 'JPG'];

  AttachmentBox.include({
    events: _.extend({}, AttachmentBox.prototype.events, {
      'click .wk_print_direct': '_onClickPrintDirect',
    }),

    _onClickPrintDirect: function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      var attachmentId = $(ev.currentTarget).data('id');
      var attachment = _.find(this.attachmentIDs, function (att) {
        return att.id === attachmentId;
      });
      if (!attachment) {
        this.do_notify(_t('Error'), _t('No attachment selected.'), false);
        return;
      }
      var extension = attachment.filename.split('.').pop().toLowerCase();
      if (!extensions.includes(extension)) {
        this.do_notify(_t('Error'), _t('File type not supported for printing.'), false);
        console.log('FILE TYPE NOT ALLOWED FOR PRINTING:', extension);
        return;
      }
      console.log('Direct Print clicked for attachment:', attachment);
      this._rpc({
        route: '/direct-print/attachment-info',
        params: {
          id: attachment.id,
        },
      }).then(function (result) {
        if (result.success) {
          this.do_notify(_t('Success'), _t('Attachment sent to printer.'), false);
        } else {
          this.do_notify(_t('Error'), _t(result.msg || 'Failed to send attachment to printer.'), false);
        }
      }.bind(this)).catch(function (error) {
        console.error('Direct Print error:', error);
        this.do_notify(_t('Error'), _t('Failed to send attachment to printer.'), false);
      }.bind(this));
    },
  });
  return AttachmentBox;
});