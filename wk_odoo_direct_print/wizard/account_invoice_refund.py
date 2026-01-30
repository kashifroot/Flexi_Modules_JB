# -*- coding: utf-8 -*-
#################################################################################
##    Copyright (c) 2018-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    You should have received a copy of the License along with this program.
#    If not, see <https://store.webkul.com/license.html/>
#################################################################################
from odoo import models, api
import logging
_logger = logging.getLogger(__name__)

class AccountInvoiceRefund(models.TransientModel):
    _inherit = 'account.invoice.refund'

    @api.multi
    def invoice_refund(self):
        res = super(AccountInvoiceRefund, self).invoice_refund()
        # Check if the result contains a domain for created invoices
        if isinstance(res, dict) and res.get('res_model') == 'account.invoice' and res.get('domain'):            
            invoice_ids = self.env['account.invoice'].search(res['domain'])
            if invoice_ids:
                self.env['autoprint.rule']._autoprint_on_action(
                    records=invoice_ids, action_name="Credit Note", model="account.invoice"
                )
        return res